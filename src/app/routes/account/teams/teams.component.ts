/**
 * Account Teams Component
 *
 * 團隊管理組件
 * Team management component
 *
 * Displays and manages teams for the current organization context.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TeamFacade, ContextType, Team } from '@core';
import { WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { CreateTeamComponent } from '../create-team/create-team.component';
import { TeamMembersComponent } from '../team-members/team-members.component';

@Component({
  selector: 'app-account-teams',
  template: `
    <div class="teams-container">
      <div class="page-header">
        <h2>團隊管理</h2>
      </div>

      @if (!isOrganizationContext()) {
        <nz-card [nzBordered]="false">
          <nz-empty nzNotFoundContent="請先切換到組織上下文以管理團隊"></nz-empty>
        </nz-card>
      } @else {
        <nz-card [nzBordered]="false">
          <div class="table-actions">
            <button nz-button nzType="primary" (click)="openCreateTeam()" [disabled]="!canCreateTeam()">
              <span nz-icon nzType="plus"></span>新建團隊
            </button>
          </div>

          <nz-table
            #teamTable
            [nzData]="teams()"
            [nzLoading]="loading()"
            [nzShowPagination]="teams().length > 10"
          >
            <thead>
              <tr>
                <th>團隊名稱</th>
                <th>描述</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (team of teamTable.data; track team.id) {
                <tr>
                  <td>{{ team.name }}</td>
                  <td>{{ team.description || '-' }}</td>
                  <td>{{ team.created_at | date:'yyyy-MM-dd' }}</td>
                  <td>
                    <a (click)="manageMembers(team)">成員管理</a>
                    <nz-divider nzType="vertical"></nz-divider>
                    <a
                      nz-popconfirm
                      nzPopconfirmTitle="確定要刪除此團隊嗎？"
                      (nzOnConfirm)="deleteTeam(team)"
                      nzOkText="確定"
                      nzCancelText="取消"
                    >刪除</a>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="4">
                    <nz-empty nzNotFoundContent="尚無團隊"></nz-empty>
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
    .teams-container {
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
    NzEmptyModule
  ]
})
export class AccountTeamsComponent implements OnInit {
  private readonly teamFacade = inject(TeamFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly modalService = inject(NzModalService);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  teams = signal<Team[]>([]);

  readonly isOrganizationContext = computed(() => {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  });

  readonly canCreateTeam = computed(() => {
    return this.isOrganizationContext() && !!this.workspaceContext.contextId();
  });

  constructor() {
    // Reload teams when context changes to organization
    effect(() => {
      const type = this.workspaceContext.contextType();
      const id = this.workspaceContext.contextId();
      if (type === ContextType.ORGANIZATION && id) {
        this.loadTeams();
      }
    });
  }

  ngOnInit(): void {
    if (this.isOrganizationContext()) {
      this.loadTeams();
    }
  }

  async loadTeams(): Promise<void> {
    const orgId = this.workspaceContext.contextId();
    if (!orgId) return;

    this.loading.set(true);
    try {
      const teams = await this.teamFacade.findByOrganization(orgId);
      this.teams.set(teams);
    } catch (error) {
      console.error('[AccountTeamsComponent] Failed to load teams:', error);
      this.msg.error('載入團隊列表失敗');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateTeam(): void {
    const modalRef = this.modalService.create({
      nzContent: CreateTeamComponent,
      nzFooter: null,
      nzWidth: 520,
      nzClosable: true,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((result: Team | undefined) => {
      if (result) {
        this.loadTeams();
        this.workspaceContext.reload();
      }
    });
  }

  manageMembers(team: Team): void {
    const orgId = this.workspaceContext.contextId();
    if (!orgId) {
      this.msg.error('無法確定組織 ID');
      return;
    }

    this.modalService.create({
      nzContent: TeamMembersComponent,
      nzFooter: null,
      nzWidth: 640,
      nzClosable: true,
      nzMaskClosable: false,
      nzData: {
        team,
        organizationId: orgId
      }
    });
  }

  async deleteTeam(team: Team): Promise<void> {
    try {
      await this.teamFacade.deleteTeam(team.id);
      this.msg.success('團隊刪除成功');
      this.loadTeams();
      this.workspaceContext.reload();
    } catch (error) {
      console.error('[AccountTeamsComponent] Failed to delete team:', error);
      this.msg.error('刪除團隊失敗');
    }
  }
}
