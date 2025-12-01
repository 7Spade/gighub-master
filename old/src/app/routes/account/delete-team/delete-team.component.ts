/**
 * Delete Team Component
 *
 * 刪除團隊組件
 * Delete team component
 *
 * Allows users to delete an existing team.
 * Integrated with TeamFacade.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TeamFacade } from '@core';
import { SHARED_IMPORTS, TeamBusinessModel } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-delete-team',
  templateUrl: './delete-team.component.html',
  styleUrls: ['./delete-team.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class DeleteTeamComponent implements OnInit {
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  team!: TeamBusinessModel;
  teamParam?: TeamBusinessModel;

  ngOnInit(): void {
    const config = this.modal.getConfig() as any;
    const params = config?.nzComponentParams || {};
    const teamData = params.team || this.teamParam;

    if (teamData) {
      this.team = teamData;
    } else {
      this.msg.error('缺少團隊資料');
      this.cancel();
    }
  }

  /**
   * 確認刪除團隊
   * Confirm delete team
   */
  async confirmDelete(): Promise<void> {
    this.loading.set(true);
    try {
      await this.teamFacade.deleteTeam(this.team['id'] as string);
      this.msg.success('團隊已刪除！');
      this.modal.close({ deleted: true, team: this.team });
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '刪除團隊失敗');
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
