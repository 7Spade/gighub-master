/**
 * Blueprint Delete Confirm Dialog Component
 *
 * Confirmation dialog for deleting blueprints (藍圖刪除確認對話框)
 * Following enterprise guidelines and vertical slice architecture
 *
 * Dependency flow:
 * Component → Store (Facade) → Service → Repository
 *
 * @module features/blueprint/shell/dialogs/blueprint-delete-confirm-dialog
 */

import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { BlueprintStore } from '../../../data-access';
import { BlueprintModel } from '../../../domain';

/**
 * Dialog input data
 */
export interface BlueprintDeleteConfirmDialogData {
  blueprint: BlueprintModel;
}

/**
 * Blueprint Delete Confirm Dialog Component
 *
 * Smart component for blueprint deletion confirmation
 */
@Component({
  selector: 'app-blueprint-delete-confirm-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="delete-confirm-dialog">
      <div class="warning-icon">
        <span nz-icon nzType="exclamation-circle" nzTheme="outline"></span>
      </div>

      <div class="confirm-message">
        <p class="title">確定要刪除此藍圖嗎？</p>
        <p class="blueprint-name">{{ blueprint.name }}</p>
        <p class="warning-text"> 此操作無法復原。刪除後，所有相關資料將被永久移除。 </p>
      </div>

      <div class="form-actions" nz-row nzJustify="center" nzGutter="16">
        <div nz-col>
          <button nz-button nzType="default" [disabled]="loading()" (click)="onCancel()"> 取消 </button>
        </div>
        <div nz-col>
          <button nz-button nzType="primary" nzDanger [nzLoading]="loading()" (click)="onConfirm()"> 確定刪除 </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .delete-confirm-dialog {
        text-align: center;
        padding: 16px;
      }

      .warning-icon {
        color: #faad14;
        font-size: 48px;
        margin-bottom: 16px;
      }

      .confirm-message {
        margin-bottom: 24px;

        .title {
          color: rgb(0 0 0 / 85%);
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .blueprint-name {
          color: #1890ff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .warning-text {
          color: rgb(0 0 0 / 45%);
          font-size: 14px;
        }
      }

      .form-actions {
        margin-top: 24px;
      }
    `
  ]
})
export class BlueprintDeleteConfirmDialogComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly messageService = inject(NzMessageService);
  private readonly blueprintStore = inject(BlueprintStore);
  private readonly dialogData = inject<BlueprintDeleteConfirmDialogData>(NZ_MODAL_DATA);

  // State
  readonly loading = signal<boolean>(false);

  // Blueprint data
  readonly blueprint = this.dialogData.blueprint;

  /**
   * Handle delete confirmation
   */
  async onConfirm(): Promise<void> {
    this.loading.set(true);

    try {
      await this.blueprintStore.deleteBlueprint(this.blueprint.id);
      this.messageService.success('藍圖已刪除');
      this.modalRef.close(true);
    } catch (error) {
      console.error('Blueprint deletion error:', error);
      this.messageService.error('刪除失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.modalRef.close(false);
  }
}
