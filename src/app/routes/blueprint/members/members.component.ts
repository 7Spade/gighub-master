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

import { ChangeDetectionStrategy, Component, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlueprintFacade, BlueprintRole } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

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
          <button nz-button nzType="primary" (click)="refreshMembers()">
            <span nz-icon nzType="reload"></span>
            刷新
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="stats-section">
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
                      <span class="account-id">{{ member.account_id }}</span>
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
                    <nz-empty nzNotFoundContent="尚無成員，藍圖創建者將自動成為成員"></nz-empty>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </nz-spin>
      </nz-card>
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
        gap: 8px;
      }

      .account-id {
        font-family: monospace;
        font-size: 12px;
        color: #666;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintMembersComponent implements OnInit {
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  // Input from route param (using withComponentInputBinding)
  id = input.required<string>();
  members = signal<any[]>([]);
  loading = signal(false);

  // Computed statistics
  readonly internalMembersCount = () => this.members().filter(m => !m.is_external).length;
  readonly externalMembersCount = () => this.members().filter(m => m.is_external).length;
  readonly maintainersCount = () => this.members().filter(m => m.role === 'maintainer' || m.role === 'owner').length;

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.loading.set(true);
    try {
      const members = await this.blueprintFacade.getBlueprintMembers(this.id());
      this.members.set(members);
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

  async updateMemberRole(member: any): Promise<void> {
    try {
      await this.blueprintFacade.updateBlueprintMemberRole(member.id, member.role as BlueprintRole);
      this.msg.success('角色更新成功');
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to update member role:', error);
      this.msg.error('更新角色失敗');
      this.loadMembers(); // Reload to revert changes
    }
  }

  async removeMember(member: any): Promise<void> {
    try {
      await this.blueprintFacade.removeBlueprintMember(this.id(), member.account_id);
      this.msg.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'overview']);
  }
}
