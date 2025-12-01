/**
 * Task List Component
 *
 * 任務列表組件
 * Task List Component
 *
 * Displays a list of tasks for the current blueprint.
 *
 * @module routes/blueprint/workspace/modules/tasks
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BlueprintContextService, TaskService, TaskBusinessModel, CreateTaskRequest } from '@shared';
import { TaskStatus, TaskPriority } from '@core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="task-list-container">
      <!-- Statistics Header -->
      <nz-card class="stats-card">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="總任務數" [nzValue]="statistics().total"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="待處理" [nzValue]="statistics().pending" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="進行中" [nzValue]="statistics().inProgress" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="審核中" [nzValue]="statistics().inReview" [nzValueStyle]="{ color: '#722ed1' }"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="已完成" [nzValue]="statistics().completed" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-statistic nzTitle="完成率" [nzValue]="statistics().completionRate" nzSuffix="%"></nz-statistic>
          </div>
        </div>
      </nz-card>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <nz-input-group [nzSuffix]="suffixIconSearch" style="width: 300px;">
            <input
              nz-input
              placeholder="搜尋任務..."
              [(ngModel)]="searchText"
              (ngModelChange)="onSearchChange($event)"
            />
          </nz-input-group>
          <ng-template #suffixIconSearch>
            <span nz-icon nzType="search"></span>
          </ng-template>

          <nz-select
            nzPlaceHolder="狀態"
            nzAllowClear
            nzMode="multiple"
            [(ngModel)]="selectedStatuses"
            (ngModelChange)="onFilterChange()"
            style="width: 200px; margin-left: 8px;"
          >
            @for (status of statusOptions; track status.value) {
              <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
            }
          </nz-select>

          <nz-select
            nzPlaceHolder="優先級"
            nzAllowClear
            nzMode="multiple"
            [(ngModel)]="selectedPriorities"
            (ngModelChange)="onFilterChange()"
            style="width: 200px; margin-left: 8px;"
          >
            @for (priority of priorityOptions; track priority.value) {
              <nz-option [nzValue]="priority.value" [nzLabel]="priority.label"></nz-option>
            }
          </nz-select>
        </div>

        <div class="toolbar-right">
          <button nz-button nzType="primary" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span>
            新增任務
          </button>
        </div>
      </div>

      <!-- Task Table -->
      <nz-spin [nzSpinning]="taskService.loading()">
        @if (filteredTasks().length === 0 && !taskService.loading()) {
          <nz-empty
            nzNotFoundContent="暫無任務"
            [nzNotFoundFooter]="emptyFooter"
          >
            <ng-template #emptyFooter>
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
            [nzPageSizeOptions]="[10, 20, 50, 100]"
            nzShowQuickJumper
          >
            <thead>
              <tr>
                <th nzWidth="40%">任務名稱</th>
                <th nzWidth="10%">狀態</th>
                <th nzWidth="10%">優先級</th>
                <th nzWidth="12%">指派人</th>
                <th nzWidth="12%">到期日</th>
                <th nzWidth="8%">進度</th>
                <th nzWidth="8%">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (task of taskTable.data; track task.id) {
                <tr>
                  <td>
                    <div class="task-title">
                      <span class="title">{{ task.title }}</span>
                      @if (task.description) {
                        <span class="description">{{ task.description | slice:0:50 }}{{ task.description.length > 50 ? '...' : '' }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getStatusColor(task.status)">{{ getStatusLabel(task.status) }}</nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getPriorityColor(task.priority)">{{ getPriorityLabel(task.priority) }}</nz-tag>
                  </td>
                  <td>
                    {{ task.assigneeName || '-' }}
                  </td>
                  <td>
                    @if (task.due_date) {
                      {{ task.due_date | date:'yyyy-MM-dd' }}
                    } @else {
                      -
                    }
                  </td>
                  <td>
                    {{ task.completion_rate || 0 }}%
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
                        <li nz-menu-divider></li>
                        @if (task.status !== TaskStatus.COMPLETED) {
                          <li nz-menu-item (click)="markComplete(task)">
                            <span nz-icon nzType="check"></span>
                            標記完成
                          </li>
                        }
                        <li
                          nz-menu-item
                          nzDanger
                          nz-popconfirm
                          nzPopconfirmTitle="確定要刪除此任務嗎？"
                          (nzOnConfirm)="deleteTask(task)"
                        >
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

    <!-- Create Task Modal -->
    <nz-modal
      [(nzVisible)]="isCreateModalVisible"
      nzTitle="新增任務"
      [nzOkLoading]="isSubmitting"
      (nzOnOk)="submitCreate()"
      (nzOnCancel)="closeCreateModal()"
      nzOkText="建立"
      nzCancelText="取消"
    >
      <ng-container *nzModalContent>
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>任務名稱</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <input nz-input [(ngModel)]="newTask.title" placeholder="輸入任務名稱" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6">描述</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <textarea
              nz-input
              [(ngModel)]="newTask.description"
              placeholder="輸入任務描述"
              [nzAutosize]="{ minRows: 3, maxRows: 6 }"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6">優先級</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <nz-select [(ngModel)]="newTask.priority" style="width: 100%;">
              @for (priority of priorityOptions; track priority.value) {
                <nz-option [nzValue]="priority.value" [nzLabel]="priority.label"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6">狀態</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <nz-select [(ngModel)]="newTask.status" style="width: 100%;">
              @for (status of statusOptions; track status.value) {
                <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .task-list-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-card {
      margin-bottom: 0;
    }

    :host ::ng-deep .stats-card .ant-statistic-title {
      font-size: 12px;
      color: #666;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
    }

    .task-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .task-title .title {
      font-weight: 500;
    }

    .task-title .description {
      font-size: 12px;
      color: #666;
    }

    nz-table {
      background: #fff;
      border-radius: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule,
    NzDropDownModule,
    NzMenuModule,
    NzFormModule,
    NzStatisticModule,
    NzGridModule,
    NzPopconfirmModule
  ]
})
export class TaskListComponent implements OnInit {
  readonly blueprintContext = inject(BlueprintContextService);
  readonly taskService = inject(TaskService);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly destroyRef = inject(DestroyRef);

  // Computed
  readonly filteredTasks = this.taskService.filteredTasks;
  readonly statistics = this.taskService.statistics;

  // Search debounce subject
  private readonly searchSubject = new Subject<string>();

  // Expose TaskStatus for template
  readonly TaskStatus = TaskStatus;

  // Filter state
  searchText = '';
  selectedStatuses: TaskStatus[] = [];
  selectedPriorities: TaskPriority[] = [];

  // Modal state
  isCreateModalVisible = false;
  isSubmitting = false;
  newTask: Partial<CreateTaskRequest> = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING
  };

  // Options
  readonly statusOptions = [
    { value: TaskStatus.PENDING, label: '待處理' },
    { value: TaskStatus.IN_PROGRESS, label: '進行中' },
    { value: TaskStatus.IN_REVIEW, label: '審核中' },
    { value: TaskStatus.COMPLETED, label: '已完成' },
    { value: TaskStatus.CANCELLED, label: '已取消' },
    { value: TaskStatus.BLOCKED, label: '已阻擋' }
  ];

  readonly priorityOptions = [
    { value: TaskPriority.LOWEST, label: '最低' },
    { value: TaskPriority.LOW, label: '低' },
    { value: TaskPriority.MEDIUM, label: '中' },
    { value: TaskPriority.HIGH, label: '高' },
    { value: TaskPriority.HIGHEST, label: '最高' }
  ];

  ngOnInit(): void {
    const blueprintId = this.blueprintContext.blueprintId();
    if (blueprintId) {
      this.taskService.loadTasks(blueprintId);
    }

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.taskService.updateFilters({ search: value });
    });
  }

  onSearchChange(value: string): void {
    // Use debounced subject for search to avoid excessive filtering
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.taskService.setFilters({
      search: this.searchText,
      status: this.selectedStatuses.length > 0 ? this.selectedStatuses : undefined,
      priority: this.selectedPriorities.length > 0 ? this.selectedPriorities : undefined
    });
  }

  openCreateModal(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING
    };
    this.isCreateModalVisible = true;
  }

  closeCreateModal(): void {
    this.isCreateModalVisible = false;
  }

  async submitCreate(): Promise<void> {
    if (!this.newTask.title?.trim()) {
      this.msg.warning('請輸入任務名稱');
      return;
    }

    const blueprintId = this.blueprintContext.blueprintId();
    if (!blueprintId) {
      this.msg.error('藍圖 ID 不存在');
      return;
    }

    this.isSubmitting = true;

    try {
      const request: CreateTaskRequest = {
        blueprintId,
        title: this.newTask.title!,
        description: this.newTask.description,
        priority: this.newTask.priority,
        status: this.newTask.status
      };

      const task = await this.taskService.createTask(request);

      if (task) {
        this.msg.success('任務建立成功');
        this.closeCreateModal();
      } else {
        this.msg.error('任務建立失敗');
      }
    } catch (error) {
      console.error('Create task error:', error);
      this.msg.error('任務建立失敗');
    } finally {
      this.isSubmitting = false;
    }
  }

  editTask(task: TaskBusinessModel): void {
    this.msg.info('編輯功能即將推出');
  }

  async markComplete(task: TaskBusinessModel): Promise<void> {
    try {
      await this.taskService.updateStatus(task.id, TaskStatus.COMPLETED);
      this.msg.success('已標記為完成');
    } catch (error) {
      this.msg.error('操作失敗');
    }
  }

  async deleteTask(task: TaskBusinessModel): Promise<void> {
    try {
      await this.taskService.deleteTask(task.id);
      this.msg.success('任務已刪除');
    } catch (error) {
      this.msg.error('刪除失敗');
    }
  }

  getStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: 'gold',
      [TaskStatus.IN_PROGRESS]: 'blue',
      [TaskStatus.IN_REVIEW]: 'purple',
      [TaskStatus.COMPLETED]: 'green',
      [TaskStatus.CANCELLED]: 'default',
      [TaskStatus.BLOCKED]: 'red'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: '待處理',
      [TaskStatus.IN_PROGRESS]: '進行中',
      [TaskStatus.IN_REVIEW]: '審核中',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消',
      [TaskStatus.BLOCKED]: '已阻擋'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: TaskPriority): string {
    const colors: Record<TaskPriority, string> = {
      [TaskPriority.LOWEST]: 'default',
      [TaskPriority.LOW]: 'cyan',
      [TaskPriority.MEDIUM]: 'blue',
      [TaskPriority.HIGH]: 'orange',
      [TaskPriority.HIGHEST]: 'red'
    };
    return colors[priority] || 'default';
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      [TaskPriority.LOWEST]: '最低',
      [TaskPriority.LOW]: '低',
      [TaskPriority.MEDIUM]: '中',
      [TaskPriority.HIGH]: '高',
      [TaskPriority.HIGHEST]: '最高'
    };
    return labels[priority] || priority;
  }
}
