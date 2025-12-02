/**
 * Context Switcher Component
 *
 * 帳戶上下文切換器元件
 * Account context switcher component
 *
 * Allows users to switch between personal account, organizations, and teams.
 * Integrated with WorkspaceContextService for state management.
 *
 * This component renders just menu items (<li> elements) without any dropdown wrapper.
 * It's designed to be embedded inside a parent menu container.
 *
 * @module layout/basic/widgets
 */

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ContextType, Team } from '@core';
import { WorkspaceContextService, AccountService } from '@shared';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'header-context-switcher',
  standalone: true,
  imports: [CommonModule, NzMenuModule, NzIconModule],
  template: `
    <!-- Personal account (flat) -->
    @if (currentUser()) {
      <li nz-menu-item (click)="switchToUser()" [class.ant-menu-item-selected]="isUserContext()">
        <i nz-icon nzType="user" class="mr-sm"></i>
        <span>{{ currentUser()?.name || '個人帳戶' }}</span>
      </li>
    }

    <!-- Organizations with their teams (flat + nested teams) -->
    @for (org of organizations(); track org.id) {
      @if (getTeamsForOrg(org.id).length > 0) {
        <!-- Organization with teams -->
        <li nz-submenu [nzTitle]="org.name" nzIcon="team">
          <ul nz-menu>
            <!-- Organization itself -->
            <li nz-menu-item (click)="switchToOrganization(org.id)" [class.ant-menu-item-selected]="isOrganizationContext(org.id)">
              <i nz-icon nzType="team" class="mr-sm"></i>
              <span>{{ org.name }}</span>
            </li>
            <li nz-menu-divider></li>
            <!-- Teams under this organization -->
            @for (team of getTeamsForOrg(org.id); track team.id) {
              <li nz-menu-item (click)="switchToTeam(team.id)" [class.ant-menu-item-selected]="isTeamContext(team.id)">
                <i nz-icon nzType="usergroup-add" class="mr-sm"></i>
                <span>{{ team.name }}</span>
              </li>
            }
          </ul>
        </li>
      } @else {
        <!-- Organization without teams (flat item) -->
        <li nz-menu-item (click)="switchToOrganization(org.id)" [class.ant-menu-item-selected]="isOrganizationContext(org.id)">
          <i nz-icon nzType="team" class="mr-sm"></i>
          <span>{{ org.name }}</span>
        </li>
      }
    }

    <!-- No accounts message -->
    @if (!currentUser() && organizations().length === 0) {
      <li nz-menu-item nzDisabled>
        <i nz-icon nzType="info-circle" class="mr-sm"></i>
        <span>暫無可用帳戶</span>
      </li>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .width-sm {
        min-width: 200px;
        max-width: 300px;
      }
    `
  ],
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
    return this.currentContextType() === ContextType.ORGANIZATION && this.currentContextId() === orgId;
  }

  /**
   * Check if current context is the specified team
   */
  isTeamContext(teamId: string): boolean {
    return this.currentContextType() === ContextType.TEAM && this.currentContextId() === teamId;
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
