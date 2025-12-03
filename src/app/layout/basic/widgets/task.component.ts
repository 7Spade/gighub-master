/**
 * Header My Tasks Component
 *
 * 我的任務快速入口 Header Widget
 * My Tasks Quick Access Header Widget
 *
 * Displays a quick list of tasks assigned to the current user.
 * Allows quick navigation to task details and status updates.
 *
 * Features:
 * - Shows pending/in-progress tasks
 * - Badge count for active tasks
 * - Click to navigate to task details
 * - Quick refresh
 *
 * Uses Angular 20 modern patterns:
 * - inject() for dependency injection
 * - Signals for reactive state management
 * - computed() for derived state
 *
 * @module layout/basic/widgets
 */

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskRepository,
  SupabaseService,
  AccountRepository
} from '@core';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'header-task',
  template: `
    <div
      class="alain-default__nav-item"
      nz-dropdown
      [nzDropdownMenu]="taskMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
      (nzVisibleChange)="onVisibleChange($event)"
    >
      <nz-badge [nzCount]="activeTaskCount()" [nzOverflowCount]="99">
        <i nz-icon nzType="carry-out" class="alain-default__nav-item-icon"></i>
      </nz-badge>
    </div>
    <nz-dropdown-menu #taskMenu="nzDropdownMenu">
      <div nz-menu class="wd-lg">
        @if (loading()) {
          <div class="mx-lg p-lg text-center"><nz-spin /></div>
        } @else if (myTasks().length === 0) {
          <nz-empty nzNotFoundContent="暫無待處理任務" [nzNotFoundImage]="'simple'" class="p-lg" />
        } @else {
          <nz-card nzTitle="我的任務" [nzExtra]="extraTpl" nzBordered="false" class="ant-card__body-nopadding">
            @for (task of myTasks().slice(0, 5); track task.id) {
              <div
                nz-row
                [nzJustify]="'space-between'"
                [nzAlign]="'middle'"
                class="py-sm px-md point bg-grey-lighter-h"
                (click)="navigateToTask(task)"
              >
                <div nz-col [nzSpan]="14">
                  <div class="text-truncate" style="max-width: 180px;" [nz-tooltip]="task.title">
                    <strong>{{ task.title }}</strong>
                  </div>
                  @if (task.due_date) {
                    <small class="text-grey">截止：{{ task.due_date | date: 'MM/dd' }}</small>
                  }
                </div>
                <div nz-col [nzSpan]="10" class="text-right">
                  <nz-tag [nzColor]="getStatusConfig(task.status).color">
                    {{ getStatusConfig(task.status).label }}
                  </nz-tag>
                </div>
              </div>
            }
            @if (myTasks().length > 5) {
              <div nz-row class="pt-md border-top-1 text-center text-grey point" (click)="viewAllTasks()">
                查看全部 ({{ myTasks().length }})
              </div>
            }
          </nz-card>
        }
      </div>
    </nz-dropdown-menu>

    <ng-template #extraTpl>
      <a (click)="refresh(); $event.stopPropagation()">
        <i nz-icon nzType="reload" [nzSpin]="loading()"></i>
      </a>
    </ng-template>
  `,
  styles: [
    `
      .text-truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NzDropDownModule,
    NzBadgeModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule,
    NzCardModule,
    NzTagModule,
    NzEmptyModule,
    NzToolTipModule
  ]
})
export class HeaderTaskComponent implements OnInit {
  // Angular 20: 使用 inject() 函數進行依賴注入
  private readonly taskRepo = inject(TaskRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly accountRepo = inject(AccountRepository);
  private readonly router = inject(Router);

  // ============================================================================
  // State Signals (狀態信號)
  // ============================================================================

  private tasksState = signal<Task[]>([]);
  private loadingState = signal<boolean>(false);

  // Readonly signals for template binding
  readonly myTasks = this.tasksState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  // ============================================================================
  // Computed Signals (計算信號)
  // ============================================================================

  /**
   * 活躍任務數量（待處理 + 進行中）
   * Active task count (pending + in_progress)
   */
  readonly activeTaskCount = computed(
    () => this.tasksState().filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS).length
  );

  ngOnInit(): void {
    this.loadMyTasks();
  }

  /**
   * 載入指派給當前用戶的任務
   * Load tasks assigned to current user
   */
  async loadMyTasks(): Promise<void> {
    const user = this.supabaseService.currentUser;
    if (!user) return;

    this.loadingState.set(true);

    try {
      // 取得當前用戶的 account_id
      const account = await firstValueFrom(this.accountRepo.findByAuthUserId(user.id));
      if (!account) {
        this.loadingState.set(false);
        return;
      }

      // 查詢指派給該用戶的任務
      const tasks = await firstValueFrom(this.taskRepo.findByAssignee(account.id));

      // 過濾出未完成的任務並按優先級和截止日期排序
      const activeTasks = tasks
        .filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED)
        .sort((a, b) => {
          // 先按狀態排序：進行中 > 待處理 > 其他
          const statusOrder: Record<TaskStatus, number> = {
            [TaskStatus.IN_PROGRESS]: 0,
            [TaskStatus.PENDING]: 1,
            [TaskStatus.IN_REVIEW]: 2,
            [TaskStatus.BLOCKED]: 3,
            [TaskStatus.COMPLETED]: 4,
            [TaskStatus.CANCELLED]: 5
          };
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;

          // 再按優先級排序
          const priorityOrder: Record<TaskPriority, number> = {
            [TaskPriority.HIGHEST]: 0,
            [TaskPriority.HIGH]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.LOW]: 3,
            [TaskPriority.LOWEST]: 4
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      this.tasksState.set(activeTasks);
    } catch (err) {
      console.error('[HeaderTaskComponent] loadMyTasks error:', err);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Dropdown 顯示時載入資料
   * Load data when dropdown becomes visible
   */
  onVisibleChange(visible: boolean): void {
    if (visible) {
      this.loadMyTasks();
    }
  }

  /**
   * 刷新任務列表
   * Refresh task list
   */
  refresh(): void {
    this.loadMyTasks();
  }

  /**
   * 導航到任務詳情
   * Navigate to task details
   */
  navigateToTask(task: Task): void {
    this.router.navigate(['/blueprint', task.blueprint_id, 'tasks'], {
      queryParams: { taskId: task.id }
    });
  }

  /**
   * 查看全部任務
   * View all tasks
   */
  viewAllTasks(): void {
    // 暫時導航到第一個任務的藍圖（未來可能需要獨立的「我的任務」頁面）
    const firstTask = this.myTasks()[0];
    if (firstTask) {
      this.router.navigate(['/blueprint', firstTask.blueprint_id, 'tasks']);
    }
  }

  /**
   * 取得狀態配置
   * Get status configuration
   */
  getStatusConfig(status: TaskStatus) {
    return TASK_STATUS_CONFIG[status];
  }

  /**
   * 取得優先級配置
   * Get priority configuration
   */
  getPriorityConfig(priority: TaskPriority) {
    return TASK_PRIORITY_CONFIG[priority];
  }
}
