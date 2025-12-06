/**
 * Blueprint Notification Settings Component
 *
 * 藍圖通知設定元件
 * Manage notification preferences for a blueprint
 *
 * Features:
 * - Configure notification channels (in-app, email, push)
 * - Set notification types per category
 * - Manage quiet hours/do not disturb
 * - Subscription management
 *
 * @module routes/blueprint/notifications
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface NotificationCategory {
  key: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

interface QuietHours {
  enabled: boolean;
  startTime: Date | null;
  endTime: Date | null;
  days: string[];
}

@Component({
  selector: 'app-blueprint-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    NzSwitchModule,
    NzTableModule,
    NzDividerModule,
    NzSelectModule,
    NzTimePickerModule,
    NzSpinModule,
    NzToolTipModule
  ],
  template: `
    <nz-page-header nzBackIcon [nzGhost]="false" (nzBack)="goBack()">
      <nz-breadcrumb nz-page-header-breadcrumb>
        <nz-breadcrumb-item><a [routerLink]="['/blueprint', blueprintId(), 'overview']">藍圖概覽</a></nz-breadcrumb-item>
        <nz-breadcrumb-item><a [routerLink]="['/blueprint', blueprintId(), 'settings']">設定</a></nz-breadcrumb-item>
        <nz-breadcrumb-item>通知偏好</nz-breadcrumb-item>
      </nz-breadcrumb>
      <nz-page-header-title>通知偏好設定</nz-page-header-title>
      <nz-page-header-subtitle>管理此藍圖的通知接收方式和偏好</nz-page-header-subtitle>
      <nz-page-header-extra>
        <button nz-button nzType="primary" (click)="saveSettings()" [nzLoading]="saving()">
          <span nz-icon nzType="save"></span>
          儲存設定
        </button>
      </nz-page-header-extra>
    </nz-page-header>

    <nz-spin [nzSpinning]="loading()">
      <!-- Master Switch -->
      <nz-card nzTitle="整體通知開關" style="margin-bottom: 16px;">
        <div class="master-switch">
          <div class="switch-info">
            <span nz-icon nzType="bell" nzTheme="outline" class="switch-icon"></span>
            <div class="switch-text">
              <h4>啟用通知</h4>
              <p>開啟或關閉此藍圖的所有通知</p>
            </div>
          </div>
          <nz-switch [(ngModel)]="masterEnabled" (ngModelChange)="onMasterToggle($event)"></nz-switch>
        </div>
      </nz-card>

      @if (masterEnabled) {
        <!-- Notification Categories -->
        <nz-card nzTitle="通知類別設定" [nzExtra]="categoryExtraTpl" style="margin-bottom: 16px;">
          <ng-template #categoryExtraTpl>
            <span class="text-muted">選擇要接收的通知類別和接收方式</span>
          </ng-template>

          <nz-table #categoryTable [nzData]="categories()" [nzFrontPagination]="false" [nzShowPagination]="false" nzSize="middle">
            <thead>
              <tr>
                <th nzWidth="200px">類別</th>
                <th>說明</th>
                <th nzWidth="100px" nzAlign="center">
                  <span nz-tooltip nzTooltipTitle="應用程式內通知">
                    <span nz-icon nzType="bell" nzTheme="outline"></span>
                    應用內
                  </span>
                </th>
                <th nzWidth="100px" nzAlign="center">
                  <span nz-tooltip nzTooltipTitle="電子郵件通知">
                    <span nz-icon nzType="mail" nzTheme="outline"></span>
                    電子郵件
                  </span>
                </th>
                <th nzWidth="100px" nzAlign="center">
                  <span nz-tooltip nzTooltipTitle="推送通知">
                    <span nz-icon nzType="mobile" nzTheme="outline"></span>
                    推送
                  </span>
                </th>
                <th nzWidth="80px" nzAlign="center">啟用</th>
              </tr>
            </thead>
            <tbody>
              @for (category of categoryTable.data; track category.key) {
                <tr>
                  <td>
                    <div class="category-info">
                      <span nz-icon [nzType]="category.icon" class="category-icon"></span>
                      <span class="category-name">{{ category.name }}</span>
                    </div>
                  </td>
                  <td>{{ category.description }}</td>
                  <td nzAlign="center">
                    <nz-switch [(ngModel)]="category.channels.inApp" [nzDisabled]="!category.enabled" nzSize="small"></nz-switch>
                  </td>
                  <td nzAlign="center">
                    <nz-switch [(ngModel)]="category.channels.email" [nzDisabled]="!category.enabled" nzSize="small"></nz-switch>
                  </td>
                  <td nzAlign="center">
                    <nz-switch [(ngModel)]="category.channels.push" [nzDisabled]="!category.enabled" nzSize="small"></nz-switch>
                  </td>
                  <td nzAlign="center">
                    <nz-switch [(ngModel)]="category.enabled"></nz-switch>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </nz-card>

        <!-- Quiet Hours -->
        <nz-card nzTitle="勿擾時段" style="margin-bottom: 16px;">
          <div class="quiet-hours">
            <div class="switch-row">
              <div class="switch-info">
                <span nz-icon nzType="clock-circle" nzTheme="outline" class="switch-icon"></span>
                <div class="switch-text">
                  <h4>啟用勿擾時段</h4>
                  <p>在指定時段內暫停所有通知</p>
                </div>
              </div>
              <nz-switch [(ngModel)]="quietHours.enabled"></nz-switch>
            </div>

            @if (quietHours.enabled) {
              <nz-divider></nz-divider>

              <div nz-row [nzGutter]="16">
                <div nz-col [nzSpan]="8">
                  <label class="form-label">開始時間</label>
                  <nz-time-picker [(ngModel)]="quietHours.startTime" nzFormat="HH:mm" style="width: 100%;"></nz-time-picker>
                </div>
                <div nz-col [nzSpan]="8">
                  <label class="form-label">結束時間</label>
                  <nz-time-picker [(ngModel)]="quietHours.endTime" nzFormat="HH:mm" style="width: 100%;"></nz-time-picker>
                </div>
                <div nz-col [nzSpan]="8">
                  <label class="form-label">適用日期</label>
                  <nz-select [(ngModel)]="quietHours.days" nzMode="multiple" nzPlaceHolder="選擇適用日期" style="width: 100%;">
                    <nz-option nzValue="monday" nzLabel="週一"></nz-option>
                    <nz-option nzValue="tuesday" nzLabel="週二"></nz-option>
                    <nz-option nzValue="wednesday" nzLabel="週三"></nz-option>
                    <nz-option nzValue="thursday" nzLabel="週四"></nz-option>
                    <nz-option nzValue="friday" nzLabel="週五"></nz-option>
                    <nz-option nzValue="saturday" nzLabel="週六"></nz-option>
                    <nz-option nzValue="sunday" nzLabel="週日"></nz-option>
                  </nz-select>
                </div>
              </div>

              <div class="quiet-hours-summary">
                <span nz-icon nzType="info-circle" nzTheme="outline"></span>
                <span> 勿擾時段：{{ formatQuietHours() }} </span>
              </div>
            }
          </div>
        </nz-card>

        <!-- Email Digest -->
        <nz-card nzTitle="電子郵件摘要" style="margin-bottom: 16px;">
          <div class="switch-row">
            <div class="switch-info">
              <span nz-icon nzType="read" nzTheme="outline" class="switch-icon"></span>
              <div class="switch-text">
                <h4>啟用每日摘要</h4>
                <p>每日一次將所有通知彙整成摘要郵件發送</p>
              </div>
            </div>
            <nz-switch [(ngModel)]="dailyDigestEnabled"></nz-switch>
          </div>

          @if (dailyDigestEnabled) {
            <nz-divider></nz-divider>
            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="8">
                <label class="form-label">發送時間</label>
                <nz-time-picker [(ngModel)]="digestTime" nzFormat="HH:mm" style="width: 100%;"></nz-time-picker>
              </div>
            </div>
          }
        </nz-card>

        <!-- Smart Merge -->
        <nz-card nzTitle="智慧合併" style="margin-bottom: 16px;">
          <div class="switch-row">
            <div class="switch-info">
              <span nz-icon nzType="merge" nzTheme="outline" class="switch-icon"></span>
              <div class="switch-text">
                <h4>啟用通知合併</h4>
                <p>將短時間內的相似通知合併為一條，避免通知轟炸</p>
              </div>
            </div>
            <nz-switch [(ngModel)]="smartMergeEnabled"></nz-switch>
          </div>
        </nz-card>
      }
    </nz-spin>
  `,
  styles: [
    `
      .master-switch,
      .switch-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .switch-info {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .switch-icon {
        font-size: 24px;
        color: #1890ff;
        margin-top: 4px;
      }

      .switch-text h4 {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 600;
      }

      .switch-text p {
        margin: 0;
        color: #666;
        font-size: 13px;
      }

      .category-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .category-icon {
        font-size: 18px;
        color: #1890ff;
      }

      .category-name {
        font-weight: 500;
      }

      .form-label {
        display: block;
        margin-bottom: 8px;
        color: #666;
        font-size: 13px;
      }

      .quiet-hours-summary {
        margin-top: 16px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 13px;
      }

      .text-muted {
        color: #999;
        font-size: 13px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintNotificationSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  blueprintId = signal('');
  loading = signal(false);
  saving = signal(false);

  masterEnabled = true;
  dailyDigestEnabled = false;
  smartMergeEnabled = true;
  digestTime: Date | null = null;

  quietHours: QuietHours = {
    enabled: false,
    startTime: null,
    endTime: null,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  };

  categories = signal<NotificationCategory[]>([
    {
      key: 'task',
      name: '任務通知',
      description: '任務建立、更新、完成、到期提醒',
      icon: 'check-square',
      enabled: true,
      channels: { inApp: true, email: true, push: true }
    },
    {
      key: 'diary',
      name: '日誌通知',
      description: '日誌提交、審核結果通知',
      icon: 'file-text',
      enabled: true,
      channels: { inApp: true, email: true, push: false }
    },
    {
      key: 'qc',
      name: '品質檢查通知',
      description: '品質檢查建立、完成、不合格通知',
      icon: 'safety-certificate',
      enabled: true,
      channels: { inApp: true, email: true, push: true }
    },
    {
      key: 'problem',
      name: '問題通知',
      description: '問題回報、分派、解決通知',
      icon: 'warning',
      enabled: true,
      channels: { inApp: true, email: true, push: true }
    },
    {
      key: 'file',
      name: '檔案通知',
      description: '檔案上傳、分享、評論通知',
      icon: 'folder',
      enabled: true,
      channels: { inApp: true, email: false, push: false }
    },
    {
      key: 'member',
      name: '成員通知',
      description: '成員加入、離開、角色變更通知',
      icon: 'team',
      enabled: true,
      channels: { inApp: true, email: true, push: false }
    },
    {
      key: 'financial',
      name: '財務通知',
      description: '合約、費用、付款相關通知',
      icon: 'dollar',
      enabled: true,
      channels: { inApp: true, email: true, push: false }
    },
    {
      key: 'system',
      name: '系統通知',
      description: '系統維護、版本更新通知',
      icon: 'setting',
      enabled: true,
      channels: { inApp: true, email: false, push: false }
    }
  ]);

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadSettings();
      }
    });

    // Default digest time to 8:00 AM
    const defaultDigestTime = new Date();
    defaultDigestTime.setHours(8, 0, 0, 0);
    this.digestTime = defaultDigestTime;

    // Default quiet hours
    const startTime = new Date();
    startTime.setHours(22, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(7, 0, 0, 0);
    this.quietHours.startTime = startTime;
    this.quietHours.endTime = endTime;
  }

  loadSettings(): void {
    this.loading.set(true);
    // In a real implementation, load settings from the server
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  onMasterToggle(enabled: boolean): void {
    if (!enabled) {
      this.msg.info('已關閉此藍圖的所有通知');
    }
  }

  formatQuietHours(): string {
    if (!this.quietHours.startTime || !this.quietHours.endTime) {
      return '未設定';
    }

    const start = this.quietHours.startTime;
    const end = this.quietHours.endTime;
    const startStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
    const endStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

    const dayNames: Record<string, string> = {
      monday: '週一',
      tuesday: '週二',
      wednesday: '週三',
      thursday: '週四',
      friday: '週五',
      saturday: '週六',
      sunday: '週日'
    };

    const days = this.quietHours.days.map(d => dayNames[d] || d).join('、') || '未選擇';

    return `${startStr} - ${endStr}，${days}`;
  }

  saveSettings(): void {
    this.saving.set(true);

    // In a real implementation, save to the server
    setTimeout(() => {
      this.saving.set(false);
      this.msg.success('通知設定已儲存');
    }, 1000);
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId(), 'settings']);
  }
}
