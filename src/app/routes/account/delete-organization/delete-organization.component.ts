/**
 * Delete Organization Component
 *
 * 刪除組織組件
 * Delete organization component
 *
 * Allows users to delete (soft delete) an existing organization account.
 * Integrated with OrganizationFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { OrganizationFacade } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-delete-organization',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">刪除組織</div>
    </div>

    <div class="modal-body">
      <nz-alert
        nzType="warning"
        nzMessage="確定要刪除此組織嗎？"
        [nzDescription]="'您即將刪除組織「' + getOrganizationName() + '」。此操作無法撤銷。'"
        nzShowIcon
      ></nz-alert>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading">
        取消
      </button>
      <button
        nz-button
        type="button"
        nzType="primary"
        nzDanger
        (click)="confirmDelete()"
        [nzLoading]="loading"
      >
        確認刪除
      </button>
    </div>
  `,
  styles: [`
    .modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 500;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }
    .modal-footer button + button {
      margin-left: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteOrganizationComponent implements OnInit {
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  organization: Record<string, unknown> | null = null;

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;
    const org = params?.['organization'] as Record<string, unknown> | undefined;

    if (org) {
      this.organization = org;
    } else {
      this.msg.error('缺少組織資料');
      this.cancel();
    }
  }

  /**
   * 取得組織名稱
   * Get organization name
   */
  getOrganizationName(): string {
    return (this.organization?.['name'] as string) || '未命名組織';
  }

  /**
   * 確認刪除組織
   * Confirm delete organization
   */
  async confirmDelete(): Promise<void> {
    if (!this.organization) return;

    this.loading = true;
    try {
      await this.organizationFacade.deleteOrganization(this.organization['id'] as string);
      this.msg.success('組織已刪除！');
      this.modal.close({ deleted: true, organization: this.organization });
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '刪除組織失敗');
    } finally {
      this.loading = false;
    }
  }

  /**
   * 取消並關閉模態框
   * Cancel and close modal
   */
  cancel(): void {
    this.modal.destroy();
  }
}
