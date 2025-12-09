/**
 * Permission Service
 *
 * 權限管理服務（Shared 層）
 * Permission management service (Shared layer)
 *
 * Provides permission checking and context management.
 * Uses Angular Signals for reactive permission state.
 *
 * @module shared/services/permission
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService, BlueprintMemberRepository, BlueprintRole } from '@core';
import { firstValueFrom } from 'rxjs';

import { Permission, BlueprintBusinessRole, PermissionContext, getCombinedPermissions } from '../../../core/infra/types/permission';
import { LoggerService } from '../../../core/logger/logger.service';

/**
 * 藍圖角色到業務角色的映射
 * Mapping from blueprint member role to business roles
 *
 * This maps the database blueprint_role enum to business roles.
 * In the future, this can be replaced with a more flexible
 * blueprint_roles table.
 */
const BLUEPRINT_ROLE_TO_BUSINESS_ROLES: Record<BlueprintRole, BlueprintBusinessRole[]> = {
  [BlueprintRole.MAINTAINER]: [BlueprintBusinessRole.PROJECT_MANAGER],
  [BlueprintRole.CONTRIBUTOR]: [BlueprintBusinessRole.WORKER],
  [BlueprintRole.VIEWER]: [BlueprintBusinessRole.OBSERVER]
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly blueprintMemberRepo = inject(BlueprintMemberRepository);
  private readonly logger = inject(LoggerService);

  // State signals
  private readonly contextState = signal<PermissionContext | null>(null);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  // Readonly signals
  readonly context = this.contextState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals
  readonly permissions = computed(() => this.contextState()?.permissions ?? []);
  readonly businessRoles = computed(() => this.contextState()?.businessRoles ?? []);
  readonly isOwner = computed(() => this.contextState()?.isOwner ?? false);
  readonly isExternal = computed(() => this.contextState()?.isExternal ?? false);
  readonly hasContext = computed(() => this.contextState() !== null);

  /**
   * 載入用戶在指定藍圖的權限上下文
   * Load user's permission context for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @param accountId User's account ID
   */
  async loadContext(blueprintId: string, accountId: string): Promise<PermissionContext | null> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);

      // Get blueprint membership
      const members = await firstValueFrom(this.blueprintMemberRepo.findByBlueprintAndAccount(blueprintId, accountId));

      // Check if user is blueprint owner
      const isOwner = await this.checkIsOwner(blueprintId, accountId);

      if (!members && !isOwner) {
        // User has no access
        this.contextState.set(null);
        return null;
      }

      // Determine business roles
      let businessRoles: BlueprintBusinessRole[] = [];
      let isExternal = false;

      if (isOwner) {
        // Owner always has PROJECT_MANAGER role
        businessRoles = [BlueprintBusinessRole.PROJECT_MANAGER];
      } else if (members) {
        // First try to use the business_role from the database
        if (members.business_role && Object.values(BlueprintBusinessRole).includes(members.business_role as BlueprintBusinessRole)) {
          businessRoles = [members.business_role as BlueprintBusinessRole];
        } else {
          // Fallback to mapping from member role
          const memberRole = members.role as BlueprintRole;
          businessRoles = BLUEPRINT_ROLE_TO_BUSINESS_ROLES[memberRole] || [BlueprintBusinessRole.OBSERVER];
        }
        isExternal = members.is_external || false;
      }

      // Get permissions for the roles
      const permissions = getCombinedPermissions(businessRoles);

      const context: PermissionContext = {
        accountId,
        blueprintId,
        businessRoles,
        permissions,
        isOwner,
        isExternal
      };

      this.contextState.set(context);
      return context;
    } catch (error) {
      this.logger.error('PermissionService', 'Failed to load context', error, { blueprintId, accountId });
      this.errorState.set('Failed to load permission context');
      this.contextState.set(null);
      return null;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 清除權限上下文
   * Clear permission context
   */
  clearContext(): void {
    this.contextState.set(null);
    this.errorState.set(null);
  }

  /**
   * 檢查用戶是否擁有指定權限
   * Check if user has a specific permission
   *
   * @param permission Permission to check
   * @returns true if user has the permission
   */
  hasPermission(permission: Permission): boolean {
    const context = this.contextState();
    if (!context) return false;

    // Owners have all permissions
    if (context.isOwner) return true;

    return context.permissions.includes(permission);
  }

  /**
   * 檢查用戶是否擁有任一指定權限
   * Check if user has any of the specified permissions
   *
   * @param permissions Permissions to check
   * @returns true if user has any of the permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * 檢查用戶是否擁有所有指定權限
   * Check if user has all of the specified permissions
   *
   * @param permissions Permissions to check
   * @returns true if user has all of the permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * 檢查用戶是否擁有指定業務角色
   * Check if user has a specific business role
   *
   * @param role Business role to check
   * @returns true if user has the role
   */
  hasRole(role: BlueprintBusinessRole): boolean {
    const context = this.contextState();
    if (!context) return false;

    return context.businessRoles.includes(role);
  }

  /**
   * 檢查用戶是否擁有任一指定業務角色
   * Check if user has any of the specified business roles
   *
   * @param roles Business roles to check
   * @returns true if user has any of the roles
   */
  hasAnyRole(roles: BlueprintBusinessRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  /**
   * 獲取當前藍圖 ID
   * Get current blueprint ID
   */
  getCurrentBlueprintId(): string | null {
    return this.contextState()?.blueprintId ?? null;
  }

  /**
   * 獲取當前用戶帳戶 ID
   * Get current user account ID
   */
  getCurrentAccountId(): string | null {
    return this.contextState()?.accountId ?? null;
  }

  /**
   * 檢查用戶是否為藍圖擁有者
   * Check if user is blueprint owner
   *
   * @private
   */
  private async checkIsOwner(blueprintId: string, accountId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client.from('blueprints').select('owner_id').eq('id', blueprintId).single();

      if (error || !data) return false;

      // Direct ownership
      if (data.owner_id === accountId) return true;

      // Organization ownership - check if user is org owner/admin
      const { data: orgData } = await this.supabaseService.client
        .from('organizations')
        .select('id')
        .eq('account_id', data.owner_id)
        .single();

      if (!orgData) return false;

      const { data: memberData } = await this.supabaseService.client
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgData.id)
        .eq('account_id', accountId)
        .single();

      return memberData?.role === 'owner';
    } catch {
      return false;
    }
  }
}
