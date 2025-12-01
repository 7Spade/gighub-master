/**
 * Blueprint Edit Guard
 *
 * Guard for blueprint edit access
 * Checks if user can edit a specific blueprint
 *
 * @module features/blueprint/guards/blueprint-edit.guard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Guard to check if user can edit a blueprint
 *
 * @example
 * ```typescript
 * // In routes configuration:
 * {
 *   path: 'blueprint/:id/edit',
 *   component: BlueprintEditComponent,
 *   canActivate: [blueprintEditGuard]
 * }
 * ```
 */
export const blueprintEditGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const message = inject(NzMessageService);

  const blueprintId = route.paramMap.get('id');

  if (!blueprintId) {
    message.error('藍圖 ID 無效');
    router.navigate(['/blueprint']);
    return false;
  }

  try {
    // TODO: Implement actual edit permission check
    // 1. Check if blueprint exists
    // 2. Check if user is owner or has edit permission
    // 3. Check if blueprint is not locked/archived

    const canEdit = await checkBlueprintEditPermission(blueprintId);

    if (!canEdit.allowed) {
      message.error(canEdit.reason || '您沒有權限編輯此藍圖');

      // Navigate to view page instead
      router.navigate(['/blueprint', blueprintId]);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Blueprint edit permission check failed:', error);
    message.error('權限檢查失敗，請稍後再試');
    router.navigate(['/blueprint', blueprintId]);
    return false;
  }
};

/**
 * Edit permission result
 */
interface EditPermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user can edit blueprint
 * TODO: Implement actual logic with BlueprintService and ACL
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkBlueprintEditPermission(blueprintId: string): Promise<EditPermissionResult> {
  // Placeholder implementation
  // In production, this should:
  // 1. Fetch blueprint metadata
  // 2. Check if user is owner
  // 3. Check edit permissions through @delon/acl
  // 4. Check if blueprint is locked or archived

  // Example rejection cases:
  // return { allowed: false, reason: '此藍圖已被鎖定，無法編輯' };
  // return { allowed: false, reason: '此藍圖已封存，請先恢復' };
  // return { allowed: false, reason: '您不是此藍圖的擁有者' };

  return { allowed: true };
}
