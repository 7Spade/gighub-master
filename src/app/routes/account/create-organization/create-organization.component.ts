/**
 * Create Organization Component
 *
 * 建立組織組件
 * Create organization component
 *
 * Allows users to create a new organization account.
 * Integrated with OrganizationFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrganizationFacade, CreateOrganizationRequest } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-create-organization',
  template: `
    <div class="modal-header">
      <div class="modal-title">建立組織</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入組織名稱（2-50個字符）'">
            <input nz-input formControlName="name" placeholder="請輸入組織名稱" [disabled]="loading" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>電子郵件</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入有效的電子郵件地址'">
            <input nz-input type="email" formControlName="email" placeholder="請輸入組織電子郵件（可選）" [disabled]="loading" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>頭像 URL</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="avatar" placeholder="請輸入組織頭像 URL（可選）" [disabled]="loading" />
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading"> 取消 </button>
      <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading" [disabled]="form.invalid">
        建立組織
      </button>
    </div>
  `,
  styles: [
    `
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule]
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = false;
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email]],
    avatar: ['']
  });

  /**
   * 提交表單創建組織
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsDirty();
        control?.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    try {
      const request: CreateOrganizationRequest = {
        name: this.form.value.name?.trim(),
        email: this.form.value.email?.trim() || undefined,
        avatar: this.form.value.avatar?.trim() || undefined
      };
      const organization = await this.organizationFacade.createOrganization(request);
      this.msg.success('組織創建成功！');
      this.modal.close(organization);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '創建組織失敗');
    } finally {
      this.loading = false;
    }
  }

  /**
   * 取消並關閉模態框
   */
  cancel(): void {
    this.modal.destroy();
  }
}
