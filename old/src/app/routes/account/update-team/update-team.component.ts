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
import { SHARED_IMPORTS, UpdateTeamRequest, TeamBusinessModel, validateForm, getTrimmedFormValue } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-update-team',
  templateUrl: './update-team.component.html',
  styleUrls: ['./update-team.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class UpdateTeamComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  team!: TeamBusinessModel;
  teamParam?: TeamBusinessModel;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]],
    avatar: ['']
  });

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};
    const teamData = params.team || this.teamParam;

    if (teamData) {
      this.team = teamData;
      this.form.patchValue({
        name: (this.team as any)['name'] || '',
        description: (this.team as any)['description'] || '',
        avatar: (this.team as any)['avatar'] || ''
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
  /**
   * 提交表單更新團隊
   * Submit form to update team
   */
  async submit(): Promise<void> {
    if (!validateForm(this.form)) {
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
