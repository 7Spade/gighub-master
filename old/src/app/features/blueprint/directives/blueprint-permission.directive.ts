/**
 * Blueprint Permission Directive
 *
 * Controls visibility based on blueprint permissions
 * For access control in blueprint editor
 *
 * @module features/blueprint/directives/blueprint-permission.directive
 */

import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Blueprint permission types
 */
export type BlueprintPermission =
  | 'blueprint:view'
  | 'blueprint:create'
  | 'blueprint:edit'
  | 'blueprint:delete'
  | 'blueprint:publish'
  | 'task:view'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:assign'
  | 'workspace:view'
  | 'workspace:create'
  | 'workspace:edit'
  | 'workspace:delete'
  | 'workspace:manage_members';

/**
 * Directive to control visibility based on blueprint permissions
 *
 * @example
 * ```html
 * <button *blueprintPermission="'blueprint:edit'">Edit</button>
 *
 * <div *blueprintPermission="['task:create', 'task:edit']">
 *   Create or edit tasks
 * </div>
 *
 * <button *blueprintPermission="'blueprint:delete'; else noPermission">
 *   Delete
 * </button>
 * <ng-template #noPermission>
 *   <span>No permission to delete</span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[blueprintPermission]',
  standalone: true
})
export class BlueprintPermissionDirective implements OnInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly destroy$ = new Subject<void>();
  private hasView = false;
  private requiredPermissions: BlueprintPermission[] = [];
  private requireAll = false;
  private elseTemplateRef?: TemplateRef<unknown>;

  /**
   * Required permission(s)
   * Can be a single permission or array of permissions
   */
  @Input()
  set blueprintPermission(value: BlueprintPermission | BlueprintPermission[]) {
    this.requiredPermissions = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  /**
   * If true, all permissions must be present (AND logic)
   * If false, any permission is sufficient (OR logic)
   */
  @Input()
  set blueprintPermissionRequireAll(value: boolean) {
    this.requireAll = value;
    this.updateView();
  }

  /**
   * Template to show when permission check fails
   */
  @Input()
  set blueprintPermissionElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef = templateRef || undefined;
    this.updateView();
  }

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasPermission = this.checkPermissions();

    if (hasPermission && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;

      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
    } else if (!hasPermission && !this.hasView && this.elseTemplateRef) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  /**
   * Check if user has required permissions
   * TODO: Integrate with actual permission service
   */
  private checkPermissions(): boolean {
    if (this.requiredPermissions.length === 0) {
      return true;
    }

    // TODO: Replace with actual permission check from @delon/acl or custom service
    const userPermissions = this.getUserPermissions();

    if (this.requireAll) {
      return this.requiredPermissions.every(p => userPermissions.includes(p));
    } else {
      return this.requiredPermissions.some(p => userPermissions.includes(p));
    }
  }

  /**
   * Get user permissions
   * TODO: Replace with actual implementation
   */
  private getUserPermissions(): BlueprintPermission[] {
    // Placeholder - return all permissions for development
    // In production, this should come from @delon/acl or a permission service
    return [
      'blueprint:view',
      'blueprint:create',
      'blueprint:edit',
      'blueprint:delete',
      'blueprint:publish',
      'task:view',
      'task:create',
      'task:edit',
      'task:delete',
      'task:assign',
      'workspace:view',
      'workspace:create',
      'workspace:edit',
      'workspace:delete',
      'workspace:manage_members'
    ];
  }
}
