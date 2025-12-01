/**
 * Teams Component
 *
 * 統一團隊管理組件 - 根據工作區上下文動態顯示內容
 * Unified teams management component - dynamically displays content based on workspace context
 *
 * @module routes/account/teams
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { OrganizationTeamsComponent } from './components';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [SHARED_IMPORTS, OrganizationTeamsComponent],
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
            <nz-alert nzType="info" nzMessage="個人帳戶" nzDescription="個人帳戶不支援團隊管理，請選擇組織" nzShowIcon></nz-alert>
          }
          @case (ContextType.ORGANIZATION) {
            <app-organization-teams [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <nz-alert nzType="info" nzMessage="團隊上下文" nzDescription="請切換到組織上下文來管理所有團隊" nzShowIcon></nz-alert>
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人帳戶" nzDescription="機器人帳戶不支援團隊管理" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '團隊管理',
      subtitle: '個人帳戶不支援團隊管理',
      cardTitle: '團隊管理'
    },
    [ContextType.ORGANIZATION]: {
      title: '團隊管理',
      subtitle: '管理 {label} 的所有團隊',
      cardTitle: '團隊列表'
    },
    [ContextType.TEAM]: {
      title: '團隊管理',
      subtitle: '請切換到組織上下文',
      cardTitle: '團隊管理'
    },
    [ContextType.BOT]: {
      title: '團隊管理',
      subtitle: '機器人帳戶不支援團隊管理',
      cardTitle: '團隊管理'
    }
  };

  protected readonly defaultConfig = {
    title: '團隊管理',
    subtitle: '請選擇組織以管理團隊',
    cardTitle: '團隊管理'
  };
}
