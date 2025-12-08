/**
 * Blueprint Overview Component
 *
 * 藍圖概覽組件
 * Blueprint overview component
 *
 * Displays the overview/detail page for a specific blueprint with integrated tabs:
 * - 概覽: Blueprint details and statistics
 * - 任務管理: Task management (embedded TasksComponent)
 * - 成員管理: Member management (embedded MembersComponent)
 * - 財務: Financial overview with quick access buttons
 * - 活動: Activity timeline with audit logs
 *
 * @module routes/blueprint
 */

import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BlueprintFacade,
  BlueprintFinancialSummary,
  Contract,
  FinancialFacade,
  ModuleType,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  LoggerService,
  getModuleConfig
} from '@core';
import { ActivityTimelineComponent, BlueprintBusinessModel, BlueprintMemberDetail, WorkspaceContextService, TaskService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { BlueprintEditDrawerComponent } from './blueprint-edit-drawer.component';

@Component({
  selector: 'app-blueprint-overview',
  template: `
    <div class="blueprint-overview-container">
      <nz-spin [nzSpinning]="loading()">
        @if (error()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error() || '未知錯誤'">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回列表</button>
            </div>
          </nz-result>
        } @else if (blueprint()) {
          <!-- Header Section -->
          <div class="blueprint-header">
            <div class="header-left">
              @if (blueprint()!.cover_url) {
                <nz-avatar [nzSize]="64" [nzSrc]="blueprint()!.cover_url!" nzShape="square"></nz-avatar>
              } @else {
                <nz-avatar [nzSize]="64" nzIcon="project" nzShape="square"></nz-avatar>
              }
              <div class="header-info">
                <h1 class="blueprint-name">{{ blueprint()!.name }}</h1>
                <div class="blueprint-tags">
                  @if (blueprint()!.is_public) {
                    <nz-tag nzColor="green">公開</nz-tag>
                  } @else {
                    <nz-tag>私有</nz-tag>
                  }
                  <nz-tag [nzColor]="getStatusColor(blueprint()!.status)">{{ getStatusLabel(blueprint()!.status) }}</nz-tag>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button nz-button nzType="primary" (click)="editBlueprint()"> <span nz-icon nzType="edit"></span>編輯 </button>
            </div>
          </div>

          <!-- Description -->
          @if (blueprint()!.description) {
            <nz-card [nzBordered]="false" class="description-card">
              <p class="description">{{ blueprint()!.description }}</p>
            </nz-card>
          }

          <!-- Statistics -->
          <div nz-row [nzGutter]="[16, 16]" class="stats-row">
            <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="啟用模組" [nzValue]="enabledModulesCount()"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="成員數" [nzValue]="membersCount()"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="建立時間" [nzValue]="createdDate()" [nzValueStyle]="{ 'font-size': '14px' }"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="更新時間" [nzValue]="updatedDate()" [nzValueStyle]="{ 'font-size': '14px' }"></nz-statistic>
              </nz-card>
            </div>
          </div>

          <!-- Tabs for different sections -->
          <nz-tabs class="content-tabs" [(nzSelectedIndex)]="selectedTabIndex">
            <!-- 概覽 Tab -->
            <nz-tab nzTitle="概覽">
              <div class="tab-header">
                <h3>藍圖概覽</h3>
                <button nz-button nzType="primary" (click)="refreshBlueprint()">
                  <span nz-icon nzType="reload"></span>
                  重新整理
                </button>
              </div>
              <nz-card [nzBordered]="false">
                <nz-descriptions nzTitle="藍圖詳情" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }">
                  <nz-descriptions-item nzTitle="名稱">{{ blueprint()!.name }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="識別碼">{{ blueprint()!.slug }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="狀態">{{ getStatusLabel(blueprint()!.status) }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="可見性">{{ blueprint()!.is_public ? '公開' : '私有' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="啟用模組" [nzSpan]="2">
                    @for (module of blueprint()!.enabled_modules || []; track module) {
                      <nz-tag>{{ getModuleLabel(module) }}</nz-tag>
                    }
                    @if (!(blueprint()!.enabled_modules || []).length) {
                      <span class="text-muted">無</span>
                    }
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="建立時間">{{ blueprint()!.created_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="更新時間">{{ blueprint()!.updated_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
                </nz-descriptions>
              </nz-card>

              <!-- Quick Navigation Cards -->
              <div nz-row [nzGutter]="[16, 16]" class="quick-nav-row">
                @if (isTasksModuleEnabled()) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToTasks()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="ordered-list" class="nav-icon tasks"></span>
                        <div class="nav-text">
                          <h4>任務管理</h4>
                          <p>管理施工任務與進度追蹤</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToMembers()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="team" class="nav-icon members"></span>
                      <div class="nav-text">
                        <h4>成員管理</h4>
                        <p>管理藍圖成員與權限</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                @if (isModuleEnabled()(ModuleType.FINANCIAL)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToFinancialOverview()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="dollar" class="nav-icon financial"></span>
                        <div class="nav-text">
                          <h4>財務管理</h4>
                          <p>合約、費用與請款管理</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                @if (isModuleEnabled()(ModuleType.DIARY)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToDiaries()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="calendar" class="nav-icon diaries"></span>
                        <div class="nav-text">
                          <h4>施工日誌</h4>
                          <p>每日施工紀錄與審核</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                @if (isModuleEnabled()(ModuleType.CHECKLISTS)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToQcInspections()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="safety-certificate" class="nav-icon qc"></span>
                        <div class="nav-text">
                          <h4>品質管控</h4>
                          <p>品管檢查與驗收</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                @if (isModuleEnabled()(ModuleType.FILES)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToFiles()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="folder-open" class="nav-icon files"></span>
                        <div class="nav-text">
                          <h4>檔案管理</h4>
                          <p>文件上傳與管理</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToSettings()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="setting" class="nav-icon settings"></span>
                      <div class="nav-text">
                        <h4>藍圖設定</h4>
                        <p>配置模組和偏好</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                @if (isModuleEnabled()(ModuleType.ISSUES)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToProblems()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="warning" class="nav-icon problems"></span>
                        <div class="nav-text">
                          <h4>問題追蹤</h4>
                          <p>問題登記與處理</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToActivities()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="history" class="nav-icon activities"></span>
                      <div class="nav-text">
                        <h4>活動歷史</h4>
                        <p>操作記錄和變更歷史</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToNotifications()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="bell" class="nav-icon notifications"></span>
                      <div class="nav-text">
                        <h4>通知設定</h4>
                        <p>通知偏好和勿擾設定</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToSearch()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="search" class="nav-icon search"></span>
                      <div class="nav-text">
                        <h4>進階搜尋</h4>
                        <p>搜尋任務、日誌、檔案</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToPermissions()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="safety-certificate" class="nav-icon permissions"></span>
                      <div class="nav-text">
                        <h4>權限管理</h4>
                        <p>角色和權限設定</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                @if (isModuleEnabled()(ModuleType.ACCEPTANCE)) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToAcceptances()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="file-done" class="nav-icon acceptances"></span>
                        <div class="nav-text">
                          <h4>驗收管理</h4>
                          <p>工程驗收流程和審批</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToReports()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="bar-chart" class="nav-icon reports"></span>
                      <div class="nav-text">
                        <h4>報表分析</h4>
                        <p>進度、品質與財務統計</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
                @if (isTasksModuleEnabled()) {
                  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card [nzBordered]="false" class="nav-card" (click)="goToGantt()" nzHoverable>
                      <div class="nav-card-content">
                        <span nz-icon nzType="project" class="nav-icon gantt"></span>
                        <div class="nav-text">
                          <h4>甘特圖</h4>
                          <p>任務時間軸視覺化</p>
                        </div>
                      </div>
                    </nz-card>
                  </div>
                }
                <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                  <nz-card [nzBordered]="false" class="nav-card" (click)="goToApiGateway()" nzHoverable>
                    <div class="nav-card-content">
                      <span nz-icon nzType="api" class="nav-icon api-gateway"></span>
                      <div class="nav-text">
                        <h4>API 閘道</h4>
                        <p>API 金鑰、Webhook 和速率限制</p>
                      </div>
                    </div>
                  </nz-card>
                </div>
              </div>
            </nz-tab>

            <!-- 任務管理 Tab - only show if tasks module is enabled -->
            @if (isTasksModuleEnabled()) {
              <nz-tab nzTitle="任務管理">
                <div class="tab-header">
                  <h3>任務管理</h3>
                  <button nz-button nzType="primary" (click)="goToTasks()">
                    <span nz-icon nzType="fullscreen"></span>
                    開啟完整視圖
                  </button>
                </div>
                <nz-spin [nzSpinning]="taskService.loading()">
                  @if (taskService.hasError()) {
                    <nz-card [nzBordered]="false">
                      <nz-result nzStatus="error" nzTitle="載入任務失敗" [nzSubTitle]="taskService.error() || '無法載入任務資料'">
                        <div nz-result-extra>
                          <button nz-button nzType="primary" (click)="loadTasks(blueprintId() || '')">
                            <span nz-icon nzType="reload"></span>
                            重試
                          </button>
                        </div>
                      </nz-result>
                    </nz-card>
                  } @else if (taskService.tasks().length === 0 && !taskService.loading()) {
                    <nz-card [nzBordered]="false">
                      <nz-empty nzNotFoundContent="尚無任務">
                        <ng-template #nzNotFoundFooter>
                          <button nz-button nzType="primary" (click)="goToTasks()">
                            <span nz-icon nzType="plus"></span>
                            建立第一個任務
                          </button>
                        </ng-template>
                      </nz-empty>
                    </nz-card>
                  } @else {
                    <!-- Task Statistics -->
                    <div nz-row [nzGutter]="[16, 16]" class="task-stats-row">
                      <div nz-col [nzXs]="12" [nzSm]="6">
                        <nz-card [nzBordered]="false" class="stat-card">
                          <nz-statistic nzTitle="總任務數" [nzValue]="taskStatsByStatus().total"></nz-statistic>
                        </nz-card>
                      </div>
                      <div nz-col [nzXs]="12" [nzSm]="6">
                        <nz-card [nzBordered]="false" class="stat-card">
                          <nz-statistic
                            nzTitle="進行中"
                            [nzValue]="taskStatsByStatus().inProgress"
                            [nzValueStyle]="{ color: '#1890ff' }"
                          ></nz-statistic>
                        </nz-card>
                      </div>
                      <div nz-col [nzXs]="12" [nzSm]="6">
                        <nz-card [nzBordered]="false" class="stat-card">
                          <nz-statistic
                            nzTitle="已完成"
                            [nzValue]="taskStatsByStatus().completed"
                            [nzValueStyle]="{ color: '#52c41a' }"
                          ></nz-statistic>
                        </nz-card>
                      </div>
                      <div nz-col [nzXs]="12" [nzSm]="6">
                        <nz-card [nzBordered]="false" class="stat-card">
                          <nz-statistic
                            nzTitle="待處理"
                            [nzValue]="taskStatsByStatus().pending"
                            [nzValueStyle]="{ color: '#faad14' }"
                          ></nz-statistic>
                        </nz-card>
                      </div>
                    </div>

                    <!-- Task Preview Table -->
                    <nz-card [nzBordered]="false" class="task-preview-card">
                      <nz-table #taskTable [nzData]="previewTasks()" [nzShowPagination]="false" nzSize="small">
                        <thead>
                          <tr>
                            <th nzWidth="45%">任務名稱</th>
                            <th nzWidth="15%">狀態</th>
                            <th nzWidth="15%">優先級</th>
                            <th nzWidth="25%">進度</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (task of taskTable.data; track task.id) {
                            <tr>
                              <td>
                                <span class="task-title">{{ task.title }}</span>
                              </td>
                              <td>
                                <nz-tag [nzColor]="TASK_STATUS_CONFIG[task.status].color" nzBorderless>
                                  {{ TASK_STATUS_CONFIG[task.status].label }}
                                </nz-tag>
                              </td>
                              <td>
                                <nz-tag [nzColor]="TASK_PRIORITY_CONFIG[task.priority].color" nzBorderless>
                                  {{ TASK_PRIORITY_CONFIG[task.priority].label }}
                                </nz-tag>
                              </td>
                              <td>
                                <nz-progress
                                  [nzPercent]="task.completion_rate"
                                  [nzShowInfo]="true"
                                  [nzStrokeWidth]="6"
                                  nzSize="small"
                                ></nz-progress>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </nz-table>
                      @if (taskService.tasks().length > 10) {
                        <div class="task-preview-footer">
                          <p class="text-muted">顯示前 10 個任務，共 {{ taskService.tasks().length }} 個任務</p>
                          <button nz-button nzType="link" (click)="goToTasks()">
                            查看全部任務
                            <span nz-icon nzType="arrow-right"></span>
                          </button>
                        </div>
                      }
                    </nz-card>
                  }
                </nz-spin>
              </nz-tab>
            }

            <!-- 成員管理 Tab -->
            <nz-tab nzTitle="成員管理">
              <div class="tab-header">
                <h3>成員管理</h3>
                <button nz-button nzType="primary" (click)="goToMembers()">
                  <span nz-icon nzType="fullscreen"></span>
                  開啟完整視圖
                </button>
              </div>
              <nz-card [nzBordered]="false">
                <div class="members-preview">
                  <nz-table #memberTable [nzData]="members()" [nzShowPagination]="false" nzSize="small" [nzFrontPagination]="false">
                    <thead>
                      <tr>
                        <th>成員</th>
                        <th>角色</th>
                        <th>類型</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (member of members().slice(0, 5); track member.id) {
                        <tr>
                          <td>
                            <div class="member-info">
                              @if (member.accountAvatar) {
                                <nz-avatar [nzSize]="24" [nzSrc]="member.accountAvatar"></nz-avatar>
                              } @else {
                                <nz-avatar [nzSize]="24" nzIcon="user"></nz-avatar>
                              }
                              <span>{{ member.accountName || member.account_id }}</span>
                            </div>
                          </td>
                          <td>
                            <nz-tag>{{ getRoleLabel(member.role) }}</nz-tag>
                          </td>
                          <td>
                            @if (member.is_external) {
                              <nz-tag nzColor="orange">外部</nz-tag>
                            } @else {
                              <nz-tag nzColor="blue">內部</nz-tag>
                            }
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="3">
                            <nz-empty nzNotFoundContent="尚無成員"></nz-empty>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </nz-table>
                  @if (members().length > 5) {
                    <div class="view-more">
                      <button nz-button nzType="link" (click)="goToMembers()">
                        查看全部 {{ members().length }} 位成員
                        <span nz-icon nzType="right"></span>
                      </button>
                    </div>
                  }
                </div>
              </nz-card>
            </nz-tab>

            <!-- 財務 Tab - only show if financial module is enabled -->
            @if (isModuleEnabled()(ModuleType.FINANCIAL)) {
              <nz-tab nzTitle="財務">
              <div class="tab-header">
                <h3>財務管理</h3>
                <button nz-button nzType="primary" (click)="goToFinancialPage('overview')">
                  <span nz-icon nzType="fullscreen"></span>
                  開啟完整視圖
                </button>
              </div>
              <nz-spin [nzSpinning]="financialLoading()">
                <!-- Financial Statistics Cards -->
                @if (financialSummary()) {
                  <div nz-row [nzGutter]="[16, 16]" class="financial-stats-row">
                    <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                      <nz-card [nzBordered]="false" class="financial-card stat-card">
                        <nz-statistic nzTitle="總預算" [nzValue]="totalBudget()" [nzPrefix]="'$'" [nzValueStyle]="{ color: '#1890ff' }">
                        </nz-statistic>
                      </nz-card>
                    </div>
                    <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                      <nz-card [nzBordered]="false" class="financial-card stat-card">
                        <nz-statistic
                          nzTitle="已支出"
                          [nzValue]="financialSummary()!.total_expenses"
                          [nzPrefix]="'$'"
                          [nzValueStyle]="{ color: '#faad14' }"
                        >
                        </nz-statistic>
                        <div class="progress-bar">
                          <nz-progress [nzPercent]="expenseRate()" nzSize="small" [nzStatus]="expenseRate() > 90 ? 'exception' : 'active'">
                          </nz-progress>
                        </div>
                      </nz-card>
                    </div>
                    <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                      <nz-card [nzBordered]="false" class="financial-card stat-card">
                        <nz-statistic
                          nzTitle="已付款"
                          [nzValue]="financialSummary()!.total_paid"
                          [nzPrefix]="'$'"
                          [nzValueStyle]="{ color: '#52c41a' }"
                        >
                        </nz-statistic>
                        <div class="progress-bar">
                          <nz-progress [nzPercent]="paymentRate()" nzSize="small" nzStatus="success"> </nz-progress>
                        </div>
                      </nz-card>
                    </div>
                    <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                      <nz-card [nzBordered]="false" class="financial-card stat-card">
                        <nz-statistic
                          nzTitle="剩餘預算"
                          [nzValue]="remainingBudget()"
                          [nzPrefix]="'$'"
                          [nzValueStyle]="{ color: remainingBudget() >= 0 ? '#52c41a' : '#ff4d4f' }"
                        >
                        </nz-statistic>
                      </nz-card>
                    </div>
                  </div>
                }

                <!-- Quick Action Buttons -->
                <div class="financial-actions">
                  <button nz-button nzType="primary" (click)="goToFinancialPage('contracts')">
                    <span nz-icon nzType="file-text"></span>
                    合約管理
                  </button>
                  <button nz-button (click)="goToFinancialPage('expenses')">
                    <span nz-icon nzType="dollar"></span>
                    費用管理
                  </button>
                  <button nz-button (click)="goToFinancialPage('payment-requests')">
                    <span nz-icon nzType="audit"></span>
                    請款管理
                  </button>
                  <button nz-button (click)="goToFinancialPage('payments')">
                    <span nz-icon nzType="transaction"></span>
                    付款紀錄
                  </button>
                </div>

                @if (financialSummary()) {
                  <!-- Financial Overview -->
                  <nz-card nzTitle="財務概覽" [nzBordered]="false" class="financial-overview-card">
                    <nz-descriptions nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }">
                      <nz-descriptions-item nzTitle="待審核請款">{{ financialSummary()!.pending_payment_count }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="總預算">{{
                        totalBudget() | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="剩餘預算">
                        <span [style.color]="remainingBudget() >= 0 ? '#52c41a' : '#ff4d4f'">
                          {{ remainingBudget() | currency: 'TWD' : 'symbol' : '1.0-0' }}
                        </span>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已支出">{{
                        financialSummary()!.total_expenses | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已請款">{{
                        financialSummary()!.total_requested | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已付款">{{
                        financialSummary()!.total_paid | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="支出率">
                        <nz-progress
                          [nzPercent]="expenseRate()"
                          nzSize="small"
                          [nzStatus]="expenseRate() > 90 ? 'exception' : 'active'"
                          [nzShowInfo]="true"
                        >
                        </nz-progress>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="付款率">
                        <nz-progress [nzPercent]="paymentRate()" nzSize="small" nzStatus="success" [nzShowInfo]="true"> </nz-progress>
                      </nz-descriptions-item>
                    </nz-descriptions>
                  </nz-card>

                  <!-- Contracts Table -->
                  @if (contracts().length > 0) {
                    <nz-card nzTitle="合約列表" [nzBordered]="false" class="contracts-card" [nzExtra]="contractsExtra">
                      <ng-template #contractsExtra>
                        <button nz-button nzType="link" (click)="goToFinancialPage('contracts')">
                          查看全部
                          <span nz-icon nzType="right"></span>
                        </button>
                      </ng-template>
                      <nz-table
                        #contractsTable
                        [nzData]="contracts()"
                        [nzPageSize]="5"
                        nzSize="small"
                        [nzShowPagination]="contracts().length > 5"
                      >
                        <thead>
                          <tr>
                            <th>合約名稱</th>
                            <th>承包商</th>
                            <th nzAlign="right">合約金額</th>
                            <th nzAlign="center">狀態</th>
                            <th nzAlign="center">起始日期</th>
                            <th nzAlign="center">結束日期</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (contract of contractsTable.data; track contract.id) {
                            <tr>
                              <td>
                                <span nz-tooltip [nzTooltipTitle]="contract.description || ''">
                                  {{ contract.title }}
                                </span>
                              </td>
                              <td>{{ contract.vendor_name || '-' }}</td>
                              <td nzAlign="right">{{ contract.contract_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}</td>
                              <td nzAlign="center">
                                <nz-tag [nzColor]="getContractStatusColor(contract.lifecycle)">
                                  {{ getContractStatusLabel(contract.lifecycle) }}
                                </nz-tag>
                              </td>
                              <td nzAlign="center">{{ contract.start_date | date: 'yyyy-MM-dd' }}</td>
                              <td nzAlign="center">{{ contract.end_date | date: 'yyyy-MM-dd' }}</td>
                            </tr>
                          }
                        </tbody>
                      </nz-table>
                    </nz-card>
                  }
                } @else {
                  <nz-empty nzNotFoundContent="尚無財務資料" nzNotFoundImage="simple">
                    <ng-template #nzNotFoundFooter>
                      <p class="text-muted">建立合約後可在此查看財務資訊</p>
                      <button nz-button nzType="primary" (click)="goToFinancialPage('contracts')">
                        <span nz-icon nzType="plus"></span>
                        新增合約
                      </button>
                    </ng-template>
                  </nz-empty>
                }
              </nz-spin>
            </nz-tab>
            }

            <!-- 活動 Tab -->
            <nz-tab nzTitle="活動">
              <div class="tab-header">
                <h3>活動記錄</h3>
                <button nz-button nzType="primary" (click)="refreshActivity()">
                  <span nz-icon nzType="reload"></span>
                  重新整理
                </button>
              </div>
              <nz-card [nzBordered]="false">
                <app-activity-timeline [blueprintId]="blueprintId() || ''" [limit]="20" [showFilters]="true" />
              </nz-card>
            </nz-tab>
          </nz-tabs>
        } @else if (!loading()) {
          <nz-result nzStatus="404" nzTitle="找不到藍圖" nzSubTitle="您請求的藍圖不存在或已被刪除">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回列表</button>
            </div>
          </nz-result>
        }
      </nz-spin>

      <!-- Blueprint Edit Drawer -->
      <app-blueprint-edit-drawer
        [blueprint]="blueprint()"
        [visible]="editDrawerVisible()"
        (closed)="onEditDrawerClosed()"
        (saved)="onBlueprintSaved($event)"
      ></app-blueprint-edit-drawer>
    </div>
  `,
  styles: [
    `
      .blueprint-overview-container {
        padding: 24px;
      }
      .blueprint-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding: 24px;
        background: #fff;
        border-radius: 8px;
      }
      .header-left {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }
      .header-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .blueprint-name {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .blueprint-tags {
        display: flex;
        gap: 8px;
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
      .description-card {
        margin-bottom: 24px;
      }
      .description {
        margin: 0;
        color: #666;
        line-height: 1.6;
      }
      .stats-row {
        margin-bottom: 16px;
      }
      .financial-stats-row {
        margin-bottom: 24px;
      }
      .financial-card {
        text-align: center;
      }
      .financial-card .progress-bar {
        margin-top: 8px;
      }
      .content-tabs {
        background: #fff;
        padding: 16px;
        border-radius: 8px;
      }
      .text-muted {
        color: #999;
      }
      .financial-overview-card {
        margin-bottom: 16px;
      }
      .contracts-card {
        margin-top: 16px;
      }
      /* Task Preview Styles */
      .task-stats-row {
        margin-bottom: 16px;
      }
      .task-preview-card {
        margin-top: 16px;
      }
      .task-title {
        font-weight: 500;
      }
      .task-preview-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      .task-preview-footer p {
        margin: 0;
      }
      /* Quick Navigation Cards */
      .quick-nav-row {
        margin-top: 24px;
      }
      .nav-card {
        cursor: pointer;
        transition: all 0.3s;
      }
      .nav-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .nav-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .nav-icon {
        font-size: 32px;
      }
      .nav-icon.activities {
        color: #722ed1;
      }
      .nav-icon.notifications {
        color: #fa8c16;
      }
      .nav-icon.search {
        color: #eb2f96;
      }
      .nav-icon.permissions {
        color: #13c2c2;
      }
      .nav-icon.reports {
        color: #2f54eb;
      }
      .nav-icon.gantt {
        color: #722ed1;
      }
      .nav-text h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
      }
      .nav-text p {
        margin: 0;
        color: #666;
        font-size: 13px;
      }
      /* Tab Headers */
      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .tab-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      /* Members Preview */
      .members-preview {
        padding: 0;
      }
      .member-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .view-more {
        text-align: center;
        margin-top: 16px;
      }
      /* Financial Actions */
      .financial-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        padding: 16px;
        background: #fafafa;
        border-radius: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzDividerModule,
    NzEmptyModule,
    NzGridModule,
    NzIconModule,
    NzProgressModule,
    NzResultModule,
    NzSpinModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
    NzTabsModule,
    NzTimelineModule,
    NzTooltipModule,
    ActivityTimelineComponent,
    BlueprintEditDrawerComponent
  ]
})
export class BlueprintOverviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly financialFacade = inject(FinancialFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly msg = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  readonly taskService = inject(TaskService);

  @ViewChild(ActivityTimelineComponent) activityTimeline?: ActivityTimelineComponent;

  blueprint = signal<BlueprintBusinessModel | null>(null);
  members = signal<BlueprintMemberDetail[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Edit drawer state
  editDrawerVisible = signal(false);

  // Tab state
  selectedTabIndex = 0;

  // Financial state
  financialSummary = signal<BlueprintFinancialSummary | null>(null);
  contracts = signal<Contract[]>([]);
  financialLoading = signal(false);

  // Task configuration constants
  readonly TaskStatus = TaskStatus;
  readonly TASK_STATUS_CONFIG = TASK_STATUS_CONFIG;
  readonly TASK_PRIORITY_CONFIG = TASK_PRIORITY_CONFIG;

  readonly blueprintId = computed(() => this.route.snapshot.paramMap.get('id'));

  readonly enabledModulesCount = computed(() => {
    return this.blueprint()?.enabled_modules?.length || 0;
  });

  /** Check if tasks module is enabled */
  readonly isTasksModuleEnabled = computed(() => {
    const modules = this.blueprint()?.enabled_modules || [];
    return modules.includes(ModuleType.TASKS);
  });

  /**
   * Check if any module is enabled
   * Generic helper for checking module status
   */
  readonly isModuleEnabled = computed(() => {
    const enabledModules = this.blueprint()?.enabled_modules || [];
    return (module: ModuleType) => enabledModules.includes(module);
  });

  readonly membersCount = computed(() => {
    return this.members().length;
  });

  readonly createdDate = computed(() => {
    const date = this.blueprint()?.created_at;
    if (!date) return '-';
    const datePipe = new DatePipe('zh-CN');
    return datePipe.transform(new Date(date), 'yyyy/MM/dd') || '-';
  });

  readonly updatedDate = computed(() => {
    const date = this.blueprint()?.updated_at;
    if (!date) return '-';
    const datePipe = new DatePipe('zh-CN');
    return datePipe.transform(new Date(date), 'yyyy/MM/dd') || '-';
  });

  // Financial computed values
  readonly totalBudget = computed(() => {
    const summary = this.financialSummary();
    return summary?.total_contract_amount ?? 0;
  });

  readonly remainingBudget = computed(() => {
    const summary = this.financialSummary();
    if (!summary) return 0;
    return (summary.total_contract_amount ?? 0) - (summary.total_expenses ?? 0);
  });

  readonly expenseRate = computed(() => {
    const summary = this.financialSummary();
    const budget = summary?.total_contract_amount ?? 0;
    if (!summary || budget === 0) return 0;
    return Math.round(((summary.total_expenses ?? 0) / budget) * 100);
  });

  readonly paymentRate = computed(() => {
    const summary = this.financialSummary();
    const requested = summary?.total_requested ?? 0;
    if (!summary || requested === 0) return 0;
    return Math.round(((summary.total_paid ?? 0) / requested) * 100);
  });

  /** Get preview tasks (limit to 10 for overview) */
  readonly previewTasks = computed(() => {
    return this.taskService.tasks().slice(0, 10);
  });

  /** Get task statistics for overview */
  readonly taskStatsByStatus = computed(() => {
    const tasks = this.taskService.tasks();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      blocked: tasks.filter(t => t.status === TaskStatus.BLOCKED).length
    };
  });

  ngOnInit(): void {
    this.loadBlueprint();

    // Check if redirected due to disabled module
    this.route.queryParams.subscribe(params => {
      const disabledModule = params['moduleDisabled'];
      if (disabledModule) {
        const moduleName = this.getModuleLabel(disabledModule);
        this.msg.warning(`「${moduleName}」模組未啟用，請在設定中啟用後使用`);
        // Clear query params
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  async loadBlueprint(): Promise<void> {
    const id = this.blueprintId();
    if (!id) {
      this.error.set('無效的藍圖 ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const blueprint = await this.blueprintFacade.findById(id);
      if (blueprint) {
        this.blueprint.set(blueprint);
        // Load members
        const members = await this.blueprintFacade.getBlueprintMembers(id);
        this.members.set(members);

        // Load financial data
        this.loadFinancialData(id);

        // Load tasks if tasks module is enabled
        if (blueprint.enabled_modules?.includes(ModuleType.TASKS)) {
          this.loadTasks(id);
        }
      } else {
        this.error.set('找不到藍圖');
      }
    } catch (err) {
      this.logger.error('[BlueprintOverviewComponent] Failed to load blueprint:', err);
      this.error.set(err instanceof Error ? err.message : '載入藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTasks(blueprintId: string): Promise<void> {
    try {
      await this.taskService.loadTasksByBlueprint(blueprintId);
    } catch (err) {
      this.logger.error('[BlueprintOverviewComponent] Failed to load tasks:', err);
      // Don't set global error, just log it
    }
  }

  async loadFinancialData(blueprintId: string): Promise<void> {
    this.financialLoading.set(true);

    try {
      // Load financial summary and contracts in parallel
      const [summary, contractsList] = await Promise.all([
        this.financialFacade.getBlueprintFinancialSummary(blueprintId),
        this.financialFacade.loadContractsForBlueprint(blueprintId)
      ]);

      this.financialSummary.set(summary);
      this.contracts.set(contractsList);
    } catch (err) {
      console.error('[BlueprintOverviewComponent] Failed to load financial data:', err);
      // Don't set error for financial data - just log it
    } finally {
      this.financialLoading.set(false);
    }
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      active: 'green',
      inactive: 'default',
      suspended: 'orange',
      deleted: 'red'
    };
    return colorMap[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: '啟用中',
      inactive: '未啟用',
      suspended: '已停權',
      deleted: '已刪除'
    };
    return labelMap[status] || status;
  }

  getModuleLabel(module: string): string {
    const config = getModuleConfig(module as ModuleType);
    if (config) {
      return config.label;
    }

    // Deprecated modules - for backward compatibility only
    const deprecatedMap: Record<string, string> = {
      dashboard: '儀表板 (已棄用)',
      bot_workflow: '自動化流程 (已棄用)',
      todos: '待辦事項 (已棄用)'
    };

    return deprecatedMap[module] || module;
  }

  getContractStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'green',
      on_hold: 'orange',
      archived: 'blue',
      deleted: 'red'
    };
    return colorMap[status] || 'default';
  }

  getContractStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      draft: '草稿',
      active: '進行中',
      on_hold: '暫停',
      archived: '已封存',
      deleted: '已刪除'
    };
    return labelMap[status] || status;
  }

  goBack(): void {
    this.router.navigate(['/blueprint/list']);
  }

  goToTasks(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'tasks']);
    }
  }

  goToMembers(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'members']);
    }
  }

  goToFinancialOverview(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'financial', 'overview']);
    }
  }

  goToDiaries(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'diaries']);
    }
  }

  goToQcInspections(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'qc-inspections']);
    }
  }

  goToFiles(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'files']);
    }
  }

  goToSettings(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'settings']);
    }
  }

  goToProblems(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'problems']);
    }
  }

  goToActivities(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'activities']);
    }
  }

  goToNotifications(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'notifications']);
    }
  }

  goToSearch(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'search']);
    }
  }

  goToPermissions(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'permissions']);
    }
  }

  goToAcceptances(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'acceptances']);
    }
  }

  goToReports(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'reports']);
    }
  }

  goToGantt(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'gantt']);
    }
  }

  goToApiGateway(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'api-gateway']);
    }
  }

  editBlueprint(): void {
    this.editDrawerVisible.set(true);
  }

  onEditDrawerClosed(): void {
    this.editDrawerVisible.set(false);
  }

  onBlueprintSaved(updated: BlueprintBusinessModel): void {
    this.blueprint.set(updated);
    this.editDrawerVisible.set(false);
  }

  refreshBlueprint(): void {
    this.loadBlueprint();
  }

  refreshActivity(): void {
    if (this.activityTimeline) {
      this.activityTimeline.loadLogs();
    }
  }

  switchToTab(index: number): void {
    this.selectedTabIndex = index;
  }

  goToFinancialPage(page: string): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'financial', page]);
    }
  }

  getRoleLabel(role: string): string {
    const labelMap: Record<string, string> = {
      owner: '擁有者',
      maintainer: '維護者',
      contributor: '貢獻者',
      viewer: '檢視者'
    };
    return labelMap[role] || role;
  }
}
