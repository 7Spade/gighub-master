/**
 * Members Component
 *
 * 統一成員管理組件 - 根據工作區上下文動態顯示內容
 * Unified members management component - dynamically displays content based on workspace context
 *
 * @module routes/account/members
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { OrganizationMembersContentComponent, TeamMembersContentComponent } from './components';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [SHARED_IMPORTS, OrganizationMembersContentComponent, TeamMembersContentComponent],
  template: `
    <page-header [title]="pageTitle()">
      <ng-template #extra>
        <nz-tag [nzColor]="contextTagColor()">
          <i nz-icon [nzType]="authContext.contextIcon()" class="mr-xs"></i>
          {{ authContext.contextLabel() }}
        </nz-tag>
      </ng-template>
    </page-header>

    <nz-card [nzTitle]="cardTitle()" class="mt-md">
      @if (authContext.switching()) {
        <div class="text-center py-lg">
          <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
        </div>
      } @else if (!hasValidContext()) {
        <nz-empty nzNotFoundContent="請選擇一個工作區" [nzNotFoundFooter]="emptyFooter"></nz-empty>
        <ng-template #emptyFooter>
          <button nz-button nzType="primary" (click)="navigateToAccount()">
            <i nz-icon nzType="setting" nzTheme="outline"></i>
            前往帳戶管理
          </button>
        </ng-template>
      } @else {
        @switch (authContext.contextType()) {
          @case (ContextType.ORGANIZATION) {
            <app-organization-members-content [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <app-team-members-content [teamId]="authContext.contextId()!" />
          }
          @case (ContextType.USER) {
            <nz-alert
              nzType="info"
              nzMessage="個人工作區"
              nzDescription="個人工作區不支援成員管理，請切換到組織或團隊工作區"
              nzShowIcon
            ></nz-alert>
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人工作區" nzDescription="機器人工作區不支援成員管理" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.ORGANIZATION]: {
      title: '成員管理',
      subtitle: '管理 {label} 的成員',
      cardTitle: '組織成員'
    },
    [ContextType.TEAM]: {
      title: '團隊成員',
      subtitle: '管理 {label} 的成員',
      cardTitle: '團隊成員'
    },
    [ContextType.USER]: {
      title: '成員管理',
      subtitle: '個人工作區不支援成員管理',
      cardTitle: '無可用成員'
    },
    [ContextType.BOT]: {
      title: '成員管理',
      subtitle: '機器人工作區不支援成員管理',
      cardTitle: '無可用成員'
    }
  };

  protected readonly defaultConfig = {
    title: '成員管理',
    subtitle: '請選擇一個組織或團隊工作區以管理成員',
    cardTitle: '成員管理'
  };
}
