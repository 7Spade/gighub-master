/**
 * Blueprint Overview Component
 *
 * 藍圖概覽組件
 * Blueprint overview component
 *
 * Displays the overview/detail page for a specific blueprint.
 *
 * @module routes/blueprint
 */

import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlueprintFacade, BlueprintFinancialSummary, Contract, FinancialFacade } from '@core';
import { BlueprintBusinessModel, BlueprintMemberDetail, WorkspaceContextService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-blueprint-overview',
  template: `
    <div class="blueprint-overview-container">
      <nz-spin [nzSpinning]="loading()">
        @if (error()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error() || '未知錯誤'">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回列表</button>
            </div>
          </nz-result>
        } @else if (blueprint()) {
          <!-- Header Section -->
          <div class="blueprint-header">
            <div class="header-left">
              @if (blueprint()!.cover_url) {
                <nz-avatar [nzSize]="64" [nzSrc]="blueprint()!.cover_url!" nzShape="square"></nz-avatar>
              } @else {
                <nz-avatar [nzSize]="64" nzIcon="project" nzShape="square"></nz-avatar>
              }
              <div class="header-info">
                <h1 class="blueprint-name">{{ blueprint()!.name }}</h1>
                <div class="blueprint-tags">
                  @if (blueprint()!.is_public) {
                    <nz-tag nzColor="green">公開</nz-tag>
                  } @else {
                    <nz-tag>私有</nz-tag>
                  }
                  <nz-tag [nzColor]="getStatusColor(blueprint()!.status)">{{ getStatusLabel(blueprint()!.status) }}</nz-tag>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button nz-button nzType="default" (click)="goToTasks()"> <span nz-icon nzType="ordered-list"></span>任務管理 </button>
              <button nz-button nzType="default" (click)="goToMembers()"> <span nz-icon nzType="team"></span>成員管理 </button>
              <button nz-button nzType="primary" (click)="editBlueprint()"> <span nz-icon nzType="edit"></span>編輯 </button>
            </div>
          </div>

          <!-- Description -->
          @if (blueprint()!.description) {
            <nz-card [nzBordered]="false" class="description-card">
              <p class="description">{{ blueprint()!.description }}</p>
            </nz-card>
          }

          <!-- Statistics -->
          <div nz-row [nzGutter]="16" class="stats-row">
            <div nz-col [nzSpan]="6">
              <nz-card [nzBordered]="false">
                <nz-statistic nzTitle="啟用模組" [nzValue]="enabledModulesCount()"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-card [nzBordered]="false">
                <nz-statistic nzTitle="成員數" [nzValue]="membersCount()"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-card [nzBordered]="false">
                <nz-statistic nzTitle="建立時間" [nzValue]="createdDate()" [nzValueStyle]="{ 'font-size': '14px' }"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-card [nzBordered]="false">
                <nz-statistic nzTitle="更新時間" [nzValue]="updatedDate()" [nzValueStyle]="{ 'font-size': '14px' }"></nz-statistic>
              </nz-card>
            </div>
          </div>

          <!-- Financial Summary Cards -->
          @if (financialSummary()) {
            <div nz-row [nzGutter]="16" class="financial-stats-row">
              <div nz-col [nzSpan]="6">
                <nz-card [nzBordered]="false" class="financial-card">
                  <nz-statistic
                    nzTitle="總預算"
                    [nzValue]="financialSummary()!.total_budget"
                    [nzPrefix]="'$'"
                    [nzValueStyle]="{ color: '#1890ff' }"
                  >
                  </nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzSpan]="6">
                <nz-card [nzBordered]="false" class="financial-card">
                  <nz-statistic
                    nzTitle="已支出"
                    [nzValue]="financialSummary()!.total_expenses"
                    [nzPrefix]="'$'"
                    [nzValueStyle]="{ color: '#faad14' }"
                  >
                  </nz-statistic>
                  <div class="progress-bar">
                    <nz-progress [nzPercent]="expenseRate()" nzSize="small" [nzStatus]="expenseRate() > 90 ? 'exception' : 'active'">
                    </nz-progress>
                  </div>
                </nz-card>
              </div>
              <div nz-col [nzSpan]="6">
                <nz-card [nzBordered]="false" class="financial-card">
                  <nz-statistic
                    nzTitle="已付款"
                    [nzValue]="financialSummary()!.total_paid"
                    [nzPrefix]="'$'"
                    [nzValueStyle]="{ color: '#52c41a' }"
                  >
                  </nz-statistic>
                  <div class="progress-bar">
                    <nz-progress [nzPercent]="paymentRate()" nzSize="small" nzStatus="success"> </nz-progress>
                  </div>
                </nz-card>
              </div>
              <div nz-col [nzSpan]="6">
                <nz-card [nzBordered]="false" class="financial-card">
                  <nz-statistic
                    nzTitle="剩餘預算"
                    [nzValue]="financialSummary()!.remaining_budget"
                    [nzPrefix]="'$'"
                    [nzValueStyle]="{ color: financialSummary()!.remaining_budget >= 0 ? '#52c41a' : '#ff4d4f' }"
                  >
                  </nz-statistic>
                </nz-card>
              </div>
            </div>
          }

          <!-- Tabs for different sections -->
          <nz-tabset class="content-tabs">
            <nz-tab nzTitle="概覽">
              <nz-card [nzBordered]="false">
                <nz-descriptions nzTitle="藍圖詳情" nzBordered [nzColumn]="2">
                  <nz-descriptions-item nzTitle="名稱">{{ blueprint()!.name }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="識別碼">{{ blueprint()!.slug }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="狀態">{{ getStatusLabel(blueprint()!.status) }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="可見性">{{ blueprint()!.is_public ? '公開' : '私有' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="啟用模組" [nzSpan]="2">
                    @for (module of blueprint()!.enabled_modules || []; track module) {
                      <nz-tag>{{ getModuleLabel(module) }}</nz-tag>
                    }
                    @if (!(blueprint()!.enabled_modules || []).length) {
                      <span class="text-muted">無</span>
                    }
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="建立時間">{{ blueprint()!.created_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="更新時間">{{ blueprint()!.updated_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
                </nz-descriptions>
              </nz-card>
            </nz-tab>

            <!-- Financial Tab -->
            <nz-tab nzTitle="財務">
              <nz-spin [nzSpinning]="financialLoading()">
                @if (financialSummary()) {
                  <!-- Financial Overview -->
                  <nz-card nzTitle="財務概覽" [nzBordered]="false" class="financial-overview-card">
                    <nz-descriptions nzBordered [nzColumn]="3">
                      <nz-descriptions-item nzTitle="合約數量">{{ financialSummary()!.total_contracts }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="總預算">{{
                        financialSummary()!.total_budget | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="剩餘預算">
                        <span [style.color]="financialSummary()!.remaining_budget >= 0 ? '#52c41a' : '#ff4d4f'">
                          {{ financialSummary()!.remaining_budget | currency: 'TWD' : 'symbol' : '1.0-0' }}
                        </span>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已支出">{{
                        financialSummary()!.total_expenses | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已請款">{{
                        financialSummary()!.total_requested | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已核准">{{
                        financialSummary()!.total_approved | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="已付款">{{
                        financialSummary()!.total_paid | currency: 'TWD' : 'symbol' : '1.0-0'
                      }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="支出率">
                        <nz-progress
                          [nzPercent]="expenseRate()"
                          nzSize="small"
                          [nzStatus]="expenseRate() > 90 ? 'exception' : 'active'"
                          [nzShowInfo]="true"
                        >
                        </nz-progress>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="付款率">
                        <nz-progress [nzPercent]="paymentRate()" nzSize="small" nzStatus="success" [nzShowInfo]="true"> </nz-progress>
                      </nz-descriptions-item>
                    </nz-descriptions>
                  </nz-card>

                  <!-- Contracts Table -->
                  @if (contracts().length > 0) {
                    <nz-card nzTitle="合約列表" [nzBordered]="false" class="contracts-card">
                      <nz-table
                        #contractsTable
                        [nzData]="contracts()"
                        [nzPageSize]="5"
                        nzSize="small"
                        [nzShowPagination]="contracts().length > 5"
                      >
                        <thead>
                          <tr>
                            <th>合約名稱</th>
                            <th>承包商</th>
                            <th nzAlign="right">合約金額</th>
                            <th nzAlign="center">狀態</th>
                            <th nzAlign="center">起始日期</th>
                            <th nzAlign="center">結束日期</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (contract of contractsTable.data; track contract.id) {
                            <tr>
                              <td>
                                <span nz-tooltip [nzTooltipTitle]="contract.description || ''">
                                  {{ contract.name }}
                                </span>
                              </td>
                              <td>{{ contract.contractor_name || '-' }}</td>
                              <td nzAlign="right">{{ contract.total_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}</td>
                              <td nzAlign="center">
                                <nz-tag [nzColor]="getContractStatusColor(contract.status)">
                                  {{ getContractStatusLabel(contract.status) }}
                                </nz-tag>
                              </td>
                              <td nzAlign="center">{{ contract.start_date | date: 'yyyy-MM-dd' }}</td>
                              <td nzAlign="center">{{ contract.end_date | date: 'yyyy-MM-dd' }}</td>
                            </tr>
                          }
                        </tbody>
                      </nz-table>
                    </nz-card>
                  }
                } @else {
                  <nz-empty nzNotFoundContent="尚無財務資料" nzNotFoundImage="simple">
                    <ng-template #nzNotFoundFooter>
                      <p class="text-muted">建立合約後可在此查看財務資訊</p>
                    </ng-template>
                  </nz-empty>
                }
              </nz-spin>
            </nz-tab>

            <nz-tab nzTitle="活動">
              <nz-empty nzNotFoundContent="暫無活動記錄"></nz-empty>
            </nz-tab>
          </nz-tabset>
        } @else if (!loading()) {
          <nz-result nzStatus="404" nzTitle="找不到藍圖" nzSubTitle="您請求的藍圖不存在或已被刪除">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回列表</button>
            </div>
          </nz-result>
        }
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .blueprint-overview-container {
        padding: 24px;
      }
      .blueprint-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding: 24px;
        background: #fff;
        border-radius: 8px;
      }
      .header-left {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }
      .header-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .blueprint-name {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .blueprint-tags {
        display: flex;
        gap: 8px;
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
      .description-card {
        margin-bottom: 24px;
      }
      .description {
        margin: 0;
        color: #666;
        line-height: 1.6;
      }
      .stats-row {
        margin-bottom: 16px;
      }
      .financial-stats-row {
        margin-bottom: 24px;
      }
      .financial-card {
        text-align: center;
      }
      .financial-card .progress-bar {
        margin-top: 8px;
      }
      .content-tabs {
        background: #fff;
        padding: 16px;
        border-radius: 8px;
      }
      .text-muted {
        color: #999;
      }
      .financial-overview-card {
        margin-bottom: 16px;
      }
      .contracts-card {
        margin-top: 16px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzDividerModule,
    NzEmptyModule,
    NzGridModule,
    NzIconModule,
    NzProgressModule,
    NzResultModule,
    NzSpinModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
    NzTabsModule,
    NzTooltipModule
  ]
})
export class BlueprintOverviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly financialFacade = inject(FinancialFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly msg = inject(NzMessageService);

  blueprint = signal<BlueprintBusinessModel | null>(null);
  members = signal<BlueprintMemberDetail[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Financial state
  financialSummary = signal<BlueprintFinancialSummary | null>(null);
  contracts = signal<Contract[]>([]);
  financialLoading = signal(false);

  readonly blueprintId = computed(() => this.route.snapshot.paramMap.get('id'));

  readonly enabledModulesCount = computed(() => {
    return this.blueprint()?.enabled_modules?.length || 0;
  });

  readonly membersCount = computed(() => {
    return this.members().length;
  });

  readonly createdDate = computed(() => {
    const date = this.blueprint()?.created_at;
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-TW');
  });

  readonly updatedDate = computed(() => {
    const date = this.blueprint()?.updated_at;
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-TW');
  });

  // Financial computed values
  readonly expenseRate = computed(() => {
    const summary = this.financialSummary();
    if (!summary || summary.total_budget === 0) return 0;
    return Math.round((summary.total_expenses / summary.total_budget) * 100);
  });

  readonly paymentRate = computed(() => {
    const summary = this.financialSummary();
    if (!summary || summary.total_approved === 0) return 0;
    return Math.round((summary.total_paid / summary.total_approved) * 100);
  });

  ngOnInit(): void {
    this.loadBlueprint();
  }

  async loadBlueprint(): Promise<void> {
    const id = this.blueprintId();
    if (!id) {
      this.error.set('無效的藍圖 ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const blueprint = await this.blueprintFacade.findById(id);
      if (blueprint) {
        this.blueprint.set(blueprint);
        // Load members
        const members = await this.blueprintFacade.getBlueprintMembers(id);
        this.members.set(members);

        // Load financial data
        this.loadFinancialData(id);
      } else {
        this.error.set('找不到藍圖');
      }
    } catch (err) {
      console.error('[BlueprintOverviewComponent] Failed to load blueprint:', err);
      this.error.set(err instanceof Error ? err.message : '載入藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async loadFinancialData(blueprintId: string): Promise<void> {
    this.financialLoading.set(true);

    try {
      // Load financial summary and contracts in parallel
      const [summary, contractsList] = await Promise.all([
        this.financialFacade.getBlueprintFinancialSummary(blueprintId),
        this.financialFacade.loadContractsForBlueprint(blueprintId)
      ]);

      this.financialSummary.set(summary);
      this.contracts.set(contractsList);
    } catch (err) {
      console.error('[BlueprintOverviewComponent] Failed to load financial data:', err);
      // Don't set error for financial data - just log it
    } finally {
      this.financialLoading.set(false);
    }
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      active: 'green',
      inactive: 'default',
      suspended: 'orange',
      deleted: 'red'
    };
    return colorMap[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: '啟用中',
      inactive: '未啟用',
      suspended: '已停權',
      deleted: '已刪除'
    };
    return labelMap[status] || status;
  }

  getModuleLabel(module: string): string {
    const labelMap: Record<string, string> = {
      tasks: '任務管理',
      diary: '施工日誌',
      dashboard: '儀表板',
      bot_workflow: '自動化流程',
      files: '檔案管理',
      todos: '待辦事項',
      checklists: '檢查清單',
      issues: '問題追蹤'
    };
    return labelMap[module] || module;
  }

  getContractStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'green',
      completed: 'blue',
      cancelled: 'red'
    };
    return colorMap[status] || 'default';
  }

  getContractStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      draft: '草稿',
      active: '進行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labelMap[status] || status;
  }

  goBack(): void {
    this.router.navigate(['/blueprint/list']);
  }

  goToTasks(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'tasks']);
    }
  }

  goToMembers(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'members']);
    }
  }

  editBlueprint(): void {
    this.msg.info('編輯功能開發中');
  }
}
