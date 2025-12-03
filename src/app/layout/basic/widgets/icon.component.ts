import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { filter, Subject, takeUntil } from 'rxjs';

/**
 * App Launcher Item Interface
 * 應用程式啟動項目介面
 */
interface AppLauncherItem {
  /** 唯一識別碼 | Unique identifier */
  id: string;
  /** 顯示名稱 | Display name */
  name: string;
  /** 圖示類型 | Icon type */
  icon: string;
  /** 背景顏色類別 | Background color class */
  bgColor: string;
  /** 路由路徑 | Route path */
  route?: string;
  /** 外部連結 | External link */
  externalUrl?: string;
  /** 是否禁用 | Is disabled */
  disabled?: boolean;
  /** 徽章數量 | Badge count */
  badge?: number;
  /** 描述 | Description */
  description?: string;
  /** 分類 | Category */
  category: 'blueprint' | 'system' | 'tools';
}

/**
 * HeaderIconComponent (App Launcher)
 *
 * 應用程式啟動器元件 - 提供快速存取藍圖相關功能
 * App Launcher component - provides quick access to blueprint-related features
 *
 * Features:
 * - Modern (Modernization): Angular 20 Signals for state management
 * - Enterprise-ready (Enterprise-readiness): Context-aware navigation
 * - Structured (Structured): Categorized app items
 * - High Availability (Reliability): Loading states and error handling
 * - Security (Security): Blueprint context aware access
 * - Scalability (Scalability): Extensible item configuration
 * - Maintainability (Maintainability): JSDoc documentation
 * - User Experience (UX): Tooltips, badges, visual feedback
 */
@Component({
  selector: 'header-icon',
  template: `
    <div
      class="alain-default__nav-item"
      nz-dropdown
      [nzDropdownMenu]="iconMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
      (nzVisibleChange)="onVisibleChange($event)"
      nz-tooltip
      [nzTooltipTitle]="hasBlueprint() ? '應用程式' : '請先選擇藍圖'"
    >
      <nz-badge [nzDot]="hasBlueprint()">
        <i nz-icon nzType="appstore" [class.text-primary]="hasBlueprint()"></i>
      </nz-badge>
    </div>
    <nz-dropdown-menu #iconMenu="nzDropdownMenu">
      <div nz-menu class="wd-xl app-launcher">
        <nz-spin [nzSpinning]="loading()" [nzTip]="'載入中...'">
          @if (!hasBlueprint()) {
            <div class="no-blueprint-hint">
              <i nz-icon nzType="inbox" nzTheme="outline" class="hint-icon"></i>
              <p>請先選擇工作藍圖</p>
              <small>選擇藍圖後即可使用相關功能</small>
            </div>
          } @else {
            <!-- Blueprint Tools -->
            <div class="category-label">藍圖工具</div>
            <div nz-row [nzJustify]="'start'" [nzAlign]="'middle'" class="app-icons">
              @for (item of blueprintApps(); track item.id) {
                <div
                  nz-col
                  [nzSpan]="6"
                  class="app-item"
                  [class.disabled]="item.disabled"
                  (click)="onItemClick(item)"
                  nz-tooltip
                  [nzTooltipTitle]="item.description"
                >
                  <nz-badge [nzCount]="item.badge || 0" [nzOverflowCount]="99">
                    <i nz-icon [nzType]="item.icon" [class]="item.bgColor + ' text-white'"></i>
                  </nz-badge>
                  <small>{{ item.name }}</small>
                </div>
              }
            </div>

            <!-- System Tools -->
            <div class="category-label">系統工具</div>
            <div nz-row [nzJustify]="'start'" [nzAlign]="'middle'" class="app-icons">
              @for (item of systemApps(); track item.id) {
                <div
                  nz-col
                  [nzSpan]="6"
                  class="app-item"
                  [class.disabled]="item.disabled"
                  (click)="onItemClick(item)"
                  nz-tooltip
                  [nzTooltipTitle]="item.description"
                >
                  <nz-badge [nzCount]="item.badge || 0" [nzOverflowCount]="99">
                    <i nz-icon [nzType]="item.icon" [class]="item.bgColor + ' text-white'"></i>
                  </nz-badge>
                  <small>{{ item.name }}</small>
                </div>
              }
            </div>
          }
        </nz-spin>
      </div>
    </nz-dropdown-menu>
  `,
  styles: [
    `
      .app-launcher {
        padding: 12px;
        min-width: 280px;
      }

      .category-label {
        font-size: 12px;
        color: #8c8c8c;
        margin: 8px 0 4px 4px;
        font-weight: 500;
      }

      .category-label:first-child {
        margin-top: 0;
      }

      .app-icons {
        padding: 8px 0;
      }

      .app-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .app-item:hover:not(.disabled) {
        background-color: #f5f5f5;
        transform: translateY(-2px);
      }

      .app-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .app-item i[nz-icon] {
        font-size: 24px;
        padding: 12px;
        border-radius: 12px;
        margin-bottom: 6px;
      }

      .app-item small {
        font-size: 11px;
        color: #595959;
        text-align: center;
        line-height: 1.2;
      }

      .no-blueprint-hint {
        text-align: center;
        padding: 24px 16px;
        color: #8c8c8c;
      }

      .no-blueprint-hint .hint-icon {
        font-size: 48px;
        color: #d9d9d9;
        margin-bottom: 12px;
      }

      .no-blueprint-hint p {
        margin: 0 0 4px;
        font-size: 14px;
        color: #595959;
      }

      .no-blueprint-hint small {
        font-size: 12px;
      }

      /* Background color classes */
      .bg-primary {
        background-color: #1890ff;
      }
      .bg-success {
        background-color: #52c41a;
      }
      .bg-warning {
        background-color: #faad14;
      }
      .bg-error {
        background-color: #ff4d4f;
      }
      .bg-geekblue {
        background-color: #2f54eb;
      }
      .bg-purple {
        background-color: #722ed1;
      }
      .bg-magenta {
        background-color: #eb2f96;
      }
      .bg-cyan {
        background-color: #13c2c2;
      }
      .bg-orange {
        background-color: #fa8c16;
      }
      .bg-volcano {
        background-color: #fa541c;
      }
      .bg-gold {
        background-color: #faad14;
      }
      .bg-lime {
        background-color: #a0d911;
      }
      .bg-grey {
        background-color: #8c8c8c;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDropDownModule, NzIconModule, NzMenuModule, NzGridModule, NzSpinModule, NzBadgeModule, NzTooltipModule]
})
export class HeaderIconComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  /** 載入狀態 | Loading state */
  readonly loading = signal(false);

  /** 當前藍圖 ID (從路由提取) | Current blueprint ID (extracted from route) */
  readonly currentBlueprintId = signal<string | null>(null);

  /** 是否有選中的藍圖 | Has selected blueprint */
  readonly hasBlueprint = computed(() => !!this.currentBlueprintId());

  ngOnInit(): void {
    // Extract blueprint ID from current URL
    this.extractBlueprintIdFromUrl(this.router.url);

    // Listen for navigation changes
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.extractBlueprintIdFromUrl(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 從 URL 提取藍圖 ID
   * Extract blueprint ID from URL
   */
  private extractBlueprintIdFromUrl(url: string): void {
    // Match /blueprint/{id} pattern
    const match = url.match(/\/blueprint\/([a-f0-9-]+)/i);
    this.currentBlueprintId.set(match ? match[1] : null);
  }

  /** 藍圖相關應用程式 | Blueprint-related apps */
  readonly blueprintApps = computed<AppLauncherItem[]>(() => {
    const blueprintId = this.currentBlueprintId();
    return [
      {
        id: 'tasks',
        name: '任務管理',
        icon: 'check-square',
        bgColor: 'bg-primary',
        route: blueprintId ? `/blueprint/${blueprintId}/tasks` : undefined,
        description: '管理工作任務與進度',
        category: 'blueprint'
      },
      {
        id: 'files',
        name: '檔案管理',
        icon: 'folder-open',
        bgColor: 'bg-geekblue',
        route: blueprintId ? `/blueprint/${blueprintId}/files` : undefined,
        description: '上傳與管理專案檔案',
        category: 'blueprint'
      },
      {
        id: 'diary',
        name: '施工日誌',
        icon: 'book',
        bgColor: 'bg-success',
        route: blueprintId ? `/blueprint/${blueprintId}/diary` : undefined,
        description: '記錄每日施工進度',
        disabled: true,
        category: 'blueprint'
      },
      {
        id: 'issues',
        name: '問題追蹤',
        icon: 'bug',
        bgColor: 'bg-error',
        route: blueprintId ? `/blueprint/${blueprintId}/issues` : undefined,
        description: '追蹤與處理問題',
        disabled: true,
        category: 'blueprint'
      },
      {
        id: 'acceptance',
        name: '品質驗收',
        icon: 'safety-certificate',
        bgColor: 'bg-orange',
        route: blueprintId ? `/blueprint/${blueprintId}/acceptance` : undefined,
        description: '執行品質驗收檢查',
        disabled: true,
        category: 'blueprint'
      },
      {
        id: 'members',
        name: '成員管理',
        icon: 'team',
        bgColor: 'bg-purple',
        route: blueprintId ? `/blueprint/${blueprintId}/members` : undefined,
        description: '管理藍圖成員與權限',
        disabled: true,
        category: 'blueprint'
      },
      {
        id: 'dashboard',
        name: '儀表板',
        icon: 'dashboard',
        bgColor: 'bg-cyan',
        route: blueprintId ? `/blueprint/${blueprintId}/dashboard` : undefined,
        description: '查看專案總覽',
        disabled: true,
        category: 'blueprint'
      },
      {
        id: 'settings',
        name: '藍圖設定',
        icon: 'setting',
        bgColor: 'bg-grey',
        route: blueprintId ? `/blueprint/${blueprintId}/settings` : undefined,
        description: '設定藍圖參數',
        disabled: true,
        category: 'blueprint'
      }
    ];
  });

  /** 系統工具應用程式 | System tool apps */
  readonly systemApps = computed<AppLauncherItem[]>(() => [
    {
      id: 'calendar',
      name: '行事曆',
      icon: 'calendar',
      bgColor: 'bg-volcano',
      route: '/calendar',
      description: '查看排程與事件',
      disabled: true,
      category: 'system'
    },
    {
      id: 'notifications',
      name: '通知中心',
      icon: 'bell',
      bgColor: 'bg-gold',
      route: '/notifications',
      description: '查看系統通知',
      disabled: true,
      category: 'system'
    },
    {
      id: 'reports',
      name: '報表中心',
      icon: 'bar-chart',
      bgColor: 'bg-lime',
      route: '/reports',
      description: '產生與下載報表',
      disabled: true,
      category: 'system'
    },
    {
      id: 'help',
      name: '說明文件',
      icon: 'question-circle',
      bgColor: 'bg-magenta',
      externalUrl: 'https://docs.gighub.io',
      description: '查看使用說明',
      category: 'system'
    }
  ]);

  /**
   * 下拉選單可見性變更
   * Dropdown visibility change handler
   */
  onVisibleChange(visible: boolean): void {
    if (visible) {
      this.loading.set(true);
      // Simulate quick loading for smooth UX
      setTimeout(() => {
        this.loading.set(false);
      }, 200);
    }
  }

  /**
   * 項目點擊處理
   * Item click handler
   */
  onItemClick(item: AppLauncherItem): void {
    if (item.disabled) return;

    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }
}
