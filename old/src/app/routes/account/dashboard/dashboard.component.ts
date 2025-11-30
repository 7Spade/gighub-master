/**
 * Dashboard Component
 *
 * 統一儀表板組件 - 根據工作區上下文動態顯示內容
 * Unified dashboard component - dynamically displays content based on workspace context
 *
 * @module routes/account/dashboard
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { UserDashboardComponent, OrganizationDashboardComponent, TeamDashboardComponent } from './components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS, UserDashboardComponent, OrganizationDashboardComponent, TeamDashboardComponent],
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
            <app-user-dashboard [userId]="authContext.contextId()!" />
          }
          @case (ContextType.ORGANIZATION) {
            <app-organization-dashboard [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <app-team-dashboard [teamId]="authContext.contextId()!" />
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人儀表板" nzDescription="機器人儀表板功能正在開發中" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '個人儀表板',
      subtitle: '查看 {label} 的個人統計與概覽',
      cardTitle: '個人概覽'
    },
    [ContextType.ORGANIZATION]: {
      title: '組織儀表板',
      subtitle: '查看 {label} 的組織統計與概覽',
      cardTitle: '組織概覽'
    },
    [ContextType.TEAM]: {
      title: '團隊儀表板',
      subtitle: '查看 {label} 的團隊統計與概覽',
      cardTitle: '團隊概覽'
    },
    [ContextType.BOT]: {
      title: '機器人儀表板',
      subtitle: '查看 {label} 的機器人統計與概覽',
      cardTitle: '機器人概覽'
    }
  };

  protected readonly defaultConfig = {
    title: '儀表板',
    subtitle: '請選擇一個工作區以查看儀表板',
    cardTitle: '概覽'
  };
}
