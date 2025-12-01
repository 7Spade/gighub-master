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
import { OrganizationMemberRepository, SupabaseService } from '@core';
import { SHARED_IMPORTS, validateForm } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-team-member',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">添加團隊成員</div>
    </div>

    <div class="modal-body">
      @if (loadingOrgMembers()) {
        <nz-spin [nzSpinning]="true" nzTip="載入組織成員中..."></nz-spin>
      } @else if (orgMembers().length === 0) {
        <nz-alert
          nzType="warning"
          nzMessage="提示"
          nzDescription="組織中沒有可添加的成員。請先將成員添加到組織。"
          [nzShowIcon]="true"
        ></nz-alert>
      } @else {
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label [nzRequired]="true">選擇成員</nz-form-label>
            <nz-form-control [nzErrorTip]="'請選擇成員'">
              <nz-select
                formControlName="accountId"
                nzPlaceHolder="請選擇組織成員"
                [nzDisabled]="loading()"
              >
                @for (member of orgMembers(); track member.id) {
                  <nz-option [nzValue]="member.account_id" [nzLabel]="getMemberLabel(member)"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">團隊角色</nz-form-label>
            <nz-form-control>
              <nz-select formControlName="role" nzPlaceHolder="請選擇角色" [nzDisabled]="loading()">
                <nz-option nzValue="member" nzLabel="成員"></nz-option>
                <nz-option nzValue="leader" nzLabel="團隊領導"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </form>
      }
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
        [disabled]="form.invalid || orgMembers().length === 0"
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
export class AddTeamMemberComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orgMemberRepo = inject(OrganizationMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  loadingOrgMembers = signal(false);
  teamId: string | null = null;
  organizationId: string | null = null;
  orgMembers = signal<Array<Record<string, unknown>>>([]);

  form: FormGroup = this.fb.group({
    accountId: ['', [Validators.required]],
    role: ['member', [Validators.required]]
  });

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;

    this.teamId = (params?.['teamId'] as string) || null;
    this.organizationId = (params?.['organizationId'] as string) || null;

    if (!this.teamId || !this.organizationId) {
      this.msg.error(`缺少必要參數：teamId=${this.teamId}, organizationId=${this.organizationId}`);
      this.cancel();
      return;
    }

    this.loadOrganizationMembers();
  }

  async loadOrganizationMembers(): Promise<void> {
    if (!this.organizationId) return;

    this.loadingOrgMembers.set(true);
    try {
      const members = await firstValueFrom(this.orgMemberRepo.findByOrganization(this.organizationId));
      this.orgMembers.set(members as Array<Record<string, unknown>>);
    } catch (error) {
      this.msg.error('載入組織成員失敗');
      console.error(error);
    } finally {
      this.loadingOrgMembers.set(false);
    }
  }

  getMemberLabel(member: Record<string, unknown>): string {
    const accountId = member['account_id'] as string;
    const role = member['role'] as string;
    return `${accountId.slice(0, 8)}... (${role})`;
  }

  async submit(): Promise<void> {
    if (!validateForm(this.form) || !this.teamId) {
      return;
    }

    this.loading.set(true);
    try {
      const formValue = this.form.value;
      const client = this.supabaseService.client;

      // Insert team member directly
      const { error } = await client
        .from('team_members')
        .insert({
          team_id: this.teamId,
          account_id: formValue.accountId,
          role: formValue.role
        });

      if (error) throw error;

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
