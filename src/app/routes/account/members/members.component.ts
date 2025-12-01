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

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ContextType, OrganizationRole, OrganizationMember } from '@core';
import { WorkspaceContextService, OrganizationMemberDetail } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

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
            <button nz-button nzType="primary" (click)="inviteMember()">
              <span nz-icon nzType="user-add"></span>邀請成員
            </button>
          </div>

          <nz-table
            #memberTable
            [nzData]="members()"
            [nzLoading]="loading()"
            [nzShowPagination]="members().length > 10"
          >
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
                  <td>{{ member.created_at | date:'yyyy-MM-dd' }}</td>
                  <td>
                    <a (click)="changeRole(member)">變更角色</a>
                    @if (member.role !== 'owner') {
                      <nz-divider nzType="vertical"></nz-divider>
                      <a
                        nz-popconfirm
                        nzPopconfirmTitle="確定要移除此成員嗎？"
                        (nzOnConfirm)="removeMember(member)"
                        nzOkText="確定"
                        nzCancelText="取消"
                      >移除</a>
                    }
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="4">
                    <nz-empty nzNotFoundContent="尚無成員"></nz-empty>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </nz-card>
      }
    </div>
  `,
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzEmptyModule
  ]
})
export class AccountMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  members = signal<OrganizationMemberDetail[]>([]);

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
      // For now, display placeholder data
      // In production, this would fetch from OrganizationMemberService
      this.members.set([]);
      this.msg.info('成員列表功能開發中');
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

  inviteMember(): void {
    this.msg.info('邀請成員功能開發中');
  }

  changeRole(member: OrganizationMemberDetail): void {
    this.msg.info(`變更角色功能開發中：${member.account?.name || member.account_id}`);
  }

  async removeMember(member: OrganizationMemberDetail): Promise<void> {
    this.msg.info(`移除成員功能開發中：${member.account?.name || member.account_id}`);
  }
}
