/**
 * Context Switcher Component
 *
 * 帳戶上下文切換器元件
 * Account context switcher component
 *
 * Allows users to switch between personal account, organizations, and teams.
<<<<<<< HEAD
 * Integrated with AuthContextService for state management.
=======
 * Integrated with WorkspaceContextService for state management.
>>>>>>> 52363ba30d4548d8e58e6450e4181ac5bd73c9c4
 *
 * @module layout/basic/widgets
 */

import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
<<<<<<< HEAD
import { AuthContextService, ContextType } from '@core';
import { AccountService, SHARED_IMPORTS } from '@shared';
=======
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
>>>>>>> 52363ba30d4548d8e58e6450e4181ac5bd73c9c4

@Component({
  selector: 'header-context-switcher',
  standalone: true,
<<<<<<< HEAD
  imports: [SHARED_IMPORTS],
  template: `
    <!-- Personal accounts (flat) -->
    @for (account of userAccounts(); track getAccountId(account)) {
      <li
        nz-menu-item
        (click)="authContext.switchToUser(getAccountId(account))"
        [class.ant-menu-item-selected]="isUserContext(getAccountId(account))"
      >
        <i nz-icon nzType="user" class="mr-sm"></i>
        <span>{{ getAccountName(account) }}</span>
      </li>
    }

    <!-- Organizations with their teams (flat + nested teams) -->
    @for (org of organizationAccounts(); track getAccountId(org)) {
      @if (teamsByOrganization().has(getAccountId(org)) && teamsByOrganization().get(getAccountId(org))!.length > 0) {
        <!-- Organization with teams -->
        <li nz-submenu [nzTitle]="getAccountName(org)" nzIcon="team">
          <ul nz-menu>
            <!-- Organization itself -->
            <li
              nz-menu-item
              (click)="authContext.switchToOrganization(getAccountId(org))"
              [class.ant-menu-item-selected]="isOrganizationContext(getAccountId(org))"
            >
              <i nz-icon nzType="team" class="mr-sm"></i>
              <span>{{ getAccountName(org) }}</span>
            </li>
            <li nz-menu-divider></li>
            <!-- Teams under this organization -->
            @for (team of teamsByOrganization().get(getAccountId(org))!; track getTeamId(team)) {
              <li
                nz-menu-item
                (click)="authContext.switchToTeam(getTeamId(team))"
                [class.ant-menu-item-selected]="isTeamContext(getTeamId(team))"
              >
                <i nz-icon nzType="usergroup-add" class="mr-sm"></i>
                <span>{{ getTeamName(team) }}</span>
              </li>
            }
          </ul>
        </li>
      } @else {
        <!-- Organization without teams (flat item) -->
        <li
          nz-menu-item
          (click)="authContext.switchToOrganization(getAccountId(org))"
          [class.ant-menu-item-selected]="isOrganizationContext(getAccountId(org))"
        >
          <i nz-icon nzType="team" class="mr-sm"></i>
          <span>{{ getAccountName(org) }}</span>
        </li>
      }
    }

    <!-- No accounts message -->
    @if (userAccounts().length === 0 && organizationAccounts().length === 0) {
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
  readonly accountService = inject(AccountService);
  readonly authContext = inject(AuthContextService);
=======
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
>>>>>>> 52363ba30d4548d8e58e6450e4181ac5bd73c9c4

  // Expose ContextType enum to template
  readonly ContextType = ContextType;

<<<<<<< HEAD
  // Use AuthContextService signals
  readonly userAccounts = computed<Array<Record<string, unknown>>>(() => {
    const accounts = this.accountService.userAccounts() as Array<Record<string, unknown>>;
    console.log('[HeaderContextSwitcher] 👤 用戶帳戶:', accounts);
    return accounts;
  });
  readonly organizationAccounts = computed<Array<Record<string, unknown>>>(() => {
    const orgs = this.authContext.organizations() as Array<Record<string, unknown>>;
    console.log('[HeaderContextSwitcher] 🏢 組織帳戶:', orgs);
    return orgs;
  });
  readonly userTeams = computed<Array<Record<string, unknown>>>(() => {
    const teams = this.authContext.teams() as Array<Record<string, unknown>>;
    console.log('[HeaderContextSwitcher] 👥 用戶團隊:', teams);
    return teams;
  });
  readonly teamsByOrganization = this.authContext.teamsByOrganization;
  readonly contextLabel = this.authContext.contextLabel;
  readonly contextIcon = this.authContext.contextIcon;
  readonly switching = this.authContext.switching;

  // Computed signals for type-safe comparisons
  readonly currentContextType = this.authContext.contextType;
  readonly currentContextId = this.authContext.contextId;

  // Helper methods for type-safe comparisons
  isContextType(type: ContextType): boolean {
    const current = this.currentContextType();
    return current === type;
  }

  isContextId(id: string | null): boolean {
    const current = this.currentContextId();
    return current === id;
  }

  isSelectedContext(type: ContextType, id: string | null): boolean {
    return this.isContextType(type) && this.isContextId(id);
  }

  // Helper methods for template (type-safe)
  // Using method instead of computed signal for better template compatibility
  // Note: isAppContext() removed since APP context no longer exists

  // Helper methods that accept IDs
  isUserContext(id: string): boolean {
    return this.isSelectedContext(ContextType.USER, id);
  }

  isOrganizationContext(id: string): boolean {
    return this.isSelectedContext(ContextType.ORGANIZATION, id);
  }

  isTeamContext(id: string): boolean {
    return this.isSelectedContext(ContextType.TEAM, id);
  }

  /**
   * Check if user is authenticated
   */
  readonly isAuthenticated = this.authContext.isAuthenticated;

  /**
   * Get account ID with type safety
   * 獲取帳戶 ID（類型安全）
   */
  getAccountId(account: Record<string, unknown>): string {
    return (account['id'] as string) || '';
  }

  /**
   * Get team ID with type safety
   * 獲取團隊 ID（類型安全）
   */
  getTeamId(team: Record<string, unknown>): string {
    return (team['id'] as string) || '';
  }

  /**
   * Get account name with fallback
   * 獲取帳戶名稱（帶回退）
   */
  getAccountName(account: Record<string, unknown>): string {
    return (account['name'] as string) || (account['email'] as string) || '未命名帳戶';
  }

  /**
   * Get team name with fallback
   * 獲取團隊名稱（帶回退）
   */
  getTeamName(team: Record<string, unknown>): string {
    return (team['name'] as string) || '未命名團隊';
  }
}

=======
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
>>>>>>> 52363ba30d4548d8e58e6450e4181ac5bd73c9c4
