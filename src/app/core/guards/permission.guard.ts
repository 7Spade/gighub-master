/**
 * Permission Guard
 *
 * 權限路由守衛
 * Permission route guard
 *
 * Protects routes based on required permissions.
 * Uses functional guard pattern for Angular 20+.
 *
 * @module core/guards
 */

import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, Route, UrlSegment } from '@angular/router';
import { PermissionService } from '@shared';

import { Permission, BlueprintBusinessRole } from '../infra/types/permission';
import { LoggerService } from '../logger';

/**
 * 權限守衛配置介面
 * Permission guard configuration interface
 */
export interface PermissionGuardConfig {
  /** 必需的權限（任一） | Required permissions (any) */
  permissions?: Permission[];
  /** 必需的角色（任一） | Required roles (any) */
  roles?: BlueprintBusinessRole[];
  /** 是否要求所有權限 | Require all permissions */
  requireAll?: boolean;
  /** 未授權時的重定向路徑 | Redirect path on unauthorized */
  redirectTo?: string;
}

/**
 * 權限守衛創建函數
 * Permission guard factory function
 *
 * Creates a canActivate guard that checks for required permissions.
 *
 * @example
 * // Route configuration
 * {
 *   path: 'tasks/create',
 *   component: TaskCreateComponent,
 *   canActivate: [permissionGuard({ permissions: [Permission.TASK_CREATE] })]
 * }
 *
 * @param config Guard configuration
 * @returns CanActivateFn
 */
export function permissionGuard(config: PermissionGuardConfig): CanActivateFn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_route: ActivatedRouteSnapshot) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    const logger = inject(LoggerService);

    // Check if permission context is loaded
    if (!permissionService.hasContext()) {
      logger.warn('[PermissionGuard] No permission context loaded');
      return handleUnauthorized(router, config.redirectTo);
    }

    // Check permissions
    if (config.permissions && config.permissions.length > 0) {
      const hasPermission = config.requireAll
        ? permissionService.hasAllPermissions(config.permissions)
        : permissionService.hasAnyPermission(config.permissions);

      if (!hasPermission) {
        logger.warn('[PermissionGuard] Missing required permissions:', config.permissions);
        return handleUnauthorized(router, config.redirectTo);
      }
    }

    // Check roles
    if (config.roles && config.roles.length > 0) {
      const hasRole = permissionService.hasAnyRole(config.roles);

      if (!hasRole) {
        logger.warn('[PermissionGuard] Missing required roles:', config.roles);
        return handleUnauthorized(router, config.redirectTo);
      }
    }

    return true;
  };
}

/**
 * 權限匹配守衛創建函數
 * Permission match guard factory function
 *
 * Creates a canMatch guard that checks for required permissions.
 * Used for lazy-loaded modules.
 *
 * @example
 * // Route configuration
 * {
 *   path: 'admin',
 *   loadChildren: () => import('./admin/admin.module'),
 *   canMatch: [permissionMatchGuard({ roles: [BlueprintBusinessRole.PROJECT_MANAGER] })]
 * }
 *
 * @param config Guard configuration
 * @returns CanMatchFn
 */
export function permissionMatchGuard(config: PermissionGuardConfig): CanMatchFn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_route: Route, _segments: UrlSegment[]) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    const logger = inject(LoggerService);

    // Check if permission context is loaded
    if (!permissionService.hasContext()) {
      logger.warn('[PermissionMatchGuard] No permission context loaded');
      return handleUnauthorized(router, config.redirectTo);
    }

    // Check permissions
    if (config.permissions && config.permissions.length > 0) {
      const hasPermission = config.requireAll
        ? permissionService.hasAllPermissions(config.permissions)
        : permissionService.hasAnyPermission(config.permissions);

      if (!hasPermission) {
        return handleUnauthorized(router, config.redirectTo);
      }
    }

    // Check roles
    if (config.roles && config.roles.length > 0) {
      const hasRole = permissionService.hasAnyRole(config.roles);

      if (!hasRole) {
        return handleUnauthorized(router, config.redirectTo);
      }
    }

    return true;
  };
}

/**
 * 處理未授權情況
 * Handle unauthorized access
 *
 * @private
 */
function handleUnauthorized(router: Router, redirectTo?: string): boolean {
  if (redirectTo) {
    router.navigate([redirectTo]);
  } else {
    // Default: navigate to 403 page
    router.navigate(['/exception/403']);
  }
  return false;
}

// ============================================================================
// Convenience Guard Factories (便捷守衛工廠函數)
// ============================================================================

/**
 * 藍圖讀取權限守衛
 * Blueprint read permission guard
 */
export const canReadBlueprint: CanActivateFn = permissionGuard({
  permissions: [Permission.BLUEPRINT_READ]
});

/**
 * 藍圖寫入權限守衛
 * Blueprint write permission guard
 */
export const canWriteBlueprint: CanActivateFn = permissionGuard({
  permissions: [Permission.BLUEPRINT_WRITE]
});

/**
 * 藍圖成員管理權限守衛
 * Blueprint member management permission guard
 */
export const canManageBlueprintMembers: CanActivateFn = permissionGuard({
  permissions: [Permission.BLUEPRINT_MANAGE_MEMBERS]
});

/**
 * 任務創建權限守衛
 * Task create permission guard
 */
export const canCreateTask: CanActivateFn = permissionGuard({
  permissions: [Permission.TASK_CREATE]
});

/**
 * 任務刪除權限守衛
 * Task delete permission guard
 */
export const canDeleteTask: CanActivateFn = permissionGuard({
  permissions: [Permission.TASK_DELETE]
});

/**
 * 日誌審批權限守衛
 * Diary approval permission guard
 */
export const canApproveDiary: CanActivateFn = permissionGuard({
  permissions: [Permission.DIARY_APPROVE]
});

/**
 * 驗收審批權限守衛
 * Acceptance approval permission guard
 */
export const canApproveAcceptance: CanActivateFn = permissionGuard({
  permissions: [Permission.ACCEPTANCE_APPROVE]
});

/**
 * 專案經理角色守衛
 * Project manager role guard
 */
export const isProjectManager: CanActivateFn = permissionGuard({
  roles: [BlueprintBusinessRole.PROJECT_MANAGER]
});

/**
 * 管理角色守衛（專案經理或工地主任）
 * Management role guard (Project Manager or Site Director)
 */
export const isManagement: CanActivateFn = permissionGuard({
  roles: [BlueprintBusinessRole.PROJECT_MANAGER, BlueprintBusinessRole.SITE_DIRECTOR]
});

/**
 * 品管人員角色守衛
 * QA staff role guard
 */
export const isQAStaff: CanActivateFn = permissionGuard({
  roles: [BlueprintBusinessRole.QA_STAFF, BlueprintBusinessRole.PROJECT_MANAGER, BlueprintBusinessRole.SITE_DIRECTOR]
});
