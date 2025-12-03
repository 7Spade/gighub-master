import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CountDownModule } from '@delon/abc/count-down';
import { G2GaugeModule } from '@delon/chart/gauge';
import { G2MiniAreaModule } from '@delon/chart/mini-area';
import { G2MiniProgressModule } from '@delon/chart/mini-progress';
import { NumberInfoModule } from '@delon/chart/number-info';
import { G2PieModule } from '@delon/chart/pie';
import { G2TagCloudModule } from '@delon/chart/tag-cloud';
import { G2WaterWaveModule } from '@delon/chart/water-wave';
import { _HttpClient } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import type { CountdownConfig } from 'ngx-countdown';
import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { zip } from 'rxjs';

interface OrganizationKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface DepartmentStatus {
  id: string;
  name: string;
  head: string;
  memberCount: number;
  activeProjects: number;
  completionRate: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
  department: string;
}

@Component({
  selector: 'app-dashboard-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...SHARED_IMPORTS,
    G2WaterWaveModule,
    G2TagCloudModule,
    G2PieModule,
    G2GaugeModule,
    G2MiniAreaModule,
    G2MiniProgressModule,
    NumberInfoModule,
    CountDownModule,
    DatePipe,
    DecimalPipe
  ]
})
export class DashboardMonitorComponent implements OnInit, OnDestroy {
  private readonly http = inject(_HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  data: NzSafeAny = {};
  tags: NzSafeAny[] = [];
  loading = true;

  // 系統運行時間
  systemUptime = '99.97%';
  lastUpdateTime = new Date();

  // 倒計時配置
  cd: CountdownConfig = {
    format: `HH:mm:ss`,
    leftTime: 86400
  };

  // 組織 KPI
  orgKPIs: OrganizationKPI[] = [
    { id: 'kpi1', name: '總施工面積', value: 125600, target: 150000, unit: '㎡', trend: 'up', trendValue: 12.5 },
    { id: 'kpi2', name: '在建項目數', value: 18, target: 20, unit: '個', trend: 'stable', trendValue: 0 },
    { id: 'kpi3', name: '員工總數', value: 856, target: 900, unit: '人', trend: 'up', trendValue: 5.2 },
    { id: 'kpi4', name: '月度營收', value: 28500000, target: 30000000, unit: '萬元', trend: 'up', trendValue: 8.3 }
  ];

  // 部門狀態
  departments: DepartmentStatus[] = [
    { id: 'dept1', name: '土建工程部', head: '王建國', memberCount: 156, activeProjects: 5, completionRate: 87, status: 'excellent' },
    { id: 'dept2', name: '機電安裝部', head: '李明華', memberCount: 98, activeProjects: 4, completionRate: 72, status: 'good' },
    { id: 'dept3', name: '裝飾裝修部', head: '張曉峰', memberCount: 78, activeProjects: 3, completionRate: 65, status: 'warning' },
    { id: 'dept4', name: '安全監督部', head: '陳安全', memberCount: 45, activeProjects: 8, completionRate: 92, status: 'excellent' },
    { id: 'dept5', name: '質量檢測部', head: '劉品質', memberCount: 32, activeProjects: 6, completionRate: 88, status: 'good' }
  ];

  // 告警列表
  alerts: AlertItem[] = [
    { id: 'a1', type: 'error', title: 'C區安全隱患', description: '發現臨邊防護不完善，需立即整改', time: '10分鐘前', department: '安全監督部' },
    { id: 'a2', type: 'warning', title: 'B區進度延誤', description: '機電安裝進度落後計劃15%', time: '30分鐘前', department: '機電安裝部' },
    { id: 'a3', type: 'info', title: '材料到貨提醒', description: '鋼筋材料已到達工地，請安排驗收', time: '1小時前', department: '物資管理部' },
    { id: 'a4', type: 'warning', title: '人員出勤異常', description: '今日土建部出勤率低於90%', time: '2小時前', department: '人力資源部' }
  ];

  // 即時數據
  percent: number | null = null;
  activeTime$: ReturnType<typeof setInterval> | null = null;
  activeData!: NzSafeAny[];
  activeStat = {
    max: 0,
    min: 0,
    t1: '',
    t2: ''
  };

  ngOnInit(): void {
    zip(this.http.get('/chart'), this.http.get('/chart/tags')).subscribe(([res, tags]: [NzSafeAny, NzSafeAny]) => {
      this.data = res;
      tags.list[Math.floor(Math.random() * tags.list.length) + 1].value = 1000;
      this.tags = tags.list;
      this.loading = false;
      this.cdr.detectChanges();
    });

    this.refData();
    this.activeTime$ = setInterval(() => this.refData(), 1000 * 5);
  }

  refData(): void {
    const activeData: NzSafeAny[] = [];
    for (let i = 0; i < 24; i += 1) {
      activeData.push({
        x: `${i.toString().padStart(2, '0')}:00`,
        y: i * 50 + Math.floor(Math.random() * 200)
      });
    }
    this.activeData = activeData;
    this.activeStat.max = [...activeData].sort((a, b) => b.y - a.y)[0].y;
    this.activeStat.min = [...activeData].sort((a, b) => a.y - b.y)[0].y;
    this.activeStat.t1 = activeData[Math.floor(activeData.length / 2)].x;
    this.activeStat.t2 = activeData[activeData.length - 1].x;
    this.percent = Math.floor(Math.random() * 30) + 70;
    this.lastUpdateTime = new Date();
    this.cdr.detectChanges();
  }

  couponFormat(val: NzSafeAny): string {
    switch (parseInt(val, 10)) {
      case 20:
        return '差';
      case 40:
        return '中';
      case 60:
        return '良';
      case 80:
        return '優';
      default:
        return '';
    }
  }

  getKPIProgress(kpi: OrganizationKPI): number {
    return Math.round((kpi.value / kpi.target) * 100);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      excellent: '#52c41a',
      good: '#1890ff',
      warning: '#faad14',
      critical: '#ff4d4f'
    };
    return colors[status] || '#d9d9d9';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      excellent: '優秀',
      good: '良好',
      warning: '注意',
      critical: '警告'
    };
    return texts[status] || '未知';
  }

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      error: 'close-circle',
      warning: 'exclamation-circle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  getAlertColor(type: string): string {
    const colors: Record<string, string> = {
      error: '#ff4d4f',
      warning: '#faad14',
      info: '#1890ff'
    };
    return colors[type] || '#1890ff';
  }

  get errorAlertCount(): number {
    return this.alerts.filter(a => a.type === 'error').length;
  }

  ngOnDestroy(): void {
    if (this.activeTime$) {
      clearInterval(this.activeTime$);
    }
  }
}
