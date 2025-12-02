/**
 * HasPermission Directive
 *
 * 權限指令
 * Permission directive
 *
 * Conditionally displays elements based on user permissions.
 * Uses Angular Signals for reactive updates.
 *
 * @module shared/directives
 *
 * @example
 * // Show element if user has task:create permission
 * <button *hasPermission="'task:create'">Create Task</button>
 *
 * // Show element if user has any of the permissions
 * <button *hasPermission="['task:update', 'task:delete']">Edit/Delete</button>
 *
 * // Show element with else template
 * <button *hasPermission="'task:delete'; else noAccess">Delete</button>
 * <ng-template #noAccess>No access</ng-template>
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  DestroyRef
} from '@angular/core';

import { PermissionService } from '../services/permission';
import { Permission, BlueprintBusinessRole } from '../../core/infra/types/permission';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  private hasView = false;
  private requiredPermissions: Permission[] = [];
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private requireAll = false;

  /**
   * 設置必需的權限
   * Set required permissions
   *
   * Can be a single permission or an array of permissions.
   */
  @Input()
  set hasPermission(value: Permission | Permission[] | string | string[]) {
    if (Array.isArray(value)) {
      this.requiredPermissions = value as Permission[];
    } else if (value) {
      this.requiredPermissions = [value as Permission];
    } else {
      this.requiredPermissions = [];
    }
    this.updateView();
  }

  /**
   * 設置無權限時顯示的模板
   * Set template to show when no permission
   */
  @Input()
  set hasPermissionElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  /**
   * 是否要求所有權限
   * Whether to require all permissions
   */
  @Input()
  set hasPermissionRequireAll(value: boolean) {
    this.requireAll = value;
    this.updateView();
  }

  constructor() {
    // React to permission context changes
    effect(() => {
      // Access signals to trigger reactivity
      this.permissionService.permissions();
      this.permissionService.hasContext();
      this.updateView();
    });
  }

  /**
   * 更新視圖
   * Update view based on current permissions
   *
   * @private
   */
  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      // Show the template
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Hide the template
      this.viewContainer.clear();
      this.hasView = false;

      // Show else template if provided
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
    } else if (!hasPermission && !this.hasView && this.elseTemplateRef) {
      // Show else template
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  /**
   * 檢查權限
   * Check if user has required permissions
   *
   * @private
   */
  private checkPermission(): boolean {
    if (this.requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    if (!this.permissionService.hasContext()) {
      return false; // No context loaded
    }

    if (this.requireAll) {
      return this.permissionService.hasAllPermissions(this.requiredPermissions);
    } else {
      return this.permissionService.hasAnyPermission(this.requiredPermissions);
    }
  }
}

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  private hasView = false;
  private requiredRoles: BlueprintBusinessRole[] = [];
  private elseTemplateRef: TemplateRef<unknown> | null = null;

  /**
   * 設置必需的角色
   * Set required roles
   */
  @Input()
  set hasRole(value: BlueprintBusinessRole | BlueprintBusinessRole[] | string | string[]) {
    if (Array.isArray(value)) {
      this.requiredRoles = value as BlueprintBusinessRole[];
    } else if (value) {
      this.requiredRoles = [value as BlueprintBusinessRole];
    } else {
      this.requiredRoles = [];
    }
    this.updateView();
  }

  /**
   * 設置無角色時顯示的模板
   * Set template to show when no role
   */
  @Input()
  set hasRoleElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    // React to permission context changes
    effect(() => {
      this.permissionService.businessRoles();
      this.permissionService.hasContext();
      this.updateView();
    });
  }

  /**
   * 更新視圖
   * Update view based on current roles
   *
   * @private
   */
  private updateView(): void {
    const hasRole = this.checkRole();

    if (hasRole && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;

      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
    } else if (!hasRole && !this.hasView && this.elseTemplateRef) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  /**
   * 檢查角色
   * Check if user has required roles
   *
   * @private
   */
  private checkRole(): boolean {
    if (this.requiredRoles.length === 0) {
      return true;
    }

    if (!this.permissionService.hasContext()) {
      return false;
    }

    return this.permissionService.hasAnyRole(this.requiredRoles);
  }
}

@Directive({
  selector: '[isOwner]',
  standalone: true
})
export class IsOwnerDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  private hasView = false;
  private elseTemplateRef: TemplateRef<unknown> | null = null;

  /**
   * 設置是否檢查擁有者
   * Set whether to check for owner
   */
  @Input()
  set isOwner(value: boolean) {
    this.updateView(value);
  }

  /**
   * 設置非擁有者時顯示的模板
   * Set template to show when not owner
   */
  @Input()
  set isOwnerElse(templateRef: TemplateRef<unknown> | null) {
    this.elseTemplateRef = templateRef;
  }

  constructor() {
    // React to permission context changes
    effect(() => {
      this.permissionService.isOwner();
      this.updateView(true);
    });
  }

  /**
   * 更新視圖
   * Update view based on owner status
   *
   * @private
   */
  private updateView(checkOwner: boolean): void {
    const isOwner = checkOwner && this.permissionService.isOwner();

    if (isOwner && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isOwner && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;

      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
    } else if (!isOwner && !this.hasView && this.elseTemplateRef) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }
}
