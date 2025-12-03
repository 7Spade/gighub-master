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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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

/**
 * Organization member with checkbox state for selection
 */
interface SelectableOrgMember extends OrganizationMemberWithAccount {
  checked?: boolean;
  selectedRole?: TeamRole;
}

@Component({
  selector: 'app-team-members',
  template: `
    <div class="modal-header">
      <div class="modal-title">團隊成員管理 - {{ team.name }}</div>
    </div>

    <div class="modal-body">
      <nz-spin [nzSpinning]="loading()">
        <!-- Add Member Section with table of organization members -->
        <div class="add-member-section">
          <h4>從組織成員中選擇添加</h4>
          @if (loadingOrgMembers()) {
            <div class="loading-hint">載入組織成員中...</div>
          } @else if (availableOrgMembers().length === 0) {
            <nz-empty nzNotFoundContent="組織中所有成員都已在此團隊中"></nz-empty>
          } @else {
            <nz-table
              #orgMemberTable
              [nzData]="availableOrgMembers()"
              [nzShowPagination]="false"
              nzSize="small"
              [nzScroll]="{ y: '200px' }"
            >
              <thead>
                <tr>
                  <th nzWidth="50px">
                    <label
                      nz-checkbox
                      [(ngModel)]="allChecked"
                      [nzIndeterminate]="indeterminate"
                      (ngModelChange)="onAllCheckedChange($event)"
                    ></label>
                  </th>
                  <th>成員</th>
                  <th>Email</th>
                  <th>角色</th>
                </tr>
              </thead>
              <tbody>
                @for (member of orgMemberTable.data; track member.account_id) {
                  <tr>
                    <td>
                      <label nz-checkbox [(ngModel)]="member.checked" (ngModelChange)="refreshCheckedStatus()"></label>
                    </td>
                    <td>{{ member.account?.name || member.account_id }}</td>
                    <td>{{ member.account?.email || '-' }}</td>
                    <td>
                      <nz-select [(ngModel)]="member.selectedRole" style="width: 100px;" nzSize="small">
                        <nz-option nzValue="leader" nzLabel="領導"></nz-option>
                        <nz-option nzValue="member" nzLabel="成員"></nz-option>
                      </nz-select>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
            <div class="batch-actions">
              <button
                nz-button
                nzType="primary"
                (click)="addSelectedMembers()"
                [disabled]="getSelectedMembers().length === 0"
                [nzLoading]="adding()"
              >
                <span nz-icon nzType="plus"></span>添加選中的 {{ getSelectedMembers().length }} 位成員
              </button>
            </div>
          }
        </div>

        <nz-divider></nz-divider>

        <!-- Current Members Section -->
        <h4>現有成員 ({{ members().length }})</h4>
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
                  <nz-empty nzNotFoundContent="尚無成員，請從上方添加"></nz-empty>
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
      .loading-hint {
        color: #999;
        padding: 16px;
        text-align: center;
      }
      .batch-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzButtonModule,
    NzCheckboxModule,
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
  // Inject modal data - this is required when using nzData in NzModalService.create()
  readonly nzModalData: TeamMembersModalData = inject(NZ_MODAL_DATA);
  private readonly teamService = inject(TeamService);
  private readonly organizationMemberService = inject(OrganizationMemberService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  // Direct access to modal data properties
  get team(): Team {
    return this.nzModalData?.team;
  }

  get organizationId(): string {
    return this.nzModalData?.organizationId || '';
  }

  loading = signal(false);
  loadingOrgMembers = signal(false);
  adding = signal(false);
  members = signal<TeamMemberWithAccount[]>([]);
  orgMembers = signal<OrganizationMemberWithAccount[]>([]);

  // Checkbox state for select all
  allChecked = false;
  indeterminate = false;

  // Available org members (excluding current team members) with selection state
  readonly availableOrgMembers = signal<SelectableOrgMember[]>([]);

  ngOnInit(): void {
    console.log('[TeamMembersComponent] Initializing with modal data:', {
      team: this.team,
      organizationId: this.organizationId,
      hasNzModalData: !!this.nzModalData
    });

    if (!this.team?.id || !this.organizationId) {
      console.error('[TeamMembersComponent] Missing required modal data');
      this.msg.error('無法載入團隊資料');
      return;
    }

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
    const available = this.orgMembers()
      .filter(m => !currentMemberIds.has(m.account_id))
      .map(
        m =>
          ({
            ...m,
            checked: false,
            selectedRole: TeamRole.MEMBER
          }) as SelectableOrgMember
      );
    this.availableOrgMembers.set(available);
    this.refreshCheckedStatus();
  }

  /**
   * Get selected members from the available org members list
   */
  getSelectedMembers(): SelectableOrgMember[] {
    return this.availableOrgMembers().filter(m => m.checked);
  }

  /**
   * Handle select all checkbox change
   */
  onAllCheckedChange(checked: boolean): void {
    const available = this.availableOrgMembers();
    available.forEach(m => (m.checked = checked));
    this.availableOrgMembers.set([...available]);
    this.refreshCheckedStatus();
  }

  /**
   * Refresh checkbox status (all checked / indeterminate)
   */
  refreshCheckedStatus(): void {
    const available = this.availableOrgMembers();
    if (available.length === 0) {
      this.allChecked = false;
      this.indeterminate = false;
      return;
    }
    const checkedCount = available.filter(m => m.checked).length;
    this.allChecked = checkedCount === available.length;
    this.indeterminate = checkedCount > 0 && checkedCount < available.length;
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

  /**
   * Add all selected members to the team
   */
  async addSelectedMembers(): Promise<void> {
    const selected = this.getSelectedMembers();
    if (selected.length === 0 || !this.team?.id) return;

    this.adding.set(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const member of selected) {
        try {
          await this.teamService.addMember(this.team.id, member.account_id, member.selectedRole || TeamRole.MEMBER);
          successCount++;
        } catch (error) {
          console.error(`[TeamMembersComponent] Failed to add member ${member.account_id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        this.msg.success(`成功添加 ${successCount} 位成員`);
      }
      if (failCount > 0) {
        this.msg.warning(`${failCount} 位成員添加失敗`);
      }

      // Refresh lists
      await this.loadMembers();
    } catch {
      this.msg.error('添加成員失敗');
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
