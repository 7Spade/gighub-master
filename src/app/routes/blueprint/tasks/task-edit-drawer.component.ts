/**
 * Task Edit Drawer Component
 *
 * 任務編輯抽屜組件 - 簡潔版本
 * Task edit drawer component - Minimal version (Occam's Razor)
 *
 * Features:
 * - Create and edit tasks using reactive forms
 * - Status and priority selection
 * - Date pickers for start/due dates
 * - Parent task selection for sub-tasks
 *
 * @module routes/blueprint/tasks
 */

import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, TaskStatus, TaskPriority, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, CreateTaskRequest, UpdateTaskRequest } from '@core';
import { SHARED_IMPORTS, TaskService } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-task-edit-drawer',
  standalone: true,
  template: `
    <nz-drawer
      [nzVisible]="visible()"
      [nzWidth]="480"
      [nzTitle]="drawerTitle()"
      nzPlacement="right"
      (nzOnClose)="close()"
      [nzFooter]="footerTpl"
    >
      <ng-container *nzDrawerContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <!-- 任務標題 -->
          <nz-form-item>
            <nz-form-label nzRequired>任務標題</nz-form-label>
            <nz-form-control nzErrorTip="請輸入任務標題">
              <input nz-input formControlName="title" placeholder="輸入任務標題" />
            </nz-form-control>
          </nz-form-item>

          <!-- 任務描述 -->
          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                formControlName="description"
                placeholder="輸入任務描述"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <!-- 狀態和優先級 -->
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>狀態</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="status" nzPlaceHolder="選擇狀態">
                    @for (status of statusOptions; track status.value) {
                      <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>優先級</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="priority" nzPlaceHolder="選擇優先級">
                    @for (priority of priorityOptions; track priority.value) {
                      <nz-option [nzValue]="priority.value" [nzLabel]="priority.label"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <!-- 日期選擇 -->
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>開始日期</nz-form-label>
                <nz-form-control>
                  <nz-date-picker formControlName="start_date" nzPlaceHolder="選擇開始日期" style="width: 100%"></nz-date-picker>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>截止日期</nz-form-label>
                <nz-form-control>
                  <nz-date-picker formControlName="due_date" nzPlaceHolder="選擇截止日期" style="width: 100%"></nz-date-picker>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <!-- 父任務選擇 (僅在創建時顯示) -->
          @if (!task()) {
            <nz-form-item>
              <nz-form-label>父任務</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="parent_id" nzPlaceHolder="選擇父任務 (可選)" nzAllowClear>
                  @for (t of availableParentTasks(); track t.id) {
                    <nz-option [nzValue]="t.id" [nzLabel]="t.title"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          }

          <!-- 完成率 (僅在編輯時顯示) -->
          @if (task()) {
            <nz-form-item>
              <nz-form-label>完成率</nz-form-label>
              <nz-form-control>
                <nz-slider formControlName="completion_rate" [nzMin]="0" [nzMax]="100" [nzStep]="5"></nz-slider>
              </nz-form-control>
            </nz-form-item>
          }
        </form>
      </ng-container>
    </nz-drawer>

    <!-- Footer Template -->
    <ng-template #footerTpl>
      <div class="drawer-footer">
        <button nz-button nzType="default" (click)="close()">取消</button>
        <button nz-button nzType="primary" [nzLoading]="saving()" [disabled]="form.invalid" (click)="save()">
          {{ task() ? '更新' : '建立' }}
        </button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS]
})
export class TaskEditDrawerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  readonly taskService = inject(TaskService);

  // Inputs
  visible = input<boolean>(false);
  task = input<Task | null>(null);
  blueprintId = input.required<string>();
  parentTaskId = input<string | null>(null);

  // Outputs
  readonly closed = output<void>();
  readonly saved = output<Task>();

  // State
  saving = signal(false);

  // Form
  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    status: [TaskStatus.PENDING],
    priority: [TaskPriority.MEDIUM],
    start_date: [null],
    due_date: [null],
    parent_id: [null],
    completion_rate: [0]
  });

  // Options
  statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({
    value: value as TaskStatus,
    label: config.label
  }));

  priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({
    value: value as TaskPriority,
    label: config.label
  }));

  // Computed: drawer title
  drawerTitle = computed(() => (this.task() ? `編輯任務: ${this.task()?.title}` : '新建任務'));

  // Computed: available parent tasks (exclude self and descendants)
  availableParentTasks = computed(() => {
    const tasks = this.taskService.tasks();
    const currentTask = this.task();

    if (!currentTask) {
      return tasks.filter(t => t.blueprint_id === this.blueprintId());
    }

    // Exclude self and all descendants
    const excludeIds = new Set<string>([currentTask.id]);
    const findDescendants = (parentId: string): void => {
      tasks
        .filter(t => t.parent_id === parentId)
        .forEach(t => {
          excludeIds.add(t.id);
          findDescendants(t.id);
        });
    };
    findDescendants(currentTask.id);

    return tasks.filter(t => t.blueprint_id === this.blueprintId() && !excludeIds.has(t.id));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] || changes['parentTaskId']) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    const task = this.task();
    if (task) {
      // Edit mode: populate form with task data
      this.form.patchValue({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        start_date: task.start_date ? new Date(task.start_date) : null,
        due_date: task.due_date ? new Date(task.due_date) : null,
        parent_id: task.parent_id,
        completion_rate: task.completion_rate
      });
    } else {
      // Create mode: reset with defaults
      this.form.reset({
        title: '',
        description: '',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        start_date: null,
        due_date: null,
        parent_id: this.parentTaskId() || null,
        completion_rate: 0
      });
    }
  }

  close(): void {
    this.closed.emit();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.form.value;
      const task = this.task();

      if (task) {
        // Update existing task
        const updateData: UpdateTaskRequest = {
          title: formValue.title,
          description: formValue.description || null,
          status: formValue.status,
          priority: formValue.priority,
          start_date: formValue.start_date ? this.formatDate(formValue.start_date) : null,
          due_date: formValue.due_date ? this.formatDate(formValue.due_date) : null,
          completion_rate: formValue.completion_rate
        };

        const updatedTask = await this.taskService.updateTask(task.id, updateData);
        this.msg.success('任務更新成功');
        this.saved.emit(updatedTask);
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          blueprint_id: this.blueprintId(),
          parent_id: formValue.parent_id || null,
          title: formValue.title,
          description: formValue.description || null,
          status: formValue.status,
          priority: formValue.priority,
          start_date: formValue.start_date ? this.formatDate(formValue.start_date) : null,
          due_date: formValue.due_date ? this.formatDate(formValue.due_date) : null
        };

        const newTask = await this.taskService.createTask(createData);
        this.msg.success('任務建立成功');
        this.saved.emit(newTask);
      }

      this.close();
    } catch (error) {
      const message = this.task() ? '任務更新失敗' : '任務建立失敗';
      this.msg.error(message);
      console.error('[TaskEditDrawerComponent] Task save error:', error);
    } finally {
      this.saving.set(false);
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
