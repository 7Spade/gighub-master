import { DatePipe } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, DOCUMENT } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Chart } from '@antv/g2';
import { OnboardingModule, OnboardingService } from '@delon/abc/onboarding';
import { QuickMenuModule } from '@delon/abc/quick-menu';
import { G2BarModule } from '@delon/chart/bar';
import { G2MiniAreaModule } from '@delon/chart/mini-area';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2MiniProgressModule } from '@delon/chart/mini-progress';
import { G2TimelineModule } from '@delon/chart/timeline';
import { _HttpClient } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { timer } from 'rxjs';

interface PersonalTask {
  id: string;
  title: string;
  project: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  progress: number;
  completed: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  taskCount: number;
}

interface QuickAction {
  icon: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-v1',
  templateUrl: './v1.component.html',
  styleUrls: ['./v1.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, G2TimelineModule, G2BarModule, G2MiniBarModule, G2MiniAreaModule, G2MiniProgressModule, QuickMenuModule, OnboardingModule, DatePipe]
})
export class DashboardV1Component implements OnInit {
  private readonly http = inject(_HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly obSrv = inject(OnboardingService);
  private readonly platform = inject(Platform);
  private readonly doc = inject(DOCUMENT);

  // 當前時間問候語
  greeting = this.getGreeting();
  currentDate = new Date();

  // 個人統計數據
  personalStats = {
    myTasks: 12,
    completedToday: 5,
    teamTasks: 45,
    efficiency: 92
  };

  // 個人任務列表
  myTasks: PersonalTask[] = [
    { id: 'T001', title: 'A區基礎驗收準備', project: '華南商業中心', priority: 'high', dueDate: '2024-12-05', progress: 85, completed: false },
    { id: 'T002', title: '材料進場檢驗報告', project: '華南商業中心', priority: 'medium', dueDate: '2024-12-06', progress: 60, completed: false },
    { id: 'T003', title: '施工日誌整理', project: '科技園區項目', priority: 'low', dueDate: '2024-12-07', progress: 30, completed: false },
    { id: 'T004', title: '安全培訓資料編寫', project: '華南商業中心', priority: 'medium', dueDate: '2024-12-08', progress: 45, completed: false },
    { id: 'T005', title: '週報撰寫提交', project: '全部項目', priority: 'high', dueDate: '2024-12-04', progress: 100, completed: true }
  ];

  // 團隊成員
  teamMembers: TeamMember[] = [
    { id: 'M001', name: '王工長', role: '現場負責人', avatar: '1', status: 'online', taskCount: 8 },
    { id: 'M002', name: '李技術員', role: '技術員', avatar: '2', status: 'online', taskCount: 6 },
    { id: 'M003', name: '張安全員', role: '安全員', avatar: '3', status: 'busy', taskCount: 4 },
    { id: 'M004', name: '陳監理', role: '監理', avatar: '4', status: 'online', taskCount: 5 },
    { id: 'M005', name: '劉施工員', role: '施工員', avatar: '5', status: 'offline', taskCount: 3 }
  ];

  // 快捷操作
  quickActions: QuickAction[] = [
    { icon: 'form', title: '填寫日誌', color: '#1890ff' },
    { icon: 'camera', title: '拍照上傳', color: '#52c41a' },
    { icon: 'file-text', title: '查看報表', color: '#722ed1' },
    { icon: 'team', title: '團隊協作', color: '#fa8c16' },
    { icon: 'bell', title: '消息通知', color: '#eb2f96' },
    { icon: 'setting', title: '設置', color: '#13c2c2' }
  ];

  // 最近動態
  recentActivities = [
    { user: '王工長', action: '完成了', target: 'A區主體結構驗收', time: '10 分鐘前', type: 'success' },
    { user: '李技術員', action: '提交了', target: '材料進場清單', time: '30 分鐘前', type: 'info' },
    { user: '張安全員', action: '發現了', target: 'C區安全隱患3處', time: '1 小時前', type: 'warning' },
    { user: '陳監理', action: '審核通過', target: 'B區水電安裝方案', time: '2 小時前', type: 'success' },
    { user: '系統', action: '自動生成', target: '本週施工進度報告', time: '3 小時前', type: 'info' }
  ];

  webSite!: NzSafeAny[];
  salesData!: NzSafeAny[];
  offlineChartData!: NzSafeAny[];

  constructor() {
    timer(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.genOnboarding());
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
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
    this.http.get('/chart').subscribe((res: NzSafeAny) => {
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
    this.http.get(`./assets/tmp/on-boarding.json`).subscribe((res: NzSafeAny) => {
      this.obSrv.start(res);
      localStorage.setItem(KEY, '1');
    });
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    return colors[priority] || 'default';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      online: '#52c41a',
      busy: '#faad14',
      offline: '#d9d9d9'
    };
    return colors[status] || '#d9d9d9';
  }

  getActivityTypeColor(type: string): string {
    const colors: Record<string, string> = {
      success: 'green',
      warning: 'orange',
      info: 'blue'
    };
    return colors[type] || 'default';
  }

  toggleTask(task: PersonalTask): void {
    task.completed = !task.completed;
    task.progress = task.completed ? 100 : task.progress;
  }

  get completedTasksCount(): number {
    return this.myTasks.filter(t => t.completed).length;
  }

  get pendingTasksCount(): number {
    return this.myTasks.filter(t => !t.completed).length;
  }

  get onlineTeamMembersCount(): number {
    return this.teamMembers.filter(m => m.status === 'online').length;
  }
}
