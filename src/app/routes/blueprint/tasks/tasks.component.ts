/**
 * Blueprint Tasks Component
 *
 * 藍圖任務管理組件 - 多視圖版本
 * Blueprint task management component - Multi-view version
 *
 * Features:
 * - Tree view (nz-tree-view with NzTreeFlattener)
 * - Table view (nz-table)
 * - Kanban view (status-based columns)
 * - Task status flow management
 * - Progress calculation (bottom-up from leaf tasks)
 *
 * @module routes/blueprint
 */

import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Task, TaskNode, FlatTaskNode, TaskStatus, TaskPriority, TaskViewType, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@core';
import { SHARED_IMPORTS, TaskService } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTreeFlatDataSource, NzTreeFlattener } from 'ng-zorro-antd/tree-view';

import { TaskEditDrawerComponent } from './task-edit-drawer.component';

@Component({
  selector: 'app-blueprint-tasks',
  template: `
    <div class="tasks-container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <h3>任務管理 (Tasks)</h3>
          <span class="subtitle">施工進度追蹤與工項管理</span>
        </div>
        <div class="header-actions">
          <nz-segmented [nzOptions]="viewOptions" [(ngModel)]="currentView" (ngModelChange)="onViewChange($event)"></nz-segmented>
          <button nz-button nzType="primary" (click)="createTask()">
            <span nz-icon nzType="plus"></span>
            新建任務
          </button>
        </div>
      </div>

      <!-- Progress Overview -->
      <nz-card [nzBordered]="false" class="progress-card">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="總進度" [nzValue]="overallProgress()" nzSuffix="%">
              <ng-template #nzPrefix>
                <nz-progress [nzPercent]="overallProgress()" nzType="circle" [nzWidth]="40" [nzFormat]="progressFormat"></nz-progress>
              </ng-template>
            </nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic nzTitle="總任務數" [nzValue]="taskService.tasks().length"></nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic
              nzTitle="進行中"
              [nzValue]="tasksByStatus()[TaskStatus.IN_PROGRESS]?.length || 0"
              [nzValueStyle]="{ color: '#1890ff' }"
            ></nz-statistic>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-statistic
              nzTitle="已完成"
              [nzValue]="tasksByStatus()[TaskStatus.COMPLETED]?.length || 0"
              [nzValueStyle]="{ color: '#52c41a' }"
            ></nz-statistic>
          </div>
        </div>
      </nz-card>

      <nz-spin [nzSpinning]="taskService.loading()">
        <!-- Tree View -->
        @if (currentView === TaskViewType.TREE) {
          <nz-card [nzBordered]="false" class="view-card">
            @if (taskService.tasks().length === 0) {
              <nz-empty nzNotFoundContent="尚無任務">
                <ng-template #nzNotFoundFooter>
                  <button nz-button nzType="primary" (click)="createTask()">建立第一個任務</button>
                </ng-template>
              </nz-empty>
            } @else {
              <nz-tree-view [nzTreeControl]="treeControl" [nzDataSource]="dataSource" nzBlockNode>
                <nz-tree-node *nzTreeNodeDef="let node" nzTreeNodePadding>
                  <nz-tree-node-toggle nzTreeNodeNoopToggle></nz-tree-node-toggle>
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node }"></ng-container>
                </nz-tree-node>

                <nz-tree-node *nzTreeNodeDef="let node; when: hasChild" nzTreeNodePadding>
                  <nz-tree-node-toggle>
                    <span nz-icon nzType="caret-down" nzTreeNodeToggleRotateIcon></span>
                  </nz-tree-node-toggle>
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node }"></ng-container>
                </nz-tree-node>
              </nz-tree-view>
            }
          </nz-card>
        }

        <!-- Table View -->
        @if (currentView === TaskViewType.TABLE) {
          <nz-card [nzBordered]="false" class="view-card">
            <nz-table #taskTable [nzData]="taskService.tasks()" [nzShowPagination]="taskService.tasks().length > 10">
              <thead>
                <tr>
                  <th nzWidth="40%">任務名稱</th>
                  <th nzWidth="12%">狀態</th>
                  <th nzWidth="12%">優先級</th>
                  <th nzWidth="12%">進度</th>
                  <th nzWidth="12%">截止日期</th>
                  <th nzWidth="12%">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (task of taskTable.data; track task.id) {
                  <tr>
                    <td>
                      <span [style.padding-left.px]="getTaskLevel(task.id) * 24">
                        @if (hasChildren(task.id)) {
                          <span nz-icon nzType="folder" nzTheme="outline" class="task-icon"></span>
                        } @else {
                          <span nz-icon nzType="file" nzTheme="outline" class="task-icon"></span>
                        }
                        {{ task.title }}
                      </span>
                    </td>
                    <td>
                      <nz-tag [nzColor]="TASK_STATUS_CONFIG[task.status].color">
                        <span nz-icon [nzType]="TASK_STATUS_CONFIG[task.status].icon"></span>
                        {{ TASK_STATUS_CONFIG[task.status].label }}
                      </nz-tag>
                    </td>
                    <td>
                      <nz-tag [nzColor]="TASK_PRIORITY_CONFIG[task.priority].color">
                        {{ TASK_PRIORITY_CONFIG[task.priority].label }}
                      </nz-tag>
                    </td>
                    <td>
                      <nz-progress [nzPercent]="task.completion_rate" [nzShowInfo]="true" [nzStrokeWidth]="6"></nz-progress>
                    </td>
                    <td>{{ task.due_date || '-' }}</td>
                    <td>
                      <a nz-dropdown [nzDropdownMenu]="taskMenu">
                        操作
                        <span nz-icon nzType="down"></span>
                      </a>
                      <nz-dropdown-menu #taskMenu="nzDropdownMenu">
                        <ul nz-menu>
                          <li nz-menu-item (click)="editTask(task)">編輯</li>
                          <li nz-menu-item (click)="addSubTask(task)">新增子任務</li>
                          <li nz-menu-divider></li>
                          @for (status of getAllowedTransitions(task.status); track status) {
                            <li nz-menu-item (click)="changeStatus(task, status)"> 轉為: {{ TASK_STATUS_CONFIG[status].label }} </li>
                          }
                        </ul>
                      </nz-dropdown-menu>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-card>
        }

        <!-- Kanban View -->
        @if (currentView === TaskViewType.KANBAN) {
          <div class="kanban-container">
            @for (column of taskService.kanbanColumns(); track column.status) {
              <nz-card class="kanban-column" [nzTitle]="columnTitle" [nzBordered]="true">
                <ng-template #columnTitle>
                  <div class="kanban-column-header">
                    <nz-tag [nzColor]="column.color">{{ column.title }}</nz-tag>
                    <nz-badge [nzCount]="column.tasks.length" [nzStyle]="{ backgroundColor: '#f0f0f0', color: '#666' }"></nz-badge>
                  </div>
                </ng-template>
                <div class="kanban-cards">
                  @for (task of column.tasks; track task.id) {
                    <nz-card class="kanban-card" [nzHoverable]="true" (click)="editTask(task)">
                      <div class="kanban-card-title">{{ task.title }}</div>
                      <div class="kanban-card-meta">
                        <nz-tag [nzColor]="TASK_PRIORITY_CONFIG[task.priority].color" nzBorderless>
                          {{ TASK_PRIORITY_CONFIG[task.priority].label }}
                        </nz-tag>
                        @if (task.due_date) {
                          <span class="due-date">
                            <span nz-icon nzType="calendar"></span>
                            {{ task.due_date }}
                          </span>
                        }
                      </div>
                      @if (task.completion_rate > 0) {
                        <nz-progress [nzPercent]="task.completion_rate" [nzShowInfo]="false" [nzStrokeWidth]="4"></nz-progress>
                      }
                    </nz-card>
                  }
                  @if (column.tasks.length === 0) {
                    <div class="kanban-empty">無任務</div>
                  }
                </div>
              </nz-card>
            }
          </div>
        }
      </nz-spin>
    </div>

    <!-- Task Edit Drawer -->
    <app-task-edit-drawer
      [visible]="drawerVisible()"
      [task]="editingTask()"
      [blueprintId]="id()"
      [parentTaskId]="parentTaskId()"
      (closed)="onDrawerClose()"
      (saved)="onTaskSaved($event)"
    ></app-task-edit-drawer>

    <!-- Node Template for Tree View -->
    <ng-template #nodeTemplate let-node>
      <div class="tree-node-content" [class.completed]="node.origin.status === TaskStatus.COMPLETED">
        <span class="node-title">{{ node.title }}</span>
        <div class="node-tags">
          <nz-tag [nzColor]="getStatusConfig(node.origin.status).color" nzBorderless>
            {{ getStatusConfig(node.origin.status).label }}
          </nz-tag>
          <nz-tag [nzColor]="getPriorityConfig(node.origin.priority).color" nzBorderless>
            {{ getPriorityConfig(node.origin.priority).label }}
          </nz-tag>
        </div>
        <div class="node-progress">
          <nz-progress [nzPercent]="node.origin.completion_rate" [nzShowInfo]="true" [nzStrokeWidth]="6" nzSize="small"></nz-progress>
        </div>
        <div class="node-actions">
          <button
            nz-button
            nzType="text"
            nzSize="small"
            nz-tooltip
            nzTooltipTitle="新增子任務"
            (click)="addSubTask(node.origin); $event.stopPropagation()"
          >
            <span nz-icon nzType="plus"></span>
          </button>
          <button
            nz-button
            nzType="text"
            nzSize="small"
            nz-tooltip
            nzTooltipTitle="編輯"
            (click)="editTask(node.origin); $event.stopPropagation()"
          >
            <span nz-icon nzType="edit"></span>
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .tasks-container {
        padding: 24px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      .header-left h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
      }
      .subtitle {
        color: #666;
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .progress-card {
        margin-bottom: 16px;
      }
      .view-card {
        min-height: 400px;
      }

      /* Tree View Styles */
      .tree-node-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        flex: 1;
      }
      .tree-node-content.completed .node-title {
        text-decoration: line-through;
        color: #999;
      }
      .node-title {
        flex: 1;
        font-weight: 500;
      }
      .node-tags {
        display: flex;
        gap: 4px;
      }
      .node-progress {
        width: 120px;
      }
      .node-actions {
        display: flex;
        gap: 4px;
      }
      .task-icon {
        margin-right: 8px;
        color: #666;
      }

      /* Kanban View Styles */
      .kanban-container {
        display: flex;
        gap: 16px;
        overflow-x: auto;
        padding-bottom: 16px;
      }
      .kanban-column {
        flex: 0 0 280px;
        min-height: 500px;
        background: #fafafa;
      }
      .kanban-column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .kanban-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .kanban-card {
        cursor: pointer;
      }
      .kanban-card-title {
        font-weight: 500;
        margin-bottom: 8px;
      }
      .kanban-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .due-date {
        font-size: 12px;
        color: #666;
      }
      .kanban-empty {
        text-align: center;
        padding: 40px 0;
        color: #999;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, TaskEditDrawerComponent]
})
export class BlueprintTasksComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  readonly taskService = inject(TaskService);

  // Input from route param
  id = input.required<string>();

  // View state
  currentView = TaskViewType.TREE;
  readonly TaskViewType = TaskViewType;
  readonly TaskStatus = TaskStatus;
  readonly TASK_STATUS_CONFIG = TASK_STATUS_CONFIG;
  readonly TASK_PRIORITY_CONFIG = TASK_PRIORITY_CONFIG;

  // Drawer state
  drawerVisible = signal(false);
  editingTask = signal<Task | null>(null);
  parentTaskId = signal<string | null>(null);

  viewOptions = [
    { label: '樹狀圖', value: TaskViewType.TREE, icon: 'apartment' },
    { label: '表格', value: TaskViewType.TABLE, icon: 'table' },
    { label: '看板', value: TaskViewType.KANBAN, icon: 'project' }
  ];

  // Tree Control
  private transformer = (node: TaskNode, level: number): FlatTaskNode => ({
    id: node.id,
    blueprint_id: node.blueprint_id,
    parent_id: node.parent_id,
    title: node.title,
    description: node.description,
    status: node.status,
    priority: node.priority,
    assignee_id: node.assignee_id,
    due_date: node.due_date,
    start_date: node.start_date,
    completion_rate: node.completion_rate,
    sort_order: node.sort_order,
    level,
    expandable: !!(node.children && node.children.length > 0),
    origin: node
  });

  treeControl = new FlatTreeControl<FlatTaskNode>(
    (node: FlatTaskNode) => node.level,
    (node: FlatTaskNode) => node.expandable
  );

  treeFlattener = new NzTreeFlattener(
    this.transformer,
    (node: FlatTaskNode) => node.level,
    (node: FlatTaskNode) => node.expandable,
    (node: TaskNode) => node.children
  );

  dataSource = new NzTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // Computed signals
  overallProgress = computed(() => this.taskService.calculateTreeProgress(this.taskService.taskTree()));

  tasksByStatus = computed(() => {
    const tasks = this.taskService.tasks();
    return tasks.reduce(
      (acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>
    );
  });

  // Progress format function - returns empty string to hide the inner text
  progressFormat = (): string => ``;

  // Tree node check
  hasChild = (_: number, node: FlatTaskNode): boolean => node.expandable;

  // Helper methods for template type safety
  getStatusConfig(status: TaskStatus): { label: string; color: string; icon: string } {
    return TASK_STATUS_CONFIG[status];
  }

  getPriorityConfig(priority: TaskPriority): { label: string; color: string; icon: string } {
    return TASK_PRIORITY_CONFIG[priority];
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    try {
      // Try to load real data first
      await this.taskService.loadTasksByBlueprint(this.id());
    } catch {
      // If no real data, load mock data for development
      this.taskService.loadMockData(this.id());
    }

    // Update tree data source
    this.updateDataSource();
  }

  private updateDataSource(): void {
    this.dataSource.setData(this.taskService.taskTree());
    // Expand all nodes by default for better UX
    this.treeControl.expandAll();
  }

  onViewChange(view: TaskViewType): void {
    this.currentView = view;
    if (view === TaskViewType.TREE) {
      this.updateDataSource();
    }
  }

  // Task level for table view indentation
  getTaskLevel(taskId: string): number {
    const flatNodes = this.taskService.flattenTaskTree(this.taskService.taskTree());
    const node = flatNodes.find((n: FlatTaskNode) => n.id === taskId);
    return node?.level || 0;
  }

  // Check if task has children
  hasChildren(taskId: string): boolean {
    const tasks = this.taskService.tasks();
    return tasks.some((t: Task) => t.parent_id === taskId);
  }

  // Status transitions
  getAllowedTransitions(status: TaskStatus): TaskStatus[] {
    return this.taskService.getAllowedTransitions(status);
  }

  // Actions
  createTask(): void {
    this.editingTask.set(null);
    this.parentTaskId.set(null);
    this.drawerVisible.set(true);
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.parentTaskId.set(null);
    this.drawerVisible.set(true);
  }

  addSubTask(parentTask: Task): void {
    this.editingTask.set(null);
    this.parentTaskId.set(parentTask.id);
    this.drawerVisible.set(true);
  }

  onDrawerClose(): void {
    this.drawerVisible.set(false);
    this.editingTask.set(null);
    this.parentTaskId.set(null);
  }

  onTaskSaved(task: Task): void {
    this.updateDataSource();
  }

  async changeStatus(task: Task, newStatus: TaskStatus): Promise<void> {
    try {
      await this.taskService.updateStatus(task.id, newStatus);
      this.msg.success(`狀態已更新為: ${TASK_STATUS_CONFIG[newStatus].label}`);
      this.updateDataSource();
    } catch {
      this.msg.error('狀態更新失敗');
    }
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'overview']);
  }
}
