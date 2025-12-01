/**
 * Blueprint List Component
 *
 * 藍圖列表元件 - 統一的藍圖列表頁面
 * Unified blueprint list page for all context types (user, org, team)
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Integrates with AuthContextService to:
 * - Automatically load blueprints based on current context
 * - Display context-aware title and descriptions
 * - Filter data according to current tenant
 *
 * @module features/blueprint/ui/blueprint-list
 */

import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthContextService } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { BlueprintStore } from '../../data-access';
import { BlueprintModel, BlueprintStatusEnum } from '../../domain';
import { BlueprintFormDialogComponent, BlueprintFormMode, BlueprintDeleteConfirmDialogComponent } from '../../shell';

/**
 * Context type labels for UI display
 */
const CONTEXT_LABELS: Record<string, { title: string; description: string }> = {
  user: {
    title: '我的藍圖',
    description: '管理您的個人藍圖'
  },
  organization: {
    title: '組織藍圖',
    description: '管理組織的所有藍圖'
  },
  team: {
    title: '團隊藍圖',
    description: '管理團隊共享的藍圖'
  },
  bot: {
    title: '機器人藍圖',
    description: '管理機器人的藍圖'
  }
};

/**
 * Status badge configuration
 */
const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  [BlueprintStatusEnum.ACTIVE]: { text: '活躍', color: 'success' },
  [BlueprintStatusEnum.INACTIVE]: { text: '非活躍', color: 'default' },
  [BlueprintStatusEnum.SUSPENDED]: { text: '已暫停', color: 'warning' },
  [BlueprintStatusEnum.DELETED]: { text: '已刪除', color: 'error' }
};

@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS, NzTableModule, NzTagModule, NzEmptyModule],
  template: `
    <page-header [title]="pageTitle()" [action]="actionTpl"></page-header>
    <ng-template #actionTpl>
      @if (hasValidContext()) {
        <button nz-button nzType="primary" (click)="createBlueprint()">
          <i nz-icon nzType="plus" nzTheme="outline"></i>
          新增藍圖
        </button>
      }
    </ng-template>

    <!-- Context Info Card -->
    <nz-card class="mb-md">
      <nz-alert nzType="info" nzShowIcon [nzMessage]="contextInfoMessage()" [nzDescription]="contextInfoDescription()"></nz-alert>
    </nz-card>

    <!-- Loading State -->
    @if (loading()) {
      <nz-spin nzSimple [nzSize]="'large'" class="d-block text-center py-lg"></nz-spin>
    }

    <!-- Error State -->
    @if (error()) {
      <nz-alert nzType="error" nzShowIcon [nzMessage]="'載入失敗'" [nzDescription]="error()" class="mb-md"></nz-alert>
    }

    <!-- No Context Selected -->
    @if (!hasValidContext() && !loading()) {
      <nz-card>
        <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'請點擊左側的用戶頭像，在下拉選單中選擇一個帳戶、組織或團隊'"></nz-empty>
      </nz-card>
    }

    <!-- Blueprint List -->
    @if (hasValidContext() && !loading() && !error()) {
      <nz-card>
        @if (blueprints().length === 0) {
          <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="emptyMessage()">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="createBlueprint()">
                <i nz-icon nzType="plus" nzTheme="outline"></i>
                建立第一個藍圖
              </button>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-table #blueprintTable [nzData]="blueprints()" [nzPageSize]="10" [nzShowPagination]="blueprints().length > 10" nzSize="middle">
            <thead>
              <tr>
                <th nzWidth="200px">名稱</th>
                <th nzWidth="100px">狀態</th>
                <th nzWidth="100px">公開性</th>
                <th>描述</th>
                <th nzWidth="150px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (blueprint of blueprintTable.data; track blueprint.id) {
                <tr>
                  <td>
                    <a (click)="viewBlueprint(blueprint)">{{ blueprint.name }}</a>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getStatusConfig(blueprint.status).color">
                      {{ getStatusConfig(blueprint.status).text }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="blueprint.isPublic ? 'blue' : 'default'">
                      {{ blueprint.isPublic ? '公開' : '私有' }}
                    </nz-tag>
                  </td>
                  <td>{{ blueprint.description || '-' }}</td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="editBlueprint(blueprint)">
                      <i nz-icon nzType="edit" nzTheme="outline"></i>
                      編輯
                    </button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteBlueprint(blueprint)">
                      <i nz-icon nzType="delete" nzTheme="outline"></i>
                      刪除
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .py-lg {
        padding-top: 48px;
        padding-bottom: 48px;
      }
    `
  ]
})
export class BlueprintListComponent implements OnInit {
  private readonly blueprintStore = inject(BlueprintStore);
  private readonly authContext = inject(AuthContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Store state
  readonly blueprints = this.blueprintStore.blueprints;
  readonly loading = this.blueprintStore.loading;
  readonly error = this.blueprintStore.error;

  // Context state (使用新的 AuthContextService)
  readonly contextType = this.authContext.contextType;
  readonly contextId = this.authContext.contextId;
  readonly contextLabel = this.authContext.contextLabel;

  // 直接使用 AuthContextService 的 hasValidContext
  readonly hasValidContext = this.authContext.hasValidContext;

  readonly pageTitle = computed(() => {
    const type = this.contextType();
    return CONTEXT_LABELS[type]?.title || '藍圖管理';
  });

  readonly pageDescription = computed(() => {
    const type = this.contextType();
    return CONTEXT_LABELS[type]?.description || '';
  });

  readonly contextInfoMessage = computed(() => {
    const type = this.contextType();
    const label = this.contextLabel();

    switch (type) {
      case 'user':
        return `目前上下文：個人帳戶`;
      case 'organization':
        return `目前上下文：組織 - ${label}`;
      case 'team':
        return `目前上下文：團隊 - ${label}`;
      default:
        return '請選擇上下文';
    }
  });

  readonly contextInfoDescription = computed(() => {
    const type = this.contextType();

    switch (type) {
      case 'user':
        return '顯示您個人建立的所有藍圖。您可以在這裡管理、編輯和分享您的藍圖。';
      case 'organization':
        return '顯示此組織的所有藍圖。組織成員可以查看和使用這些藍圖。';
      case 'team':
        return '顯示此團隊的所有藍圖。團隊成員可以協作管理這些藍圖。';
      default:
        return '請點擊左側的用戶頭像，在「切換工作區」下拉選單中選擇一個帳戶、組織或團隊以查看相關藍圖。';
    }
  });

  readonly emptyMessage = computed(() => {
    const type = this.contextType();

    switch (type) {
      case 'user':
        return '您還沒有建立任何藍圖';
      case 'organization':
        return '此組織尚無任何藍圖';
      case 'team':
        return '此團隊尚無任何藍圖';
      default:
        return '沒有可用的藍圖';
    }
  });

  constructor() {
    // Watch for context changes and reload data using effect()
    // This effect monitors the AuthContextService and triggers data loading
    // when the context changes to a valid state
    effect(() => {
      const contextType = this.contextType();
      const contextId = this.contextId();
      const isReady = this.authContext.isReady();

      // Debug log for context monitoring
      console.log('[BlueprintList] 📍 Context changed:', { contextType, contextId, isReady });

      // Load blueprints when context becomes valid and system is ready
      if (isReady && contextId) {
        console.log('[BlueprintList] ✅ Valid context detected, loading blueprints...');
        this.loadBlueprints();
      }
    });
  }

  ngOnInit(): void {
    // Log initialization
    console.log('[BlueprintList] 🚀 Component initialized');
    console.log('[BlueprintList] 📊 Current context:', {
      type: this.contextType(),
      id: this.contextId(),
      hasValidContext: this.hasValidContext(),
      isReady: this.authContext.isReady()
    });
  }

  /**
   * Load blueprints based on current context
   */
  private async loadBlueprints(): Promise<void> {
    const contextId = this.contextId();
    if (!contextId) {
      console.warn('[BlueprintList] No context ID available, skipping load');
      return;
    }

    try {
      await this.blueprintStore.loadOwnerBlueprints(contextId);
    } catch (error) {
      console.error('[BlueprintList] Failed to load blueprints:', error);
    }
  }

  /**
   * Get status configuration for badge
   */
  getStatusConfig(status: string): { text: string; color: string } {
    return STATUS_CONFIG[status] || { text: status, color: 'default' };
  }

  /**
   * Create new blueprint
   */
  createBlueprint(): void {
    const contextId = this.contextId();
    const contextType = this.contextType();

    if (!contextId) {
      this.message.warning('請先選擇一個上下文');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: '新增藍圖',
      nzContent: BlueprintFormDialogComponent,
      nzWidth: 600,
      nzData: {
        mode: 'create' as BlueprintFormMode,
        ownerId: contextId,
        ownerType: contextType
      },
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result: BlueprintModel | undefined) => {
      if (result) {
        this.message.success('藍圖建立成功');
        this.loadBlueprints();
      }
    });
  }

  /**
   * View blueprint details
   * Navigate to blueprint detail page using absolute path
   */
  viewBlueprint(blueprint: BlueprintModel): void {
    this.router.navigate(['/blueprint', blueprint.id]);
  }

  /**
   * Edit blueprint
   */
  editBlueprint(blueprint: BlueprintModel): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯藍圖',
      nzContent: BlueprintFormDialogComponent,
      nzWidth: 600,
      nzData: {
        mode: 'edit' as BlueprintFormMode,
        blueprint
      },
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result: BlueprintModel | undefined) => {
      if (result) {
        this.message.success('藍圖更新成功');
        this.loadBlueprints();
      }
    });
  }

  /**
   * Delete blueprint
   */
  deleteBlueprint(blueprint: BlueprintModel): void {
    const modalRef = this.modal.create({
      nzTitle: '確認刪除',
      nzContent: BlueprintDeleteConfirmDialogComponent,
      nzWidth: 400,
      nzData: {
        blueprint
      },
      nzFooter: null
    });

    modalRef.afterClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadBlueprints();
      }
    });
  }
}
