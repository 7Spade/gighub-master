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
  templateUrl: './add-organization-member.component.html',
  styleUrls: ['./add-organization-member.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class AddOrganizationMemberComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orgMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  organizationId!: string;

  form: FormGroup = this.fb.group({
    accountId: ['', [Validators.required]],
    role: ['member', [Validators.required]]
  });

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};

    console.log('[AddOrganizationMemberComponent] params:', params);
    console.log('[AddOrganizationMemberComponent] organizationId from params:', params?.organizationId);

    // Try both params and direct property
    this.organizationId = params?.organizationId || (this as any).organizationId;

    console.log('[AddOrganizationMemberComponent] Final organizationId:', this.organizationId);

    if (!this.organizationId) {
      this.msg.error(`缺少組織 ID: params=${JSON.stringify(params)}`);
      this.cancel();
    }
  }

  async submit(): Promise<void> {
    if (!validateForm(this.form)) {
      return;
    }

    this.loading.set(true);
    try {
      const formValue = this.form.value;
      const user = await this.supabaseService.getUser();

      await firstValueFrom(
        this.orgMemberRepo.create({
          organization_id: this.organizationId,
          account_id: formValue.accountId,
          role: formValue.role,
          auth_user_id: user?.id // ✅ 添加 auth_user_id
        } as any)
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
