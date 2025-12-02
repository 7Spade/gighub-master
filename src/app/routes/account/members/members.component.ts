/**
 * Account Members Component
 *
 * 成員管理組件
 * Member management component
 *
 * Displays and manages members for the current organization context.
 *
 * @module routes/account
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextType, OrganizationRole } from '@core';
import { WorkspaceContextService, OrganizationMemberService, OrganizationMemberWithAccount } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-account-members',
  template: `
    <div class="members-container">
      <div class="page-header">
        <h2>成員管理</h2>
      </div>

      @if (!isOrganizationContext()) {
        <nz-card [nzBordered]="false">
          <nz-empty nzNotFoundContent="請先切換到組織上下文以管理成員"></nz-empty>
        </nz-card>
      } @else {
        <nz-card [nzBordered]="false">
          <div class="table-actions">
            <button nz-button nzType="primary" (click)="openInviteModal()"> <span nz-icon nzType="user-add"></span>邀請成員 </button>
          </div>

          <nz-table #memberTable [nzData]="members()" [nzLoading]="loading()" [nzShowPagination]="members().length > 10">
            <thead>
              <tr>
                <th>成員</th>
                <th>Email</th>
                <th>角色</th>
                <th>加入時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (member of memberTable.data; track member.id) {
                <tr>
                  <td>{{ member.account?.name || member.account_id }}</td>
                  <td>{{ member.account?.email || '-' }}</td>
                  <td>
                    <nz-tag [nzColor]="getRoleColor(member.role)">{{ getRoleLabel(member.role) }}</nz-tag>
                  </td>
                  <td>{{ member.created_at | date: 'yyyy-MM-dd' }}</td>
                  <td>
                    @if (member.role !== 'owner') {
                      <a (click)="changeRole(member)">變更角色</a>
                      <nz-divider nzType="vertical"></nz-divider>
                      <a
                        nz-popconfirm
                        nzPopconfirmTitle="確定要移除此成員嗎？"
                        (nzOnConfirm)="removeMember(member)"
                        nzOkText="確定"
                        nzCancelText="取消"
                        >移除</a
                      >
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <nz-empty nzNotFoundContent="尚無成員"></nz-empty>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </nz-card>
      }
    </div>

    <!-- Invite Member Modal -->
    <nz-modal
      [(nzVisible)]="inviteModalVisible"
      nzTitle="邀請成員"
      [nzOkLoading]="inviting()"
      (nzOnOk)="confirmInvite()"
      (nzOnCancel)="cancelInvite()"
    >
      <ng-container *nzModalContent>
        <nz-form-item>
          <nz-form-label>Email</nz-form-label>
          <nz-form-control>
            <input nz-input [(ngModel)]="inviteEmail" placeholder="請輸入成員 Email" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>角色</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="inviteRole" nzPlaceHolder="選擇角色">
              <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
              <nz-option nzValue="member" nzLabel="成員"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
    </nz-modal>

    <!-- Change Role Modal -->
    <nz-modal
      [(nzVisible)]="changeRoleModalVisible"
      nzTitle="變更角色"
      [nzOkLoading]="changingRole()"
      (nzOnOk)="confirmChangeRole()"
      (nzOnCancel)="cancelChangeRole()"
    >
      <ng-container *nzModalContent>
        <p>變更 {{ selectedMember?.account?.name || selectedMember?.account_id }} 的角色</p>
        <nz-form-item>
          <nz-form-label>新角色</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="newRole" nzPlaceHolder="選擇新角色">
              <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
              <nz-option nzValue="member" nzLabel="成員"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .members-container {
        padding: 24px;
      }
      .page-header {
        margin-bottom: 24px;
      }
      .page-header h2 {
        margin: 0;
      }
      .table-actions {
        margin-bottom: 16px;
      }
      .text-muted {
        color: #999;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule
  ]
})
export class AccountMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly organizationMemberService = inject(OrganizationMemberService);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  members = signal<OrganizationMemberWithAccount[]>([]);

  // Invite modal state
  inviteModalVisible = false;
  inviteEmail = '';
  inviteRole: OrganizationRole = OrganizationRole.MEMBER;
  inviting = signal(false);

  // Change role modal state
  changeRoleModalVisible = false;
  selectedMember: OrganizationMemberWithAccount | null = null;
  newRole: OrganizationRole = OrganizationRole.MEMBER;
  changingRole = signal(false);

  readonly isOrganizationContext = computed(() => {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  });

  constructor() {
    // Reload members when context changes to organization
    effect(() => {
      const type = this.workspaceContext.contextType();
      const id = this.workspaceContext.contextId();
      if (type === ContextType.ORGANIZATION && id) {
        this.loadMembers();
      }
    });
  }

  ngOnInit(): void {
    if (this.isOrganizationContext()) {
      this.loadMembers();
    }
  }

  async loadMembers(): Promise<void> {
    const orgId = this.workspaceContext.contextId();
    if (!orgId) return;

    this.loading.set(true);
    try {
      const members = await this.organizationMemberService.findByOrganization(orgId);
      this.members.set(members);
    } catch (error) {
      console.error('[AccountMembersComponent] Failed to load members:', error);
      this.msg.error('載入成員列表失敗');
    } finally {
      this.loading.set(false);
    }
  }

  getRoleColor(role: OrganizationRole | string): string {
    const colorMap: Record<string, string> = {
      [OrganizationRole.OWNER]: 'gold',
      [OrganizationRole.ADMIN]: 'blue',
      [OrganizationRole.MEMBER]: 'default'
    };
    return colorMap[role] || 'default';
  }

  getRoleLabel(role: OrganizationRole | string): string {
    const labelMap: Record<string, string> = {
      [OrganizationRole.OWNER]: '擁有者',
      [OrganizationRole.ADMIN]: '管理員',
      [OrganizationRole.MEMBER]: '成員'
    };
    return labelMap[role] || role;
  }

  // Invite member
  openInviteModal(): void {
    this.inviteEmail = '';
    this.inviteRole = OrganizationRole.MEMBER;
    this.inviteModalVisible = true;
  }

  cancelInvite(): void {
    this.inviteModalVisible = false;
  }

  async confirmInvite(): Promise<void> {
    if (!this.inviteEmail.trim()) {
      this.msg.warning('請輸入 Email');
      return;
    }

    const orgId = this.workspaceContext.contextId();
    if (!orgId) {
      this.msg.error('無法確定組織 ID');
      return;
    }

    this.inviting.set(true);
    try {
      await this.organizationMemberService.addMember({
        organizationId: orgId,
        email: this.inviteEmail.trim(),
        role: this.inviteRole
      });
      this.msg.success('成員邀請成功');
      this.inviteModalVisible = false;
      this.loadMembers();
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '邀請成員失敗');
    } finally {
      this.inviting.set(false);
    }
  }

  // Change role
  changeRole(member: OrganizationMemberWithAccount): void {
    this.selectedMember = member;
    this.newRole = member.role === OrganizationRole.ADMIN ? OrganizationRole.MEMBER : OrganizationRole.ADMIN;
    this.changeRoleModalVisible = true;
  }

  cancelChangeRole(): void {
    this.changeRoleModalVisible = false;
    this.selectedMember = null;
  }

  async confirmChangeRole(): Promise<void> {
    if (!this.selectedMember) return;

    this.changingRole.set(true);
    try {
      await this.organizationMemberService.updateRole(this.selectedMember.id, this.newRole);
      this.msg.success('角色變更成功');
      this.changeRoleModalVisible = false;
      this.selectedMember = null;
      this.loadMembers();
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '變更角色失敗');
    } finally {
      this.changingRole.set(false);
    }
  }

  // Remove member
  async removeMember(member: OrganizationMemberWithAccount): Promise<void> {
    try {
      await this.organizationMemberService.removeMember(member.id);
      this.msg.success('成員移除成功');
      this.loadMembers();
    } catch (error) {
      console.error('[AccountMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }
}
