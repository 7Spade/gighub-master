/**
 * Diaries Component
 *
 * 施工日誌管理組件
 * Construction diary management component
 *
 * Features:
 * - Diary list with filtering and search
 * - Calendar view for date-based navigation
 * - Create/edit diary functionality
 * - Approval workflow support
 *
 * @module routes/blueprint/diaries
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
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
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { format } from 'date-fns';
import { firstValueFrom } from 'rxjs';

import {
  CreateDiaryRequest,
  Diary,
  DiaryStatus,
  DiaryWithDetails,
  DIARY_STATUS_CONFIG,
  UpdateDiaryRequest,
  WeatherType,
  WEATHER_TYPE_CONFIG
} from '../../../core/infra/types/diary';
import { DiaryService } from '../../../shared/services/diary/diary.service';

@Component({
  selector: 'app-blueprint-diaries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzResultModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzGridModule,
    NzDescriptionsModule,
    NzStatisticModule,
    NzTabsModule,
    NzTimelineModule,
    NzAvatarModule,
    NzToolTipModule,
    NzPopconfirmModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="diaries-container">
      <nz-spin [nzSpinning]="diaryService.loading()">
        @if (error()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error()!">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="loadDiaries()">重試</button>
              <button nz-button (click)="goBack()">返回</button>
            </div>
          </nz-result>
        } @else {
          <!-- Header -->
          <div class="page-header">
            <div class="header-left">
              <button nz-button (click)="goBack()">
                <span nz-icon nzType="arrow-left"></span>
              </button>
              <h2>施工日誌</h2>
            </div>
            <div class="header-actions">
              <button nz-button nzType="primary" (click)="openCreateDrawer()">
                <span nz-icon nzType="plus"></span>
                新增日誌
              </button>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div nz-row [nzGutter]="[16, 16]" class="stats-row">
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="總日誌數" [nzValue]="stats()?.total_count || 0"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card draft">
                <nz-statistic nzTitle="草稿" [nzValue]="stats()?.draft_count || 0"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card submitted">
                <nz-statistic nzTitle="待審核" [nzValue]="stats()?.submitted_count || 0"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card approved">
                <nz-statistic nzTitle="已核准" [nzValue]="stats()?.approved_count || 0"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="總工時" [nzValue]="stats()?.total_work_hours || 0" nzSuffix="小時"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="平均每日出工" [nzValue]="stats()?.avg_daily_workers || 0" nzSuffix="人"></nz-statistic>
              </nz-card>
            </div>
          </div>

          <!-- Filters -->
          <nz-card [nzBordered]="false" class="filter-card">
            <div class="filters">
              <div class="filter-item">
                <nz-date-picker
                  [(ngModel)]="filterDateRange"
                  nzMode="month"
                  nzPlaceholder="選擇月份"
                  (ngModelChange)="onMonthChange($event)"
                ></nz-date-picker>
              </div>
              <div class="filter-item">
                <nz-select
                  [(ngModel)]="filterStatus"
                  nzPlaceholder="狀態篩選"
                  nzAllowClear
                  (ngModelChange)="onStatusFilterChange($event)"
                  style="width: 150px"
                >
                  @for (status of statusOptions; track status.value) {
                    <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
                  }
                </nz-select>
              </div>
              <div class="filter-item">
                <nz-input-group [nzSuffix]="suffixIconSearch">
                  <input nz-input placeholder="搜尋摘要..." [(ngModel)]="searchKeyword" (ngModelChange)="onSearchChange($event)" />
                </nz-input-group>
                <ng-template #suffixIconSearch>
                  <span nz-icon nzType="search"></span>
                </ng-template>
              </div>
              <button nz-button (click)="refreshDiaries()">
                <span nz-icon nzType="reload"></span>
                重新整理
              </button>
            </div>
          </nz-card>

          <!-- Diary List Table -->
          <nz-card [nzBordered]="false" class="table-card">
            <nz-table
              #diaryTable
              [nzData]="diaryService.diaries()"
              [nzPageSize]="diaryService.pagination().pageSize"
              [nzPageIndex]="diaryService.pagination().page"
              [nzTotal]="diaryService.pagination().total"
              [nzFrontPagination]="false"
              [nzShowSizeChanger]="true"
              [nzPageSizeOptions]="[10, 20, 50]"
              (nzPageIndexChange)="onPageChange($event)"
              (nzPageSizeChange)="onPageSizeChange($event)"
              nzSize="middle"
              [nzLoading]="diaryService.loading()"
            >
              <thead>
                <tr>
                  <th nzWidth="120px">工作日期</th>
                  <th nzWidth="80px">天氣</th>
                  <th nzWidth="80px">工時</th>
                  <th nzWidth="80px">出工人數</th>
                  <th>摘要</th>
                  <th nzWidth="100px">狀態</th>
                  <th nzWidth="120px">建立者</th>
                  <th nzWidth="140px">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (diary of diaryTable.data; track diary.id) {
                  <tr (click)="viewDiary(diary)" class="clickable-row">
                    <td>{{ diary.work_date | date: 'yyyy-MM-dd' }}</td>
                    <td>
                      @if (diary.weather) {
                        <nz-tag [nzColor]="getWeatherConfig(diary.weather).color">
                          {{ getWeatherConfig(diary.weather).label }}
                        </nz-tag>
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td>
                      @if (diary.work_hours !== null) {
                        {{ diary.work_hours }}h
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td>
                      @if (diary.worker_count !== null) {
                        {{ diary.worker_count }}人
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td>
                      <span class="summary-text" [nz-tooltip]="diary.summary || ''">
                        {{ diary.summary || '暫無摘要' | slice: 0 : 50 }}{{ (diary.summary?.length || 0) > 50 ? '...' : '' }}
                      </span>
                    </td>
                    <td>
                      <nz-tag [nzColor]="getStatusConfig(diary.status).color">
                        <span nz-icon [nzType]="getStatusConfig(diary.status).icon"></span>
                        {{ getStatusConfig(diary.status).label }}
                      </nz-tag>
                    </td>
                    <td>
                      @if (getDiaryWithDetails(diary); as diaryDetails) {
                        @if (diaryDetails.creator) {
                          <div class="creator-info">
                            @if (diaryDetails.creator.avatar_url) {
                              <nz-avatar [nzSrc]="diaryDetails.creator.avatar_url" [nzSize]="24"></nz-avatar>
                            } @else {
                              <nz-avatar nzIcon="user" [nzSize]="24"></nz-avatar>
                            }
                            <span>{{ diaryDetails.creator.name }}</span>
                          </div>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td (click)="$event.stopPropagation()">
                      <div class="action-buttons">
                        @if (getStatusConfig(diary.status).canEdit) {
                          <button nz-button nzType="link" nzSize="small" (click)="editDiary(diary)">
                            <span nz-icon nzType="edit"></span>
                          </button>
                        }
                        @if (getStatusConfig(diary.status).canSubmit) {
                          <button
                            nz-button
                            nzType="link"
                            nzSize="small"
                            nz-popconfirm
                            nzPopconfirmTitle="確定要提交此日誌嗎？"
                            (nzOnConfirm)="submitDiary(diary)"
                          >
                            <span nz-icon nzType="send"></span>
                          </button>
                        }
                        @if (getStatusConfig(diary.status).canApprove) {
                          <button nz-button nzType="link" nzSize="small" (click)="openApprovalModal(diary)">
                            <span nz-icon nzType="audit"></span>
                          </button>
                        }
                        @if (diary.status === 'draft') {
                          <button
                            nz-button
                            nzType="link"
                            nzDanger
                            nzSize="small"
                            nz-popconfirm
                            nzPopconfirmTitle="確定要刪除此日誌嗎？"
                            (nzOnConfirm)="deleteDiary(diary)"
                          >
                            <span nz-icon nzType="delete"></span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8">
                      <nz-empty nzNotFoundContent="尚無日誌記錄">
                        <ng-template #nzNotFoundFooter>
                          <button nz-button nzType="primary" (click)="openCreateDrawer()">
                            <span nz-icon nzType="plus"></span>
                            新增日誌
                          </button>
                        </ng-template>
                      </nz-empty>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-card>
        }
      </nz-spin>

      <!-- Create/Edit Diary Drawer -->
      <nz-drawer
        [nzVisible]="drawerVisible()"
        [nzWidth]="600"
        [nzTitle]="drawerTitle()"
        (nzOnClose)="closeDrawer()"
        [nzFooter]="drawerFooter"
      >
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="diaryForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>工作日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇工作日期">
                <nz-date-picker formControlName="work_date" style="width: 100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>天氣</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="weather" nzPlaceholder="選擇天氣" nzAllowClear>
                      @for (weather of weatherOptions; track weather.value) {
                        <nz-option [nzValue]="weather.value" [nzLabel]="weather.label"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="6">
                <nz-form-item>
                  <nz-form-label>最低溫度</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="temperature_min" [nzMin]="-50" [nzMax]="60" nzPlaceholder="°C"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="6">
                <nz-form-item>
                  <nz-form-label>最高溫度</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="temperature_max" [nzMin]="-50" [nzMax]="60" nzPlaceholder="°C"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>工時 (小時)</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="work_hours" [nzMin]="0" [nzMax]="24" [nzStep]="0.5"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>出工人數</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="worker_count" [nzMin]="0" [nzMax]="9999"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <nz-form-item>
              <nz-form-label>摘要</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="summary" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="輸入今日工作摘要..."></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>備註</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 2, maxRows: 4 }" placeholder="其他備註事項..."></textarea>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
        <ng-template #drawerFooter>
          <div class="drawer-footer">
            <button nz-button (click)="closeDrawer()">取消</button>
            <button nz-button nzType="primary" [nzLoading]="diaryService.saving()" (click)="saveDiary()">
              {{ isEditing() ? '更新' : '建立' }}
            </button>
          </div>
        </ng-template>
      </nz-drawer>

      <!-- Diary Detail Drawer -->
      <nz-drawer
        [nzVisible]="detailDrawerVisible()"
        [nzWidth]="700"
        nzTitle="日誌詳情"
        (nzOnClose)="closeDetailDrawer()"
      >
        <ng-container *nzDrawerContent>
          @if (selectedDiary()) {
            <nz-descriptions nzTitle="基本資訊" nzBordered [nzColumn]="2">
              <nz-descriptions-item nzTitle="工作日期">{{ selectedDiary()!.work_date | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態">
                <nz-tag [nzColor]="getStatusConfig(selectedDiary()!.status).color">
                  {{ getStatusConfig(selectedDiary()!.status).label }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="天氣">
                @if (selectedDiary()!.weather) {
                  <nz-tag [nzColor]="getWeatherConfig(selectedDiary()!.weather!).color">
                    {{ getWeatherConfig(selectedDiary()!.weather!).label }}
                  </nz-tag>
                } @else {
                  <span class="text-muted">未填寫</span>
                }
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="溫度">
                @if (selectedDiary()!.temperature_min !== null || selectedDiary()!.temperature_max !== null) {
                  {{ selectedDiary()!.temperature_min ?? '-' }}°C ~ {{ selectedDiary()!.temperature_max ?? '-' }}°C
                } @else {
                  <span class="text-muted">未填寫</span>
                }
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="工時">
                @if (selectedDiary()!.work_hours !== null) {
                  {{ selectedDiary()!.work_hours }} 小時
                } @else {
                  <span class="text-muted">未填寫</span>
                }
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="出工人數">
                @if (selectedDiary()!.worker_count !== null) {
                  {{ selectedDiary()!.worker_count }} 人
                } @else {
                  <span class="text-muted">未填寫</span>
                }
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="摘要" [nzSpan]="2">
                {{ selectedDiary()!.summary || '未填寫' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="備註" [nzSpan]="2">
                {{ selectedDiary()!.notes || '無' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">
                {{ selectedDiary()!.created_at | date: 'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="更新時間">
                {{ selectedDiary()!.updated_at | date: 'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
            </nz-descriptions>

            @if (selectedDiary()!.status === 'approved' && selectedDiary()!.approved_at) {
              <nz-descriptions nzTitle="審核資訊" nzBordered [nzColumn]="2" class="section-margin">
                <nz-descriptions-item nzTitle="審核時間">
                  {{ selectedDiary()!.approved_at | date: 'yyyy-MM-dd HH:mm' }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="審核者">
                  @if (getSelectedDiaryWithDetails()?.approver) {
                    {{ getSelectedDiaryWithDetails()!.approver!.name }}
                  } @else {
                    <span class="text-muted">-</span>
                  }
                </nz-descriptions-item>
              </nz-descriptions>
            }

            <div class="detail-actions">
              @if (getStatusConfig(selectedDiary()!.status).canEdit) {
                <button nz-button nzType="primary" (click)="editDiary(selectedDiary()!)">
                  <span nz-icon nzType="edit"></span>
                  編輯
                </button>
              }
              @if (getStatusConfig(selectedDiary()!.status).canSubmit) {
                <button nz-button (click)="submitDiary(selectedDiary()!)">
                  <span nz-icon nzType="send"></span>
                  提交審核
                </button>
              }
              @if (getStatusConfig(selectedDiary()!.status).canApprove) {
                <button nz-button nzType="primary" (click)="openApprovalModal(selectedDiary()!)">
                  <span nz-icon nzType="audit"></span>
                  審核
                </button>
              }
            </div>
          }
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    .diaries-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-left h2 {
      margin: 0;
    }

    .stats-row {
      margin-bottom: 24px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-card.draft ::ng-deep .ant-statistic-content {
      color: #8c8c8c;
    }

    .stat-card.submitted ::ng-deep .ant-statistic-content {
      color: #1890ff;
    }

    .stat-card.approved ::ng-deep .ant-statistic-content {
      color: #52c41a;
    }

    .filter-card {
      margin-bottom: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-item {
      flex-shrink: 0;
    }

    .table-card {
      margin-bottom: 24px;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background-color: #fafafa;
    }

    .summary-text {
      display: inline-block;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .creator-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .text-muted {
      color: #8c8c8c;
    }

    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .section-margin {
      margin-top: 24px;
    }

    .detail-actions {
      margin-top: 24px;
      display: flex;
      gap: 8px;
    }
  `]
})
export class BlueprintDiariesComponent implements OnInit {
  readonly diaryService = inject(DiaryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // State
  readonly error = signal<string | null>(null);
  readonly drawerVisible = signal(false);
  readonly detailDrawerVisible = signal(false);
  readonly isEditing = signal(false);
  readonly selectedDiary = signal<Diary | null>(null);
  readonly editingDiaryId = signal<string | null>(null);

  // Computed
  readonly blueprintId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly stats = computed(() => this.diaryService.stats());
  readonly drawerTitle = computed(() => this.isEditing() ? '編輯日誌' : '新增日誌');

  // Filters
  filterDateRange: Date | null = null;
  filterStatus: DiaryStatus | null = null;
  searchKeyword = '';
  currentPage = 1;
  currentPageSize = 20;

  // Options
  readonly statusOptions = Object.entries(DIARY_STATUS_CONFIG).map(([value, config]) => ({
    value: value as DiaryStatus,
    label: config.label
  }));

  readonly weatherOptions = Object.entries(WEATHER_TYPE_CONFIG).map(([value, config]) => ({
    value: value as WeatherType,
    label: config.label
  }));

  // Form
  readonly diaryForm = this.fb.group({
    work_date: [null as Date | null, Validators.required],
    weather: [null as WeatherType | null],
    temperature_min: [null as number | null],
    temperature_max: [null as number | null],
    work_hours: [null as number | null],
    worker_count: [null as number | null],
    summary: [''],
    notes: ['']
  });

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.loadDiaries();
      this.loadStats();
    }
  }

  loadDiaries(): void {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.error.set(null);
    this.diaryService.loadDiaries({
      blueprintId,
      status: this.filterStatus || undefined,
      search: this.searchKeyword || undefined,
      limit: this.currentPageSize,
      offset: (this.currentPage - 1) * this.currentPageSize
    });
  }

  loadStats(): void {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.diaryService.loadStats(blueprintId);
  }

  refreshDiaries(): void {
    this.loadDiaries();
    this.loadStats();
  }

  // Filter handlers
  onMonthChange(date: Date | null): void {
    this.filterDateRange = date;
    this.loadDiaries();
  }

  onStatusFilterChange(status: DiaryStatus | null): void {
    this.filterStatus = status;
    this.loadDiaries();
  }

  onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    this.loadDiaries();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDiaries();
  }

  onPageSizeChange(pageSize: number): void {
    this.currentPageSize = pageSize;
    this.currentPage = 1;
    this.loadDiaries();
  }

  // Navigation
  goBack(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.router.navigate(['/blueprint', blueprintId, 'overview']);
    } else {
      this.router.navigate(['/blueprint/list']);
    }
  }

  // Drawer handlers
  openCreateDrawer(): void {
    this.isEditing.set(false);
    this.editingDiaryId.set(null);
    this.diaryForm.reset({
      work_date: new Date()
    });
    this.drawerVisible.set(true);
  }

  editDiary(diary: Diary): void {
    this.isEditing.set(true);
    this.editingDiaryId.set(diary.id);
    this.diaryForm.patchValue({
      work_date: diary.work_date ? new Date(diary.work_date) : null,
      weather: diary.weather,
      temperature_min: diary.temperature_min,
      temperature_max: diary.temperature_max,
      work_hours: diary.work_hours,
      worker_count: diary.worker_count,
      summary: diary.summary || '',
      notes: diary.notes || ''
    });
    this.drawerVisible.set(true);
    this.detailDrawerVisible.set(false);
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.diaryForm.reset();
  }

  async saveDiary(): Promise<void> {
    if (!this.diaryForm.valid) {
      Object.values(this.diaryForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    const formValue = this.diaryForm.value;
    const workDate = formValue.work_date ? format(formValue.work_date, 'yyyy-MM-dd') : '';

    if (this.isEditing()) {
      const updateRequest: UpdateDiaryRequest = {
        weather: formValue.weather || null,
        temperature_min: formValue.temperature_min ?? null,
        temperature_max: formValue.temperature_max ?? null,
        work_hours: formValue.work_hours ?? null,
        worker_count: formValue.worker_count ?? null,
        summary: formValue.summary || null,
        notes: formValue.notes || null
      };

      const result = await firstValueFrom(
        this.diaryService.update(this.editingDiaryId()!, updateRequest)
      );

      if (result) {
        this.msg.success('日誌更新成功');
        this.closeDrawer();
        this.refreshDiaries();
      } else {
        this.msg.error('日誌更新失敗');
      }
    } else {
      const createRequest: CreateDiaryRequest = {
        blueprint_id: blueprintId,
        work_date: workDate,
        weather: formValue.weather || null,
        temperature_min: formValue.temperature_min ?? null,
        temperature_max: formValue.temperature_max ?? null,
        work_hours: formValue.work_hours ?? null,
        worker_count: formValue.worker_count ?? null,
        summary: formValue.summary || null,
        notes: formValue.notes || null
      };

      const result = await firstValueFrom(this.diaryService.create(createRequest));

      if (result) {
        this.msg.success('日誌建立成功');
        this.closeDrawer();
        this.refreshDiaries();
      } else {
        this.msg.error('日誌建立失敗');
      }
    }
  }

  // View diary detail
  viewDiary(diary: Diary): void {
    this.selectedDiary.set(diary);
    this.detailDrawerVisible.set(true);
  }

  closeDetailDrawer(): void {
    this.detailDrawerVisible.set(false);
    this.selectedDiary.set(null);
  }

  // Workflow actions
  async submitDiary(diary: Diary): Promise<void> {
    const result = await firstValueFrom(this.diaryService.submit(diary.id));
    if (result) {
      this.msg.success('日誌已提交審核');
      this.refreshDiaries();
      this.closeDetailDrawer();
    } else {
      this.msg.error('提交失敗');
    }
  }

  async deleteDiary(diary: Diary): Promise<void> {
    const result = await firstValueFrom(this.diaryService.delete(diary.id));
    if (result) {
      this.msg.success('日誌已刪除');
      this.refreshDiaries();
    } else {
      this.msg.error('刪除失敗');
    }
  }

  openApprovalModal(diary: Diary): void {
    this.modal.confirm({
      nzTitle: '審核日誌',
      nzContent: `確定要核准 ${diary.work_date} 的日誌嗎？`,
      nzOkText: '核准',
      nzCancelText: '取消',
      nzOnOk: async () => {
        const result = await firstValueFrom(this.diaryService.approve(diary.id));
        if (result) {
          this.msg.success('日誌已核准');
          this.refreshDiaries();
          this.closeDetailDrawer();
        } else {
          this.msg.error('核准失敗');
        }
      }
    });
  }

  // Helper methods
  getStatusConfig(status: DiaryStatus) {
    return DIARY_STATUS_CONFIG[status] || DIARY_STATUS_CONFIG.draft;
  }

  getWeatherConfig(weather: WeatherType) {
    return WEATHER_TYPE_CONFIG[weather] || WEATHER_TYPE_CONFIG.other;
  }

  getDiaryWithDetails(diary: Diary): DiaryWithDetails | null {
    return (diary as DiaryWithDetails).creator ? (diary as DiaryWithDetails) : null;
  }

  getSelectedDiaryWithDetails(): DiaryWithDetails | null {
    const diary = this.selectedDiary();
    if (!diary) return null;
    return (diary as DiaryWithDetails).creator ? (diary as DiaryWithDetails) : null;
  }
}
