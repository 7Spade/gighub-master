/**
 * Blueprint Detail Component
 *
 * 藍圖詳情組件
 * Blueprint detail component
 *
 * Displays blueprint overview and provides navigation to modules.
 *
 * @module routes/blueprint
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlueprintFacade, ModuleType } from '@core';
import { BlueprintBusinessModel, WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-blueprint-detail',
  template: `
    <nz-spin [nzSpinning]="loading()">
      @if (blueprint()) {
        <nz-page-header
          [nzTitle]="blueprint()!.name"
          [nzSubtitle]="blueprint()!.description || '無描述'"
          nzBackIcon
          (nzBack)="goBack()"
        >
          <nz-page-header-extra>
            <button nz-button nzType="primary" (click)="navigateToMembers()">
              <span nz-icon nzType="team"></span>
              成員管理
            </button>
          </nz-page-header-extra>
          <nz-page-header-tags>
            @if (blueprint()!.is_public) {
              <nz-tag nzColor="green">公開</nz-tag>
            } @else {
              <nz-tag>私有</nz-tag>
            }
            <nz-tag nzColor="blue">{{ blueprint()!.status }}</nz-tag>
          </nz-page-header-tags>
        </nz-page-header>

        <div class="content-container">
          <nz-card nzTitle="藍圖資訊" class="info-card">
            <nz-descriptions [nzColumn]="2" nzBordered>
              <nz-descriptions-item nzTitle="藍圖名稱">
                {{ blueprint()!.name }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態">
                <nz-tag [nzColor]="blueprint()!.status === 'active' ? 'green' : 'default'">
                  {{ blueprint()!.status }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">
                {{ blueprint()!.created_at | date:'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="更新時間">
                {{ blueprint()!.updated_at | date:'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="描述" [nzSpan]="2">
                {{ blueprint()!.description || '無描述' }}
              </nz-descriptions-item>
            </nz-descriptions>
          </nz-card>

          <nz-card nzTitle="啟用模組" class="modules-card">
            <div class="modules-grid">
              @for (module of enabledModules(); track module.type) {
                <div class="module-item" (click)="navigateToModule(module.type)">
                  <nz-avatar
                    [nzSize]="48"
                    [nzIcon]="module.icon"
                    [nzShape]="'square'"
                    class="module-icon"
                  ></nz-avatar>
                  <span class="module-name">{{ module.label }}</span>
                </div>
              }
              @if (enabledModules().length === 0) {
                <nz-empty nzNotFoundContent="尚未啟用任何模組"></nz-empty>
              }
            </div>
          </nz-card>
        </div>
      } @else if (!loading()) {
        <nz-empty
          nzNotFoundContent="找不到藍圖"
          [nzNotFoundFooter]="emptyFooter"
        >
          <ng-template #emptyFooter>
            <button nz-button nzType="primary" (click)="goBack()">
              返回列表
            </button>
          </ng-template>
        </nz-empty>
      }
    </nz-spin>
  `,
  styles: [`
    .content-container {
      padding: 24px;
    }
    .info-card {
      margin-bottom: 24px;
    }
    .modules-card {
      margin-bottom: 24px;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
    }
    .module-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .module-item:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }
    .module-icon {
      margin-bottom: 8px;
      background-color: #f0f5ff;
      color: #1890ff;
    }
    .module-name {
      font-size: 14px;
      color: #333;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzIconModule,
    NzPageHeaderModule,
    NzSpinModule,
    NzTabsModule,
    NzTagModule,
    NzAvatarModule,
    NzEmptyModule
  ]
})
export class BlueprintDetailComponent implements OnInit {
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  blueprint = signal<BlueprintBusinessModel | null>(null);
  loading = signal(false);

  private blueprintId = signal<string | null>(null);

  // Module configuration
  private readonly moduleConfig: Record<string, { label: string; icon: string }> = {
    [ModuleType.TASKS]: { label: '任務管理', icon: 'project' },
    [ModuleType.DIARY]: { label: '施工日誌', icon: 'book' },
    [ModuleType.DASHBOARD]: { label: '儀表板', icon: 'dashboard' },
    [ModuleType.FILES]: { label: '檔案管理', icon: 'folder' },
    [ModuleType.TODOS]: { label: '待辦事項', icon: 'check-square' },
    [ModuleType.CHECKLISTS]: { label: '檢查清單', icon: 'ordered-list' },
    [ModuleType.ISSUES]: { label: '問題追蹤', icon: 'bug' },
    [ModuleType.BOT_WORKFLOW]: { label: '自動化流程', icon: 'robot' }
  };

  enabledModules = signal<Array<{ type: string; label: string; icon: string }>>([]);

  constructor() {
    // React to blueprint changes to update enabled modules
    effect(() => {
      const bp = this.blueprint();
      if (bp?.enabled_modules) {
        const modules = (bp.enabled_modules as string[]).map(type => ({
          type,
          label: this.moduleConfig[type]?.label || type,
          icon: this.moduleConfig[type]?.icon || 'appstore'
        }));
        this.enabledModules.set(modules);
      } else {
        this.enabledModules.set([]);
      }
    });
  }

  ngOnInit(): void {
    // Get blueprint ID from route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadBlueprint(id);
      }
    });
  }

  async loadBlueprint(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const blueprint = await this.blueprintFacade.findById(id);
      this.blueprint.set(blueprint);
      if (!blueprint) {
        this.msg.warning('找不到指定的藍圖');
      }
    } catch (error) {
      console.error('[BlueprintDetailComponent] Failed to load blueprint:', error);
      this.msg.error('載入藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/blueprint/list']);
  }

  navigateToMembers(): void {
    const id = this.blueprintId();
    if (id) {
      this.router.navigate(['/blueprint', id, 'members']);
    }
  }

  navigateToModule(moduleType: string): void {
    const id = this.blueprintId();
    if (id) {
      // Navigate to the specific module within the blueprint
      // For now, show a message as module routes are not implemented yet
      this.msg.info(`${this.moduleConfig[moduleType]?.label || moduleType} 模組功能即將推出`);
    }
  }
}
