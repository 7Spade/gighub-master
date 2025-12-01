/**
 * Update Team Component
 *
 * 更新團隊組件
 * Update team component
 *
 * Allows users to update an existing team within an organization.
 * Integrated with TeamFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamFacade } from '@core';
import { SHARED_IMPORTS, UpdateTeamRequest, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-update-team',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">更新團隊</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">團隊名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入團隊名稱（2-50個字符）'">
            <input
              nz-input
              formControlName="name"
              placeholder="請輸入團隊名稱"
              [disabled]="loading()"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>團隊描述</nz-form-label>
          <nz-form-control [nzErrorTip]="'描述不能超過500個字符'">
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入團隊描述（可選）"
              [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              [disabled]="loading()"
            ></textarea>
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
        更新團隊
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
export class UpdateTeamComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  team: Record<string, unknown> | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;
    const teamData = params?.['team'] as Record<string, unknown> | undefined;

    if (teamData) {
      this.team = teamData;
      this.form.patchValue({
        name: this.team['name'] || '',
        description: this.team['description'] || ''
      });
    } else {
      this.msg.error('缺少團隊資料');
      this.cancel();
    }
  }

  /**
   * 提交表單更新團隊
   * Submit form to update team
   */
  async submit(): Promise<void> {
    if (!validateForm(this.form) || !this.team) {
      return;
    }

    this.loading.set(true);
    try {
      const request = getTrimmedFormValue<UpdateTeamRequest>(this.form);
      const updatedTeam = await this.teamFacade.updateTeam(this.team['id'] as string, request as UpdateTeamRequest);
      this.msg.success('團隊更新成功！');
      this.modal.close(updatedTeam);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '更新團隊失敗');
    } finally {
      this.loading.set(false);
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
