/**
 * API Gateway Management Component
 *
 * API 閘道管理組件
 * Comprehensive API gateway management for blueprints
 *
 * Features:
 * - API Key management (create, revoke, view)
 * - Webhook configuration and management
 * - Rate limiting settings
 * - API quota monitoring
 * - Request logs and analytics
 *
 * @module routes/blueprint/api-gateway
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  permissions: string[];
  requestCount: number;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: Date;
  lastTriggeredAt: Date | null;
  successCount: number;
  failureCount: number;
}

interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

interface ApiStats {
  totalRequests: number;
  todayRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeWebhooks: number;
  activeApiKeys: number;
}

@Component({
  selector: 'app-blueprint-api-gateway',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzDividerModule,
    NzTooltipModule,
    NzStatisticModule,
    NzGridModule,
    NzProgressModule,
    NzTabsModule,
    NzResultModule,
    NzDrawerModule,
    NzFormModule,
    NzModalModule,
    NzSwitchModule,
    NzPopconfirmModule,
    NzBadgeModule,
    NzAlertModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h2>
          <span nz-icon nzType="api" nzTheme="outline"></span>
          API 閘道管理
        </h2>
        <p class="subtitle">管理 API 金鑰、Webhook 和速率限制設定</p>
      </div>
      <div class="header-actions">
        <button nz-button nzType="default" (click)="goBack()">
          <span nz-icon nzType="arrow-left"></span>
          返回概覽
        </button>
      </div>
    </div>

    <nz-spin [nzSpinning]="loading()">
      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="[16, 16]" class="stats-row">
        <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="總請求數"
              [nzValue]="stats().totalRequests"
              [nzPrefix]="totalRequestsPrefix"
              [nzValueStyle]="{ color: '#1890ff' }"
            ></nz-statistic>
            <ng-template #totalRequestsPrefix>
              <span nz-icon nzType="api" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="今日請求"
              [nzValue]="stats().todayRequests"
              [nzPrefix]="todayRequestsPrefix"
              [nzValueStyle]="{ color: '#52c41a' }"
            ></nz-statistic>
            <ng-template #todayRequestsPrefix>
              <span nz-icon nzType="calendar" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="API 金鑰"
              [nzValue]="stats().activeApiKeys"
              [nzPrefix]="apiKeysPrefix"
              [nzValueStyle]="{ color: '#faad14' }"
            ></nz-statistic>
            <ng-template #apiKeysPrefix>
              <span nz-icon nzType="key" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="活躍 Webhook"
              [nzValue]="stats().activeWebhooks"
              [nzPrefix]="webhooksPrefix"
              [nzValueStyle]="{ color: '#722ed1' }"
            ></nz-statistic>
            <ng-template #webhooksPrefix>
              <span nz-icon nzType="link" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <nz-card [nzBordered]="false" class="main-card">
        <nz-tabset>
          <!-- API Keys Tab -->
          <nz-tab nzTitle="API 金鑰">
            <div class="tab-header">
              <div class="tab-title">
                <h3>API 金鑰管理</h3>
                <p>建立和管理用於訪問藍圖 API 的金鑰</p>
              </div>
              <button nz-button nzType="primary" (click)="openApiKeyDrawer()">
                <span nz-icon nzType="plus"></span>
                建立 API 金鑰
              </button>
            </div>

            <nz-alert
              nzType="info"
              nzMessage="安全提示"
              nzDescription="API 金鑰是敏感憑證，請妥善保管。金鑰只會在建立時顯示一次，請立即複製並安全儲存。"
              [nzShowIcon]="true"
              class="alert-info"
            ></nz-alert>

            <nz-table #apiKeyTable [nzData]="apiKeys()" [nzShowPagination]="true" [nzPageSize]="10" nzSize="middle">
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>金鑰</th>
                  <th>權限</th>
                  <th>狀態</th>
                  <th>請求次數</th>
                  <th>最後使用</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                @for (key of apiKeyTable.data; track key.id) {
                  <tr>
                    <td>
                      <span class="key-name">{{ key.name }}</span>
                    </td>
                    <td>
                      <code class="key-value">{{ maskApiKey(key.key) }}</code>
                      <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="複製金鑰" (click)="copyApiKey(key.key)">
                        <span nz-icon nzType="copy"></span>
                      </button>
                    </td>
                    <td>
                      @for (perm of key.permissions.slice(0, 2); track perm) {
                        <nz-tag>{{ perm }}</nz-tag>
                      }
                      @if (key.permissions.length > 2) {
                        <nz-tag>+{{ key.permissions.length - 2 }}</nz-tag>
                      }
                    </td>
                    <td>
                      @if (key.isActive) {
                        <nz-badge nzStatus="success" nzText="啟用"></nz-badge>
                      } @else {
                        <nz-badge nzStatus="default" nzText="停用"></nz-badge>
                      }
                    </td>
                    <td>{{ key.requestCount | number }}</td>
                    <td>
                      @if (key.lastUsedAt) {
                        {{ key.lastUsedAt | date: 'yyyy-MM-dd HH:mm' }}
                      } @else {
                        <span class="text-muted">從未使用</span>
                      }
                    </td>
                    <td>
                      <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="編輯" (click)="editApiKey(key)">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        nz-button
                        nzType="text"
                        nzSize="small"
                        nzDanger
                        nz-popconfirm
                        nzPopconfirmTitle="確定要撤銷此 API 金鑰嗎？"
                        (nzOnConfirm)="revokeApiKey(key.id)"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7">
                      <nz-empty nzNotFoundContent="尚無 API 金鑰"></nz-empty>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-tab>

          <!-- Webhooks Tab -->
          <nz-tab nzTitle="Webhooks">
            <div class="tab-header">
              <div class="tab-title">
                <h3>Webhook 管理</h3>
                <p>設定事件通知到外部服務</p>
              </div>
              <button nz-button nzType="primary" (click)="openWebhookDrawer()">
                <span nz-icon nzType="plus"></span>
                建立 Webhook
              </button>
            </div>

            <nz-table #webhookTable [nzData]="webhooks()" [nzShowPagination]="true" [nzPageSize]="10" nzSize="middle">
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>URL</th>
                  <th>事件</th>
                  <th>狀態</th>
                  <th>成功/失敗</th>
                  <th>最後觸發</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                @for (webhook of webhookTable.data; track webhook.id) {
                  <tr>
                    <td>
                      <span class="webhook-name">{{ webhook.name }}</span>
                    </td>
                    <td>
                      <code class="webhook-url" nz-tooltip [nzTooltipTitle]="webhook.url">
                        {{ truncateUrl(webhook.url) }}
                      </code>
                    </td>
                    <td>
                      @for (event of webhook.events.slice(0, 2); track event) {
                        <nz-tag nzColor="blue">{{ getEventLabel(event) }}</nz-tag>
                      }
                      @if (webhook.events.length > 2) {
                        <nz-tag>+{{ webhook.events.length - 2 }}</nz-tag>
                      }
                    </td>
                    <td>
                      @if (webhook.isActive) {
                        <nz-badge nzStatus="success" nzText="啟用"></nz-badge>
                      } @else {
                        <nz-badge nzStatus="default" nzText="停用"></nz-badge>
                      }
                    </td>
                    <td>
                      <span class="success-count">{{ webhook.successCount }}</span>
                      /
                      <span class="failure-count">{{ webhook.failureCount }}</span>
                    </td>
                    <td>
                      @if (webhook.lastTriggeredAt) {
                        {{ webhook.lastTriggeredAt | date: 'yyyy-MM-dd HH:mm' }}
                      } @else {
                        <span class="text-muted">從未觸發</span>
                      }
                    </td>
                    <td>
                      <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="測試" (click)="testWebhook(webhook)">
                        <span nz-icon nzType="thunderbolt"></span>
                      </button>
                      <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="編輯" (click)="editWebhook(webhook)">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        nz-button
                        nzType="text"
                        nzSize="small"
                        nzDanger
                        nz-popconfirm
                        nzPopconfirmTitle="確定要刪除此 Webhook 嗎？"
                        (nzOnConfirm)="deleteWebhook(webhook.id)"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7">
                      <nz-empty nzNotFoundContent="尚無 Webhook"></nz-empty>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-tab>

          <!-- Rate Limiting Tab -->
          <nz-tab nzTitle="速率限制">
            <div class="tab-header">
              <div class="tab-title">
                <h3>速率限制設定</h3>
                <p>控制 API 請求頻率以保護系統資源</p>
              </div>
              <button nz-button nzType="primary" (click)="saveRateLimitConfig()">
                <span nz-icon nzType="save"></span>
                儲存設定
              </button>
            </div>

            <div class="rate-limit-section">
              <nz-card [nzBordered]="true" class="config-card">
                <div class="config-header">
                  <div class="config-info">
                    <h4>啟用速率限制</h4>
                    <p>開啟後將對所有 API 請求進行頻率限制</p>
                  </div>
                  <nz-switch [(ngModel)]="rateLimitConfig().enabled" (ngModelChange)="onRateLimitToggle($event)"></nz-switch>
                </div>
              </nz-card>

              @if (rateLimitConfig().enabled) {
                <div nz-row [nzGutter]="[16, 16]" class="config-row">
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="true" class="config-card">
                      <h4>每分鐘請求數</h4>
                      <nz-input-number
                        [(ngModel)]="rateLimitConfig().requestsPerMinute"
                        [nzMin]="1"
                        [nzMax]="10000"
                        [nzStep]="10"
                        style="width: 100%"
                      ></nz-input-number>
                      <p class="config-hint">建議值: 60</p>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="true" class="config-card">
                      <h4>每小時請求數</h4>
                      <nz-input-number
                        [(ngModel)]="rateLimitConfig().requestsPerHour"
                        [nzMin]="1"
                        [nzMax]="100000"
                        [nzStep]="100"
                        style="width: 100%"
                      ></nz-input-number>
                      <p class="config-hint">建議值: 1000</p>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="true" class="config-card">
                      <h4>每日請求數</h4>
                      <nz-input-number
                        [(ngModel)]="rateLimitConfig().requestsPerDay"
                        [nzMin]="1"
                        [nzMax]="1000000"
                        [nzStep]="1000"
                        style="width: 100%"
                      ></nz-input-number>
                      <p class="config-hint">建議值: 10000</p>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="true" class="config-card">
                      <h4>突發限制</h4>
                      <nz-input-number
                        [(ngModel)]="rateLimitConfig().burstLimit"
                        [nzMin]="1"
                        [nzMax]="100"
                        [nzStep]="1"
                        style="width: 100%"
                      ></nz-input-number>
                      <p class="config-hint">建議值: 10</p>
                    </nz-card>
                  </div>
                </div>

                <!-- Usage Statistics -->
                <nz-card [nzBordered]="true" class="usage-card">
                  <h4>當前使用量</h4>
                  <div nz-row [nzGutter]="[16, 16]">
                    <div nz-col [nzXs]="24" [nzSm]="8">
                      <div class="usage-item">
                        <span class="usage-label">每分鐘使用</span>
                        <nz-progress
                          [nzPercent]="getUsagePercent('minute')"
                          [nzStatus]="getUsageStatus('minute')"
                          nzSize="small"
                        ></nz-progress>
                        <span class="usage-text"> {{ currentUsage().minute }} / {{ rateLimitConfig().requestsPerMinute }} </span>
                      </div>
                    </div>
                    <div nz-col [nzXs]="24" [nzSm]="8">
                      <div class="usage-item">
                        <span class="usage-label">每小時使用</span>
                        <nz-progress [nzPercent]="getUsagePercent('hour')" [nzStatus]="getUsageStatus('hour')" nzSize="small"></nz-progress>
                        <span class="usage-text"> {{ currentUsage().hour }} / {{ rateLimitConfig().requestsPerHour }} </span>
                      </div>
                    </div>
                    <div nz-col [nzXs]="24" [nzSm]="8">
                      <div class="usage-item">
                        <span class="usage-label">每日使用</span>
                        <nz-progress [nzPercent]="getUsagePercent('day')" [nzStatus]="getUsageStatus('day')" nzSize="small"></nz-progress>
                        <span class="usage-text"> {{ currentUsage().day }} / {{ rateLimitConfig().requestsPerDay }} </span>
                      </div>
                    </div>
                  </div>
                </nz-card>
              }
            </div>
          </nz-tab>

          <!-- Quota Management Tab -->
          <nz-tab nzTitle="配額管理">
            <div class="tab-header">
              <div class="tab-title">
                <h3>API 配額管理</h3>
                <p>監控和管理 API 使用配額</p>
              </div>
            </div>

            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                <nz-card [nzBordered]="true">
                  <h4>API 請求配額</h4>
                  <nz-progress
                    nzType="circle"
                    [nzPercent]="getQuotaPercent('requests')"
                    [nzFormat]="formatQuota"
                    [nzWidth]="120"
                  ></nz-progress>
                  <p class="quota-info">{{ quotaUsage().requests | number }} / {{ quotaLimits().requests | number }} 請求</p>
                </nz-card>
              </div>
              <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                <nz-card [nzBordered]="true">
                  <h4>Webhook 配額</h4>
                  <nz-progress
                    nzType="circle"
                    [nzPercent]="getQuotaPercent('webhooks')"
                    [nzFormat]="formatQuota"
                    [nzWidth]="120"
                  ></nz-progress>
                  <p class="quota-info">{{ quotaUsage().webhooks }} / {{ quotaLimits().webhooks }} Webhooks</p>
                </nz-card>
              </div>
              <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                <nz-card [nzBordered]="true">
                  <h4>API 金鑰配額</h4>
                  <nz-progress
                    nzType="circle"
                    [nzPercent]="getQuotaPercent('apiKeys')"
                    [nzFormat]="formatQuota"
                    [nzWidth]="120"
                  ></nz-progress>
                  <p class="quota-info">{{ quotaUsage().apiKeys }} / {{ quotaLimits().apiKeys }} API 金鑰</p>
                </nz-card>
              </div>
            </div>
          </nz-tab>
        </nz-tabset>
      </nz-card>
    </nz-spin>

    <!-- API Key Drawer -->
    <nz-drawer
      [nzVisible]="apiKeyDrawerVisible()"
      [nzTitle]="editingApiKey() ? '編輯 API 金鑰' : '建立 API 金鑰'"
      [nzWidth]="500"
      [nzClosable]="true"
      (nzOnClose)="closeApiKeyDrawer()"
    >
      <ng-container *nzDrawerContent>
        <form nz-form nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>金鑰名稱</nz-form-label>
            <nz-form-control nzErrorTip="請輸入金鑰名稱">
              <input nz-input [(ngModel)]="apiKeyForm().name" name="name" placeholder="例如：生產環境金鑰" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>權限範圍</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="apiKeyForm().permissions" name="permissions" nzMode="multiple" nzPlaceHolder="選擇權限">
                <nz-option nzValue="read" nzLabel="讀取 (Read)"></nz-option>
                <nz-option nzValue="write" nzLabel="寫入 (Write)"></nz-option>
                <nz-option nzValue="delete" nzLabel="刪除 (Delete)"></nz-option>
                <nz-option nzValue="admin" nzLabel="管理 (Admin)"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>到期時間</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="apiKeyForm().expiresIn" name="expiresIn" nzPlaceHolder="選擇到期時間">
                <nz-option nzValue="never" nzLabel="永不過期"></nz-option>
                <nz-option nzValue="30d" nzLabel="30 天"></nz-option>
                <nz-option nzValue="90d" nzLabel="90 天"></nz-option>
                <nz-option nzValue="1y" nzLabel="1 年"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <div class="drawer-footer">
            <button nz-button nzType="default" (click)="closeApiKeyDrawer()">取消</button>
            <button nz-button nzType="primary" (click)="saveApiKey()">
              {{ editingApiKey() ? '更新' : '建立' }}
            </button>
          </div>
        </form>
      </ng-container>
    </nz-drawer>

    <!-- Webhook Drawer -->
    <nz-drawer
      [nzVisible]="webhookDrawerVisible()"
      [nzTitle]="editingWebhook() ? '編輯 Webhook' : '建立 Webhook'"
      [nzWidth]="500"
      [nzClosable]="true"
      (nzOnClose)="closeWebhookDrawer()"
    >
      <ng-container *nzDrawerContent>
        <form nz-form nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Webhook 名稱</nz-form-label>
            <nz-form-control nzErrorTip="請輸入 Webhook 名稱">
              <input nz-input [(ngModel)]="webhookForm().name" name="name" placeholder="例如：Slack 通知" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Webhook URL</nz-form-label>
            <nz-form-control nzErrorTip="請輸入有效的 URL">
              <input nz-input [(ngModel)]="webhookForm().url" name="url" placeholder="https://example.com/webhook" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>觸發事件</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="webhookForm().events" name="events" nzMode="multiple" nzPlaceHolder="選擇觸發事件">
                <nz-option nzValue="task.created" nzLabel="任務建立"></nz-option>
                <nz-option nzValue="task.updated" nzLabel="任務更新"></nz-option>
                <nz-option nzValue="task.completed" nzLabel="任務完成"></nz-option>
                <nz-option nzValue="diary.created" nzLabel="日誌建立"></nz-option>
                <nz-option nzValue="diary.approved" nzLabel="日誌核准"></nz-option>
                <nz-option nzValue="qc.passed" nzLabel="品檢通過"></nz-option>
                <nz-option nzValue="qc.failed" nzLabel="品檢未通過"></nz-option>
                <nz-option nzValue="problem.created" nzLabel="問題建立"></nz-option>
                <nz-option nzValue="problem.resolved" nzLabel="問題解決"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Secret (用於簽名驗證)</nz-form-label>
            <nz-form-control>
              <nz-input-group [nzSuffix]="secretSuffix">
                <input nz-input [(ngModel)]="webhookForm().secret" name="secret" placeholder="選填，用於驗證請求" />
              </nz-input-group>
              <ng-template #secretSuffix>
                <button nz-button nzType="text" nzSize="small" (click)="generateSecret()">
                  <span nz-icon nzType="reload"></span>
                </button>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>啟用狀態</nz-form-label>
            <nz-form-control>
              <nz-switch [(ngModel)]="webhookForm().isActive" name="isActive"></nz-switch>
            </nz-form-control>
          </nz-form-item>

          <div class="drawer-footer">
            <button nz-button nzType="default" (click)="closeWebhookDrawer()">取消</button>
            <button nz-button nzType="primary" (click)="saveWebhook()">
              {{ editingWebhook() ? '更新' : '建立' }}
            </button>
          </div>
        </form>
      </ng-container>
    </nz-drawer>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .header-content h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .subtitle {
        margin: 0;
        color: rgba(0, 0, 0, 0.45);
      }

      .stats-row {
        margin-bottom: 24px;
      }

      .stat-card {
        text-align: center;
      }

      .main-card {
        margin-bottom: 24px;
      }

      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .tab-title h3 {
        margin: 0;
        font-size: 18px;
      }

      .tab-title p {
        margin: 4px 0 0;
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
      }

      .alert-info {
        margin-bottom: 16px;
      }

      .key-name,
      .webhook-name {
        font-weight: 500;
      }

      .key-value,
      .webhook-url {
        font-family: monospace;
        font-size: 12px;
        background: #f5f5f5;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .text-muted {
        color: rgba(0, 0, 0, 0.45);
      }

      .success-count {
        color: #52c41a;
      }

      .failure-count {
        color: #ff4d4f;
      }

      .rate-limit-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .config-card {
        h4 {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 500;
        }

        p {
          margin: 8px 0 0;
          color: rgba(0, 0, 0, 0.45);
          font-size: 12px;
        }
      }

      .config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .config-info {
        h4 {
          margin: 0;
        }

        p {
          margin: 4px 0 0;
        }
      }

      .config-row {
        margin-top: 16px;
      }

      .config-hint {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }

      .usage-card {
        margin-top: 16px;

        h4 {
          margin: 0 0 16px;
        }
      }

      .usage-item {
        .usage-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .usage-text {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.65);
        }
      }

      .quota-info {
        margin-top: 12px;
        text-align: center;
        color: rgba(0, 0, 0, 0.65);
      }

      .drawer-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px 24px;
        background: #fff;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `
  ]
})
export class BlueprintApiGatewayComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  loading = signal(false);
  blueprintId = signal<string>('');

  // Statistics
  stats = signal<ApiStats>({
    totalRequests: 0,
    todayRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeWebhooks: 0,
    activeApiKeys: 0
  });

  // API Keys
  apiKeys = signal<ApiKey[]>([]);
  apiKeyDrawerVisible = signal(false);
  editingApiKey = signal<ApiKey | null>(null);
  apiKeyForm = signal<{
    name: string;
    permissions: string[];
    expiresIn: string;
  }>({
    name: '',
    permissions: [],
    expiresIn: 'never'
  });

  // Webhooks
  webhooks = signal<Webhook[]>([]);
  webhookDrawerVisible = signal(false);
  editingWebhook = signal<Webhook | null>(null);
  webhookForm = signal<{
    name: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
  }>({
    name: '',
    url: '',
    events: [],
    secret: '',
    isActive: true
  });

  // Rate Limiting
  rateLimitConfig = signal<RateLimitConfig>({
    enabled: false,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 10
  });

  currentUsage = signal({
    minute: 0,
    hour: 0,
    day: 0
  });

  // Quota
  quotaUsage = signal({
    requests: 0,
    webhooks: 0,
    apiKeys: 0
  });

  quotaLimits = signal({
    requests: 100000,
    webhooks: 10,
    apiKeys: 20
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.blueprintId.set(id);
        this.loadData();
      }
    });
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Simulate loading data
      await this.simulateApiCall();

      // Set mock statistics
      this.stats.set({
        totalRequests: 15423,
        todayRequests: 234,
        successfulRequests: 15201,
        failedRequests: 222,
        averageResponseTime: 145,
        activeWebhooks: 3,
        activeApiKeys: 5
      });

      // Set mock API keys
      this.apiKeys.set([
        {
          id: '1',
          name: '生產環境金鑰',
          key: 'gig_live_abcd1234567890efghij',
          createdAt: new Date('2024-01-15'),
          lastUsedAt: new Date(),
          expiresAt: null,
          isActive: true,
          permissions: ['read', 'write'],
          requestCount: 8532
        },
        {
          id: '2',
          name: '測試環境金鑰',
          key: 'gig_test_xyz9876543210qwerty',
          createdAt: new Date('2024-02-20'),
          lastUsedAt: new Date('2024-12-01'),
          expiresAt: new Date('2025-02-20'),
          isActive: true,
          permissions: ['read'],
          requestCount: 1245
        }
      ]);

      // Set mock webhooks
      this.webhooks.set([
        {
          id: '1',
          name: 'Slack 通知',
          url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX',
          events: ['task.created', 'task.completed'],
          isActive: true,
          secret: 'whsec_abcd1234',
          createdAt: new Date('2024-03-01'),
          lastTriggeredAt: new Date(),
          successCount: 523,
          failureCount: 12
        },
        {
          id: '2',
          name: 'Email 通知',
          url: 'https://api.sendgrid.com/v3/webhook',
          events: ['problem.created', 'qc.failed'],
          isActive: true,
          secret: 'whsec_xyz9876',
          createdAt: new Date('2024-04-15'),
          lastTriggeredAt: new Date('2024-12-05'),
          successCount: 156,
          failureCount: 3
        }
      ]);

      // Set quota usage
      this.quotaUsage.set({
        requests: 15423,
        webhooks: 2,
        apiKeys: 2
      });

      // Set current usage
      this.currentUsage.set({
        minute: 12,
        hour: 234,
        day: 1523
      });
    } catch (error) {
      console.error('Failed to load API gateway data:', error);
      this.msg.error('載入 API 閘道資料失敗');
    } finally {
      this.loading.set(false);
    }
  }

  private simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  goBack(): void {
    this.router.navigate(['../../overview'], { relativeTo: this.route });
  }

  // API Key methods
  maskApiKey(key: string): string {
    if (key.length <= 12) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }

  copyApiKey(key: string): void {
    navigator.clipboard
      .writeText(key)
      .then(() => {
        this.msg.success('API 金鑰已複製到剪貼簿');
      })
      .catch(() => {
        this.msg.error('複製失敗');
      });
  }

  openApiKeyDrawer(): void {
    this.editingApiKey.set(null);
    this.apiKeyForm.set({
      name: '',
      permissions: [],
      expiresIn: 'never'
    });
    this.apiKeyDrawerVisible.set(true);
  }

  editApiKey(key: ApiKey): void {
    this.editingApiKey.set(key);
    this.apiKeyForm.set({
      name: key.name,
      permissions: [...key.permissions],
      expiresIn: key.expiresAt ? '90d' : 'never'
    });
    this.apiKeyDrawerVisible.set(true);
  }

  closeApiKeyDrawer(): void {
    this.apiKeyDrawerVisible.set(false);
    this.editingApiKey.set(null);
  }

  saveApiKey(): void {
    const form = this.apiKeyForm();
    if (!form.name || form.permissions.length === 0) {
      this.msg.warning('請填寫必填欄位');
      return;
    }

    if (this.editingApiKey()) {
      this.msg.success('API 金鑰已更新');
    } else {
      // Generate a new key
      const newKey = `gig_${Math.random().toString(36).substring(2, 30)}`;
      this.modal.success({
        nzTitle: 'API 金鑰建立成功',
        nzContent: `
          <p>請立即複製並安全儲存此金鑰，它只會顯示一次：</p>
          <code style="display: block; padding: 12px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">
            ${newKey}
          </code>
        `,
        nzOkText: '複製金鑰',
        nzOnOk: () => {
          navigator.clipboard.writeText(newKey);
          this.msg.success('金鑰已複製');
        }
      });
    }

    this.closeApiKeyDrawer();
    this.loadData();
  }

  revokeApiKey(keyId: string): void {
    // TODO: Implement actual API call to revoke key
    console.debug(`Revoking API key: ${keyId}`);
    this.msg.success('API 金鑰已撤銷');
    this.loadData();
  }

  // Webhook methods
  truncateUrl(url: string): string {
    if (url.length <= 40) return url;
    return `${url.substring(0, 37)}...`;
  }

  getEventLabel(event: string): string {
    const labels: Record<string, string> = {
      'task.created': '任務建立',
      'task.updated': '任務更新',
      'task.completed': '任務完成',
      'diary.created': '日誌建立',
      'diary.approved': '日誌核准',
      'qc.passed': '品檢通過',
      'qc.failed': '品檢未通過',
      'problem.created': '問題建立',
      'problem.resolved': '問題解決'
    };
    return labels[event] || event;
  }

  openWebhookDrawer(): void {
    this.editingWebhook.set(null);
    this.webhookForm.set({
      name: '',
      url: '',
      events: [],
      secret: '',
      isActive: true
    });
    this.webhookDrawerVisible.set(true);
  }

  editWebhook(webhook: Webhook): void {
    this.editingWebhook.set(webhook);
    this.webhookForm.set({
      name: webhook.name,
      url: webhook.url,
      events: [...webhook.events],
      secret: webhook.secret,
      isActive: webhook.isActive
    });
    this.webhookDrawerVisible.set(true);
  }

  closeWebhookDrawer(): void {
    this.webhookDrawerVisible.set(false);
    this.editingWebhook.set(null);
  }

  generateSecret(): void {
    const secret = `whsec_${Math.random().toString(36).substring(2, 18)}`;
    this.webhookForm.update(form => ({ ...form, secret }));
    this.msg.success('已產生新的 Secret');
  }

  saveWebhook(): void {
    const form = this.webhookForm();
    if (!form.name || !form.url || form.events.length === 0) {
      this.msg.warning('請填寫必填欄位');
      return;
    }

    if (this.editingWebhook()) {
      this.msg.success('Webhook 已更新');
    } else {
      this.msg.success('Webhook 已建立');
    }

    this.closeWebhookDrawer();
    this.loadData();
  }

  deleteWebhook(webhookId: string): void {
    // TODO: Implement actual API call to delete webhook
    console.debug(`Deleting webhook: ${webhookId}`);
    this.msg.success('Webhook 已刪除');
    this.loadData();
  }

  testWebhook(webhook: Webhook): void {
    // TODO: Implement actual webhook test request
    console.debug(`Testing webhook: ${webhook.name} -> ${webhook.url}`);
    this.msg.loading('正在發送測試請求...', { nzDuration: 0 });
    setTimeout(() => {
      this.msg.remove();
      this.msg.success('測試請求已發送成功');
    }, 1500);
  }

  // Rate limiting methods
  onRateLimitToggle(enabled: boolean): void {
    this.rateLimitConfig.update(config => ({ ...config, enabled }));
  }

  saveRateLimitConfig(): void {
    this.msg.success('速率限制設定已儲存');
  }

  getUsagePercent(type: 'minute' | 'hour' | 'day'): number {
    const usage = this.currentUsage();
    const config = this.rateLimitConfig();

    switch (type) {
      case 'minute':
        return Math.round((usage.minute / config.requestsPerMinute) * 100);
      case 'hour':
        return Math.round((usage.hour / config.requestsPerHour) * 100);
      case 'day':
        return Math.round((usage.day / config.requestsPerDay) * 100);
    }
  }

  getUsageStatus(type: 'minute' | 'hour' | 'day'): 'success' | 'exception' | 'active' | 'normal' {
    const percent = this.getUsagePercent(type);
    if (percent >= 90) return 'exception';
    if (percent >= 70) return 'active';
    return 'success';
  }

  // Quota methods
  getQuotaPercent(type: 'requests' | 'webhooks' | 'apiKeys'): number {
    const usage = this.quotaUsage();
    const limits = this.quotaLimits();

    switch (type) {
      case 'requests':
        return Math.round((usage.requests / limits.requests) * 100);
      case 'webhooks':
        return Math.round((usage.webhooks / limits.webhooks) * 100);
      case 'apiKeys':
        return Math.round((usage.apiKeys / limits.apiKeys) * 100);
    }
  }

  formatQuota = (percent: number): string => `${percent}%`;
}
