/**
 * Update Organization Component
 *
 * 更新組織組件
 * Update organization component
 *
 * Allows users to update an existing organization account.
 * Integrated with OrganizationFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationFacade } from '@core';
import { SHARED_IMPORTS, UpdateOrganizationRequest, Account, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-update-organization',
  templateUrl: './update-organization.component.html',
  styleUrls: ['./update-organization.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class UpdateOrganizationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  organization!: Account;
  organizationParam?: Account;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email]],
    avatar: ['']
  });

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};
    const org = params.organization || this.organizationParam;

    if (org) {
      this.organization = org;
      this.form.patchValue({
        name: this.organization['name'] || '',
        email: this.organization['email'] || '',
        avatar: this.organization['avatar'] || ''
      });
    } else {
      this.msg.error('缺少組織資料');
      this.cancel();
    }
  }

  /**
   * 提交表單更新組織
   * Submit form to update organization
   */
  async submit(): Promise<void> {
    if (!validateForm(this.form)) {
      return;
    }

    this.loading = true;
    try {
      const request = getTrimmedFormValue<UpdateOrganizationRequest>(this.form);
      const updatedOrganization = await this.organizationFacade.updateOrganization(
        this.organization['id'] as string,
        request as UpdateOrganizationRequest
      );
      this.msg.success('組織更新成功！');
      this.modal.close(updatedOrganization);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '更新組織失敗');
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
