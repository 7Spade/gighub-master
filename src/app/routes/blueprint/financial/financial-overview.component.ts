/**
 * Financial Overview Component
 *
 * 財務概覽元件
 * Financial overview dashboard component
 *
 * Enterprise-grade financial dashboard with:
 * - Key financial metrics display
 * - Budget vs Actual visualization
 * - Payment status summary
 * - Quick navigation to sub-modules
 *
 * @module routes/blueprint/financial
 */

import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentRequestStatus } from '@core';
import { FinancialService, SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-financial-overview',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="page-container">
      <!-- Header -->
      <app-page-header title="財務概覽" subtitle="Financial Overview - 預算與成本追蹤" [showBack]="true" (backClick)="goBack()">
        <button actions nz-button nzType="default" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          刷新
        </button>
      </app-page-header>

      <nz-spin [nzSpinning]="financialService.loading()">
        <!-- Summary Cards -->
        <div nz-row [nzGutter]="[16, 16]" class="stats-section">
          <!-- Total Contract Amount -->
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="合約總金額"
                [nzValue]="summary()?.total_contract_amount ?? 0"
                [nzPrefix]="contractIcon"
                [nzValueStyle]="{ color: '#1890ff' }"
                nzSuffix="元"
              ></nz-statistic>
              <ng-template #contractIcon>
                <span nz-icon nzType="file-text" nzTheme="outline"></span>
              </ng-template>
            </nz-card>
          </div>

          <!-- Total Expenses -->
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="累計支出"
                [nzValue]="summary()?.total_expenses ?? 0"
                [nzPrefix]="expenseIcon"
                [nzValueStyle]="{ color: '#faad14' }"
                nzSuffix="元"
              ></nz-statistic>
              <ng-template #expenseIcon>
                <span nz-icon nzType="account-book" nzTheme="outline"></span>
              </ng-template>
            </nz-card>
          </div>

          <!-- Total Requested -->
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="累計請款"
                [nzValue]="summary()?.total_requested ?? 0"
                [nzPrefix]="requestIcon"
                [nzValueStyle]="{ color: '#722ed1' }"
                nzSuffix="元"
              ></nz-statistic>
              <ng-template #requestIcon>
                <span nz-icon nzType="audit" nzTheme="outline"></span>
              </ng-template>
            </nz-card>
          </div>

          <!-- Total Paid -->
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" class="stat-card">
              <nz-statistic
                nzTitle="累計付款"
                [nzValue]="summary()?.total_paid ?? 0"
                [nzPrefix]="paidIcon"
                [nzValueStyle]="{ color: '#52c41a' }"
                nzSuffix="元"
              ></nz-statistic>
              <ng-template #paidIcon>
                <span nz-icon nzType="dollar" nzTheme="outline"></span>
              </ng-template>
            </nz-card>
          </div>
        </div>

        <!-- Progress Section -->
        <div nz-row [nzGutter]="[16, 16]" class="progress-section">
          <!-- Budget Usage -->
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="預算使用率" [nzBordered]="false" class="progress-card">
              <div class="progress-content">
                <nz-progress
                  [nzPercent]="budgetUsagePercent()"
                  [nzStrokeColor]="getBudgetColor(budgetUsagePercent())"
                  [nzFormat]="progressFormat"
                  nzType="circle"
                  [nzWidth]="120"
                ></nz-progress>
                <div class="progress-details">
                  <div class="detail-item">
                    <span class="label">預算總額</span>
                    <span class="value">{{ summary()?.total_contract_amount ?? 0 | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">已使用</span>
                    <span class="value">{{ summary()?.total_expenses ?? 0 | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">剩餘預算</span>
                    <span class="value">{{ remainingBudget() | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </nz-card>
          </div>

          <!-- Payment Status -->
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="付款進度" [nzBordered]="false" class="progress-card">
              <div class="progress-content">
                <nz-progress
                  [nzPercent]="paymentPercent()"
                  [nzStrokeColor]="'#52c41a'"
                  [nzFormat]="progressFormat"
                  nzType="circle"
                  [nzWidth]="120"
                ></nz-progress>
                <div class="progress-details">
                  <div class="detail-item">
                    <span class="label">請款總額</span>
                    <span class="value">{{ summary()?.total_requested ?? 0 | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">已付款</span>
                    <span class="value">{{ summary()?.total_paid ?? 0 | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">待付款</span>
                    <span class="value">{{ pendingPayment() | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </nz-card>
          </div>
        </div>

        <!-- Quick Navigation -->
        <div nz-row [nzGutter]="[16, 16]" class="navigation-section">
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" [nzHoverable]="true" class="nav-card" (click)="navigateTo('contracts')">
              <div class="nav-content">
                <span nz-icon nzType="file-text" nzTheme="outline" class="nav-icon contracts"></span>
                <div class="nav-info">
                  <h4>合約管理</h4>
                  <p>{{ financialService.contracts().length }} 筆合約</p>
                </div>
                <span nz-icon nzType="right" class="nav-arrow"></span>
              </div>
            </nz-card>
          </div>

          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" [nzHoverable]="true" class="nav-card" (click)="navigateTo('expenses')">
              <div class="nav-content">
                <span nz-icon nzType="account-book" nzTheme="outline" class="nav-icon expenses"></span>
                <div class="nav-info">
                  <h4>費用管理</h4>
                  <p>{{ financialService.expenses().length }} 筆費用</p>
                </div>
                <span nz-icon nzType="right" class="nav-arrow"></span>
              </div>
            </nz-card>
          </div>

          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" [nzHoverable]="true" class="nav-card" (click)="navigateTo('payment-requests')">
              <div class="nav-content">
                <span nz-icon nzType="audit" nzTheme="outline" class="nav-icon requests"></span>
                <div class="nav-info">
                  <h4>請款管理</h4>
                  <p>{{ pendingRequestCount() }} 筆待審核</p>
                </div>
                <span nz-icon nzType="right" class="nav-arrow"></span>
              </div>
            </nz-card>
          </div>

          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-card [nzBordered]="false" [nzHoverable]="true" class="nav-card" (click)="navigateTo('payments')">
              <div class="nav-content">
                <span nz-icon nzType="dollar" nzTheme="outline" class="nav-icon payments"></span>
                <div class="nav-info">
                  <h4>付款紀錄</h4>
                  <p>{{ financialService.payments().length }} 筆付款</p>
                </div>
                <span nz-icon nzType="right" class="nav-arrow"></span>
              </div>
            </nz-card>
          </div>
        </div>

        <!-- Recent Activities -->
        <nz-card nzTitle="最近活動" [nzBordered]="false" class="activity-card">
          <nz-list nzItemLayout="horizontal" [nzLoading]="financialService.loading()">
            @for (request of recentPaymentRequests(); track request.id) {
              <nz-list-item>
                <nz-list-item-meta nzAvatar="audit" [nzTitle]="request.request_number" [nzDescription]="request.description || '無描述'">
                  <nz-list-item-meta-avatar>
                    <nz-avatar nzIcon="audit"></nz-avatar>
                  </nz-list-item-meta-avatar>
                </nz-list-item-meta>
                <ul nz-list-item-actions>
                  <nz-list-item-action>
                    <nz-tag [nzColor]="getStatusColor(request.status)">
                      {{ getStatusLabel(request.status) }}
                    </nz-tag>
                  </nz-list-item-action>
                  <nz-list-item-action>
                    {{ request.requested_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}
                  </nz-list-item-action>
                </ul>
              </nz-list-item>
            } @empty {
              <nz-empty nzNotFoundContent="尚無請款紀錄"></nz-empty>
            }
          </nz-list>
        </nz-card>
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 24px;
      }

      .stats-section {
        margin-bottom: 24px;
      }

      .stat-card {
        text-align: center;
      }

      .progress-section {
        margin-bottom: 24px;
      }

      .progress-card {
        height: 100%;
      }

      .progress-content {
        display: flex;
        align-items: center;
        gap: 32px;
        padding: 16px 0;
      }

      .progress-details {
        flex: 1;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .detail-item:last-child {
        border-bottom: none;
      }

      .detail-item .label {
        color: #666;
      }

      .detail-item .value {
        font-weight: 500;
      }

      .navigation-section {
        margin-bottom: 24px;
      }

      .nav-card {
        cursor: pointer;
        transition: all 0.3s;
      }

      .nav-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .nav-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .nav-icon {
        font-size: 32px;
        padding: 12px;
        border-radius: 8px;
      }

      .nav-icon.contracts {
        background: #e6f7ff;
        color: #1890ff;
      }

      .nav-icon.expenses {
        background: #fff7e6;
        color: #faad14;
      }

      .nav-icon.requests {
        background: #f9f0ff;
        color: #722ed1;
      }

      .nav-icon.payments {
        background: #f6ffed;
        color: #52c41a;
      }

      .nav-info {
        flex: 1;
      }

      .nav-info h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .nav-info p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      .nav-arrow {
        color: #999;
        font-size: 16px;
      }

      .activity-card {
        margin-bottom: 24px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialOverviewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  readonly financialService = inject(FinancialService);

  /** Blueprint ID from route param */
  id = input.required<string>();

  /** Current financial summary */
  readonly summary = computed(() => this.financialService.currentSummary());

  /** Budget usage percentage */
  readonly budgetUsagePercent = computed(() => {
    const s = this.summary();
    if (!s || s.total_contract_amount === 0) return 0;
    return Math.round((s.total_expenses / s.total_contract_amount) * 100);
  });

  /** Payment percentage */
  readonly paymentPercent = computed(() => {
    const s = this.summary();
    if (!s || s.total_requested === 0) return 0;
    return Math.round((s.total_paid / s.total_requested) * 100);
  });

  /** Remaining budget */
  readonly remainingBudget = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.total_contract_amount - s.total_expenses;
  });

  /** Pending payment amount */
  readonly pendingPayment = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.total_requested - s.total_paid;
  });

  /** Pending payment request count */
  readonly pendingRequestCount = computed(() => {
    return this.financialService.paymentRequests().filter(r => r.status === PaymentRequestStatus.PENDING).length;
  });

  /** Recent payment requests */
  readonly recentPaymentRequests = computed(() => {
    return this.financialService.paymentRequests().slice(0, 5);
  });

  /** Progress format function */
  progressFormat = (percent: number): string => `${percent}%`;

  ngOnInit(): void {
    this.loadData();
  }

  /** Load all financial data */
  async loadData(): Promise<void> {
    try {
      await this.financialService.loadAllFinancialData(this.id());
    } catch {
      this.msg.error('載入財務資料失敗');
    }
  }

  /** Refresh data */
  async refreshData(): Promise<void> {
    await this.loadData();
    this.msg.success('資料已刷新');
  }

  /** Get budget color based on usage percentage */
  getBudgetColor(percent: number): string {
    if (percent >= 90) return '#ff4d4f';
    if (percent >= 70) return '#fa8c16';
    return '#52c41a';
  }

  /** Get status color */
  getStatusColor(status: PaymentRequestStatus): string {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return 'default';
      case PaymentRequestStatus.PENDING:
        return 'processing';
      case PaymentRequestStatus.APPROVED:
        return 'success';
      case PaymentRequestStatus.REJECTED:
        return 'error';
      case PaymentRequestStatus.PAID:
        return 'green';
      default:
        return 'default';
    }
  }

  /** Get status label */
  getStatusLabel(status: PaymentRequestStatus): string {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return '草稿';
      case PaymentRequestStatus.PENDING:
        return '待審核';
      case PaymentRequestStatus.APPROVED:
        return '已核准';
      case PaymentRequestStatus.REJECTED:
        return '已拒絕';
      case PaymentRequestStatus.PAID:
        return '已付款';
      default:
        return status;
    }
  }

  /** Navigate to sub-module */
  navigateTo(path: string): void {
    this.router.navigate(['/blueprint', this.id(), 'financial', path]);
  }

  /** Go back to blueprint overview */
  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'overview']);
  }
}
