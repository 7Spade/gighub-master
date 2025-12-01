/**
 * Unsaved Changes Guard
 *
 * Guard to warn users about unsaved changes
 * Prevents accidental navigation away from forms with changes
 *
 * @module features/blueprint/guards/unsaved-changes.guard
 */

import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, from } from 'rxjs';

/**
 * Interface for components with unsaved changes
 */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
  saveChanges?(): Promise<boolean>;
}

/**
 * Guard to check for unsaved changes before navigation
 *
 * @example
 * ```typescript
 * // In routes configuration:
 * {
 *   path: 'blueprint/:id/edit',
 *   component: BlueprintEditComponent,
 *   canDeactivate: [unsavedChangesGuard]
 * }
 *
 * // In component:
 * export class BlueprintEditComponent implements HasUnsavedChanges {
 *   hasUnsavedChanges(): boolean {
 *     return this.form.dirty;
 *   }
 *
 *   async saveChanges(): Promise<boolean> {
 *     // Save logic
 *     return true;
 *   }
 * }
 * ```
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component): Observable<boolean> | Promise<boolean> | boolean => {
  const modal = inject(NzModalService);

  // If component doesn't implement interface, allow navigation
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }

  // If no unsaved changes, allow navigation
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  // Show confirmation dialog
  return from(showConfirmDialog(modal, component));
};

/**
 * Show confirmation dialog for unsaved changes
 */
async function showConfirmDialog(modal: NzModalService, component: HasUnsavedChanges): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    modal.confirm({
      nzTitle: '未儲存的變更',
      nzContent: '您有未儲存的變更。要在離開前儲存嗎？',
      nzOkText: '儲存並離開',
      nzOkType: 'primary',
      nzCancelText: '不儲存',
      nzOnOk: async () => {
        if (component.saveChanges) {
          try {
            const saved = await component.saveChanges();
            resolve(saved);
          } catch {
            resolve(false);
          }
        } else {
          resolve(true);
        }
      },
      nzOnCancel: () => {
        // User chose to discard changes
        resolve(true);
      },
      nzClosable: true,
      nzMaskClosable: false,
      nzFooter: [
        {
          label: '取消',
          onClick: () => {
            modal.closeAll();
            resolve(false);
          }
        },
        {
          label: '不儲存',
          onClick: () => {
            modal.closeAll();
            resolve(true);
          }
        },
        {
          label: '儲存並離開',
          type: 'primary',
          onClick: async () => {
            if (component.saveChanges) {
              try {
                const saved = await component.saveChanges();
                modal.closeAll();
                resolve(saved);
              } catch {
                modal.closeAll();
                resolve(false);
              }
            } else {
              modal.closeAll();
              resolve(true);
            }
          }
        }
      ]
    });
  });
}

/**
 * Simple version that just confirms without save option
 */
export const simpleUnsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component
): Observable<boolean> | Promise<boolean> | boolean => {
  const modal = inject(NzModalService);

  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }

  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return new Promise<boolean>(resolve => {
    modal.confirm({
      nzTitle: '確定要離開嗎？',
      nzContent: '您有未儲存的變更，離開後將會遺失。',
      nzOkText: '離開',
      nzOkDanger: true,
      nzCancelText: '留在此頁',
      nzOnOk: () => resolve(true),
      nzOnCancel: () => resolve(false)
    });
  });
};
