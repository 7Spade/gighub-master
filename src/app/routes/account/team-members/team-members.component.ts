/**
 * Team Members Component
 *
 * 團隊成員管理組件
 * Team members management component
 *
 * Dialog component for managing team members.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team, TeamMember, TeamRole } from '@core';
import { TeamService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

export interface TeamMembersDialogData {
  team: Team;
}

@Component({
  selector: 'app-team-members',
  template: `
    <div class="modal-header">
      <div class="modal-title">{{ team?.name }} - 成員管理</div>
    </div>

    <div class="modal-body">
      <nz-spin [nzSpinning]="loading()">
        <nz-table
          #memberTable
          [nzData]="members()"
          [nzShowPagination]="members().length > 10"
          [nzPageSize]="10"
          nzSize="small"
        >
          <thead>
            <tr>
              <th>成員 ID</th>
              <th>角色</th>
              <th>加入時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (member of memberTable.data; track member.id) {
              <tr>
                <td>
                  <span class="account-id">{{ member.account_id }}</span>
                </td>
                <td>
                  <nz-tag [nzColor]="member.role === 'leader' ? 'gold' : 'blue'">
                    {{ member.role === 'leader' ? '領導' : '成員' }}
                  </nz-tag>
                </td>
                <td>{{ member.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>
                  <button
                    nz-button
                    nzType="link"
                    nzDanger
                    nzSize="small"
                    nz-popconfirm
                    nzPopconfirmTitle="確定要移除此成員嗎？"
                    (nzOnConfirm)="removeMember(member)"
                  >
                    <span nz-icon nzType="delete"></span>
                  </button>
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="4">
                  <nz-empty nzNotFoundContent="暫無團隊成員"></nz-empty>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-spin>
    </div>

    <div class="modal-footer">
      <button nz-button (click)="close()">關閉</button>
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
      max-height: 400px;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }
    .account-id {
      font-family: monospace;
      font-size: 12px;
      color: #666;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzButtonModule,
    NzDividerModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzEmptyModule
  ]
})
export class TeamMembersComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);
  readonly data: TeamMembersDialogData = inject(NZ_MODAL_DATA);

  members = signal<TeamMember[]>([]);
  loading = signal(false);

  get team(): Team | undefined {
    return this.data?.team;
  }

  ngOnInit(): void {
    if (this.team) {
      this.loadMembers();
    }
  }

  async loadMembers(): Promise<void> {
    if (!this.team) return;

    this.loading.set(true);
    try {
      const members = await this.teamService.findMembers(this.team.id);
      this.members.set(members);
    } catch (error) {
      console.error('[TeamMembersComponent] Failed to load members:', error);
      this.msg.error('載入團隊成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async removeMember(member: TeamMember): Promise<void> {
    try {
      await this.teamService.removeMember(member.id);
      this.msg.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      console.error('[TeamMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }

  close(): void {
    this.modal.destroy();
  }
}
