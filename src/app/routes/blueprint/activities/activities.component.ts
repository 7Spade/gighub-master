/**
 * Blueprint Activities Component
 *
 * 藍圖活動歷史元件
 * Full-page view for all activities within a blueprint
 *
 * Features:
 * - Full activity timeline with advanced filters
 * - Export activity logs
 * - Date range filtering
 * - Actor filtering
 * - Statistics cards
 *
 * @module routes/blueprint/activities
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { TimelineRepository } from '../../../core/infra/repositories/timeline';
import {
  Activity,
  ActivityType,
  TimelineEntityType,
  ACTIVITY_TYPE_CONFIG,
  TIMELINE_ENTITY_TYPE_CONFIG
} from '../../../core/infra/types/timeline';

@Component({
  selector: 'app-blueprint-activities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterLink,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NzSpinModule,
    NzEmptyModule,
    NzTimelineModule,
    NzTooltipModule,
    NzAvatarModule
  ],
  template: `
    <nz-page-header nzBackIcon [nzGhost]="false" (nzBack)="goBack()">
      <nz-breadcrumb nz-page-header-breadcrumb>
        <nz-breadcrumb-item><a [routerLink]="['/blueprint', blueprintId(), 'overview']">藍圖概覽</a></nz-breadcrumb-item>
        <nz-breadcrumb-item>活動歷史</nz-breadcrumb-item>
      </nz-breadcrumb>
      <nz-page-header-title>活動歷史</nz-page-header-title>
      <nz-page-header-subtitle>查看藍圖內所有操作記錄和變更歷史</nz-page-header-subtitle>
      <nz-page-header-extra>
        <button nz-button nzType="default" (click)="exportLogs()">
          <span nz-icon nzType="download"></span>
          導出記錄
        </button>
        <button nz-button nzType="primary" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          刷新
        </button>
      </nz-page-header-extra>
    </nz-page-header>

    <!-- Statistics Cards -->
    <div nz-row [nzGutter]="16" style="margin: 16px 0;">
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="總活動數" [nzValue]="stats().total" [nzPrefix]="totalPrefixTpl"></nz-statistic>
          <ng-template #totalPrefixTpl><span nz-icon nzType="history" nzTheme="outline"></span></ng-template>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="今日活動" [nzValue]="stats().today" [nzPrefix]="todayPrefixTpl"></nz-statistic>
          <ng-template #todayPrefixTpl><span nz-icon nzType="calendar" nzTheme="outline"></span></ng-template>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="活躍用戶" [nzValue]="stats().activeUsers" [nzPrefix]="usersPrefixTpl"></nz-statistic>
          <ng-template #usersPrefixTpl><span nz-icon nzType="team" nzTheme="outline"></span></ng-template>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="變更操作" [nzValue]="stats().changes" [nzPrefix]="changesPrefixTpl"></nz-statistic>
          <ng-template #changesPrefixTpl><span nz-icon nzType="edit" nzTheme="outline"></span></ng-template>
        </nz-card>
      </div>
    </div>

    <!-- Filters -->
    <nz-card nzTitle="篩選條件" [nzExtra]="filterExtraTpl" style="margin-bottom: 16px;">
      <ng-template #filterExtraTpl>
        @if (hasActiveFilters()) {
          <button nz-button nzType="link" nzSize="small" (click)="clearFilters()">
            <span nz-icon nzType="clear"></span>
            清除篩選
          </button>
        }
      </ng-template>

      <div nz-row [nzGutter]="16">
        <div nz-col [nzSpan]="6">
          <label class="filter-label">動作類型</label>
          <nz-select
            [(ngModel)]="filters.action"
            (ngModelChange)="applyFilters()"
            nzPlaceHolder="全部動作"
            nzAllowClear
            style="width: 100%;"
          >
            @for (action of actionOptions; track action.value) {
              <nz-option [nzValue]="action.value" [nzLabel]="action.label"></nz-option>
            }
          </nz-select>
        </div>
        <div nz-col [nzSpan]="6">
          <label class="filter-label">實體類型</label>
          <nz-select
            [(ngModel)]="filters.entityType"
            (ngModelChange)="applyFilters()"
            nzPlaceHolder="全部類型"
            nzAllowClear
            style="width: 100%;"
          >
            @for (entity of entityTypeOptions; track entity.value) {
              <nz-option [nzValue]="entity.value" [nzLabel]="entity.label"></nz-option>
            }
          </nz-select>
        </div>
        <div nz-col [nzSpan]="6">
          <label class="filter-label">日期範圍</label>
          <nz-range-picker [(ngModel)]="filters.dateRange" (ngModelChange)="applyFilters()" style="width: 100%;"></nz-range-picker>
        </div>
        <div nz-col [nzSpan]="6">
          <label class="filter-label">視圖模式</label>
          <nz-select [(ngModel)]="viewMode" style="width: 100%;">
            <nz-option nzValue="timeline" nzLabel="時間軸"></nz-option>
            <nz-option nzValue="table" nzLabel="表格"></nz-option>
          </nz-select>
        </div>
      </div>
    </nz-card>

    <!-- Content -->
    <nz-card>
      <nz-spin [nzSpinning]="loading()">
        @if (viewMode === 'timeline') {
          <!-- Timeline View -->
          @if (filteredLogs().length > 0) {
            <nz-timeline nzMode="left">
              @for (log of filteredLogs(); track log.id) {
                <nz-timeline-item [nzColor]="getActionColor(log.activity_type)" [nzDot]="actionDotTpl">
                  <ng-template #actionDotTpl>
                    <span nz-icon [nzType]="getActionIcon(log.activity_type)" [style.color]="getActionColorHex(log.activity_type)"></span>
                  </ng-template>

                  <div class="timeline-item">
                    <div class="timeline-header">
                      <div class="actor-info">
                        <nz-avatar [nzSize]="28" nzIcon="user"></nz-avatar>
                        <span class="actor-name">{{ log.metadata?.actor_name || '系統' }}</span>
                      </div>
                      <span class="timestamp" nz-tooltip [nzTooltipTitle]="log.created_at | date: 'yyyy-MM-dd HH:mm:ss'">
                        {{ getRelativeTime(log.created_at) }}
                      </span>
                    </div>

                    <div class="timeline-content">
                      <nz-tag [nzColor]="getActionColor(log.activity_type)">
                        {{ getActionLabel(log.activity_type) }}
                      </nz-tag>
                      <nz-tag>{{ getEntityTypeLabel(log.entity_type) }}</nz-tag>
                      @if (log.metadata?.entity_name || log.summary) {
                        <span class="entity-name">{{ log.metadata?.entity_name || log.summary }}</span>
                      }
                    </div>

                    @if (log.metadata?.changes_summary?.length) {
                      <div class="timeline-changes">
                        @for (change of log.metadata!.changes_summary!; track change) {
                          <div class="change-item">• {{ change }}</div>
                        }
                      </div>
                    }
                  </div>
                </nz-timeline-item>
              }
            </nz-timeline>
          } @else {
            <nz-empty nzNotFoundContent="暫無活動記錄" nzNotFoundImage="simple"></nz-empty>
          }
        } @else {
          <!-- Table View -->
          <nz-table
            #activityTable
            [nzData]="filteredLogs()"
            [nzFrontPagination]="true"
            [nzPageSize]="20"
            [nzShowSizeChanger]="true"
            nzSize="middle"
          >
            <thead>
              <tr>
                <th nzWidth="180px">時間</th>
                <th nzWidth="120px">操作者</th>
                <th nzWidth="100px">動作</th>
                <th nzWidth="100px">類型</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              @for (log of activityTable.data; track log.id) {
                <tr>
                  <td>{{ log.created_at | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                  <td>
                    <div class="actor-cell">
                      <nz-avatar [nzSize]="24" nzIcon="user"></nz-avatar>
                      <span>{{ log.metadata?.actor_name || '系統' }}</span>
                    </div>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getActionColor(log.activity_type)">
                      {{ getActionLabel(log.activity_type) }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag>{{ getEntityTypeLabel(log.entity_type) }}</nz-tag>
                  </td>
                  <td>{{ log.metadata?.entity_name || log.summary || '-' }}</td>
                </tr>
              }
            </tbody>
          </nz-table>
        }

        @if (hasMore() && filteredLogs().length > 0) {
          <div class="load-more">
            <button nz-button nzType="default" (click)="loadMore()" [nzLoading]="loading()"> 載入更多 </button>
          </div>
        }
      </nz-spin>
    </nz-card>
  `,
  styles: [
    `
      .filter-label {
        display: block;
        margin-bottom: 8px;
        color: #666;
        font-size: 13px;
      }

      .timeline-item {
        padding-bottom: 8px;
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .actor-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .actor-name {
        font-weight: 500;
        color: #333;
      }

      .timestamp {
        font-size: 12px;
        color: #999;
      }

      .timeline-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .entity-name {
        color: #1890ff;
        font-weight: 500;
      }

      .timeline-changes {
        margin-top: 8px;
        padding: 8px 12px;
        background: #fafafa;
        border-radius: 4px;
        font-size: 13px;
      }

      .change-item {
        color: #666;
        margin-bottom: 4px;
      }

      .change-item:last-child {
        margin-bottom: 0;
      }

      .load-more {
        text-align: center;
        margin-top: 24px;
      }

      .actor-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintActivitiesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly timelineRepository = inject(TimelineRepository);
  private readonly msg = inject(NzMessageService);

  blueprintId = signal('');
  logs = signal<Activity[]>([]);
  loading = signal(false);
  hasMore = signal(false);

  viewMode: 'timeline' | 'table' = 'timeline';

  filters = {
    action: null as ActivityType | null,
    entityType: null as TimelineEntityType | null,
    dateRange: null as Date[] | null
  };

  readonly actionOptions = Object.entries(ACTIVITY_TYPE_CONFIG).map(([value, config]) => ({
    value: value as ActivityType,
    label: config.label
  }));

  readonly entityTypeOptions = Object.entries(TIMELINE_ENTITY_TYPE_CONFIG).map(([value, config]) => ({
    value: value as TimelineEntityType,
    label: config.label
  }));

  filteredLogs = computed(() => {
    let result = this.logs();

    if (this.filters.action) {
      result = result.filter(log => log.activity_type === this.filters.action);
    }

    if (this.filters.entityType) {
      result = result.filter(log => log.entity_type === this.filters.entityType);
    }

    if (this.filters.dateRange && this.filters.dateRange.length === 2) {
      const [start, end] = this.filters.dateRange;
      result = result.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= start && logDate <= end;
      });
    }

    return result;
  });

  stats = computed(() => {
    const all = this.logs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = all.filter(log => new Date(log.created_at) >= today);
    const uniqueActors = new Set(all.map(log => log.metadata?.actor_name).filter(Boolean));
    const changeLogs = all.filter(log => ['created', 'updated', 'deleted'].includes(log.activity_type));

    return {
      total: all.length,
      today: todayLogs.length,
      activeUsers: uniqueActors.size,
      changes: changeLogs.length
    };
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadLogs();
      }
    });
  }

  loadLogs(): void {
    this.loading.set(true);

    this.timelineRepository.findByBlueprint(this.blueprintId(), { limit: 100, includeActor: true }).subscribe({
      next: logs => {
        this.logs.set(logs as Activity[]);
        this.hasMore.set(logs.length >= 100);
        this.loading.set(false);
      },
      error: err => {
        console.error('[Activities] Failed to load logs:', err);
        this.msg.error('載入活動記錄失敗');
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    const currentOffset = this.logs().length;
    this.loading.set(true);

    this.timelineRepository.findByBlueprint(this.blueprintId(), { limit: 100, offset: currentOffset, includeActor: true }).subscribe({
      next: logs => {
        this.logs.set([...this.logs(), ...(logs as Activity[])]);
        this.hasMore.set(logs.length >= 100);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    // Filtering is done via computed signal
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.action || this.filters.entityType || this.filters.dateRange);
  }

  clearFilters(): void {
    this.filters = {
      action: null,
      entityType: null,
      dateRange: null
    };
  }

  refreshData(): void {
    this.loadLogs();
    this.msg.success('已刷新');
  }

  exportLogs(): void {
    const data = this.filteredLogs();
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activities_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    this.msg.success('導出成功');
  }

  private convertToCSV(data: Activity[]): string {
    const headers = ['時間', '操作者', '動作', '類型', '描述'];
    const rows = data.map(log => [
      log.created_at,
      log.metadata?.actor_name || '系統',
      this.getActionLabel(log.activity_type),
      this.getEntityTypeLabel(log.entity_type),
      log.metadata?.entity_name || log.summary || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId(), 'overview']);
  }

  getActionColor(action: ActivityType): string {
    return ACTIVITY_TYPE_CONFIG[action]?.color || 'default';
  }

  getActionColorHex(action: ActivityType): string {
    const colorMap: Record<string, string> = {
      green: '#52c41a',
      blue: '#1890ff',
      red: '#ff4d4f',
      orange: '#faad14',
      cyan: '#13c2c2',
      purple: '#722ed1',
      default: '#666'
    };
    const color = ACTIVITY_TYPE_CONFIG[action]?.color || 'default';
    return colorMap[color] || colorMap['default'];
  }

  getActionIcon(action: ActivityType): string {
    return ACTIVITY_TYPE_CONFIG[action]?.icon || 'question-circle';
  }

  getActionLabel(action: ActivityType): string {
    return ACTIVITY_TYPE_CONFIG[action]?.label || action;
  }

  getEntityTypeLabel(entityType: TimelineEntityType): string {
    return TIMELINE_ENTITY_TYPE_CONFIG[entityType]?.label || entityType;
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return '剛剛';
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      const datePipe = new DatePipe('zh-TW');
      return datePipe.transform(date, 'yyyy/MM/dd') || '';
    }
  }
}
