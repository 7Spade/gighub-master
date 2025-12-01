/**
 * Task Form Dialog Component
 *
 * Modal dialog for creating/editing tasks (任務表單對話框)
 * Using @delon/form for dynamic form generation
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Dependency flow:
 * Component → Store (Facade) → Service → Repository
 *
 * @module features/blueprint/shell/dialogs/task-form-dialog
 */

import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { SFComponent, SFSchema, SFUISchema } from '@delon/form';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { TaskStore } from '../../../data-access';
import { TaskModel, CreateTaskRequest, UpdateTaskRequest, TaskPriority, TaskStatus } from '../../../domain';

/**
 * Dialog mode for create/edit
 */
export type TaskFormMode = 'create' | 'edit';

/**
 * Dialog input data (aligned with new schema - blueprintId instead of workspaceId)
 */
export interface TaskFormDialogData {
  mode: TaskFormMode;
  task?: TaskModel;
  blueprintId: string;
  parentId?: string | null;
}

/**
 * Form values interface
 */
interface TaskFormValues {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
}

/**
 * Task Form Dialog Component
 *
 * Smart component for task CRUD operations
 * Uses @delon/form for schema-driven forms
 */
@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './task-form-dialog.component.html'
})
export class TaskFormDialogComponent implements OnInit {
  @ViewChild('sf') sf!: SFComponent;

  private readonly modalRef = inject(NzModalRef);
  private readonly messageService = inject(NzMessageService);
  private readonly taskStore = inject(TaskStore);
  private readonly dialogData = inject<TaskFormDialogData>(NZ_MODAL_DATA);

  // Form state
  readonly loading = signal<boolean>(false);
  readonly formData = signal<Partial<TaskFormValues>>({});

  // Dialog properties
  readonly mode = this.dialogData.mode;
  readonly isEditMode = this.mode === 'edit';
  readonly dialogTitle = this.isEditMode ? '編輯任務' : '建立任務';

  /**
   * Form schema definition (JSON Schema) - Simplified
   * Aligned with database schema
   */
  readonly schema: SFSchema = {
    properties: {
      title: {
        type: 'string',
        title: '任務名稱',
        minLength: 1,
        maxLength: 200
      },
      description: {
        type: 'string',
        title: '描述',
        maxLength: 1000
      },
      priority: {
        type: 'string',
        title: '優先級',
        enum: [
          { label: '最低', value: 'lowest' },
          { label: '低', value: 'low' },
          { label: '中', value: 'medium' },
          { label: '高', value: 'high' },
          { label: '最高', value: 'highest' }
        ],
        default: 'medium'
      },
      status: {
        type: 'string',
        title: '狀態',
        enum: [
          { label: '待處理', value: 'pending' },
          { label: '進行中', value: 'in_progress' },
          { label: '審核中', value: 'in_review' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
          { label: '已阻塞', value: 'blocked' }
        ],
        default: 'pending'
      }
    },
    required: ['title', 'priority']
  };

  /**
   * UI schema for form layout (simplified)
   */
  readonly uiSchema: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: { span: 24 }
    },
    $title: {
      widget: 'string',
      placeholder: '請輸入任務名稱'
    },
    $description: {
      widget: 'textarea',
      placeholder: '請輸入任務描述（選填）',
      autosize: { minRows: 2, maxRows: 4 }
    },
    $priority: {
      widget: 'select',
      placeholder: '請選擇優先級'
    },
    $status: {
      widget: 'select',
      placeholder: '請選擇狀態'
    }
  };

  ngOnInit(): void {
    // Initialize form data for edit mode
    if (this.isEditMode && this.dialogData.task) {
      const task = this.dialogData.task;
      this.formData.set({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status
      });
    } else {
      // Default values for create mode
      this.formData.set({
        priority: 'medium',
        status: 'pending'
      });
    }
  }

  /**
   * Trigger form submit programmatically
   */
  triggerSubmit(): void {
    if (this.sf?.valid) {
      this.onSubmit(this.sf.value as TaskFormValues);
    } else {
      // Show validation errors
      this.messageService.warning('請填寫所有必填欄位');
    }
  }

  /**
   * Handle form submission
   */
  async onSubmit(formValue: TaskFormValues): Promise<void> {
    this.loading.set(true);

    try {
      if (this.isEditMode) {
        await this.handleUpdate(formValue);
      } else {
        await this.handleCreate(formValue);
      }
    } catch (error) {
      console.error('Task form error:', error);
      this.messageService.error('操作失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle task creation (simplified - blueprintId instead of workspaceId)
   */
  private async handleCreate(formValue: TaskFormValues): Promise<void> {
    const request: CreateTaskRequest = {
      blueprintId: this.dialogData.blueprintId,
      parentId: this.dialogData.parentId,
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority
    };

    const result = await this.taskStore.createTask(request);
    this.messageService.success('任務建立成功');
    this.modalRef.close(result);
  }

  /**
   * Handle task update (simplified)
   */
  private async handleUpdate(formValue: TaskFormValues): Promise<void> {
    if (!this.dialogData.task) {
      throw new Error('Task not found for update');
    }

    const request: UpdateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status
    };

    const result = await this.taskStore.updateTask(this.dialogData.task.id, request);
    this.messageService.success('任務更新成功');
    this.modalRef.close(result);
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.modalRef.close();
  }
}
