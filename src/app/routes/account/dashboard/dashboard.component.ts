/**
 * Account Dashboard Component
 *
 * 帳戶儀表板組件
 * Account dashboard component
 *
 * Displays statistics and overview based on context type (user/organization/team).
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextType } from '@core';
import { WorkspaceContextService } from '@shared';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface DashboardStats {
  blueprintCount: number;
  organizationCount?: number;
  teamCount?: number;
  memberCount?: number;
}

@Component({
  selector: 'app-account-dashboard',
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h2>
          <span nz-icon [nzType]="contextIcon()" nzTheme="outline"></span>
          {{ contextLabel() }} - 儀表板
        </h2>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <div nz-row [nzGutter]="16">
          @switch (contextType()) {
            @case ('user') {
              <!-- 用戶儀表板 -->
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="我的藍圖" [nzValue]="userStats().blueprintCount" [nzPrefix]="blueprintIcon">
                    <ng-template #blueprintIcon>
                      <span nz-icon nzType="project" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="參與組織" [nzValue]="userStats().organizationCount" [nzPrefix]="orgIcon">
                    <ng-template #orgIcon>
                      <span nz-icon nzType="team" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="參與團隊" [nzValue]="userStats().teamCount" [nzPrefix]="teamIcon">
                    <ng-template #teamIcon>
                      <span nz-icon nzType="usergroup-add" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
            }
            @case ('organization') {
              <!-- 組織儀表板 -->
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="組織藍圖" [nzValue]="orgStats().blueprintCount" [nzPrefix]="blueprintIcon2">
                    <ng-template #blueprintIcon2>
                      <span nz-icon nzType="project" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="成員數量" [nzValue]="orgStats().memberCount" [nzPrefix]="memberIcon">
                    <ng-template #memberIcon>
                      <span nz-icon nzType="user" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="團隊數量" [nzValue]="orgStats().teamCount" [nzPrefix]="teamIcon2">
                    <ng-template #teamIcon2>
                      <span nz-icon nzType="usergroup-add" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
            }
            @case ('team') {
              <!-- 團隊儀表板 -->
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="團隊藍圖" [nzValue]="teamStats().blueprintCount" [nzPrefix]="blueprintIcon3">
                    <ng-template #blueprintIcon3>
                      <span nz-icon nzType="project" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col nzSpan="6">
                <nz-card [nzBordered]="false">
                  <nz-statistic nzTitle="團隊成員" [nzValue]="teamStats().memberCount" [nzPrefix]="memberIcon2">
                    <ng-template #memberIcon2>
                      <span nz-icon nzType="user" nzTheme="outline"></span>
                    </ng-template>
                  </nz-statistic>
                </nz-card>
              </div>
            }
            @default {
              <div nz-col nzSpan="24">
                <nz-empty nzNotFoundContent="請選擇上下文"></nz-empty>
              </div>
            }
          }
        </div>
      </nz-spin>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    nz-card {
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzSpinModule,
    NzEmptyModule,
    NzIconModule
  ]
})
export class AccountDashboardComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);

  readonly contextType = this.workspaceContext.contextType;
  readonly contextLabel = this.workspaceContext.contextLabel;
  readonly contextIcon = this.workspaceContext.contextIcon;

  loading = signal(false);
  userStats = signal<DashboardStats>({ blueprintCount: 0, organizationCount: 0, teamCount: 0 });
  orgStats = signal<DashboardStats>({ blueprintCount: 0, memberCount: 0, teamCount: 0 });
  teamStats = signal<DashboardStats>({ blueprintCount: 0, memberCount: 0 });

  constructor() {
    // Update stats when context changes
    effect(() => {
      const type = this.contextType();
      const id = this.workspaceContext.contextId();
      if (type && id) {
        this.loadStats();
      }
    });
  }

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading.set(true);

    // Load stats based on context type
    const organizations = this.workspaceContext.organizations();
    const teams = this.workspaceContext.teams();

    // Set user stats
    this.userStats.set({
      blueprintCount: 0, // Would need to query blueprints
      organizationCount: organizations.length,
      teamCount: teams.length
    });

    // Set organization stats
    const currentOrg = this.workspaceContext.currentOrganization();
    if (currentOrg) {
      const orgTeams = teams.filter(t => t.organization_id === currentOrg.id);
      this.orgStats.set({
        blueprintCount: 0, // Would need to query blueprints
        memberCount: currentOrg.memberCount || 0,
        teamCount: orgTeams.length
      });
    }

    // Set team stats
    this.teamStats.set({
      blueprintCount: 0,
      memberCount: 0
    });

    this.loading.set(false);
  }
}
