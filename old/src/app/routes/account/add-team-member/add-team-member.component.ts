/**
 * Add Team Member Component
 *
 * 添加團隊成員組件
 * Add team member component
 *
 * Allows team leaders to add new members to a team.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamMemberRepository, OrganizationMemberRepository, SupabaseService } from '@core';
import { SHARED_IMPORTS, validateForm } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-team-member',
  templateUrl: './add-team-member.component.html',
  styleUrls: ['./add-team-member.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class AddTeamMemberComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamMemberRepo = inject(TeamMemberRepository);
  private readonly orgMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  loadingOrgMembers = signal(false);
  teamId!: string;
  organizationId!: string;
  orgMembers = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    accountId: ['', [Validators.required]],
    role: ['member', [Validators.required]]
  });

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};

    console.log('[AddTeamMemberComponent] params:', params);
    console.log('[AddTeamMemberComponent] teamId:', params?.teamId);
    console.log('[AddTeamMemberComponent] organizationId:', params?.organizationId);

    this.teamId = params?.teamId || (this as any).teamId;
    this.organizationId = params?.organizationId || (this as any).organizationId;

    console.log('[AddTeamMemberComponent] Final teamId:', this.teamId);
    console.log('[AddTeamMemberComponent] Final organizationId:', this.organizationId);

    if (!this.teamId || !this.organizationId) {
      this.msg.error(`缺少必要參數：teamId=${this.teamId}, organizationId=${this.organizationId}`);
      this.cancel();
      return;
    }

    this.loadOrganizationMembers();
  }

  async loadOrganizationMembers(): Promise<void> {
    this.loadingOrgMembers.set(true);
    try {
      const members = await firstValueFrom(this.orgMemberRepo.findByOrganization(this.organizationId));
      this.orgMembers.set(members);
    } catch (error) {
      this.msg.error('載入組織成員失敗');
      console.error(error);
    } finally {
      this.loadingOrgMembers.set(false);
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
        this.teamMemberRepo.create({
          team_id: this.teamId,
          account_id: formValue.accountId,
          role: formValue.role,
          auth_user_id: user?.id // ✅ 添加 auth_user_id
        } as any)
      );
      this.msg.success('成員添加成功！');
      this.modal.close({ success: true });
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '添加成員失敗');
      console.error('[AddTeamMemberComponent] 添加成員錯誤:', error);
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.modal.destroy();
  }
}
