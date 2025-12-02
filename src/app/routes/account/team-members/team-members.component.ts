/**
 * Team Members Component
 *
 * 團隊成員管理組件
 * Team members management component
 *
 * Displays and manages members for a specific team.
 *
 * @module routes/account
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Team, TeamMember, TeamRole, Account } from '@core';
import { TeamService, OrganizationMemberService, OrganizationMemberWithAccount } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

/**
 * Modal data interface for team members component
 */
interface TeamMembersModalData {
  team: Team;
  organizationId: string;
}

/**
 * Team member with account details
 */
interface TeamMemberWithAccount extends TeamMember {
  account?: Account;
}

@Component({
  selector: 'app-team-members',
  template: `
    <div class="modal-header">
      <div class="modal-title">團隊成員管理 - {{ team.name }}</div>
    </div>

    <div class="modal-body">
      <nz-spin [nzSpinning]="loading()">
        <div class="add-member-section">
          <h4>添加成員</h4>
          <div class="add-member-form">
            <nz-select [(ngModel)]="selectedMemberId" nzPlaceHolder="選擇組織成員" [nzLoading]="loadingOrgMembers()" style="width: 200px;">
              @for (member of availableOrgMembers(); track member.account_id) {
                <nz-option [nzValue]="member.account_id" [nzLabel]="member.account?.name || member.account_id"></nz-option>
              }
            </nz-select>
            <nz-select [(ngModel)]="selectedRole" style="width: 120px;">
              <nz-option nzValue="leader" nzLabel="領導"></nz-option>
              <nz-option nzValue="member" nzLabel="成員"></nz-option>
            </nz-select>
            <button nz-button nzType="primary" (click)="addMember()" [disabled]="!selectedMemberId" [nzLoading]="adding()">
              <span nz-icon nzType="plus"></span>添加
            </button>
          </div>
        </div>

        <nz-divider></nz-divider>

        <h4>現有成員</h4>
        <nz-table #memberTable [nzData]="members()" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th>成員</th>
              <th>角色</th>
              <th>加入時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (member of memberTable.data; track member.id) {
              <tr>
                <td>{{ member.account?.name || member.account_id }}</td>
                <td>
                  <nz-tag [nzColor]="getRoleColor(member.role)">{{ getRoleLabel(member.role) }}</nz-tag>
                </td>
                <td>{{ member.created_at | date: 'yyyy-MM-dd' }}</td>
                <td>
                  <a
                    nz-popconfirm
                    nzPopconfirmTitle="確定要移除此成員嗎？"
                    (nzOnConfirm)="removeMember(member)"
                    nzOkText="確定"
                    nzCancelText="取消"
                    >移除</a
                  >
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4">
                  <nz-empty nzNotFoundContent="尚無成員"></nz-empty>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-spin>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="close()">關閉</button>
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
      .add-member-section {
        margin-bottom: 16px;
      }
      .add-member-section h4 {
        margin-bottom: 12px;
      }
      .add-member-form {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzButtonModule,
    NzDividerModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule
  ]
})
export class TeamMembersComponent implements OnInit {
  private readonly nzModalData = inject<TeamMembersModalData>(NZ_MODAL_DATA);
  private readonly teamService = inject(TeamService);
  private readonly organizationMemberService = inject(OrganizationMemberService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  // Get data from modal injection
  readonly team = this.nzModalData.team;
  readonly organizationId = this.nzModalData.organizationId;

  loading = signal(false);
  loadingOrgMembers = signal(false);
  adding = signal(false);
  members = signal<TeamMemberWithAccount[]>([]);
  orgMembers = signal<OrganizationMemberWithAccount[]>([]);

  selectedMemberId = '';
  selectedRole: TeamRole = TeamRole.MEMBER;

  // Available org members (excluding current team members)
  readonly availableOrgMembers = signal<OrganizationMemberWithAccount[]>([]);

  ngOnInit(): void {
    // Load org members first, then team members (for account enrichment)
    this.loadOrgMembers().then(() => {
      this.loadMembers();
    });
  }

  async loadMembers(): Promise<void> {
    if (!this.team?.id) return;

    this.loading.set(true);
    try {
      const teamMembers = await this.teamService.findMembers(this.team.id);
      // Fetch account details for each member
      const membersWithAccounts = await this.enrichMembersWithAccounts(teamMembers);
      this.members.set(membersWithAccounts);
      this.updateAvailableOrgMembers();
    } catch (error) {
      console.error('[TeamMembersComponent] Failed to load members:', error);
      this.msg.error('載入團隊成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Enrich team members with account details from organization members
   */
  private async enrichMembersWithAccounts(teamMembers: TeamMember[]): Promise<TeamMemberWithAccount[]> {
    // Get organization members to look up account details
    const orgMembers = this.orgMembers();
    const accountMap = new Map(orgMembers.map(m => [m.account_id, m.account]));

    return teamMembers.map(member => ({
      ...member,
      account: accountMap.get(member.account_id)
    }));
  }

  async loadOrgMembers(): Promise<void> {
    if (!this.organizationId) return;

    this.loadingOrgMembers.set(true);
    try {
      const members = await this.organizationMemberService.findByOrganization(this.organizationId);
      this.orgMembers.set(members);
      this.updateAvailableOrgMembers();
    } catch (error) {
      console.error('[TeamMembersComponent] Failed to load org members:', error);
    } finally {
      this.loadingOrgMembers.set(false);
    }
  }

  updateAvailableOrgMembers(): void {
    const currentMemberIds = new Set(this.members().map(m => m.account_id));
    const available = this.orgMembers().filter(m => !currentMemberIds.has(m.account_id));
    this.availableOrgMembers.set(available);
  }

  getRoleColor(role: TeamRole | string): string {
    const colorMap: Record<string, string> = {
      [TeamRole.LEADER]: 'gold',
      [TeamRole.MEMBER]: 'default'
    };
    return colorMap[role] || 'default';
  }

  getRoleLabel(role: TeamRole | string): string {
    const labelMap: Record<string, string> = {
      [TeamRole.LEADER]: '領導',
      [TeamRole.MEMBER]: '成員'
    };
    return labelMap[role] || role;
  }

  async addMember(): Promise<void> {
    if (!this.selectedMemberId || !this.team?.id) return;

    this.adding.set(true);
    try {
      await this.teamService.addMember(this.team.id, this.selectedMemberId, this.selectedRole);
      this.msg.success('成員添加成功');
      this.selectedMemberId = '';
      this.loadMembers();
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '添加成員失敗');
    } finally {
      this.adding.set(false);
    }
  }

  async removeMember(member: TeamMemberWithAccount): Promise<void> {
    try {
      await this.teamService.removeMember(member.id);
      this.msg.success('成員移除成功');
      this.loadMembers();
    } catch (error) {
      console.error('[TeamMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }

  close(): void {
    this.modal.close();
  }
}
