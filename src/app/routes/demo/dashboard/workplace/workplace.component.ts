import { DecimalPipe, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { G2MiniProgressModule } from '@delon/chart/mini-progress';
import { G2RadarModule } from '@delon/chart/radar';
import { _HttpClient } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { zip } from 'rxjs';

interface BlueprintPhase {
  id: string;
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
  tasks: number;
  completedTasks: number;
}

interface BlueprintMilestone {
  id: string;
  title: string;
  date: string;
  type: 'success' | 'warning' | 'info' | 'default';
  description: string;
}

interface WorkArea {
  id: string;
  name: string;
  manager: string;
  progress: number;
  workers: number;
  status: 'active' | 'paused' | 'completed';
}

@Component({
  selector: 'app-dashboard-workplace',
  templateUrl: './workplace.component.html',
  styleUrls: ['./workplace.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, NzAvatarModule, G2RadarModule, G2MiniProgressModule, NzTimelineModule, NgStyle, DecimalPipe]
})
export class DashboardWorkplaceComponent implements OnInit {
  private readonly http = inject(_HttpClient);
  readonly msg = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  notice: NzSafeAny[] = [];
  activities: NzSafeAny[] = [];
  radarData!: NzSafeAny[];
  loading = true;

  // 藍圖基本信息
  blueprintInfo = {
    name: '華南商業中心項目',
    code: 'BP-2024-001',
    startDate: '2024-03-01',
    endDate: '2025-06-30',
    totalProgress: 45,
    totalBudget: 28500000,
    spentBudget: 12825000
  };

  // 階段列表
  phases: BlueprintPhase[] = [
    {
      id: 'p1',
      name: '基礎工程',
      progress: 100,
      startDate: '2024-03',
      endDate: '2024-05',
      status: 'completed',
      tasks: 24,
      completedTasks: 24
    },
    {
      id: 'p2',
      name: '主體結構',
      progress: 85,
      startDate: '2024-05',
      endDate: '2024-09',
      status: 'in-progress',
      tasks: 36,
      completedTasks: 30
    },
    {
      id: 'p3',
      name: '機電安裝',
      progress: 35,
      startDate: '2024-07',
      endDate: '2024-11',
      status: 'in-progress',
      tasks: 28,
      completedTasks: 10
    },
    { id: 'p4', name: '裝飾裝修', progress: 0, startDate: '2024-10', endDate: '2025-03', status: 'upcoming', tasks: 42, completedTasks: 0 },
    { id: 'p5', name: '竣工驗收', progress: 0, startDate: '2025-03', endDate: '2025-06', status: 'upcoming', tasks: 18, completedTasks: 0 }
  ];

  // 里程碑
  milestones: BlueprintMilestone[] = [
    { id: 'm1', title: '基礎驗收完成', date: '2024-05-15', type: 'success', description: '基礎工程全部完成，通過驗收' },
    { id: 'm2', title: '主體結構封頂', date: '2024-08-30', type: 'warning', description: '主體結構即將封頂，預計延期2天' },
    { id: 'm3', title: '機電聯調', date: '2024-11-15', type: 'info', description: '機電系統聯合調試' },
    { id: 'm4', title: '竣工交付', date: '2025-06-30', type: 'default', description: '項目竣工交付' }
  ];

  // 工區列表
  workAreas: WorkArea[] = [
    { id: 'w1', name: 'A區（商業裙樓）', manager: '王建國', progress: 72, workers: 45, status: 'active' },
    { id: 'w2', name: 'B區（辦公塔樓）', manager: '李明華', progress: 58, workers: 38, status: 'active' },
    { id: 'w3', name: 'C區（地下車庫）', manager: '張曉峰', progress: 85, workers: 28, status: 'active' },
    { id: 'w4', name: 'D區（景觀綠化）', manager: '陳園林', progress: 15, workers: 12, status: 'paused' }
  ];

  // 快速入口
  private readonly iconColors = [
    'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
    'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
    'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)'
  ];

  private readonly linkIcons = ['file-sync', 'calendar', 'team', 'fund', 'safety', 'tool'];

  links = [
    { title: '進度更新', href: '' },
    { title: '工期計劃', href: '' },
    { title: '人員調度', href: '' },
    { title: '成本控制', href: '' },
    { title: '安全管理', href: '' },
    { title: '質量管理', href: '' }
  ];

  getIconBg(index: number): string {
    return this.iconColors[index % this.iconColors.length];
  }

  getLinkIcon(index: number): string {
    return this.linkIcons[index % this.linkIcons.length];
  }

  ngOnInit(): void {
    zip(this.http.get('/chart'), this.http.get('/api/notice'), this.http.get('/api/activities')).subscribe(
      ([chart, notice, activities]: [NzSafeAny, NzSafeAny, NzSafeAny]) => {
        this.radarData = chart.radarData;
        this.notice = notice;
        this.activities = activities.map((item: NzSafeAny) => {
          item.template = item.template.split(/@\{([^{}]*)\}/gi).map((key: string) => {
            if (item[key]) {
              return `<a>${item[key].name}</a>`;
            }
            return key;
          });
          return item;
        });
        this.loading = false;
        this.cdr.detectChanges();
      }
    );
  }

  getPhaseStatusColor(status: string): string {
    const colors: Record<string, string> = {
      completed: '#52c41a',
      'in-progress': '#1890ff',
      upcoming: '#d9d9d9',
      delayed: '#ff4d4f'
    };
    return colors[status] || '#d9d9d9';
  }

  getPhaseStatusText(status: string): string {
    const texts: Record<string, string> = {
      completed: '已完成',
      'in-progress': '進行中',
      upcoming: '待開始',
      delayed: '已延期'
    };
    return texts[status] || '未知';
  }

  getWorkAreaStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'green',
      paused: 'orange',
      completed: 'blue'
    };
    return colors[status] || 'default';
  }

  getWorkAreaStatusText(status: string): string {
    const texts: Record<string, string> = {
      active: '施工中',
      paused: '暫停',
      completed: '完工'
    };
    return texts[status] || '未知';
  }

  getMilestoneColor(type: string): string {
    const colors: Record<string, string> = {
      success: 'green',
      warning: 'orange',
      info: 'blue',
      default: 'gray'
    };
    return colors[type] || 'gray';
  }

  get activeWorkAreasCount(): number {
    return this.workAreas.filter(w => w.status === 'active').length;
  }
}
