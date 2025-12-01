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
import { SHARED_IMPORTS, UpdateOrganizationRequest, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-update-organization',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">更新組織</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入組織名稱（2-50個字符）'">
            <input
              nz-input
              formControlName="name"
              placeholder="請輸入組織名稱"
              [disabled]="loading"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>電子郵件</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入有效的電子郵件地址'">
            <input
              nz-input
              type="email"
              formControlName="email"
              placeholder="請輸入組織電子郵件（可選）"
              [disabled]="loading"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>頭像 URL</nz-form-label>
          <nz-form-control>
            <input
              nz-input
              formControlName="avatar"
              placeholder="請輸入組織頭像 URL（可選）"
              [disabled]="loading"
            />
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading">
        取消
      </button>
      <button
        nz-button
        type="button"
        nzType="primary"
        (click)="submit()"
        [nzLoading]="loading"
        [disabled]="form.invalid"
      >
        更新組織
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
export class UpdateOrganizationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  organization: Record<string, unknown> | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email]],
    avatar: ['']
  });

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;
    const org = params?.['organization'] as Record<string, unknown> | undefined;

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
    if (!validateForm(this.form) || !this.organization) {
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
