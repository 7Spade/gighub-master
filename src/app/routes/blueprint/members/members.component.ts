/**
 * Blueprint Members Component
 *
 * 藍圖成員管理組件
 * Blueprint members management component
 *
 * Displays and manages blueprint members.
 *
 * @module routes/blueprint
 */

import { ChangeDetectionStrategy, Component, inject, signal, input, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BlueprintFacade, BlueprintRole } from '@core';
import { AccountService, SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

/** Extended member type with account details */
interface MemberWithAccount {
  id: string;
  blueprint_id: string;
  account_id: string;
  role: string;
  is_external: boolean;
  created_at: string;
  accountName?: string;
  accountEmail?: string;
}

@Component({
  selector: 'app-blueprint-members',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button nz-button nzType="text" (click)="goBack()" class="back-button">
            <span nz-icon nzType="arrow-left"></span>
          </button>
          <div class="title-section">
            <h3>成員管理</h3>
            <span class="subtitle">Member Management - 管理藍圖成員與權限</span>
          </div>
        </div>
        <div class="header-actions">
          <button nz-button nzType="default" (click)="refreshMembers()">
            <span nz-icon nzType="reload"></span>
            刷新
          </button>
          <button nz-button nzType="primary" (click)="openInviteDrawer()">
            <span nz-icon nzType="user-add"></span>
            邀請成員
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="[16, 16]" class="stats-section">
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="總成員數" [nzValue]="members().length"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="內部成員" [nzValue]="internalMembersCount()" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="外部成員" [nzValue]="externalMembersCount()" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="維護者" [nzValue]="maintainersCount()" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Members Table -->
      <nz-card [nzBordered]="false" class="table-card">
        <nz-spin [nzSpinning]="loading()">
          <nz-table #memberTable [nzData]="members()" [nzShowPagination]="members().length > 10" [nzPageSize]="10">
            <thead>
              <tr>
                <th>成員</th>
                <th>角色</th>
                <th>類型</th>
                <th>加入時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (member of memberTable.data; track member.id) {
                <tr>
                  <td>
                    <div class="member-info">
                      <nz-avatar [nzSize]="32" nzIcon="user"></nz-avatar>
                      <div class="member-details">
                        <span class="member-name">{{ member.accountName || '未知用戶' }}</span>
                        <span class="member-id">ID: {{ member.account_id | slice: 0 : 8 }}...</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <nz-select [(ngModel)]="member.role" (ngModelChange)="updateMemberRole(member)" style="width: 120px;">
                      <nz-option nzValue="viewer" nzLabel="檢視者"></nz-option>
                      <nz-option nzValue="contributor" nzLabel="貢獻者"></nz-option>
                      <nz-option nzValue="maintainer" nzLabel="維護者"></nz-option>
                    </nz-select>
                  </td>
                  <td>
                    @if (member.is_external) {
                      <nz-tag nzColor="orange">外部</nz-tag>
                    } @else {
                      <nz-tag nzColor="blue">內部</nz-tag>
                    }
                  </td>
                  <td>{{ member.created_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                  <td>
                    <button
                      nz-button
                      nzType="link"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="確定要移除此成員嗎？"
                      (nzOnConfirm)="removeMember(member)"
                    >
                      <span nz-icon nzType="delete"></span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <nz-empty nzNotFoundContent="尚無成員，點擊「邀請成員」添加團隊成員"></nz-empty>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </nz-spin>
      </nz-card>

      <!-- Invite Member Drawer -->
      <nz-drawer [nzVisible]="drawerVisible()" nzTitle="邀請成員" [nzWidth]="400" (nzOnClose)="closeInviteDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="inviteForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired nzFor="account_id">帳戶 ID</nz-form-label>
              <nz-form-control nzErrorTip="請輸入有效的帳戶 ID">
                <input nz-input formControlName="account_id" id="account_id" placeholder="請輸入要邀請的帳戶 ID" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="role">角色</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="role" id="role" style="width: 100%">
                  <nz-option nzValue="viewer" nzLabel="檢視者"></nz-option>
                  <nz-option nzValue="contributor" nzLabel="貢獻者"></nz-option>
                  <nz-option nzValue="maintainer" nzLabel="維護者"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="is_external">成員類型</nz-form-label>
              <nz-form-control>
                <label nz-checkbox formControlName="is_external">外部成員</label>
              </nz-form-control>
            </nz-form-item>

            <div class="drawer-footer">
              <button nz-button nzType="default" (click)="closeInviteDrawer()">取消</button>
              <button nz-button nzType="primary" [nzLoading]="inviting()" [disabled]="inviteForm.invalid" (click)="inviteMember()">
                邀請
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 24px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .back-button {
        padding: 4px 8px;
        color: #666;
      }

      .back-button:hover {
        color: #1890ff;
      }

      .title-section h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .subtitle {
        color: #666;
        font-size: 14px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      .stats-section {
        margin-bottom: 16px;
      }

      .stat-card {
        text-align: center;
      }

      .table-card {
        margin-bottom: 24px;
      }

      .member-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .member-details {
        display: flex;
        flex-direction: column;
      }

      .member-name {
        font-weight: 500;
        font-size: 14px;
      }

      .member-id {
        font-family: monospace;
        font-size: 11px;
        color: #999;
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #f0f0f0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintMembersComponent implements OnInit {
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly fb = inject(FormBuilder);

  // Input from route param (using withComponentInputBinding)
  id = input.required<string>();
  members = signal<MemberWithAccount[]>([]);
  loading = signal(false);
  drawerVisible = signal(false);
  inviting = signal(false);

  // Invite form
  inviteForm: FormGroup = this.fb.group({
    account_id: ['', [Validators.required]],
    role: ['viewer', [Validators.required]],
    is_external: [false]
  });

  // Computed statistics
  readonly internalMembersCount = computed(() => this.members().filter(m => !m.is_external).length);
  readonly externalMembersCount = computed(() => this.members().filter(m => m.is_external).length);
  readonly maintainersCount = computed(() => this.members().filter(m => m.role === 'maintainer' || m.role === 'owner').length);

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.loading.set(true);
    try {
      const members = await this.blueprintFacade.getBlueprintMembers(this.id());

      // Fetch account details for each member
      const membersWithAccounts: MemberWithAccount[] = await Promise.all(
        members.map(async (member: MemberWithAccount) => {
          try {
            const account = await this.accountService.findById(member.account_id);
            return {
              ...member,
              accountName: account?.name || account?.email || '未知用戶',
              accountEmail: account?.email ?? undefined
            };
          } catch {
            return {
              ...member,
              accountName: '未知用戶',
              accountEmail: undefined
            };
          }
        })
      );

      this.members.set(membersWithAccounts);
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to load members:', error);
      this.msg.error('載入成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async refreshMembers(): Promise<void> {
    await this.loadMembers();
    this.msg.success('成員列表已刷新');
  }

  async updateMemberRole(member: MemberWithAccount): Promise<void> {
    try {
      await this.blueprintFacade.updateBlueprintMemberRole(member.id, member.role as BlueprintRole);
      this.msg.success('角色更新成功');
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to update member role:', error);
      this.msg.error('更新角色失敗');
      this.loadMembers(); // Reload to revert changes
    }
  }

  async removeMember(member: MemberWithAccount): Promise<void> {
    try {
      await this.blueprintFacade.removeBlueprintMember(this.id(), member.account_id);
      this.msg.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }

  openInviteDrawer(): void {
    this.inviteForm.reset({
      account_id: '',
      role: 'viewer',
      is_external: false
    });
    this.drawerVisible.set(true);
  }

  closeInviteDrawer(): void {
    this.drawerVisible.set(false);
  }

  async inviteMember(): Promise<void> {
    if (this.inviteForm.invalid) return;

    this.inviting.set(true);
    try {
      const { account_id, role, is_external } = this.inviteForm.value;
      await this.blueprintFacade.addBlueprintMember(this.id(), account_id, role as BlueprintRole, is_external);
      this.msg.success('成員邀請成功');
      this.closeInviteDrawer();
      await this.loadMembers();
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to invite member:', error);
      this.msg.error('邀請成員失敗');
    } finally {
      this.inviting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'overview']);
  }
}
