/**
 * Organization Service
 *
 * 組織管理服務（Shared 層）
 * Organization management service (Shared layer)
 *
 * Provides business logic for organization operations.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';
import { OrganizationRepository, OrganizationMemberRepository, OrganizationRole, SupabaseService } from '@core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/logger';
import { AuditLogService } from '../audit-log';

import { OrganizationBusinessModel, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../models/account';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly organizationMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly auditLog = inject(AuditLogService);

  // State
  private organizationsState = signal<OrganizationBusinessModel[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly organizations = this.organizationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 根據 ID 查詢組織
   * Find organization by ID
   */
  async findById(id: string): Promise<OrganizationBusinessModel | null> {
    const org = await firstValueFrom(this.organizationRepo.findById(id));
    return org as OrganizationBusinessModel | null;
  }

  /**
   * 查詢用戶創建的組織
   * Find organizations created by user (where user is owner)
   */
  async getUserCreatedOrganizations(authUserId: string): Promise<OrganizationBusinessModel[]> {
    const ownerMemberships = await firstValueFrom(
      this.organizationMemberRepo.findWithOptions({
        authUserId,
        role: OrganizationRole.OWNER
      })
    );

    const organizationIds = ownerMemberships.map(m => (m as any).organization_id).filter((id: string | undefined) => id);

    if (organizationIds.length === 0) {
      return [];
    }

    const orgs = await firstValueFrom(this.organizationRepo.findByIds(organizationIds));
    return orgs as OrganizationBusinessModel[];
  }

  /**
   * 查詢用戶加入的組織
   * Find organizations user has joined
   */
  async getUserJoinedOrganizations(accountId: string): Promise<OrganizationBusinessModel[]> {
    const memberships = await firstValueFrom(this.organizationMemberRepo.findByAccount(accountId));

    const orgIds = memberships.map(m => (m as any).organization_id).filter((id: string | undefined) => id);

    if (orgIds.length === 0) {
      return [];
    }

    const orgs = await firstValueFrom(this.organizationRepo.findByIds(orgIds));
    return orgs as OrganizationBusinessModel[];
  }

  /**
   * 創建組織
   * Create organization
   *
   * Uses RPC function create_organization for proper handling
   */
  async createOrganization(request: CreateOrganizationRequest): Promise<OrganizationBusinessModel> {
    try {
      this.logger.info('Creating organization', { name: request.name });

      const client = this.supabaseService.client;

      // Use SECURITY DEFINER function to create organization atomically
      const { data, error } = await (client as any).rpc('create_organization', {
        p_name: request.name,
        p_email: request.email || null,
        p_avatar_url: request.avatar || null,
        p_slug: null // Let the function generate slug
      });

      if (error) {
        this.logger.error('Failed to create organization via RPC', error);
        throw error;
      }

      if (!data || !data[0]) {
        throw new Error('Failed to create organization');
      }

      const { out_account_id, out_organization_id } = data[0];

      // Prefer fetching from organizations table if organization_id is returned
      // Otherwise fallback to fetching the organization by account_id
      let org: OrganizationBusinessModel | null = null;

      if (out_organization_id) {
        org = await firstValueFrom(this.organizationRepo.findById(out_organization_id)) as OrganizationBusinessModel | null;
      }

      if (!org) {
        // Fallback: fetch organization by account_id
        const { data: orgData, error: fetchError } = await client.from('organizations').select('*').eq('account_id', out_account_id).single();

        if (fetchError || !orgData) {
          // Data inconsistency: organization record missing in organizations table
          // The RPC function should create both account and organization records atomically
          throw new Error(`Organization record missing in organizations table for account_id: ${out_account_id}`);
        }

        org = orgData as OrganizationBusinessModel;
      }

      // Record audit log
      this.auditLog.quickLog(
        'organization',
        org.id!,
        'create',
        {
          entityName: org.name,
          organizationId: org.id,
          newValue: org,
          severity: 'info',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management',
            account_id: out_account_id
          }
        }
      ).subscribe();

      this.logger.info('Organization created successfully', {
        organizationId: org.id,
        name: org.name
      });

      return org;
    } catch (error) {
      this.logger.error('Failed to create organization', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'organization',
        'N/A',
        'create',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 更新組織
   * Update organization
   */
  async updateOrganization(id: string, request: UpdateOrganizationRequest): Promise<OrganizationBusinessModel> {
    try {
      this.logger.info('Updating organization', {
        organizationId: id,
        changes: Object.keys(request)
      });

      // Get old value for change tracking
      const oldOrg = await this.findById(id);
      if (!oldOrg) {
        throw new Error('Organization not found');
      }

      // Perform update
      const newOrg = await firstValueFrom(this.organizationRepo.update(id, request as any));
      if (!newOrg) {
        throw new Error('Failed to update organization');
      }

      // Record changes in audit log (automatically tracks differences)
      this.auditLog.logChanges(
        'organization',
        id,
        'update',
        oldOrg,
        newOrg,
        {
          entityName: newOrg.name,
          organizationId: id,
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management',
            changed_fields: Object.keys(request)
          }
        }
      ).subscribe();

      this.logger.info('Organization updated successfully', {
        organizationId: id,
        name: newOrg.name
      });

      return newOrg as OrganizationBusinessModel;
    } catch (error) {
      this.logger.error('Failed to update organization', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'organization',
        id,
        'update',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 軟刪除組織
   * Soft delete organization
   */
  async softDeleteOrganization(id: string): Promise<OrganizationBusinessModel> {
    try {
      this.logger.info('Deleting organization', { organizationId: id });

      // Get organization before deletion for audit log
      const org = await this.findById(id);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Perform soft delete
      const deletedOrg = await firstValueFrom(this.organizationRepo.softDelete(id));
      if (!deletedOrg) {
        throw new Error('Failed to delete organization');
      }

      // Record deletion in audit log (warning severity for sensitive operation)
      this.auditLog.quickLog(
        'organization',
        id,
        'delete',
        {
          entityName: org.name,
          organizationId: id,
          oldValue: org,
          severity: 'warning',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management',
            deletion_type: 'soft_delete'
          }
        }
      ).subscribe();

      this.logger.info('Organization deleted successfully', {
        organizationId: id,
        name: org.name
      });

      return deletedOrg as OrganizationBusinessModel;
    } catch (error) {
      this.logger.error('Failed to delete organization', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'organization',
        id,
        'delete',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 恢復已刪除的組織
   * Restore deleted organization
   */
  async restoreOrganization(id: string): Promise<OrganizationBusinessModel> {
    try {
      this.logger.info('Restoring organization', { organizationId: id });

      const org = await firstValueFrom(this.organizationRepo.restore(id));
      if (!org) {
        throw new Error('Failed to restore organization');
      }

      // Record restore in audit log
      this.auditLog.quickLog(
        'organization',
        id,
        'restore',
        {
          entityName: org.name,
          organizationId: id,
          newValue: org,
          severity: 'info',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management',
            operation_type: 'restore'
          }
        }
      ).subscribe();

      this.logger.info('Organization restored successfully', {
        organizationId: id,
        name: org.name
      });

      return org as OrganizationBusinessModel;
    } catch (error) {
      this.logger.error('Failed to restore organization', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'organization',
        id,
        'restore',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }
}
