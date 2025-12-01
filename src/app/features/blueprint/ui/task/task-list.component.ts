/**
 * Task List Component
 *
 * 任務列表組件
 *
 * @module features/blueprint/ui/task
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { TaskStore } from '../../data-access';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskStatusLabels,
  TaskStatusColors,
  TaskPriorityLabels,
  TaskPriorityColors
} from '../../domain';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDropDownModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzProgressModule,
    NzAvatarModule,
    NzToolTipModule,
    NzSpinModule,
    NzEmptyModule
  ],
  template: `
    <div class="task-list-container">
      <!-- 工具列 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button nz-button nzType="primary" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span>
            新增任務
          </button>

          <nz-input-group [nzSuffix]="searchIcon" style="width: 240px">
            <input
              nz-input
              placeholder="搜尋任務..."
              [(ngModel)]="searchText"
              (ngModelChange)="onSearch()"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </div>

        <div class="toolbar-right">
          <nz-select
            nzPlaceHolder="狀態篩選"
            nzAllowClear
            nzMode="multiple"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChange()"
            style="width: 200px"
          >
            @for (status of statusOptions; track status.value) {
              <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
            }
          </nz-select>

          <nz-select
            nzPlaceHolder="優先級篩選"
            nzAllowClear
            nzMode="multiple"
            [(ngModel)]="priorityFilter"
            (ngModelChange)="onFilterChange()"
            style="width: 200px"
          >
            @for (priority of priorityOptions; track priority.value) {
              <nz-option [nzValue]="priority.value" [nzLabel]="priority.label"></nz-option>
            }
          </nz-select>
        </div>
      </div>

      <!-- 任務表格 -->
      <nz-spin [nzSpinning]="taskStore.loading()">
        @if (taskStore.tasks().length === 0 && !taskStore.loading()) {
          <nz-empty nzNotFoundContent="暫無任務">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="openCreateModal()">
                建立第一個任務
              </button>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-table
            #taskTable
            [nzData]="filteredTasks()"
            [nzPageSize]="20"
            [nzShowSizeChanger]="true"
            nzSize="middle"
          >
            <thead>
              <tr>
                <th nzWidth="40%">任務名稱</th>
                <th nzWidth="100px">狀態</th>
                <th nzWidth="100px">優先級</th>
                <th nzWidth="120px">進度</th>
                <th nzWidth="120px">到期日</th>
                <th nzWidth="100px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (task of taskTable.data; track task.id) {
                <tr>
                  <td>
                    <div class="task-title">
                      <span class="title">{{ task.title }}</span>
                      @if (task.description) {
                        <span
                          class="description"
                          nz-tooltip
                          [nzTooltipTitle]="task.description"
                        >
                          {{ task.description }}
                        </span>
                      }
                    </div>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getStatusColor(task.status)">
                      {{ getStatusLabel(task.status) }}
                    </nz-tag>
                  </td>
                  <td>
                    <span [style.color]="getPriorityColor(task.priority)">
                      {{ getPriorityLabel(task.priority) }}
                    </span>
                  </td>
                  <td>
                    <nz-progress
                      [nzPercent]="task.completion_rate"
                      [nzSize]="'small'"
                      [nzStatus]="task.completion_rate === 100 ? 'success' : 'active'"
                    ></nz-progress>
                  </td>
                  <td>
                    @if (task.due_date) {
                      <span [class.overdue]="isOverdue(task.due_date)">
                        {{ task.due_date }}
                      </span>
                    } @else {
                      <span class="no-date">-</span>
                    }
                  </td>
                  <td>
                    <button
                      nz-button
                      nzType="text"
                      nz-dropdown
                      [nzDropdownMenu]="actionMenu"
                    >
                      <span nz-icon nzType="more"></span>
                    </button>
                    <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                      <ul nz-menu>
                        <li nz-menu-item (click)="editTask(task)">
                          <span nz-icon nzType="edit"></span>
                          編輯
                        </li>
                        <li nz-menu-item (click)="updateStatus(task)">
                          <span nz-icon nzType="sync"></span>
                          更新狀態
                        </li>
                        <li nz-menu-divider></li>
                        <li nz-menu-item nzDanger (click)="deleteTask(task)">
                          <span nz-icon nzType="delete"></span>
                          刪除
                        </li>
                      </ul>
                    </nz-dropdown-menu>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .task-list-container {
      background: #fff;
      padding: 24px;
      border-radius: 4px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .task-title {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .title {
        font-weight: 500;
      }

      .description {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
      }
    }

    .overdue {
      color: #f5222d;
    }

    .no-date {
      color: #999;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  readonly taskStore = inject(TaskStore);
  private readonly modal = inject(NzModalService);
  private readonly msg = inject(NzMessageService);

  searchText = '';
  statusFilter: TaskStatus[] = [];
  priorityFilter: TaskPriority[] = [];

  readonly statusOptions = Object.entries(TaskStatusLabels).map(([value, label]) => ({
    value,
    label
  }));

  readonly priorityOptions = Object.entries(TaskPriorityLabels).map(([value, label]) => ({
    value,
    label
  }));

  filteredTasks = signal<Task[]>([]);

  constructor() {
    this.updateFilteredTasks();
  }

  getStatusLabel(status: string): string {
    return TaskStatusLabels[status as keyof typeof TaskStatusLabels] ?? status;
  }

  getStatusColor(status: string): string {
    return TaskStatusColors[status as keyof typeof TaskStatusColors] ?? 'default';
  }

  getPriorityLabel(priority: string): string {
    return TaskPriorityLabels[priority as keyof typeof TaskPriorityLabels] ?? priority;
  }

  getPriorityColor(priority: string): string {
    return TaskPriorityColors[priority as keyof typeof TaskPriorityColors] ?? '#999';
  }

  isOverdue(dueDate: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  }

  onSearch(): void {
    this.updateFilteredTasks();
  }

  onFilterChange(): void {
    this.updateFilteredTasks();
  }

  private updateFilteredTasks(): void {
    let tasks = this.taskStore.tasks();

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    if (this.statusFilter.length > 0) {
      tasks = tasks.filter(t => this.statusFilter.includes(t.status));
    }

    if (this.priorityFilter.length > 0) {
      tasks = tasks.filter(t => this.priorityFilter.includes(t.priority));
    }

    this.filteredTasks.set(tasks);
  }

  openCreateModal(): void {
    this.msg.info('新增任務功能開發中');
  }

  editTask(task: Task): void {
    this.msg.info(`編輯任務: ${task.title}`);
  }

  updateStatus(task: Task): void {
    this.msg.info(`更新狀態: ${task.title}`);
  }

  async deleteTask(task: Task): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除任務「${task.title}」嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.taskStore.deleteTask(task.id);
          this.msg.success('任務已刪除');
          this.updateFilteredTasks();
        } catch {
          this.msg.error('刪除失敗');
        }
      }
    });
  }
}
