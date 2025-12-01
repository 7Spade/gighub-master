/**
 * Blueprint Workspace Component
 *
 * 藍圖工作區組件
 * Blueprint Workspace Component
 *
 * Main layout component for blueprint workspace.
 * Contains module navigation tabs and renders child module components.
 *
 * @module routes/blueprint/workspace
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';
import { BlueprintContextService, ModuleConfig, MODULE_CONFIGS } from '@shared';
import { ModuleType } from '@core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-blueprint-workspace',
  template: `
    <div class="blueprint-workspace">
      <!-- Page Header with Breadcrumb -->
      <nz-page-header
        [nzTitle]="blueprintContext.blueprintName()"
        [nzSubtitle]="blueprint()?.description || ''"
        nzBackIcon
        (nzBack)="goBack()"
      >
        <!-- Breadcrumb -->
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a routerLink="/blueprint/list">
              <span nz-icon nzType="project"></span>
              藍圖
            </a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>{{ blueprintContext.blueprintName() }}</nz-breadcrumb-item>
          @if (blueprintContext.activeModule()) {
            <nz-breadcrumb-item>{{ getActiveModuleLabel() }}</nz-breadcrumb-item>
          }
        </nz-breadcrumb>

        <!-- Tags -->
        <nz-page-header-tags>
          @if (blueprint()?.is_public) {
            <nz-tag nzColor="green">公開</nz-tag>
          } @else {
            <nz-tag>私有</nz-tag>
          }
          <nz-tag nzColor="blue">{{ blueprint()?.status }}</nz-tag>
        </nz-page-header-tags>

        <!-- Extra Actions -->
        <nz-page-header-extra>
          <nz-space>
            <button *nzSpaceItem nz-button nzType="default" nz-tooltip nzTooltipTitle="成員管理" [routerLink]="['/', 'blueprint', blueprint()?.id, 'members']">
              <span nz-icon nzType="team"></span>
            </button>
            <button *nzSpaceItem nz-button nzType="default" nz-tooltip nzTooltipTitle="設定" nz-dropdown [nzDropdownMenu]="settingsMenu">
              <span nz-icon nzType="setting"></span>
            </button>
          </nz-space>

          <nz-dropdown-menu #settingsMenu="nzDropdownMenu">
            <ul nz-menu>
              <li nz-menu-item>
                <span nz-icon nzType="edit"></span>
                編輯藍圖
              </li>
              <li nz-menu-item>
                <span nz-icon nzType="appstore-add"></span>
                管理模組
              </li>
              <li nz-menu-divider></li>
              <li nz-menu-item nzDanger>
                <span nz-icon nzType="delete"></span>
                刪除藍圖
              </li>
            </ul>
          </nz-dropdown-menu>
        </nz-page-header-extra>
      </nz-page-header>

      <!-- Module Navigation Tabs -->
      <div class="module-tabs-container">
        <nz-tabset
          [nzSelectedIndex]="selectedTabIndex()"
          [nzAnimated]="true"
          nzSize="default"
          nzTabPosition="top"
          (nzSelectedIndexChange)="onTabChange($event)"
        >
          @for (module of enabledModuleConfigs(); track module.type) {
            <nz-tab [nzTitle]="moduleTabTitle">
              <ng-template #moduleTabTitle>
                <span nz-icon [nzType]="module.icon"></span>
                {{ module.label }}
              </ng-template>
            </nz-tab>
          }
        </nz-tabset>
      </div>

      <!-- Module Content Area -->
      <div class="module-content">
        @if (blueprintContext.loading()) {
          <div class="loading-container">
            <nz-spin nzTip="載入中...">
              <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 6 }"></nz-skeleton>
            </nz-spin>
          </div>
        } @else if (blueprintContext.error()) {
          <div class="error-container">
            <span nz-icon nzType="warning" nzTheme="outline" style="font-size: 48px; color: #faad14;"></span>
            <p>{{ blueprintContext.error() }}</p>
            <button nz-button nzType="primary" (click)="retry()">重試</button>
          </div>
        } @else {
          <!-- Router outlet for child module routes -->
          <router-outlet></router-outlet>

          <!-- Default content when no module is selected -->
          @if (!hasChildRoute()) {
            <div class="default-content">
              <div class="module-grid">
                @for (module of enabledModuleConfigs(); track module.type) {
                  <div
                    class="module-card"
                    (click)="navigateToModule(module.type)"
                    [class.active]="blueprintContext.activeModule() === module.type"
                  >
                    <div class="module-icon">
                      <span nz-icon [nzType]="module.icon" nzTheme="outline"></span>
                    </div>
                    <div class="module-info">
                      <h4>{{ module.label }}</h4>
                      <p>{{ module.description }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .blueprint-workspace {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    :host ::ng-deep .ant-page-header {
      background: #fff;
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    .module-tabs-container {
      background: #fff;
      padding: 0 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    :host ::ng-deep .ant-tabs-nav {
      margin-bottom: 0;
    }

    :host ::ng-deep .ant-tabs-tab {
      padding: 12px 16px;
    }

    :host ::ng-deep .ant-tabs-tab .anticon {
      margin-right: 8px;
    }

    .module-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: #fff;
      border-radius: 8px;
    }

    .error-container p {
      margin: 16px 0;
      color: #666;
    }

    .default-content {
      background: #fff;
      border-radius: 8px;
      padding: 24px;
    }

    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .module-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .module-card:hover {
      background: #e6f7ff;
      border-color: #1890ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .module-card.active {
      background: #e6f7ff;
      border-color: #1890ff;
    }

    .module-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #fff;
      border-radius: 8px;
      font-size: 24px;
      color: #1890ff;
      flex-shrink: 0;
    }

    .module-info {
      flex: 1;
      min-width: 0;
    }

    .module-info h4 {
      margin: 0 0 4px;
      font-weight: 500;
      font-size: 16px;
    }

    .module-info p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzBreadCrumbModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
    NzMenuModule,
    NzPageHeaderModule,
    NzSkeletonModule,
    NzSpinModule,
    NzTabsModule,
    NzTagModule,
    NzToolTipModule,
    NzSpaceModule,
    NzAvatarModule
  ]
})
export class BlueprintWorkspaceComponent implements OnInit, OnDestroy {
  readonly blueprintContext = inject(BlueprintContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Computed signals
  readonly blueprint = this.blueprintContext.blueprint;
  readonly enabledModuleConfigs = this.blueprintContext.enabledModuleConfigs;

  // Local signals
  private readonly childRouteActive = signal(false);

  readonly selectedTabIndex = computed(() => {
    const activeModule = this.blueprintContext.activeModule();
    const configs = this.enabledModuleConfigs();
    if (!activeModule) return 0;
    const index = configs.findIndex(c => c.type === activeModule);
    return index >= 0 ? index : 0;
  });

  ngOnInit(): void {
    // Check if there's a child route active
    this.checkChildRoute();
  }

  ngOnDestroy(): void {
    // Clear context when leaving workspace
    // Note: Don't clear if navigating within workspace
  }

  goBack(): void {
    this.router.navigate(['/blueprint/list']);
  }

  onTabChange(index: number): void {
    const configs = this.enabledModuleConfigs();
    if (configs[index]) {
      this.navigateToModule(configs[index].type);
    }
  }

  navigateToModule(moduleType: ModuleType): void {
    this.blueprintContext.navigateToModule(moduleType);
  }

  getActiveModuleLabel(): string {
    const activeModule = this.blueprintContext.activeModule();
    if (!activeModule) return '';
    const config = MODULE_CONFIGS[activeModule];
    return config?.label ?? '';
  }

  hasChildRoute(): boolean {
    // Use ActivatedRoute children for more reliable route detection
    const hasChildren = this.route.children.length > 0;
    const urlSegments = this.router.url.split('/');
    const workspaceIndex = urlSegments.findIndex(s => s === 'workspace');
    // Check if there's a segment after 'workspace' that isn't empty
    const hasModuleRoute = workspaceIndex >= 0 && workspaceIndex < urlSegments.length - 1 && urlSegments[workspaceIndex + 1] !== '';
    return hasChildren && hasModuleRoute;
  }

  retry(): void {
    this.blueprintContext.reloadBlueprint();
  }

  private checkChildRoute(): void {
    this.childRouteActive.set(this.hasChildRoute());
  }
}
