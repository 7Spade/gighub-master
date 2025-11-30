/**
 * Settings Component
 *
 * 統一設定組件 - 根據工作區上下文動態顯示內容
 * Unified settings component - dynamically displays content based on workspace context
 *
 * @module routes/account/settings
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { UserSettingsComponent, OrganizationSettingsComponent } from './components';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SHARED_IMPORTS, UserSettingsComponent, OrganizationSettingsComponent],
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
            <app-user-settings [userId]="authContext.contextId()!" />
          }
          @case (ContextType.ORGANIZATION) {
            <app-organization-settings [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <nz-alert nzType="info" nzMessage="團隊設定" nzDescription="團隊設定功能正在開發中,敬請期待" nzShowIcon></nz-alert>
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人設定" nzDescription="機器人設定功能正在開發中,敬請期待" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '個人設定',
      subtitle: '管理 {label} 的個人設定與偏好',
      cardTitle: '個人配置'
    },
    [ContextType.ORGANIZATION]: {
      title: '組織設定',
      subtitle: '管理 {label} 的組織設定與偏好',
      cardTitle: '組織配置'
    },
    [ContextType.TEAM]: {
      title: '團隊設定',
      subtitle: '管理 {label} 的團隊設定與偏好',
      cardTitle: '團隊配置'
    },
    [ContextType.BOT]: {
      title: '機器人設定',
      subtitle: '管理 {label} 的機器人設定與偏好',
      cardTitle: '機器人配置'
    }
  };

  protected readonly defaultConfig = {
    title: '設定',
    subtitle: '請選擇一個工作區以管理設定',
    cardTitle: '配置'
  };
}
