# 藍圖邏輯容器 Blueprint

> Blueprint Shell 元件的標準實作模板

---

## 🎯 概述

藍圖邏輯容器（Blueprint Shell）是系統的核心容器元件，負責：

1. 建立藍圖上下文
2. 注入權限資訊
3. 管理子模組狀態
4. 提供路由出口

---

## 📁 目錄結構

```
src/app/features/blueprint/
├── blueprint.routes.ts
├── shell/
│   └── blueprint-shell/
│       ├── blueprint-shell.component.ts
│       ├── blueprint-shell.component.html
│       └── blueprint-shell.component.less
├── data-access/
│   ├── stores/
│   │   └── blueprint.store.ts
│   ├── services/
│   │   └── workspace.service.ts
│   └── repositories/
│       └── blueprint.repository.ts
├── domain/
│   ├── enums/
│   │   ├── blueprint-status.enum.ts
│   │   └── blueprint-role.enum.ts
│   └── interfaces/
│       └── blueprint.interface.ts
└── ui/
    └── [業務模組元件]
```

---

## 📋 Shell Component 模板

### TypeScript

```typescript
// shell/blueprint-shell/blueprint-shell.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';

import { WorkspaceContextFacade } from '@core/facades/account/workspace-context.facade';
import { BlueprintStore } from '../../data-access/stores/blueprint.store';
import { BlueprintSidebarComponent } from '../components/blueprint-sidebar/blueprint-sidebar.component';

@Component({
  selector: 'app-blueprint-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NzLayoutModule,
    NzSpinModule,
    NzResultModule,
    BlueprintSidebarComponent,
  ],
  templateUrl: './blueprint-shell.component.html',
  styleUrl: './blueprint-shell.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlueprintShellComponent implements OnInit {
  // 依賴注入
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceContext = inject(WorkspaceContextFacade);
  private readonly blueprintStore = inject(BlueprintStore);

  // 從 Store 取得狀態
  protected readonly blueprint = this.blueprintStore.currentBlueprint;
  protected readonly loading = this.blueprintStore.loading;
  protected readonly error = this.blueprintStore.error;

  // 計算屬性
  protected readonly blueprintName = computed(() =>
    this.blueprint()?.name ?? '載入中...'
  );

  protected readonly canEdit = computed(() => {
    const role = this.blueprintStore.currentUserRole();
    return role === 'owner' || role === 'admin' || role === 'member';
  });

  protected readonly canManage = computed(() => {
    const role = this.blueprintStore.currentUserRole();
    return role === 'owner' || role === 'admin';
  });

  // 上下文切換 Effect
  private readonly contextEffect = effect(() => {
    // 當平台上下文變更時，重新載入藍圖資料
    const context = this.workspaceContext.currentContext();
    if (context) {
      console.log('[BlueprintShell] Context changed:', context.contextType);
    }
  });

  ngOnInit(): void {
    // 監聽路由參數
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const blueprintId = params['blueprintId'];
        if (blueprintId) {
          this.loadBlueprint(blueprintId);
        }
      });
  }

  /**
   * 載入藍圖資料
   */
  private async loadBlueprint(blueprintId: string): Promise<void> {
    const blueprint = await this.blueprintStore.loadBlueprint(blueprintId);

    if (!blueprint) {
      // 藍圖不存在或無權限，導航回列表
      this.router.navigate(['/blueprints']);
    }
  }

  /**
   * 重試載入
   */
  protected onRetry(): void {
    const blueprintId = this.route.snapshot.params['blueprintId'];
    if (blueprintId) {
      this.loadBlueprint(blueprintId);
    }
  }
}
```

### HTML Template

```html
<!-- shell/blueprint-shell/blueprint-shell.component.html -->
<nz-layout class="blueprint-shell">
  <!-- 側邊欄 -->
  <nz-sider
    class="blueprint-shell__sidebar"
    [nzWidth]="240"
    [nzCollapsible]="true"
    [nzCollapsedWidth]="64"
  >
    <app-blueprint-sidebar
      [blueprint]="blueprint()"
      [canManage]="canManage()"
    />
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
    @else if (error()) {
      <nz-result
        nzStatus="error"
        [nzTitle]="error()"
        nzSubTitle="請稍後再試或聯繫管理員"
      >
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="onRetry()">
            重新載入
          </button>
          <button nz-button routerLink="/blueprints">
            返回列表
          </button>
        </div>
      </nz-result>
    }

    <!-- 正常內容 -->
    @else if (blueprint()) {
      <nz-content class="blueprint-shell__content">
        <router-outlet></router-outlet>
      </nz-content>
    }
  </nz-layout>
</nz-layout>
```

### LESS Styles

```less
// shell/blueprint-shell/blueprint-shell.component.less
@import '~@delon/theme/styles/layout/default/mixins';

.blueprint-shell {
  min-height: 100vh;

  &__sidebar {
    background: @component-background;
    border-right: 1px solid @border-color-split;
  }

  &__main {
    background: @body-background;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 400px;
  }

  &__content {
    padding: @padding-lg;
    overflow: auto;
  }
}
```

---

## 📦 Blueprint Store 模板

```typescript
// data-access/stores/blueprint.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { BlueprintRepository } from '../repositories/blueprint.repository';
import { Blueprint, BlueprintMember } from '../../domain/interfaces/blueprint.interface';
import { BlueprintRole } from '../../domain/enums/blueprint-role.enum';

@Injectable({ providedIn: 'root' })
export class BlueprintStore {
  private readonly repository = inject(BlueprintRepository);

  // 藍圖列表狀態
  private readonly _blueprints = signal<Blueprint[]>([]);
  private readonly _currentBlueprint = signal<Blueprint | null>(null);
  private readonly _currentUserRole = signal<BlueprintRole | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly blueprints = this._blueprints.asReadonly();
  readonly currentBlueprint = this._currentBlueprint.asReadonly();
  readonly currentUserRole = this._currentUserRole.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly blueprintCount = computed(() => this._blueprints().length);
  readonly blueprintId = computed(() => this._currentBlueprint()?.id ?? null);

  readonly isOwner = computed(() => this._currentUserRole() === BlueprintRole.OWNER);
  readonly isAdmin = computed(() => {
    const role = this._currentUserRole();
    return role === BlueprintRole.OWNER || role === BlueprintRole.ADMIN;
  });

  /**
   * 載入單一藍圖
   */
  async loadBlueprint(id: string): Promise<Blueprint | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprint = await this.repository.findById(id);
      this._currentBlueprint.set(blueprint);

      if (blueprint) {
        // 載入當前用戶的角色
        const role = await this.repository.getCurrentUserRole(id);
        this._currentUserRole.set(role);
      }

      return blueprint;
    } catch (error) {
      this._error.set('載入藍圖失敗');
      console.error('[BlueprintStore] loadBlueprint error:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 載入藍圖列表
   */
  async loadBlueprints(ownerId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprints = await this.repository.findByOwner(ownerId);
      this._blueprints.set(blueprints);
    } catch (error) {
      this._error.set('載入藍圖列表失敗');
      console.error('[BlueprintStore] loadBlueprints error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._blueprints.set([]);
    this._currentBlueprint.set(null);
    this._currentUserRole.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  /**
   * 清除當前藍圖
   */
  clearCurrent(): void {
    this._currentBlueprint.set(null);
    this._currentUserRole.set(null);
  }
}
```

---

## 🔄 上下文傳遞機制

```
平台上下文 (WorkspaceContextFacade)
│  ├── contextType: USER | ORGANIZATION | TEAM | BOT
│  ├── contextId: string (account_id)
│  └── permissions: string[]
│
│  inject() 注入
▼
藍圖上下文 (BlueprintStore)
│  ├── currentBlueprint: Signal<Blueprint | null>
│  ├── currentUserRole: Signal<BlueprintRole | null>
│  └── blueprintId: computed(() => ...)
│
│  inject() 注入
▼
業務模組 (TaskStore, DiaryStore, ...)
│  ├── 從 BlueprintStore 取得 blueprintId
│  └── 根據 blueprintId 載入資料
│
│  inject() 注入
▼
UI 元件 (TaskTreeComponent, ...)
   └── 從 Store 取得狀態並渲染
```

---

## 📚 參考資源

- [系統架構設計圖](../../../docs/architecture/system-architecture.md)
- [架構規則](../architecture-rules.md)
- [Feature 標準結構](./angular-feature.blueprint.md)

---

**最後更新**: 2025-11-27
