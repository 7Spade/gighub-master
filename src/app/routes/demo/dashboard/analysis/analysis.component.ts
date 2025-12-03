import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { G2BarModule } from '@delon/chart/bar';
import { G2CardModule } from '@delon/chart/card';
import { G2MiniAreaModule } from '@delon/chart/mini-area';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2MiniProgressModule } from '@delon/chart/mini-progress';
import { NumberInfoModule } from '@delon/chart/number-info';
import { G2PieModule } from '@delon/chart/pie';
import { G2TimelineModule } from '@delon/chart/timeline';
import { TrendModule } from '@delon/chart/trend';
import { ALAIN_I18N_TOKEN, _HttpClient } from '@delon/theme';
import { getTimeDistance } from '@delon/util/date-time';
import { deepCopy } from '@delon/util/other';
import { SHARED_IMPORTS, yuan } from '@shared';
import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzMessageService } from 'ng-zorro-antd/message';

interface FinancialStat {
  title: string;
  value: number;
  prefix: string;
  suffix: string;
  icon: string;
  color: string;
  trend: 'up' | 'down';
  trendValue: number;
}

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  status: 'normal' | 'warning' | 'danger';
}

interface PendingPayment {
  id: string;
  project: string;
  vendor: string;
  amount: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-dashboard-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...SHARED_IMPORTS,
    G2TimelineModule,
    G2PieModule,
    NumberInfoModule,
    TrendModule,
    G2MiniAreaModule,
    DecimalPipe,
    G2BarModule,
    G2MiniProgressModule,
    G2CardModule,
    G2MiniBarModule
  ]
})
export class DashboardAnalysisComponent implements OnInit {
  private readonly http = inject(_HttpClient);
  readonly msg = inject(NzMessageService);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  private readonly cdr = inject(ChangeDetectorRef);

  data: NzSafeAny = {};
  loading = true;
  dateRange: Date[] = [];
  dateRangeTypes = ['today', 'week', 'month', 'year'];
  dateRangeType = this.dateRangeTypes[2];

  financialStats: FinancialStat[] = [
    { title: '本月預算', value: 2850000, prefix: '¥', suffix: '', icon: 'wallet', color: 'primary', trend: 'up', trendValue: 12.5 },
    { title: '已執行金額', value: 1856000, prefix: '¥', suffix: '', icon: 'check-circle', color: 'success', trend: 'up', trendValue: 8.3 },
    { title: '待付款項', value: 523000, prefix: '¥', suffix: '', icon: 'clock-circle', color: 'warning', trend: 'down', trendValue: 5.2 },
    {
      title: '逾期未付',
      value: 128000,
      prefix: '¥',
      suffix: '',
      icon: 'exclamation-circle',
      color: 'danger',
      trend: 'up',
      trendValue: 15.8
    }
  ];

  budgetCategories: BudgetCategory[] = [
    { name: '人工費用', budget: 800000, spent: 620000, status: 'normal' },
    { name: '材料採購', budget: 1200000, spent: 1050000, status: 'warning' },
    { name: '設備租賃', budget: 350000, spent: 280000, status: 'normal' },
    { name: '安全設施', budget: 150000, spent: 148000, status: 'danger' },
    { name: '行政管理', budget: 200000, spent: 120000, status: 'normal' },
    { name: '其他支出', budget: 150000, spent: 85000, status: 'normal' }
  ];

  pendingPayments: PendingPayment[] = [
    { id: 'PAY-001', project: 'A區主體工程', vendor: '鋼筋材料供應商', amount: 156000, dueDate: '2024-12-05', priority: 'high' },
    { id: 'PAY-002', project: 'B區機電安裝', vendor: '電氣設備公司', amount: 89000, dueDate: '2024-12-08', priority: 'medium' },
    { id: 'PAY-003', project: 'C區裝修工程', vendor: '裝飾材料商', amount: 67500, dueDate: '2024-12-10', priority: 'low' },
    { id: 'PAY-004', project: '基礎設施', vendor: '混凝土供應商', amount: 210500, dueDate: '2024-12-03', priority: 'high' }
  ];

  titleMap = {
    y1: '收入',
    y2: '支出'
  };

  expenseColumns: STColumn[] = [
    { title: '費用類別', index: 'category', width: 120 },
    {
      title: '預算金額',
      index: 'budget',
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'symbol', currencyCode: 'CNY' } } },
      width: 120
    },
    {
      title: '已支出',
      index: 'spent',
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'symbol', currencyCode: 'CNY' } } },
      width: 120
    },
    {
      title: '執行率',
      index: 'rate',
      render: 'rate',
      width: 150
    },
    {
      title: '狀態',
      index: 'status',
      render: 'status',
      width: 100
    }
  ];

  cashFlowType = 'month';
  salesPieData: NzSafeAny;
  salesTotal = 0;

  offlineIdx = 0;

  ngOnInit(): void {
    this.http.get('/chart').subscribe((res: NzSafeAny) => {
      res.offlineData.forEach((item: NzSafeAny) => {
        item.chart = deepCopy(res.offlineChartData);
      });
      this.data = res;
      this.loading = false;
      this.changeCashFlowType();
    });
  }

  setDate(type: string): void {
    this.dateRange = getTimeDistance(type as NzSafeAny);
    this.dateRangeType = type;
    setTimeout(() => this.cdr.detectChanges());
  }

  changeCashFlowType(): void {
    this.salesPieData =
      this.cashFlowType === 'month'
        ? this.data.salesTypeData
        : this.cashFlowType === 'quarter'
          ? this.data.salesTypeDataOnline
          : this.data.salesTypeDataOffline;
    if (this.salesPieData) {
      this.salesTotal = this.salesPieData.reduce((pre: number, now: { y: number }) => now.y + pre, 0);
    }
    this.cdr.detectChanges();
  }

  handlePieValueFormat(value: string | number): string {
    return yuan(value);
  }

  offlineChange(idx: number): void {
    if (this.data.offlineData[idx].show !== true) {
      this.data.offlineData[idx].show = true;
      this.cdr.detectChanges();
    }
  }

  getBudgetRate(category: BudgetCategory): number {
    return Math.round((category.spent / category.budget) * 100);
  }

  getBudgetStatusColor(status: string): string {
    const colors: Record<string, string> = {
      normal: '#52c41a',
      warning: '#faad14',
      danger: '#ff4d4f'
    };
    return colors[status] || '#1890ff';
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    return colors[priority] || 'default';
  }

  formatAmount(value: number): string {
    return yuan(value);
  }
}
