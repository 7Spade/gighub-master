/**
 * Context Switcher Component
 *
 * 帳戶上下文切換器元件
 * Account context switcher component
 *
 * Allows users to switch between personal account, organizations, and teams.
 * Integrated with WorkspaceContextService for state management.
 *
 * @module layout/basic/widgets
 */

import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import {
  ContextType,
  Team
} from '@core';
import {
  WorkspaceContextService,
  AccountService
} from '@shared';

@Component({
  selector: 'header-context-switcher',
  standalone: true,
  imports: [
    CommonModule,
    NzDropDownModule,
    NzMenuModule,
    NzIconModule,
    NzDividerModule,
    NzSpinModule,
    NzAvatarModule
  ],
  template: `
    <div
      class="alain-default__nav-item d-flex align-items-center px-sm"
      nz-dropdown
      [nzDropdownMenu]="contextMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
    >
      @if (switching()) {
        <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
      } @else {
        <i nz-icon [nzType]="contextIcon()" class="mr-xs"></i>
        <span class="hidden-mobile">{{ contextLabel() }}</span>
        <i nz-icon nzType="down" class="ml-xs hidden-mobile"></i>
      }
    </div>

    <nz-dropdown-menu #contextMenu="nzDropdownMenu">
      <ul nz-menu class="context-menu width-sm">
        <!-- Loading state -->
        @if (loading()) {
          <li nz-menu-item nzDisabled>
            <nz-spin nzSimple [nzSize]="'small'" class="mr-sm"></nz-spin>
            <span>載入中...</span>
          </li>
        } @else {
          <!-- Personal accounts -->
          @if (currentUser()) {
            <li
              nz-menu-item
              (click)="switchToUser()"
              [class.ant-menu-item-selected]="isUserContext()"
            >
              <i nz-icon nzType="user" class="mr-sm"></i>
              <span>{{ currentUser()?.name || '個人帳戶' }}</span>
            </li>
          }

          <!-- Organizations with their teams -->
          @if (organizations().length > 0) {
            <li nz-menu-divider></li>
            <li nz-menu-group nzTitle="組織">
              <ul>
                @for (org of organizations(); track org.id) {
                  @if (getTeamsForOrg(org.id).length > 0) {
                    <!-- Organization with teams (submenu) -->
                    <li nz-submenu [nzTitle]="org.name" nzIcon="team">
                      <ul>
                        <!-- Organization itself -->
                        <li
                          nz-menu-item
                          (click)="switchToOrganization(org.id)"
                          [class.ant-menu-item-selected]="isOrganizationContext(org.id)"
                        >
                          <i nz-icon nzType="team" class="mr-sm"></i>
                          <span>{{ org.name }} (組織)</span>
                        </li>
                        <li nz-menu-divider></li>
                        <!-- Teams under this organization -->
                        @for (team of getTeamsForOrg(org.id); track team.id) {
                          <li
                            nz-menu-item
                            (click)="switchToTeam(team.id)"
                            [class.ant-menu-item-selected]="isTeamContext(team.id)"
                          >
                            <i nz-icon nzType="usergroup-add" class="mr-sm"></i>
                            <span>{{ team.name }}</span>
                          </li>
                        }
                      </ul>
                    </li>
                  } @else {
                    <!-- Organization without teams (flat item) -->
                    <li
                      nz-menu-item
                      (click)="switchToOrganization(org.id)"
                      [class.ant-menu-item-selected]="isOrganizationContext(org.id)"
                    >
                      <i nz-icon nzType="team" class="mr-sm"></i>
                      <span>{{ org.name }}</span>
                    </li>
                  }
                }
              </ul>
            </li>
          }

          <!-- No accounts message -->
          @if (!currentUser() && organizations().length === 0) {
            <li nz-menu-item nzDisabled>
              <i nz-icon nzType="info-circle" class="mr-sm"></i>
              <span>暫無可用帳戶</span>
            </li>
          }
        }
      </ul>
    </nz-dropdown-menu>
  `,
  styles: [`
    :host {
      display: block;
    }

    .context-menu {
      min-width: 200px;
      max-width: 300px;
    }

    .width-sm {
      min-width: 200px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderContextSwitcherComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly accountService = inject(AccountService);

  // Expose ContextType enum to template
  readonly ContextType = ContextType;

  // Use WorkspaceContextService signals
  readonly currentUser = this.workspaceContext.currentUser;
  readonly organizations = this.workspaceContext.organizations;
  readonly teams = this.workspaceContext.teams;
  readonly teamsByOrganization = this.workspaceContext.teamsByOrganization;
  readonly contextLabel = this.workspaceContext.contextLabel;
  readonly contextIcon = this.workspaceContext.contextIcon;
  readonly switching = this.workspaceContext.switching;
  readonly loading = this.workspaceContext.loading;

  // Computed signals for type-safe comparisons
  readonly currentContextType = this.workspaceContext.contextType;
  readonly currentContextId = this.workspaceContext.contextId;

  /**
   * Get teams for a specific organization
   */
  getTeamsForOrg(orgId: string): Team[] {
    return this.teamsByOrganization().get(orgId) || [];
  }

  /**
   * Check if current context is user
   */
  isUserContext(): boolean {
    return this.currentContextType() === ContextType.USER;
  }

  /**
   * Check if current context is the specified organization
   */
  isOrganizationContext(orgId: string): boolean {
    return this.currentContextType() === ContextType.ORGANIZATION &&
           this.currentContextId() === orgId;
  }

  /**
   * Check if current context is the specified team
   */
  isTeamContext(teamId: string): boolean {
    return this.currentContextType() === ContextType.TEAM &&
           this.currentContextId() === teamId;
  }

  /**
   * Switch to user context
   */
  switchToUser(): void {
    const userId = this.currentUser()?.id;
    if (userId) {
      this.workspaceContext.switchToUser(userId);
    }
  }

  /**
   * Switch to organization context
   */
  switchToOrganization(orgId: string): void {
    this.workspaceContext.switchToOrganization(orgId);
  }

  /**
   * Switch to team context
   */
  switchToTeam(teamId: string): void {
    this.workspaceContext.switchToTeam(teamId);
  }
}
