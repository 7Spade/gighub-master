/**
 * Reports & Analytics Dashboard Component
 *
 * 報表分析儀表板組件
 * Comprehensive reports and analytics dashboard for blueprints
 *
 * Features:
 * - Task progress statistics
 * - Financial summary
 * - Quality inspection overview
 * - Problem tracking metrics
 * - Activity trends
 * - Export functionality
 *
 * @module routes/blueprint/reports
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlueprintFinancialSummary } from '@core';
import { FinancialFacade, TaskService, QcService, ProblemService, DiaryService, AuditLogService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

interface ReportSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;
  totalDiaries: number;
  approvedDiaries: number;
  pendingDiaries: number;
  totalQcInspections: number;
  passedInspections: number;
  failedInspections: number;
  qcPassRate: number;
  totalProblems: number;
  openProblems: number;
  resolvedProblems: number;
  criticalProblems: number;
  totalActivities: number;
  todayActivities: number;
}

@Component({
  selector: 'app-blueprint-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDividerModule,
    NzTooltipModule,
    NzStatisticModule,
    NzGridModule,
    NzProgressModule,
    NzTabsModule,
    NzResultModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h2>
          <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
          報表分析
        </h2>
        <p class="subtitle">藍圖進度、財務、品質與問題追蹤的綜合統計報告</p>
      </div>
      <div class="header-actions">
        <nz-date-picker
          [(ngModel)]="dateRange"
          nzMode="range"
          [nzRanges]="dateRangePresets"
          (ngModelChange)="onDateRangeChange()"
        ></nz-date-picker>
        <button nz-button nzType="primary" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
        <button nz-button (click)="exportReport()">
          <span nz-icon nzType="download"></span>
          匯出報告
        </button>
      </div>
    </div>

    <nz-spin [nzSpinning]="loading()">
      @if (error()) {
        <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error() || ''">
          <div nz-result-extra>
            <button nz-button nzType="primary" (click)="refreshData()">重試</button>
            <button nz-button (click)="goBack()">返回</button>
          </div>
        </nz-result>
      } @else {
        <!-- Summary Statistics -->
        <div nz-row [nzGutter]="[16, 16]" class="stats-row">
          <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="總任務數"
                [nzValue]="summary().totalTasks"
                [nzPrefix]="taskIcon"
                [nzValueStyle]="{ color: '#1890ff' }"
              ></nz-statistic>
              <ng-template #taskIcon><span nz-icon nzType="ordered-list"></span></ng-template>
            </nz-card>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="任務完成率"
                [nzValue]="summary().taskCompletionRate"
                nzSuffix="%"
                [nzValueStyle]="{
                  color: summary().taskCompletionRate >= 80 ? '#52c41a' : summary().taskCompletionRate >= 50 ? '#faad14' : '#f5222d'
                }"
              ></nz-statistic>
              <nz-progress
                [nzPercent]="summary().taskCompletionRate"
                [nzShowInfo]="false"
                nzSize="small"
                [nzStatus]="summary().taskCompletionRate >= 80 ? 'success' : summary().taskCompletionRate >= 50 ? 'active' : 'exception'"
              ></nz-progress>
            </nz-card>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="品質通過率"
                [nzValue]="summary().qcPassRate"
                nzSuffix="%"
                [nzValueStyle]="{ color: summary().qcPassRate >= 90 ? '#52c41a' : summary().qcPassRate >= 70 ? '#faad14' : '#f5222d' }"
              ></nz-statistic>
              <nz-progress
                [nzPercent]="summary().qcPassRate"
                [nzShowInfo]="false"
                nzSize="small"
                [nzStatus]="summary().qcPassRate >= 90 ? 'success' : summary().qcPassRate >= 70 ? 'active' : 'exception'"
              ></nz-progress>
            </nz-card>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="待處理問題"
                [nzValue]="summary().openProblems"
                [nzPrefix]="problemIcon"
                [nzValueStyle]="{ color: summary().openProblems > 5 ? '#f5222d' : '#faad14' }"
              ></nz-statistic>
              <ng-template #problemIcon><span nz-icon nzType="warning"></span></ng-template>
            </nz-card>
          </div>
        </div>

        <!-- Tabs for different report sections -->
        <nz-tabs class="report-tabs">
          <!-- 任務進度 Tab -->
          <nz-tab nzTitle="任務進度">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="12">
                <nz-card nzTitle="任務狀態分布" [nzBordered]="false">
                  <div class="stat-breakdown">
                    <div class="stat-item">
                      <nz-tag nzColor="default">待處理</nz-tag>
                      <span class="stat-value">{{ summary().pendingTasks }}</span>
                    </div>
                    <div class="stat-item">
                      <nz-tag nzColor="processing">進行中</nz-tag>
                      <span class="stat-value">{{ summary().inProgressTasks }}</span>
                    </div>
                    <div class="stat-item">
                      <nz-tag nzColor="success">已完成</nz-tag>
                      <span class="stat-value">{{ summary().completedTasks }}</span>
                    </div>
                  </div>
                  <nz-divider></nz-divider>
                  <div class="completion-bar">
                    <span>完成進度</span>
                    <nz-progress [nzPercent]="summary().taskCompletionRate" nzSize="small" [nzFormat]="percentFormatter"></nz-progress>
                  </div>
                </nz-card>
              </div>
              <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="12">
                <nz-card nzTitle="任務概況" [nzBordered]="false">
                  <nz-table [nzData]="taskBreakdown()" [nzShowPagination]="false" nzSize="small">
                    <thead>
                      <tr>
                        <th>指標</th>
                        <th nzAlign="right">數量</th>
                        <th nzAlign="right">佔比</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of taskBreakdown(); track item.label) {
                        <tr>
                          <td>
                            <nz-tag [nzColor]="item.color">{{ item.label }}</nz-tag>
                          </td>
                          <td nzAlign="right">{{ item.count }}</td>
                          <td nzAlign="right">{{ item.percentage | number: '1.1-1' }}%</td>
                        </tr>
                      }
                    </tbody>
                  </nz-table>
                </nz-card>
              </div>
            </div>
          </nz-tab>

          <!-- 施工日誌 Tab -->
          <nz-tab nzTitle="施工日誌">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="總日誌數" [nzValue]="summary().totalDiaries"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="已核准" [nzValue]="summary().approvedDiaries" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="待審核" [nzValue]="summary().pendingDiaries" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="核准率" [nzValue]="diaryApprovalRate()" nzSuffix="%"></nz-statistic>
                </nz-card>
              </div>
            </div>
          </nz-tab>

          <!-- 品質管控 Tab -->
          <nz-tab nzTitle="品質管控">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="總檢查數" [nzValue]="summary().totalQcInspections"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="通過" [nzValue]="summary().passedInspections" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic
                    nzTitle="未通過"
                    [nzValue]="summary().failedInspections"
                    [nzValueStyle]="{ color: '#f5222d' }"
                  ></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic
                    nzTitle="通過率"
                    [nzValue]="summary().qcPassRate"
                    nzSuffix="%"
                    [nzValueStyle]="{ color: summary().qcPassRate >= 90 ? '#52c41a' : '#faad14' }"
                  ></nz-statistic>
                  <nz-progress [nzPercent]="summary().qcPassRate" [nzShowInfo]="false" nzSize="small"></nz-progress>
                </nz-card>
              </div>
            </div>
          </nz-tab>

          <!-- 問題追蹤 Tab -->
          <nz-tab nzTitle="問題追蹤">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="總問題數" [nzValue]="summary().totalProblems"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="待處理" [nzValue]="summary().openProblems" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic
                    nzTitle="已解決"
                    [nzValue]="summary().resolvedProblems"
                    [nzValueStyle]="{ color: '#52c41a' }"
                  ></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic
                    nzTitle="嚴重問題"
                    [nzValue]="summary().criticalProblems"
                    [nzValueStyle]="{ color: summary().criticalProblems > 0 ? '#f5222d' : '#52c41a' }"
                  ></nz-statistic>
                </nz-card>
              </div>
            </div>
            <nz-divider></nz-divider>
            <nz-card nzTitle="問題解決率" [nzBordered]="false">
              <div class="completion-bar">
                <span>解決進度 ({{ summary().resolvedProblems }}/{{ summary().totalProblems }})</span>
                <nz-progress [nzPercent]="problemResolutionRate()" nzSize="small" [nzFormat]="percentFormatter"></nz-progress>
              </div>
            </nz-card>
          </nz-tab>

          <!-- 財務概況 Tab -->
          <nz-tab nzTitle="財務概況">
            <nz-spin [nzSpinning]="financialLoading()">
              @if (financialSummary()) {
                <div nz-row [nzGutter]="[16, 16]">
                  <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="false" class="stat-card financial">
                      <nz-statistic
                        nzTitle="總預算"
                        [nzValue]="financialSummary()!.total_contract_amount"
                        nzPrefix="$"
                        [nzValueStyle]="{ color: '#1890ff' }"
                      ></nz-statistic>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="false" class="stat-card financial">
                      <nz-statistic
                        nzTitle="已支出"
                        [nzValue]="financialSummary()!.total_expenses"
                        nzPrefix="$"
                        [nzValueStyle]="{ color: '#fa8c16' }"
                      ></nz-statistic>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="false" class="stat-card financial">
                      <nz-statistic
                        nzTitle="已付款"
                        [nzValue]="financialSummary()!.total_paid"
                        nzPrefix="$"
                        [nzValueStyle]="{ color: '#52c41a' }"
                      ></nz-statistic>
                    </nz-card>
                  </div>
                  <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
                    <nz-card [nzBordered]="false" class="stat-card financial">
                      <nz-statistic
                        nzTitle="剩餘預算"
                        [nzValue]="remainingBudget()"
                        nzPrefix="$"
                        [nzValueStyle]="{ color: remainingBudget() >= 0 ? '#52c41a' : '#f5222d' }"
                      ></nz-statistic>
                    </nz-card>
                  </div>
                </div>
                <nz-divider></nz-divider>
                <nz-card nzTitle="預算使用率" [nzBordered]="false">
                  <div class="completion-bar">
                    <span>預算使用 ({{ budgetUsageRate() | number: '1.1-1' }}%)</span>
                    <nz-progress
                      [nzPercent]="budgetUsageRate()"
                      nzSize="small"
                      [nzStatus]="budgetUsageRate() > 90 ? 'exception' : budgetUsageRate() > 70 ? 'active' : 'success'"
                    ></nz-progress>
                  </div>
                </nz-card>
              } @else {
                <nz-empty nzNotFoundContent="尚無財務資料"></nz-empty>
              }
            </nz-spin>
          </nz-tab>

          <!-- 活動概況 Tab -->
          <nz-tab nzTitle="活動概況">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="8">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic nzTitle="總活動數" [nzValue]="summary().totalActivities" [nzPrefix]="activityIcon"></nz-statistic>
                  <ng-template #activityIcon><span nz-icon nzType="history"></span></ng-template>
                </nz-card>
              </div>
              <div nz-col [nzXs]="12" [nzSm]="12" [nzMd]="8">
                <nz-card [nzBordered]="false" class="stat-card">
                  <nz-statistic
                    nzTitle="今日活動"
                    [nzValue]="summary().todayActivities"
                    [nzValueStyle]="{ color: '#1890ff' }"
                  ></nz-statistic>
                </nz-card>
              </div>
              <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="8">
                <nz-card [nzBordered]="false" class="stat-card">
                  <div class="action-card">
                    <button nz-button nzType="primary" (click)="goToActivities()">
                      <span nz-icon nzType="history"></span>
                      查看完整活動歷史
                    </button>
                  </div>
                </nz-card>
              </div>
            </div>
          </nz-tab>
        </nz-tabs>
      }
    </nz-spin>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding: 24px;
        background: #fff;
        border-radius: 8px;
      }
      .header-content h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .subtitle {
        margin: 0;
        color: #666;
      }
      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .stats-row {
        margin-bottom: 24px;
      }
      .stat-card {
        text-align: center;
      }
      .stat-card.financial {
        background: linear-gradient(135deg, #f6f8fa 0%, #fff 100%);
      }
      .report-tabs {
        background: #fff;
        padding: 16px;
        border-radius: 8px;
      }
      .stat-breakdown {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 16px;
      }
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: 600;
      }
      .completion-bar {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .completion-bar span {
        font-size: 14px;
        color: #666;
      }
      .action-card {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60px;
      }
      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          gap: 16px;
        }
        .header-actions {
          flex-wrap: wrap;
        }
      }
    `
  ]
})
export class BlueprintReportsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private financialFacade = inject(FinancialFacade);
  private taskService = inject(TaskService);
  private qcService = inject(QcService);
  private problemService = inject(ProblemService);
  private diaryService = inject(DiaryService);
  private auditLogService = inject(AuditLogService);
  private msg = inject(NzMessageService);

  blueprintId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  financialLoading = signal(false);
  financialSummary = signal<BlueprintFinancialSummary | null>(null);

  dateRange: [Date, Date] | null = null;
  dateRangePresets = {
    今天: [new Date(), new Date()],
    本週: [this.getStartOfWeek(), new Date()],
    本月: [this.getStartOfMonth(), new Date()],
    最近三個月: [this.getMonthsAgo(3), new Date()],
    全部: [null, null] as unknown as [Date, Date]
  };

  summary = signal<ReportSummary>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    taskCompletionRate: 0,
    totalDiaries: 0,
    approvedDiaries: 0,
    pendingDiaries: 0,
    totalQcInspections: 0,
    passedInspections: 0,
    failedInspections: 0,
    qcPassRate: 0,
    totalProblems: 0,
    openProblems: 0,
    resolvedProblems: 0,
    criticalProblems: 0,
    totalActivities: 0,
    todayActivities: 0
  });

  taskBreakdown = computed(() => {
    const s = this.summary();
    const total = s.totalTasks || 1;
    return [
      { label: '待處理', count: s.pendingTasks, percentage: (s.pendingTasks / total) * 100, color: 'default' },
      { label: '進行中', count: s.inProgressTasks, percentage: (s.inProgressTasks / total) * 100, color: 'processing' },
      { label: '已完成', count: s.completedTasks, percentage: (s.completedTasks / total) * 100, color: 'success' }
    ];
  });

  diaryApprovalRate = computed(() => {
    const s = this.summary();
    if (s.totalDiaries === 0) return 0;
    return Math.round((s.approvedDiaries / s.totalDiaries) * 100);
  });

  problemResolutionRate = computed(() => {
    const s = this.summary();
    if (s.totalProblems === 0) return 0;
    return Math.round((s.resolvedProblems / s.totalProblems) * 100);
  });

  remainingBudget = computed(() => {
    const f = this.financialSummary();
    if (!f) return 0;
    return f.total_contract_amount - f.total_expenses;
  });

  budgetUsageRate = computed(() => {
    const f = this.financialSummary();
    if (!f || f.total_contract_amount === 0) return 0;
    return Math.round((f.total_expenses / f.total_contract_amount) * 100);
  });

  percentFormatter = (percent: number) => `${percent}%`;

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadData();
      }
    });
  }

  async loadData(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      // Load task stats (async)
      await this.loadTaskStats(blueprintId);

      // Load financial stats (async)
      await this.loadFinancialStats(blueprintId);

      // Load other stats (signal-based, using void methods)
      this.loadDiaryStats(blueprintId);
      this.loadQcStats(blueprintId);
      this.loadProblemStats(blueprintId);
      this.loadActivityStats(blueprintId);
    } catch (err) {
      console.error('Failed to load report data:', err);
      this.error.set('載入報告資料失敗');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTaskStats(blueprintId: string): Promise<void> {
    try {
      const tasks = await this.taskService.loadTasksByBlueprint(blueprintId);
      const total = tasks.length;
      const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;
      const pending = tasks.filter((t: { status: string }) => t.status === 'pending').length;
      const inProgress = tasks.filter((t: { status: string }) => t.status === 'in_progress').length;

      this.summary.update(s => ({
        ...s,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        taskCompletionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }));
    } catch (err) {
      console.error('Failed to load task stats:', err);
    }
  }

  private loadDiaryStats(blueprintId: string): void {
    try {
      this.diaryService.loadByBlueprint(blueprintId);
      setTimeout(() => {
        const diaries = this.diaryService.diaries();
        const total = diaries.length;
        const approved = diaries.filter(d => d.status === 'approved').length;
        const pending = diaries.filter(d => d.status === 'submitted').length;

        this.summary.update(s => ({
          ...s,
          totalDiaries: total,
          approvedDiaries: approved,
          pendingDiaries: pending
        }));
      }, 500);
    } catch (err) {
      console.error('Failed to load diary stats:', err);
    }
  }

  private loadQcStats(blueprintId: string): void {
    try {
      this.qcService.loadInspections({ blueprintId: blueprintId });
      setTimeout(() => {
        const inspections = this.qcService.inspections();
        const total = inspections.length;
        const passed = inspections.filter(i => i.status === 'passed').length;
        const failed = inspections.filter(i => i.status === 'failed').length;

        this.summary.update(s => ({
          ...s,
          totalQcInspections: total,
          passedInspections: passed,
          failedInspections: failed,
          qcPassRate: total > 0 ? Math.round((passed / total) * 100) : 0
        }));
      }, 500);
    } catch (err) {
      console.error('Failed to load QC stats:', err);
    }
  }

  private loadProblemStats(blueprintId: string): void {
    try {
      this.problemService.loadProblems({ blueprintId: blueprintId });
      setTimeout(() => {
        const problems = this.problemService.problems();
        const total = problems.length;
        const open = problems.filter(p => ['opened', 'assessing', 'assigned', 'in_progress'].includes(p.status)).length;
        const resolved = problems.filter(p => ['resolved', 'verified', 'closed'].includes(p.status)).length;
        const critical = problems.filter(p => p.severity === 'critical').length;

        this.summary.update(s => ({
          ...s,
          totalProblems: total,
          openProblems: open,
          resolvedProblems: resolved,
          criticalProblems: critical
        }));
      }, 500);
    } catch (err) {
      console.error('Failed to load problem stats:', err);
    }
  }

  private loadActivityStats(blueprintId: string): void {
    try {
      this.auditLogService.loadLogs({ blueprintId: blueprintId, page: 1, pageSize: 1000 });
      setTimeout(() => {
        const logs = this.auditLogService.logs();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = logs.filter(l => new Date(l.created_at) >= today).length;

        this.summary.update(s => ({
          ...s,
          totalActivities: logs.length,
          todayActivities: todayCount
        }));
      }, 500);
    } catch (err) {
      console.error('Failed to load activity stats:', err);
    }
  }

  private async loadFinancialStats(blueprintId: string): Promise<void> {
    this.financialLoading.set(true);
    try {
      const summary = await this.financialFacade.getBlueprintFinancialSummary(blueprintId);
      this.financialSummary.set(summary);
    } catch (err) {
      console.error('Failed to load financial stats:', err);
    } finally {
      this.financialLoading.set(false);
    }
  }

  refreshData(): void {
    this.loadData();
  }

  onDateRangeChange(): void {
    this.refreshData();
  }

  exportReport(): void {
    const s = this.summary();
    const f = this.financialSummary();

    const reportData: Array<[string, string | number]> = [
      ['報告類型', '數值'],
      ['總任務數', s.totalTasks],
      ['已完成任務', s.completedTasks],
      ['任務完成率', `${s.taskCompletionRate}%`],
      ['總日誌數', s.totalDiaries],
      ['已核准日誌', s.approvedDiaries],
      ['品質檢查數', s.totalQcInspections],
      ['品質通過率', `${s.qcPassRate}%`],
      ['總問題數', s.totalProblems],
      ['待處理問題', s.openProblems],
      ['嚴重問題', s.criticalProblems],
      ['總活動數', s.totalActivities]
    ];

    if (f) {
      reportData.push(
        ['總預算', f.total_contract_amount],
        ['已支出', f.total_expenses],
        ['已付款', f.total_paid],
        ['剩餘預算', f.total_contract_amount - f.total_expenses]
      );
    }

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.msg.success('報告已匯出');
  }

  goBack(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'overview']);
    } else {
      this.router.navigate(['/blueprint/list']);
    }
  }

  goToActivities(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'activities']);
    }
  }

  private getStartOfWeek(): Date {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private getStartOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getMonthsAgo(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }
}
