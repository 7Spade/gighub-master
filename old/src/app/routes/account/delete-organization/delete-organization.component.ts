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
import { SHARED_IMPORTS, Account } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-delete-organization',
  templateUrl: './delete-organization.component.html',
  styleUrls: ['./delete-organization.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class DeleteOrganizationComponent implements OnInit {
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  organization!: Account;
  organizationParam?: Account;

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};
    const org = params.organization || this.organizationParam;

    if (org) {
      this.organization = org;
    } else {
      this.msg.error('缺少組織資料');
      this.cancel();
    }
  }

  /**
   * 確認刪除組織
   * Confirm delete organization
   */
  async confirmDelete(): Promise<void> {
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
