/**
 * Add Organization Member Component
 *
 * 添加組織成員組件
 * Add organization member component
 *
 * Allows organization owners/admins to add new members.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationMemberRepository, SupabaseService } from '@core';
import { SHARED_IMPORTS, validateForm } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-organization-member',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">添加組織成員</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">帳戶 ID</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入有效的帳戶 ID'">
            <input
              nz-input
              formControlName="accountId"
              placeholder="請輸入要添加成員的帳戶 ID"
              [disabled]="loading()"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">角色</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="role" nzPlaceHolder="請選擇角色" [nzDisabled]="loading()">
              <nz-option nzValue="member" nzLabel="成員"></nz-option>
              <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()">
        取消
      </button>
      <button
        nz-button
        type="button"
        nzType="primary"
        (click)="submit()"
        [nzLoading]="loading()"
        [disabled]="form.invalid"
      >
        添加成員
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
export class AddOrganizationMemberComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orgMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  organizationId: string | null = null;

  form: FormGroup = this.fb.group({
    accountId: ['', [Validators.required]],
    role: ['member', [Validators.required]]
  });

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;
    const orgId = params?.['organizationId'] as string | undefined;

    if (orgId) {
      this.organizationId = orgId;
    } else {
      this.msg.error('缺少組織 ID');
      this.cancel();
    }
  }

  async submit(): Promise<void> {
    if (!validateForm(this.form) || !this.organizationId) {
      return;
    }

    this.loading.set(true);
    try {
      const formValue = this.form.value;
      await firstValueFrom(
        this.orgMemberRepo.create({
          organization_id: this.organizationId,
          account_id: formValue.accountId,
          role: formValue.role
        })
      );
      this.msg.success('成員添加成功！');
      this.modal.close({ success: true });
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '添加成員失敗');
      console.error('[AddOrganizationMemberComponent] 添加成員錯誤:', error);
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.modal.destroy();
  }
}
