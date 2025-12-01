/**
 * Blueprint Shell Component
 *
 * 藍圖邏輯容器組件
 * Blueprint logical container component
 *
 * 負責：
 * 1. 建立藍圖上下文
 * 2. 注入權限資訊
 * 3. 管理子模組狀態
 * 4. 提供路由出口
 *
 * @module features/blueprint/shell
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, RouterLink } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { BlueprintFacade } from '@core';
import { BlueprintBusinessModel, WorkspaceContextService } from '@shared';
import { TaskStore, DiaryStore, TodoStore } from '../data-access';

/**
 * 藍圖模組項目定義
 */
interface BlueprintModule {
  key: string;
  title: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-blueprint-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzSpinModule,
    NzResultModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzAvatarModule,
    NzTagModule,
    NzDropDownModule
  ],
  template: `
    <nz-layout class="blueprint-shell">
      <!-- 側邊欄 -->
      <nz-sider
        class="blueprint-shell__sidebar"
        [nzWidth]="240"
        [nzCollapsible]="true"
        [nzCollapsedWidth]="64"
        [(nzCollapsed)]="collapsed"
      >
        <!-- 藍圖標題 -->
        <div class="blueprint-header" [class.collapsed]="collapsed()">
          @if (blueprint(); as bp) {
            @if (bp.cover_url) {
              <nz-avatar [nzSize]="collapsed() ? 32 : 48" [nzSrc]="bp.cover_url" nzShape="square"></nz-avatar>
            } @else {
              <nz-avatar [nzSize]="collapsed() ? 32 : 48" nzIcon="project" nzShape="square"></nz-avatar>
            }
            @if (!collapsed()) {
              <div class="blueprint-info">
                <h3 class="blueprint-name">{{ bp.name }}</h3>
                <nz-tag [nzColor]="bp.is_public ? 'green' : 'default'">
                  {{ bp.is_public ? '公開' : '私有' }}
                </nz-tag>
              </div>
            }
          }
        </div>

        <!-- 導航菜單 -->
        <ul nz-menu [nzMode]="collapsed() ? 'vertical' : 'inline'" [nzInlineCollapsed]="collapsed()">
          @for (module of modules; track module.key) {
            <li
              nz-menu-item
              [nzSelected]="isModuleActive(module.key)"
              [routerLink]="['./', module.path]"
            >
              <span nz-icon [nzType]="module.icon"></span>
              <span>{{ module.title }}</span>
            </li>
          }
        </ul>
      </nz-sider>

      <!-- 主內容區 -->
      <nz-layout class="blueprint-shell__main">
        <!-- 載入中 -->
        @if (loading()) {
          <div class="blueprint-shell__loading">
            <nz-spin nzSize="large" nzTip="載入藍圖中..."></nz-spin>
          </div>
        }

        <!-- 錯誤狀態 -->
        @else if (error(); as errorMsg) {
          <nz-result
            nzStatus="error"
            [nzTitle]="errorMsg"
            nzSubTitle="請稍後再試或聯繫管理員"
          >
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="retry()">
                重新載入
              </button>
              <button nz-button routerLink="/blueprint/list">
                返回列表
              </button>
            </div>
          </nz-result>
        }

        <!-- 正常內容 -->
        @else if (blueprint()) {
          <!-- 頂部導航 -->
          <nz-header class="blueprint-shell__header">
            <nz-breadcrumb>
              <nz-breadcrumb-item>
                <a routerLink="/blueprint/list">
                  <span nz-icon nzType="home"></span>
                  藍圖
                </a>
              </nz-breadcrumb-item>
              <nz-breadcrumb-item>{{ blueprint()?.name }}</nz-breadcrumb-item>
              <nz-breadcrumb-item>{{ currentModuleTitle() }}</nz-breadcrumb-item>
            </nz-breadcrumb>

            <div class="header-actions">
              <button nz-button nz-dropdown [nzDropdownMenu]="settingsMenu" nzPlacement="bottomRight">
                <span nz-icon nzType="setting"></span>
                設定
              </button>
              <nz-dropdown-menu #settingsMenu="nzDropdownMenu">
                <ul nz-menu>
                  <li nz-menu-item [routerLink]="['./members']">
                    <span nz-icon nzType="team"></span>
                    成員管理
                  </li>
                  <li nz-menu-item [routerLink]="['./settings']">
                    <span nz-icon nzType="setting"></span>
                    藍圖設定
                  </li>
                </ul>
              </nz-dropdown-menu>
            </div>
          </nz-header>

          <!-- 內容區 -->
          <nz-content class="blueprint-shell__content">
            <router-outlet></router-outlet>
          </nz-content>
        }
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .blueprint-shell {
      min-height: 100vh;
      background: #f0f2f5;
    }

    .blueprint-shell__sidebar {
      background: #fff;
      border-right: 1px solid #f0f0f0;
    }

    .blueprint-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #f0f0f0;

      &.collapsed {
        justify-content: center;
        padding: 16px 8px;
      }
    }

    .blueprint-info {
      flex: 1;
      overflow: hidden;
    }

    .blueprint-name {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .blueprint-shell__main {
      background: #f0f2f5;
    }

    .blueprint-shell__header {
      background: #fff;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f0f0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .blueprint-shell__loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 400px;
    }

    .blueprint-shell__content {
      padding: 24px;
      overflow: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintShellComponent implements OnInit {
  // 依賴注入
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly taskStore = inject(TaskStore);
  private readonly diaryStore = inject(DiaryStore);
  private readonly todoStore = inject(TodoStore);

  // 狀態
  readonly collapsed = signal(false);
  readonly blueprint = signal<BlueprintBusinessModel | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // 模組列表
  readonly modules: BlueprintModule[] = [
    { key: 'dashboard', title: '儀表板', icon: 'dashboard', path: 'dashboard' },
    { key: 'tasks', title: '任務管理', icon: 'project', path: 'tasks' },
    { key: 'diary', title: '施工日誌', icon: 'file-text', path: 'diary' },
    { key: 'todo', title: '待辦事項', icon: 'check-square', path: 'todo' },
    { key: 'files', title: '檔案管理', icon: 'folder', path: 'files' }
  ];

  // 計算屬性
  readonly currentModuleTitle = computed(() => {
    const url = this.router.url;
    const module = this.modules.find(m => url.includes(m.path));
    return module?.title ?? '概覽';
  });

  readonly canEdit = computed(() => {
    // TODO: 根據 blueprint member role 判斷
    return true;
  });

  readonly canManage = computed(() => {
    // TODO: 根據 blueprint member role 判斷
    return true;
  });

  // 上下文切換 Effect
  private readonly contextEffect = effect(() => {
    const contextType = this.workspaceContext.contextType();
    if (contextType) {
      console.log('[BlueprintShell] Context changed:', contextType);
    }
  });

  ngOnInit(): void {
    // 監聽路由參數
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const blueprintId = params['id'];
        if (blueprintId) {
          this.loadBlueprint(blueprintId);
        }
      });
  }

  /**
   * 載入藍圖資料
   */
  private async loadBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const blueprint = await this.blueprintFacade.findById(blueprintId);
      if (blueprint) {
        this.blueprint.set(blueprint);
        // 載入子模組資料
        await this.loadModuleData(blueprintId);
      } else {
        this.error.set('藍圖不存在或無權限存取');
      }
    } catch (err) {
      console.error('[BlueprintShell] loadBlueprint error:', err);
      this.error.set('載入藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 載入模組資料
   */
  private async loadModuleData(blueprintId: string): Promise<void> {
    const currentUser = this.workspaceContext.currentUser();

    // 並行載入各模組資料
    await Promise.all([
      this.taskStore.loadTasks(blueprintId),
      this.diaryStore.loadDiaries(blueprintId),
      currentUser?.id
        ? this.todoStore.loadTodos(blueprintId, currentUser.id)
        : Promise.resolve()
    ]);
  }

  /**
   * 判斷模組是否活動中
   */
  isModuleActive(moduleKey: string): boolean {
    return this.router.url.includes(moduleKey);
  }

  /**
   * 重試載入
   */
  retry(): void {
    const blueprintId = this.route.snapshot.params['id'];
    if (blueprintId) {
      this.loadBlueprint(blueprintId);
    }
  }
}
