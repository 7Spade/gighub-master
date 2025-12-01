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

import { OrganizationMembersComponent, TeamMembersComponent } from './components';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [SHARED_IMPORTS, OrganizationMembersComponent, TeamMembersComponent],
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
          @case (ContextType.USER) {
            <nz-alert nzType="info" nzMessage="個人帳戶" nzDescription="個人帳戶不支援成員管理，請選擇組織或團隊" nzShowIcon></nz-alert>
          }
          @case (ContextType.ORGANIZATION) {
            <app-organization-members [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <app-team-members [teamId]="authContext.contextId()!" />
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人帳戶" nzDescription="機器人帳戶不支援成員管理" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '成員管理',
      subtitle: '個人帳戶不支援成員管理',
      cardTitle: '成員管理'
    },
    [ContextType.ORGANIZATION]: {
      title: '組織成員',
      subtitle: '管理 {label} 的組織成員',
      cardTitle: '組織成員列表'
    },
    [ContextType.TEAM]: {
      title: '團隊成員',
      subtitle: '管理 {label} 的團隊成員',
      cardTitle: '團隊成員列表'
    },
    [ContextType.BOT]: {
      title: '成員管理',
      subtitle: '機器人帳戶不支援成員管理',
      cardTitle: '成員管理'
    }
  };

  protected readonly defaultConfig = {
    title: '成員管理',
    subtitle: '請選擇組織或團隊以管理成員',
    cardTitle: '成員管理'
  };
}
