/**
 * Permission Facade
 *
 * 權限業務域門面（Shared 層）
 * Permission business domain facade (Shared layer)
 *
 * Provides unified interface for permission operations.
 * Integrates with PermissionService for context management.
 *
 * @module shared/facades/permission
 */

import { Injectable, inject, computed } from '@angular/core';
import { PermissionService } from '../services';

import { Permission, BlueprintBusinessRole, PermissionContext } from '../../../core/infra/types/permission';

@Injectable({
  providedIn: 'root'
})
export class PermissionFacade {
  private readonly permissionService = inject(PermissionService);

  // Proxy permission service signals
  readonly context = this.permissionService.context;
  readonly loading = this.permissionService.loading;
  readonly error = this.permissionService.error;
  readonly permissions = this.permissionService.permissions;
  readonly businessRoles = this.permissionService.businessRoles;
  readonly isOwner = this.permissionService.isOwner;
  readonly isExternal = this.permissionService.isExternal;
  readonly hasContext = this.permissionService.hasContext;

  // Computed signals for common role checks
  readonly isProjectManager = computed(() => this.permissionService.hasRole(BlueprintBusinessRole.PROJECT_MANAGER));

  readonly isSiteDirector = computed(() => this.permissionService.hasRole(BlueprintBusinessRole.SITE_DIRECTOR));

  readonly isManagement = computed(() =>
    this.permissionService.hasAnyRole([BlueprintBusinessRole.PROJECT_MANAGER, BlueprintBusinessRole.SITE_DIRECTOR])
  );

  readonly isQAStaff = computed(() => this.permissionService.hasRole(BlueprintBusinessRole.QA_STAFF));

  readonly isWorker = computed(() => this.permissionService.hasRole(BlueprintBusinessRole.WORKER));

  readonly isObserver = computed(() => this.permissionService.hasRole(BlueprintBusinessRole.OBSERVER));

  // Common permission checks
  readonly canManageBlueprint = computed(() => this.permissionService.hasPermission(Permission.BLUEPRINT_MANAGE_SETTINGS));

  readonly canManageMembers = computed(() => this.permissionService.hasPermission(Permission.BLUEPRINT_MANAGE_MEMBERS));

  readonly canCreateTask = computed(() => this.permissionService.hasPermission(Permission.TASK_CREATE));

  readonly canDeleteTask = computed(() => this.permissionService.hasPermission(Permission.TASK_DELETE));

  readonly canApproveDiary = computed(() => this.permissionService.hasPermission(Permission.DIARY_APPROVE));

  readonly canPerformAcceptance = computed(() => this.permissionService.hasPermission(Permission.ACCEPTANCE_PERFORM));

  readonly canApproveAcceptance = computed(() => this.permissionService.hasPermission(Permission.ACCEPTANCE_APPROVE));

  /**
   * 載入權限上下文
   * Load permission context for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @param accountId User's account ID
   */
  async loadContext(blueprintId: string, accountId: string): Promise<PermissionContext | null> {
    return this.permissionService.loadContext(blueprintId, accountId);
  }

  /**
   * 清除權限上下文
   * Clear permission context
   */
  clearContext(): void {
    this.permissionService.clearContext();
  }

  /**
   * 檢查權限
   * Check if user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    return this.permissionService.hasPermission(permission);
  }

  /**
   * 檢查任一權限
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return this.permissionService.hasAnyPermission(permissions);
  }

  /**
   * 檢查所有權限
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return this.permissionService.hasAllPermissions(permissions);
  }

  /**
   * 檢查角色
   * Check if user has a specific business role
   */
  hasRole(role: BlueprintBusinessRole): boolean {
    return this.permissionService.hasRole(role);
  }

  /**
   * 檢查任一角色
   * Check if user has any of the specified business roles
   */
  hasAnyRole(roles: BlueprintBusinessRole[]): boolean {
    return this.permissionService.hasAnyRole(roles);
  }

  /**
   * 獲取當前藍圖 ID
   * Get current blueprint ID
   */
  getCurrentBlueprintId(): string | null {
    return this.permissionService.getCurrentBlueprintId();
  }

  /**
   * 獲取當前用戶帳戶 ID
   * Get current user account ID
   */
  getCurrentAccountId(): string | null {
    return this.permissionService.getCurrentAccountId();
  }
}
