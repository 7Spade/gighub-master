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

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlueprintFacade, BlueprintRole } from '@core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-blueprint-members',
  template: `
    <div class="members-container">
      <div class="header">
        <h3>成員管理</h3>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-table #memberTable [nzData]="members()" [nzShowPagination]="members().length > 10" [nzPageSize]="10">
          <thead>
            <tr>
              <th>成員</th>
              <th>角色</th>
              <th>外部協作者</th>
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
            }
          </tbody>
        </nz-table>
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .members-container {
        padding: 24px;
      }
      .header {
        margin-bottom: 16px;
      }
      .header h3 {
        margin: 0;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzAvatarModule,
    NzPopconfirmModule,
    NzSpinModule,
    NzSelectModule
  ]
})
export class BlueprintMembersComponent implements OnInit {
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly msg = inject(NzMessageService);

  blueprintId = input.required<string>();
  members = signal<any[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.loading.set(true);
    try {
      const members = await this.blueprintFacade.getBlueprintMembers(this.blueprintId());
      this.members.set(members);
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to load members:', error);
      this.msg.error('載入成員失敗');
    } finally {
      this.loading.set(false);
    }
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
      await this.blueprintFacade.removeBlueprintMember(this.blueprintId(), member.account_id);
      this.msg.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      console.error('[BlueprintMembersComponent] Failed to remove member:', error);
      this.msg.error('移除成員失敗');
    }
  }
}
