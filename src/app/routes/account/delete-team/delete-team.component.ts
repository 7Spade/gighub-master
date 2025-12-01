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
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-delete-team',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="modal-header">
      <div class="modal-title">刪除團隊</div>
    </div>

    <div class="modal-body">
      <nz-alert
        nzType="warning"
        nzMessage="確定要刪除此團隊嗎？"
        [nzDescription]="'您即將刪除團隊「' + getTeamName() + '」。此操作無法撤銷。'"
        nzShowIcon
      ></nz-alert>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()">
        取消
      </button>
      <button
        nz-button
        type="button"
        nzType="primary"
        nzDanger
        (click)="confirmDelete()"
        [nzLoading]="loading()"
      >
        確認刪除
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
export class DeleteTeamComponent implements OnInit {
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  team: Record<string, unknown> | null = null;

  ngOnInit(): void {
    const config = this.modal.getConfig();
    const params = (config as Record<string, unknown>)?.['nzComponentParams'] as Record<string, unknown> | undefined;
    const teamData = params?.['team'] as Record<string, unknown> | undefined;

    if (teamData) {
      this.team = teamData;
    } else {
      this.msg.error('缺少團隊資料');
      this.cancel();
    }
  }

  /**
   * 取得團隊名稱
   * Get team name
   */
  getTeamName(): string {
    return (this.team?.['name'] as string) || '未命名團隊';
  }

  /**
   * 確認刪除團隊
   * Confirm delete team
   */
  async confirmDelete(): Promise<void> {
    if (!this.team) return;

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
