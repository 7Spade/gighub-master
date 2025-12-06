/**
 * Blueprint Gantt Chart Component
 *
 * 藍圖甘特圖組件
 * Blueprint Gantt chart component
 *
 * Displays tasks on a timeline with their durations, progress, and dependencies
 * Features:
 * - Task timeline visualization
 * - Progress tracking with visual indicators
 * - Date range navigation (week/month/quarter view)
 * - Task filtering and search
 * - Color-coded by status/priority
 * - Export to image/CSV
 *
 * @module routes/blueprint
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Task, TaskStatus, TaskPriority, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@core';
import { TaskService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-blueprint-gantt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    NzAvatarModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzDividerModule,
    NzDropDownModule,
    NzEmptyModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzProgressModule,
    NzRadioModule,
    NzResultModule,
    NzSelectModule,
    NzSpinModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
    NzTooltipModule
  ],
  template: `
    <nz-breadcrumb class="breadcrumb">
      <nz-breadcrumb-item>
        <a [routerLink]="['/blueprint', blueprintId(), 'overview']">藍圖</a>
      </nz-breadcrumb-item>
      <nz-breadcrumb-item>甘特圖</nz-breadcrumb-item>
    </nz-breadcrumb>

    <nz-card [nzBordered]="false" class="gantt-header-card">
      <div class="page-header">
        <div class="header-left">
          <h2><span nz-icon nzType="project" nzTheme="outline"></span> 任務甘特圖</h2>
          <span class="subtitle">視覺化任務時間軸和進度</span>
        </div>
        <div class="header-actions">
          <button nz-button (click)="goToTasks()">
            <span nz-icon nzType="unordered-list"></span>
            列表視圖
          </button>
          <button nz-button nzType="primary" (click)="exportGantt()">
            <span nz-icon nzType="download"></span>
            匯出
          </button>
        </div>
      </div>
    </nz-card>

    <!-- Statistics -->
    <div nz-row [nzGutter]="[16, 16]" class="stats-row">
      <div nz-col [nzXs]="12" [nzSm]="6">
        <nz-card [nzBordered]="false" class="stat-card">
          <nz-statistic nzTitle="總任務數" [nzValue]="taskStats().total"></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="12" [nzSm]="6">
        <nz-card [nzBordered]="false" class="stat-card">
          <nz-statistic nzTitle="進行中" [nzValue]="taskStats().inProgress" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="12" [nzSm]="6">
        <nz-card [nzBordered]="false" class="stat-card">
          <nz-statistic nzTitle="已完成" [nzValue]="taskStats().completed" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="12" [nzSm]="6">
        <nz-card [nzBordered]="false" class="stat-card">
          <nz-statistic nzTitle="逾期" [nzValue]="taskStats().overdue" [nzValueStyle]="{ color: '#ff4d4f' }"></nz-statistic>
        </nz-card>
      </div>
    </div>

    <!-- Filter Bar -->
    <nz-card [nzBordered]="false" class="filter-card">
      <div class="filter-bar">
        <div class="filter-left">
          <nz-input-group [nzPrefix]="prefixIcon" class="search-input">
            <input nz-input placeholder="搜尋任務..." [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" />
          </nz-input-group>
          <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>

          <nz-select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()" nzPlaceHolder="狀態" nzAllowClear class="filter-select">
            <nz-option nzValue="pending" nzLabel="待處理"></nz-option>
            <nz-option nzValue="in_progress" nzLabel="進行中"></nz-option>
            <nz-option nzValue="completed" nzLabel="已完成"></nz-option>
            <nz-option nzValue="cancelled" nzLabel="已取消"></nz-option>
          </nz-select>

          <nz-select
            [(ngModel)]="priorityFilter"
            (ngModelChange)="onFilterChange()"
            nzPlaceHolder="優先級"
            nzAllowClear
            class="filter-select"
          >
            <nz-option nzValue="urgent" nzLabel="緊急"></nz-option>
            <nz-option nzValue="high" nzLabel="高"></nz-option>
            <nz-option nzValue="medium" nzLabel="中"></nz-option>
            <nz-option nzValue="low" nzLabel="低"></nz-option>
          </nz-select>
        </div>

        <div class="filter-right">
          <nz-radio-group [(ngModel)]="viewMode" (ngModelChange)="onViewModeChange()">
            <label nz-radio-button nzValue="day">日</label>
            <label nz-radio-button nzValue="week">週</label>
            <label nz-radio-button nzValue="month">月</label>
          </nz-radio-group>

          <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="onDateRangeChange()"></nz-range-picker>

          <button nz-button (click)="navigatePrev()">
            <span nz-icon nzType="left"></span>
          </button>
          <button nz-button (click)="navigateToday()">今天</button>
          <button nz-button (click)="navigateNext()">
            <span nz-icon nzType="right"></span>
          </button>
        </div>
      </div>
    </nz-card>

    <!-- Gantt Chart -->
    <nz-card [nzBordered]="false" class="gantt-card">
      <nz-spin [nzSpinning]="taskService.loading()">
        @if (taskService.hasError()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="taskService.error() || '無法載入任務資料'">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="loadTasks()">
                <span nz-icon nzType="reload"></span>
                重試
              </button>
            </div>
          </nz-result>
        } @else if (filteredTasks().length === 0) {
          <nz-empty nzNotFoundContent="無符合條件的任務">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="clearFilters()"> 清除篩選 </button>
            </ng-template>
          </nz-empty>
        } @else {
          <div class="gantt-container">
            <!-- Timeline Header -->
            <div class="gantt-header">
              <div class="gantt-task-list-header">任務名稱</div>
              <div class="gantt-timeline-header">
                @for (date of timelineDates(); track date.toISOString()) {
                  <div class="timeline-date" [class.today]="isToday(date)" [class.weekend]="isWeekend(date)">
                    <span class="date-day">{{ date | date: 'd' }}</span>
                    <span class="date-month">{{ date | date: 'MMM' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Task Rows -->
            <div class="gantt-body">
              @for (task of filteredTasks(); track task.id) {
                <div class="gantt-row" [class.completed]="task.status === 'completed'">
                  <div class="gantt-task-cell">
                    <div class="task-info">
                      <span class="task-name" [nz-tooltip]="task.title">{{ task.title }}</span>
                      <div class="task-meta">
                        <nz-tag [nzColor]="getStatusColor(task.status)">{{ getStatusLabel(task.status) }}</nz-tag>
                        <nz-tag [nzColor]="getPriorityColor(task.priority)">{{ getPriorityLabel(task.priority) }}</nz-tag>
                      </div>
                    </div>
                  </div>
                  <div class="gantt-timeline-cell">
                    <div class="timeline-grid">
                      @for (date of timelineDates(); track date.toISOString()) {
                        <div class="timeline-grid-cell" [class.today]="isToday(date)" [class.weekend]="isWeekend(date)"></div>
                      }
                    </div>
                    @if (hasValidDates(task)) {
                      <div
                        class="gantt-bar"
                        [style.left.%]="calculateBarLeft(task)"
                        [style.width.%]="calculateBarWidth(task)"
                        [class]="'status-' + task.status"
                        [nz-tooltip]="getTaskTooltip(task)"
                      >
                        <div class="bar-progress" [style.width.%]="task.completion_rate || 0"></div>
                        <span class="bar-label">{{ task.completion_rate || 0 }}%</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </nz-spin>
    </nz-card>

    <!-- Legend -->
    <nz-card [nzBordered]="false" class="legend-card">
      <div class="legend">
        <span class="legend-title">圖例：</span>
        <div class="legend-item">
          <div class="legend-bar status-pending"></div>
          <span>待處理</span>
        </div>
        <div class="legend-item">
          <div class="legend-bar status-in_progress"></div>
          <span>進行中</span>
        </div>
        <div class="legend-item">
          <div class="legend-bar status-completed"></div>
          <span>已完成</span>
        </div>
        <div class="legend-item">
          <div class="legend-bar overdue"></div>
          <span>逾期</span>
        </div>
        <nz-divider nzType="vertical"></nz-divider>
        <div class="legend-item">
          <div class="legend-cell today"></div>
          <span>今天</span>
        </div>
        <div class="legend-item">
          <div class="legend-cell weekend"></div>
          <span>週末</span>
        </div>
      </div>
    </nz-card>
  `,
  styles: [
    `
      .breadcrumb {
        margin-bottom: 16px;
      }

      .gantt-header-card {
        margin-bottom: 16px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-left h2 {
        margin: 0;
        font-size: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .subtitle {
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
        margin-left: 32px;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .stats-row {
        margin-bottom: 16px;
      }

      .stat-card {
        text-align: center;
      }

      .filter-card {
        margin-bottom: 16px;
      }

      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .filter-left,
      .filter-right {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .search-input {
        width: 200px;
      }

      .filter-select {
        min-width: 120px;
      }

      .gantt-card {
        margin-bottom: 16px;
      }

      .gantt-container {
        overflow-x: auto;
      }

      .gantt-header {
        display: flex;
        border-bottom: 2px solid #f0f0f0;
        background: #fafafa;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .gantt-task-list-header {
        min-width: 250px;
        width: 250px;
        padding: 12px 16px;
        font-weight: 600;
        border-right: 1px solid #f0f0f0;
      }

      .gantt-timeline-header {
        display: flex;
        flex: 1;
      }

      .timeline-date {
        min-width: 40px;
        padding: 8px 4px;
        text-align: center;
        border-right: 1px solid #f0f0f0;
        font-size: 12px;
      }

      .timeline-date.today {
        background: #e6f7ff;
      }

      .timeline-date.weekend {
        background: #f5f5f5;
      }

      .date-day {
        display: block;
        font-weight: 600;
      }

      .date-month {
        display: block;
        color: rgba(0, 0, 0, 0.45);
        font-size: 10px;
      }

      .gantt-body {
        min-height: 200px;
      }

      .gantt-row {
        display: flex;
        border-bottom: 1px solid #f0f0f0;
        min-height: 48px;
      }

      .gantt-row:hover {
        background: #fafafa;
      }

      .gantt-row.completed {
        opacity: 0.7;
      }

      .gantt-task-cell {
        min-width: 250px;
        width: 250px;
        padding: 8px 16px;
        border-right: 1px solid #f0f0f0;
        display: flex;
        align-items: center;
      }

      .task-info {
        overflow: hidden;
      }

      .task-name {
        display: block;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .task-meta {
        display: flex;
        gap: 4px;
      }

      .task-meta .ant-tag {
        font-size: 10px;
        padding: 0 4px;
        line-height: 16px;
        margin: 0;
      }

      .gantt-timeline-cell {
        flex: 1;
        position: relative;
        min-height: 48px;
      }

      .timeline-grid {
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .timeline-grid-cell {
        min-width: 40px;
        border-right: 1px solid #f0f0f0;
      }

      .timeline-grid-cell.today {
        background: #e6f7ff;
      }

      .timeline-grid-cell.weekend {
        background: #f5f5f5;
      }

      .gantt-bar {
        position: absolute;
        top: 8px;
        height: 32px;
        border-radius: 4px;
        background: #1890ff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 500;
        min-width: 40px;
        z-index: 5;
        overflow: hidden;
      }

      .gantt-bar.status-pending {
        background: #faad14;
      }

      .gantt-bar.status-in_progress {
        background: #1890ff;
      }

      .gantt-bar.status-completed {
        background: #52c41a;
      }

      .gantt-bar.status-cancelled {
        background: #bfbfbf;
      }

      .bar-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px 0 0 4px;
      }

      .bar-label {
        position: relative;
        z-index: 1;
      }

      .legend-card {
        margin-bottom: 16px;
      }

      .legend {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .legend-title {
        font-weight: 500;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .legend-bar {
        width: 24px;
        height: 12px;
        border-radius: 2px;
      }

      .legend-bar.status-pending {
        background: #faad14;
      }

      .legend-bar.status-in_progress {
        background: #1890ff;
      }

      .legend-bar.status-completed {
        background: #52c41a;
      }

      .legend-bar.overdue {
        background: #ff4d4f;
      }

      .legend-cell {
        width: 24px;
        height: 12px;
        border: 1px solid #d9d9d9;
      }

      .legend-cell.today {
        background: #e6f7ff;
      }

      .legend-cell.weekend {
        background: #f5f5f5;
      }

      @media (max-width: 768px) {
        .filter-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-left,
        .filter-right {
          justify-content: center;
        }

        .search-input {
          width: 100%;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintGanttComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  readonly taskService = inject(TaskService);

  blueprintId = signal<string>('');
  viewMode = signal<ViewMode>('week');
  dateRange = signal<Date[]>([]);
  searchTerm = signal<string>('');
  statusFilter = signal<string>('');
  priorityFilter = signal<string>('');

  private readonly currentViewStart = signal<Date>(this.getStartOfWeek(new Date()));

  timelineDates = computed(() => {
    const dates: Date[] = [];
    const start = this.currentViewStart();
    const daysToShow = this.getDaysToShow();

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  });

  filteredTasks = computed(() => {
    let tasks = this.taskService.tasks();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    if (search) {
      tasks = tasks.filter(t => t.title.toLowerCase().includes(search));
    }
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    return tasks.sort((a, b) => {
      const aStart = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bStart = b.start_date ? new Date(b.start_date).getTime() : 0;
      return aStart - bStart;
    });
  });

  taskStats = computed(() => {
    const tasks = this.taskService.tasks();
    const now = new Date();

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      }).length
    };
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadTasks();
      }
    });
  }

  async loadTasks(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      await this.taskService.loadTasksByBlueprint(blueprintId);
    }
  }

  getStatusLabel(status: string): string {
    return TASK_STATUS_CONFIG[status as TaskStatus]?.label || status;
  }

  getStatusColor(status: string): string {
    return TASK_STATUS_CONFIG[status as TaskStatus]?.color || 'default';
  }

  getPriorityLabel(priority: string): string {
    return TASK_PRIORITY_CONFIG[priority as TaskPriority]?.label || priority;
  }

  getPriorityColor(priority: string): string {
    return TASK_PRIORITY_CONFIG[priority as TaskPriority]?.color || 'default';
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  hasValidDates(task: Task): boolean {
    return !!(task.start_date && task.due_date);
  }

  calculateBarLeft(task: Task): number {
    if (!task.start_date) return 0;

    const taskStart = new Date(task.start_date);
    const viewStart = this.currentViewStart();
    const daysToShow = this.getDaysToShow();

    const diffDays = Math.floor((taskStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, (diffDays / daysToShow) * 100);
  }

  calculateBarWidth(task: Task): number {
    if (!task.start_date || !task.due_date) return 0;

    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.due_date);
    const daysToShow = this.getDaysToShow();

    const durationDays = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, Math.min(100, (durationDays / daysToShow) * 100));
  }

  getTaskTooltip(task: Task): string {
    const start = task.start_date ? new Date(task.start_date).toLocaleDateString() : '未設定';
    const due = task.due_date ? new Date(task.due_date).toLocaleDateString() : '未設定';
    return `${task.title}\n開始：${start}\n截止：${due}\n進度：${task.completion_rate || 0}%`;
  }

  private getDaysToShow(): number {
    switch (this.viewMode()) {
      case 'day':
        return 14;
      case 'week':
        return 28;
      case 'month':
        return 90;
      default:
        return 28;
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  onViewModeChange(): void {
    this.currentViewStart.set(this.getStartOfWeek(new Date()));
  }

  onDateRangeChange(): void {
    const range = this.dateRange();
    if (range && range.length === 2 && range[0]) {
      this.currentViewStart.set(range[0]);
    }
  }

  onSearchChange(): void {
    // Reactive computed will update automatically
  }

  onFilterChange(): void {
    // Reactive computed will update automatically
  }

  navigatePrev(): void {
    const current = this.currentViewStart();
    const days = this.getDaysToShow() / 2;
    const newStart = new Date(current);
    newStart.setDate(current.getDate() - days);
    this.currentViewStart.set(newStart);
  }

  navigateNext(): void {
    const current = this.currentViewStart();
    const days = this.getDaysToShow() / 2;
    const newStart = new Date(current);
    newStart.setDate(current.getDate() + days);
    this.currentViewStart.set(newStart);
  }

  navigateToday(): void {
    this.currentViewStart.set(this.getStartOfWeek(new Date()));
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
  }

  goToTasks(): void {
    this.router.navigate(['/blueprint', this.blueprintId(), 'tasks']);
  }

  exportGantt(): void {
    const tasks = this.filteredTasks();
    if (tasks.length === 0) {
      this.msg.warning('無任務可匯出');
      return;
    }

    const csvContent = this.generateCsv(tasks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    this.msg.success('甘特圖資料已匯出');
  }

  private generateCsv(tasks: Task[]): string {
    const headers = ['任務名稱', '狀態', '優先級', '開始日期', '截止日期', '進度'];
    const rows = tasks.map(t => [
      t.title,
      this.getStatusLabel(t.status),
      this.getPriorityLabel(t.priority),
      t.start_date || '',
      t.due_date || '',
      `${t.completion_rate || 0}%`
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }
}
