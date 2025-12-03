import { Platform } from '@angular/cdk/platform';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, DOCUMENT } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Chart } from '@antv/g2';
import { OnboardingModule, OnboardingService } from '@delon/abc/onboarding';
import { QuickMenuModule } from '@delon/abc/quick-menu';
import { G2BarModule } from '@delon/chart/bar';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2TimelineModule } from '@delon/chart/timeline';
import { _HttpClient } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { timer } from 'rxjs';

@Component({
  selector: 'app-dashboard-v1',
  templateUrl: './v1.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, G2TimelineModule, G2BarModule, G2MiniBarModule, QuickMenuModule, OnboardingModule]
})
export class DashboardV1Component implements OnInit {
  private readonly http = inject(_HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly obSrv = inject(OnboardingService);
  private readonly platform = inject(Platform);
  private readonly doc = inject(DOCUMENT);
  todoData = [
    {
      completed: true,
      avatar: '1',
      name: '王工长',
      content: `A区主体结构验收已完成`
    },
    {
      completed: false,
      avatar: '2',
      name: '李主管',
      content: `B区水电安装进度需加快`
    },
    {
      completed: false,
      avatar: '3',
      name: '张安全员',
      content: `C区安全检查发现3处隐患`
    },
    {
      completed: false,
      avatar: '4',
      name: '陈监理',
      content: `D区装修材料待验收`
    },
    {
      completed: false,
      avatar: '5',
      name: '刘技术员',
      content: `E区绿化设计方案需确认`
    },
    {
      completed: false,
      avatar: '6',
      name: '赵项目经理',
      content: `本周工程例会安排在周五下午`
    }
  ];

  webSite!: any[];
  salesData!: any[];
  offlineChartData!: any[];

  constructor() {
    timer(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.genOnboarding());
  }

  fixDark(chart: Chart): void {
    if (!this.platform.isBrowser || (this.doc.body as HTMLBodyElement).getAttribute('data-theme') !== 'dark') return;

    chart.theme({
      styleSheet: {
        backgroundColor: 'transparent'
      }
    });
  }

  ngOnInit(): void {
    this.http.get('/chart').subscribe(res => {
      this.webSite = res.visitData.slice(0, 10);
      this.salesData = res.salesData;
      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });
  }

  private genOnboarding(): void {
    const KEY = 'on-boarding';
    if (!this.platform.isBrowser || localStorage.getItem(KEY) === '1') {
      return;
    }
    this.http.get(`./assets/tmp/on-boarding.json`).subscribe(res => {
      this.obSrv.start(res);
      localStorage.setItem(KEY, '1');
    });
  }
}
