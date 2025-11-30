/**
 * Blueprint Form Dialog Component
 *
 * Modal dialog for creating/editing blueprints (藍圖表單對話框)
 * Using @delon/form for dynamic form generation
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Simplified version:
 * - Uses isPublic boolean instead of visibility enum
 * - Removed tags (use metadata JSONB if needed)
 *
 * Dependency flow:
 * Component → Store (Facade) → Service → Repository
 *
 * @module features/blueprint/shell/dialogs/blueprint-form-dialog
 */

import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { SFComponent, SFSchema, SFUISchema } from '@delon/form';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { BlueprintStore } from '../../../data-access';
import { BlueprintModel, CreateBlueprintRequest, UpdateBlueprintRequest, OwnerType } from '../../../domain';

/**
 * Dialog mode for create/edit
 */
export type BlueprintFormMode = 'create' | 'edit';

/**
 * Dialog input data
 */
export interface BlueprintFormDialogData {
  mode: BlueprintFormMode;
  blueprint?: BlueprintModel;
  ownerId?: string;
  ownerType?: OwnerType;
}

/**
 * Form values interface (simplified)
 */
interface BlueprintFormValues {
  name: string;
  description: string;
  isPublic: boolean;
}

/**
 * Blueprint Form Dialog Component
 *
 * Smart component for blueprint CRUD operations
 * Uses @delon/form for schema-driven forms
 */
@Component({
  selector: 'app-blueprint-form-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './blueprint-form-dialog.component.html'
})
export class BlueprintFormDialogComponent implements OnInit {
  @ViewChild('sf') sf!: SFComponent;

  private readonly modalRef = inject(NzModalRef);
  private readonly messageService = inject(NzMessageService);
  private readonly blueprintStore = inject(BlueprintStore);
  private readonly dialogData = inject<BlueprintFormDialogData>(NZ_MODAL_DATA);

  // Form state
  readonly loading = signal<boolean>(false);
  readonly formData = signal<Partial<BlueprintFormValues>>({});

  // Dialog properties
  readonly mode = this.dialogData.mode;
  readonly isEditMode = this.mode === 'edit';
  readonly dialogTitle = this.isEditMode ? '編輯藍圖' : '建立藍圖';

  /**
   * Form schema definition (JSON Schema) - Simplified
   * Aligned with database schema
   */
  readonly schema: SFSchema = {
    properties: {
      name: {
        type: 'string',
        title: '藍圖名稱',
        minLength: 2,
        maxLength: 100
      },
      description: {
        type: 'string',
        title: '描述',
        maxLength: 500
      },
      isPublic: {
        type: 'boolean',
        title: '公開藍圖',
        default: false
      }
    },
    required: ['name', 'description']
  };

  /**
   * UI schema for form layout (simplified)
   */
  readonly uiSchema: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: { span: 24 }
    },
    $name: {
      widget: 'string',
      placeholder: '請輸入藍圖名稱'
    },
    $description: {
      widget: 'textarea',
      placeholder: '請輸入藍圖描述',
      autosize: { minRows: 3, maxRows: 6 }
    },
    $isPublic: {
      widget: 'boolean',
      checkedChildren: '公開',
      unCheckedChildren: '私有'
    }
  };

  ngOnInit(): void {
    // Initialize form data for edit mode
    if (this.isEditMode && this.dialogData.blueprint) {
      const blueprint = this.dialogData.blueprint;
      this.formData.set({
        name: blueprint.name,
        description: blueprint.description,
        isPublic: blueprint.isPublic
      });
    }
  }

  /**
   * Trigger form submit programmatically
   */
  triggerSubmit(): void {
    if (this.sf?.valid) {
      this.onSubmit(this.sf.value as BlueprintFormValues);
    } else {
      // Show validation errors
      this.messageService.warning('請填寫所有必填欄位');
    }
  }

  /**
   * Handle form submission
   */
  async onSubmit(formValue: BlueprintFormValues): Promise<void> {
    this.loading.set(true);

    try {
      if (this.isEditMode) {
        await this.handleUpdate(formValue);
      } else {
        await this.handleCreate(formValue);
      }
    } catch (error) {
      console.error('Blueprint form error:', error);
      this.messageService.error('操作失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle blueprint creation (simplified)
   */
  private async handleCreate(formValue: BlueprintFormValues): Promise<void> {
    if (!this.dialogData.ownerId) {
      throw new Error('Owner ID is required for creation');
    }

    const request: CreateBlueprintRequest = {
      name: formValue.name,
      description: formValue.description,
      isPublic: formValue.isPublic ?? false,
      ownerId: this.dialogData.ownerId
    };

    const result = await this.blueprintStore.createBlueprint(request);
    this.messageService.success('藍圖建立成功');
    this.modalRef.close(result);
  }

  /**
   * Handle blueprint update (simplified)
   */
  private async handleUpdate(formValue: BlueprintFormValues): Promise<void> {
    if (!this.dialogData.blueprint) {
      throw new Error('Blueprint not found for update');
    }

    const request: UpdateBlueprintRequest = {
      name: formValue.name,
      description: formValue.description,
      isPublic: formValue.isPublic
    };

    const result = await this.blueprintStore.updateBlueprint(this.dialogData.blueprint.id, request);
    this.messageService.success('藍圖更新成功');
    this.modalRef.close(result);
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.modalRef.close();
  }
}
