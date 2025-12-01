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
import { OrganizationMemberRepository, OrganizationRepository, OrganizationRole, SupabaseService } from '@core';
import { firstValueFrom } from 'rxjs';

import { CreateOrganizationRequest, OrganizationBusinessModel, UpdateOrganizationRequest } from '../../models/account';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly organizationMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);

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
    const client = this.supabaseService.client;

    // Use SECURITY DEFINER function to create organization atomically
    const { data, error } = await (client as any).rpc('create_organization', {
      p_name: request.name,
      p_email: request.email || null,
      p_avatar_url: request.avatar || null,
      p_slug: null // Let the function generate slug
    });

    if (error) {
      console.error('[OrganizationService] Failed to create organization:', error);
      throw error;
    }

    if (!data || !data[0]) {
      throw new Error('Failed to create organization');
    }

    const { out_account_id, out_organization_id } = data[0];

    // Prefer fetching from organizations table if organization_id is returned
    // Otherwise fallback to fetching the organization by account_id
    if (out_organization_id) {
      const org = await firstValueFrom(this.organizationRepo.findById(out_organization_id));
      if (org) {
        return org as OrganizationBusinessModel;
      }
    }

    // Fallback: fetch organization by account_id
    const { data: orgData, error: fetchError } = await client.from('organizations').select('*').eq('account_id', out_account_id).single();

    if (fetchError || !orgData) {
      // Data inconsistency: organization record missing in organizations table
      // The RPC function should create both account and organization records atomically
      throw new Error(`Organization record missing in organizations table for account_id: ${out_account_id}`);
    }

    return orgData as OrganizationBusinessModel;
  }

  /**
   * 更新組織
   * Update organization
   */
  async updateOrganization(id: string, request: UpdateOrganizationRequest): Promise<OrganizationBusinessModel> {
    const org = await firstValueFrom(this.organizationRepo.update(id, request as any));
    if (!org) {
      throw new Error('Failed to update organization');
    }
    return org as OrganizationBusinessModel;
  }

  /**
   * 軟刪除組織
   * Soft delete organization
   */
  async softDeleteOrganization(id: string): Promise<OrganizationBusinessModel> {
    const org = await firstValueFrom(this.organizationRepo.softDelete(id));
    if (!org) {
      throw new Error('Failed to delete organization');
    }
    return org as OrganizationBusinessModel;
  }

  /**
   * 恢復已刪除的組織
   * Restore deleted organization
   */
  async restoreOrganization(id: string): Promise<OrganizationBusinessModel> {
    const org = await firstValueFrom(this.organizationRepo.restore(id));
    if (!org) {
      throw new Error('Failed to restore organization');
    }
    return org as OrganizationBusinessModel;
  }
}
