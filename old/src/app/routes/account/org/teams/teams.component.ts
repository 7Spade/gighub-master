import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamFacade, AuthContextService, TeamMemberRepository } from '@core';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS, TeamBusinessModel } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

import { AddTeamMemberComponent } from '../../add-team-member/add-team-member.component';
import { CreateTeamComponent } from '../../create-team/create-team.component';
import { DeleteTeamComponent } from '../../delete-team/delete-team.component';
import { UpdateTeamComponent } from '../../update-team/update-team.component';

@Component({
  selector: 'app-org-teams',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header />
    <nz-card [nzTitle]="'團隊管理'" [nzExtra]="extraTpl">
      @if (loading()) {
        <nz-spin />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" />
      } @else if (teams().length === 0) {
        <nz-empty nzNotFoundContent="暫無團隊" />
      } @else {
        <nz-table [nzData]="teams()" [nzPageSize]="10">
          <thead>
            <tr>
              <th>團隊名稱</th>
              <th>描述</th>
              <th>成員數</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (team of teams(); track team['id']) {
              <tr>
                <td>{{ team['name'] }}</td>
                <td>{{ team['description'] || '-' }}</td>
                <td>{{ team['memberCount'] || 0 }}</td>
                <td>
                  <button nz-button nzType="link" nzSize="small" (click)="addTeamMember(team)"> 添加成員 </button>
                  <nz-divider nzType="vertical"></nz-divider>
                  <a [routerLink]="['/account/team', team['id'], 'members']" nz-button nzType="link" nzSize="small"> 成員列表 </a>
                  <nz-divider nzType="vertical"></nz-divider>
                  <button nz-button nzType="link" nzSize="small" (click)="editTeam(team)"> 編輯 </button>
                  <nz-divider nzType="vertical"></nz-divider>
                  <button nz-button nzType="link" nzDanger nzSize="small" (click)="deleteTeam(team)"> 刪除 </button>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-card>

    <ng-template #extraTpl>
      <button nz-button nzType="primary" (click)="createTeam()">
        <i nz-icon nzType="plus"></i>
        建立團隊
      </button>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgTeamsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamFacade = inject(TeamFacade);
  private readonly teamMemberRepo = inject(TeamMemberRepository);
  private readonly modal = inject(ModalHelper);
  private readonly msg = inject(NzMessageService);
  private readonly authContext = inject(AuthContextService);

  organizationId = signal<string | null>(null);
  teams = signal<any[]>([]); // 改為 any[] 以包含 memberCount
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orgId = params['organizationId'];
      if (orgId) {
        this.organizationId.set(orgId);
        this.loadTeams(orgId);
      }
    });
  }

  async loadTeams(organizationId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const teams = await this.teamFacade.findByOrganization(organizationId);

      // ✅ 查詢每個團隊的成員數
      const teamsWithMemberCount = await Promise.all(
        teams.map(async team => {
          const members = await firstValueFrom(this.teamMemberRepo.findByTeam(team['id'] as string));
          return {
            ...team,
            memberCount: members.length
          };
        })
      );

      this.teams.set(teamsWithMemberCount);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : '載入團隊失敗');
    } finally {
      this.loading.set(false);
    }
  }

  createTeam(): void {
    this.modal.create(CreateTeamComponent, {}, { size: 'md' }).subscribe(result => {
      if (result && this.organizationId()) {
        this.loadTeams(this.organizationId()!);
      }
    });
  }

  editTeam(team: TeamBusinessModel): void {
    this.modal.create(UpdateTeamComponent, { teamParam: team }, { size: 'md' }).subscribe(result => {
      if (result && this.organizationId()) {
        this.loadTeams(this.organizationId()!);
      }
    });
  }

  deleteTeam(team: TeamBusinessModel): void {
    this.modal.create(DeleteTeamComponent, { teamParam: team }, { size: 'md' }).subscribe(result => {
      if (result && this.organizationId()) {
        this.loadTeams(this.organizationId()!);
      }
    });
  }

  addTeamMember(team: TeamBusinessModel): void {
    this.modal
      .create(
        AddTeamMemberComponent,
        {
          teamId: team['id'],
          organizationId: this.organizationId()
        },
        { size: 'md' }
      )
      .subscribe(result => {
        if (result?.success) {
          this.msg.success('成員添加成功！');
        }
      });
  }
}
