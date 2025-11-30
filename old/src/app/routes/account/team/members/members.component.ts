import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TeamMemberRepository, TeamRepository } from '@core';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

import { AddTeamMemberComponent } from '../../add-team-member/add-team-member.component';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, FormsModule],
  template: `
    <page-header />
    <nz-card [nzTitle]="'團隊成員'" [nzExtra]="extraTpl">
      @if (loading()) {
        <nz-spin />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" />
      } @else if (members().length === 0) {
        <nz-empty nzNotFoundContent="暫無成員" />
      } @else {
        <nz-table [nzData]="members()" [nzPageSize]="10">
          <thead>
            <tr>
              <th>成員名稱</th>
              <th>角色</th>
              <th>加入時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (member of members(); track member.id) {
              <tr>
                <td>{{ member.account_id }}</td>
                <td>
                  <nz-select [ngModel]="member.role" (ngModelChange)="updateMemberRole(member, $event)" style="width: 120px">
                    <nz-option nzValue="leader" nzLabel="隊長"></nz-option>
                    <nz-option nzValue="member" nzLabel="成員"></nz-option>
                  </nz-select>
                </td>
                <td>{{ member.joined_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td>
                  @if (member.role !== 'leader') {
                    <button nz-button nzType="link" nzDanger nzSize="small" (click)="removeMember(member)"> 移除 </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-card>

    <ng-template #extraTpl>
      <button nz-button nzType="primary" (click)="addMember()">
        <i nz-icon nzType="plus"></i>
        添加成員
      </button>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamMembersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly memberRepo = inject(TeamMemberRepository);
  private readonly teamRepo = inject(TeamRepository);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalHelper);

  teamId = signal<string | null>(null);
  organizationId = signal<string | null>(null);
  members = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(async params => {
      const tId = params['teamId'];
      if (tId) {
        this.teamId.set(tId);
        // 獲取團隊所屬組織
        const team = await firstValueFrom(this.teamRepo.findById(tId));
        if (team) {
          this.organizationId.set((team as any).organization_id);
        }
        this.loadMembers(tId);
      }
    });
  }

  async loadMembers(teamId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const members = await firstValueFrom(this.memberRepo.findByTeam(teamId));
      this.members.set(members);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : '載入成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  addMember(): void {
    if (!this.teamId() || !this.organizationId()) {
      this.msg.error('缺少必要參數');
      return;
    }

    this.modal
      .create(
        AddTeamMemberComponent,
        {
          teamId: this.teamId(),
          organizationId: this.organizationId()
        },
        { size: 'md' }
      )
      .subscribe(result => {
        if (result?.success && this.teamId()) {
          this.loadMembers(this.teamId()!);
        }
      });
  }

  async updateMemberRole(member: any, newRole: string): Promise<void> {
    try {
      await firstValueFrom(this.memberRepo.update(member.id, { role: newRole } as any));
      this.msg.success('角色更新成功！');
      await this.loadMembers(this.teamId()!);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '更新角色失敗');
    }
  }

  async removeMember(member: any): Promise<void> {
    try {
      await firstValueFrom(this.memberRepo.delete(member.id));
      this.msg.success('成員已移除！');
      await this.loadMembers(this.teamId()!);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '移除成員失敗');
    }
  }

  getRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      leader: '隊長',
      member: '成員'
    };
    return roleMap[role] || role;
  }
}
