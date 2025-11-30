/**
 * Task Access Guard
 *
 * Guard for task access within workspace
 * Checks if user can access a specific task
 *
 * @module features/blueprint/guards/task-access.guard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Guard to check if user can access a task
 *
 * @example
 * ```typescript
 * // In routes configuration:
 * {
 *   path: 'workspace/:workspaceId/task/:taskId',
 *   component: TaskDetailComponent,
 *   canActivate: [taskAccessGuard]
 * }
 * ```
 */
export const taskAccessGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const message = inject(NzMessageService);

  const workspaceId = route.paramMap.get('workspaceId');
  const taskId = route.paramMap.get('taskId');

  if (!workspaceId || !taskId) {
    message.error('無效的工作區或任務 ID');
    router.navigate(['/blueprint']);
    return false;
  }

  try {
    // TODO: Implement actual access check
    // 1. Check if workspace exists
    // 2. Check if user is workspace member
    // 3. Check if task exists in workspace
    // 4. Check task visibility settings

    const hasAccess = await checkTaskAccess(workspaceId, taskId);

    if (!hasAccess.allowed) {
      message.error(hasAccess.reason || '您沒有權限查看此任務');
      router.navigate(['/workspace', workspaceId]);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Task access check failed:', error);
    message.error('存取檢查失敗，請稍後再試');
    router.navigate(['/blueprint']);
    return false;
  }
};

/**
 * Access check result
 */
interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user can access task
 * TODO: Implement actual logic with TaskService and ACL
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkTaskAccess(workspaceId: string, taskId: string): Promise<AccessCheckResult> {
  // Placeholder implementation
  // In production, this should:
  // 1. Verify workspace membership
  // 2. Fetch task metadata
  // 3. Check task visibility
  // 4. Verify through @delon/acl

  return { allowed: true };
}
