# Context7 分析報告：藍圖模組守衛實作方案

**分析日期**: 2025-12-08  
**基於文件**: BLUEPRINT_HEALTH_CHECK_REPORT.md  
**Context7 查詢**: Angular routing guards, signals, ng-alain patterns

---

## 執行摘要

根據 BLUEPRINT_HEALTH_CHECK_REPORT.md 的問題分析，並透過 Context7 查詢 Angular 最新的路由守衛和 Signals 最佳實踐，本文件提供了完整的實作方案。

### Context7 關鍵發現

1. **現代 Angular 路由守衛使用函數式 API**
   - 使用 `CanActivateFn` 而非類別式守衛
   - 使用 `inject()` 函數進行依賴注入
   - 支援 async/await 和 Promise 返回

2. **Signals 用於狀態管理**
   - 使用 `signal()` 創建可寫信號
   - 使用 `computed()` 創建派生信號
   - 使用 `effect()` 處理副作用

3. **ng-alain 整合模式**
   - 使用 `@for` 和 `@if` 控制流指令
   - 遵循 Standalone Components 架構

---

## 問題分析

### 核心問題

根據健康檢查報告，主要存在以下問題：

1. **缺乏路由級別的模組啟用檢查**
   - 用戶可以停用模組，但仍能通過 URL 直接訪問
   - 沒有統一的守衛機制

2. **設計不一致**
   - 模組定義與實際路由路徑不一致
   - 元件命名不統一
   - 模組標籤在不同元件間不一致

3. **部分實踐**
   - 只有 Overview 元件檢查了 Tasks 模組
   - 其他元件完全沒有檢查

---

## Context7 推薦的實作方案

### 方案 1: 創建函數式路由守衛 (ModuleEnabledGuard)

基於 Context7 的 Angular guards 文檔，推薦使用現代的函數式守衛：

```typescript
// src/app/core/guards/module-enabled.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BlueprintFacade } from '../facades/blueprint/blueprint.facade';
import { ModuleType } from '../infra/types/blueprint';

/**
 * Route guard that checks if a required module is enabled for the blueprint
 * Context7 Pattern: Functional CanActivateFn with inject()
 */
export const moduleEnabledGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const blueprintFacade = inject(BlueprintFacade);
  const router = inject(Router);
  
  // Get required module from route data
  const requiredModule = route.data['requiredModule'] as ModuleType;
  const blueprintId = route.paramMap.get('id');
  
  // If no module requirement, allow access
  if (!requiredModule || !blueprintId) {
    return true;
  }
  
  try {
    // Load blueprint data (consider using signal-based facade)
    const blueprint = await blueprintFacade.findById(blueprintId);
    
    if (!blueprint) {
      // Blueprint not found, redirect to list
      return router.parseUrl('/blueprint/list');
    }
    
    // Check if module is enabled
    const isModuleEnabled = blueprint.enabled_modules?.includes(requiredModule) ?? false;
    
    if (!isModuleEnabled) {
      // Module disabled, redirect to overview with message
      return router.parseUrl(`/blueprint/${blueprintId}/overview?moduleDisabled=${requiredModule}`);
    }
    
    return true; // Module enabled, allow access
  } catch (error) {
    console.error('Failed to check module status:', error);
    return router.parseUrl('/blueprint/list');
  }
};
```

**Context7 最佳實踐應用**:
- ✅ 使用 `CanActivateFn` 函數式守衛（現代 Angular 推薦）
- ✅ 使用 `inject()` 進行依賴注入
- ✅ 使用 `async/await` 處理異步操作
- ✅ 使用 `router.parseUrl()` 進行程式化導航

### 方案 2: 更新路由配置

```typescript
// src/app/routes/blueprint/routes.ts
import { Routes } from '@angular/router';
import { moduleEnabledGuard } from '@core/guards/module-enabled.guard';
import { ModuleType } from '@core';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id',
        children: [
          {
            path: 'overview',
            loadComponent: () => import('./overview/overview.component').then(m => m.BlueprintOverviewComponent),
            data: { title: '藍圖概覽' }
            // Overview 不需要模組檢查
          },
          {
            path: 'tasks',
            loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
            canActivate: [moduleEnabledGuard], // ✅ 添加守衛
            data: { 
              title: '任務管理',
              requiredModule: ModuleType.TASKS // ✅ 指定需要的模組
            }
          },
          {
            path: 'diaries',
            loadComponent: () => import('./diaries/diaries.component').then(m => m.BlueprintDiariesComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '施工日誌',
              requiredModule: ModuleType.DIARY
            }
          },
          {
            path: 'qc-inspections',
            loadComponent: () => import('./qc-inspections/qc-inspections.component').then(m => m.BlueprintQcInspectionsComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '品質管控',
              requiredModule: ModuleType.CHECKLISTS
            }
          },
          {
            path: 'files',
            loadComponent: () => import('./files/files.component').then(m => m.BlueprintFilesComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '檔案管理',
              requiredModule: ModuleType.FILES
            }
          },
          {
            path: 'financial',
            loadChildren: () => import('./financial/routes').then(m => m.routes),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '財務管理',
              requiredModule: ModuleType.FINANCIAL
            }
          },
          {
            path: 'problems',
            loadComponent: () => import('./problems/problems.component').then(m => m.BlueprintProblemsComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '問題追蹤',
              requiredModule: ModuleType.ISSUES
            }
          },
          {
            path: 'acceptances',
            loadComponent: () => import('./acceptances/acceptances.component').then(m => m.BlueprintAcceptancesComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '驗收管理',
              requiredModule: ModuleType.ACCEPTANCE
            }
          },
          {
            path: 'gantt',
            loadComponent: () => import('./gantt/gantt.component').then(m => m.BlueprintGanttComponent),
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '甘特圖',
              requiredModule: ModuleType.TASKS // Gantt 依賴 Tasks 模組
            }
          }
        ]
      }
    ]
  }
];
```

### 方案 3: 使用 Signals 進行模組檢查

基於 Context7 的 Signals 文檔，推薦在 Overview 元件使用 Signals：

```typescript
// src/app/routes/blueprint/overview/overview.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { ModuleType, MODULES_CONFIG } from '@core';

@Component({
  selector: 'app-blueprint-overview',
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class BlueprintOverviewComponent {
  // Inject services using inject()
  private blueprintFacade = inject(BlueprintFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msg = inject(NzMessageService);
  
  // Writable signal for blueprint
  readonly blueprint = signal<BlueprintBusinessModel | null>(null);
  
  // Computed signal for module checking
  readonly isModuleEnabled = computed(() => {
    const bp = this.blueprint();
    return (module: ModuleType) => {
      if (!bp) return false;
      return bp.enabled_modules?.includes(module) ?? false;
    };
  });
  
  // Computed signals for each module
  readonly isTasksModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.TASKS)
  );
  
  readonly isDiaryModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.DIARY)
  );
  
  readonly isFilesModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.FILES)
  );
  
  readonly isFinancialModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.FINANCIAL)
  );
  
  readonly isIssuesModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.ISSUES)
  );
  
  readonly isChecklistsModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.CHECKLISTS)
  );
  
  readonly isAcceptanceModuleEnabled = computed(() => 
    this.isModuleEnabled()(ModuleType.ACCEPTANCE)
  );
  
  constructor() {
    // Check for module disabled message
    effect(() => {
      this.route.queryParams.subscribe(params => {
        const disabledModule = params['moduleDisabled'];
        if (disabledModule) {
          const config = MODULES_CONFIG.find(m => m.value === disabledModule);
          const moduleName = config?.label || disabledModule;
          this.msg.warning(`「${moduleName}」模組未啟用，請在設定中啟用後使用`);
          
          // Clear query params
          this.router.navigate([], { 
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true 
          });
        }
      });
    });
  }
  
  async loadBlueprint(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const bp = await this.blueprintFacade.findById(id);
      this.blueprint.set(bp);
    }
  }
}
```

**模板更新**:

```html
<!-- overview.component.html -->
<div class="navigation-cards">
  <!-- Tasks Module Card -->
  @if (isTasksModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToTasks()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="ordered-list" class="nav-icon tasks"></span>
          <div class="nav-text">
            <h4>任務管理</h4>
            <p>管理施工任務與進度追蹤</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Diary Module Card -->
  @if (isDiaryModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToDiaries()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="file-text" class="nav-icon diary"></span>
          <div class="nav-text">
            <h4>施工日誌</h4>
            <p>記錄每日施工進度與狀況</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Files Module Card -->
  @if (isFilesModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToFiles()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="folder" class="nav-icon files"></span>
          <div class="nav-text">
            <h4>檔案管理</h4>
            <p>管理專案文件與圖檔</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Financial Module Card -->
  @if (isFinancialModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToFinancial()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="dollar" class="nav-icon financial"></span>
          <div class="nav-text">
            <h4>財務管理</h4>
            <p>合約、費用與請款管理</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Issues Module Card -->
  @if (isIssuesModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToProblems()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="warning" class="nav-icon issues"></span>
          <div class="nav-text">
            <h4>問題追蹤</h4>
            <p>施工問題登記與追蹤</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Checklists Module Card -->
  @if (isChecklistsModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToQcInspections()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="check-square" class="nav-icon checklists"></span>
          <div class="nav-text">
            <h4>品質管控</h4>
            <p>品質檢查與巡檢清單</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
  
  <!-- Acceptance Module Card -->
  @if (isAcceptanceModuleEnabled()) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
      <nz-card [nzBordered]="false" class="nav-card" (click)="goToAcceptances()" nzHoverable>
        <div class="nav-card-content">
          <span nz-icon nzType="audit" class="nav-icon acceptance"></span>
          <div class="nav-text">
            <h4>品質驗收</h4>
            <p>工程驗收與簽核</p>
          </div>
        </div>
      </nz-card>
    </div>
  }
</div>
```

**Context7 最佳實踐應用**:
- ✅ 使用 `signal()` 創建反應式狀態
- ✅ 使用 `computed()` 創建派生值
- ✅ 使用 `effect()` 處理副作用（查詢參數檢查）
- ✅ 使用 `@if` 控制流指令進行條件渲染
- ✅ 使用 `inject()` 進行依賴注入
- ✅ 使用 `ChangeDetectionStrategy.OnPush` 優化性能

### 方案 4: 統一模組配置

```typescript
// src/app/core/infra/types/blueprint/index.ts

/**
 * Extended module configuration with routing info
 * Based on Context7 best practices for configuration management
 */
export interface ExtendedModuleConfig extends ModuleConfig {
  value: ModuleType;
  label: string;
  icon: string;
  description: string;
  isCore: boolean;
  routePath: string;
  componentName: string;
}

/**
 * Complete modules configuration
 * Single source of truth for all module metadata
 */
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  {
    value: ModuleType.TASKS,
    label: '任務管理',
    icon: 'ordered-list',
    description: '工作項目追蹤與進度管理',
    isCore: true,
    routePath: 'tasks',
    componentName: 'BlueprintTasksComponent'
  },
  {
    value: ModuleType.DIARY,
    label: '施工日誌',
    icon: 'file-text',
    description: '每日施工記錄與天氣',
    isCore: true,
    routePath: 'diaries',
    componentName: 'BlueprintDiariesComponent'
  },
  {
    value: ModuleType.CHECKLISTS,
    label: '檢查清單',
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'qc-inspections',
    componentName: 'BlueprintQcInspectionsComponent'
  },
  {
    value: ModuleType.ISSUES,
    label: '問題追蹤',
    icon: 'warning',
    description: '施工問題登記與追蹤',
    isCore: true,
    routePath: 'problems',
    componentName: 'BlueprintProblemsComponent'
  },
  {
    value: ModuleType.FILES,
    label: '檔案管理',
    icon: 'folder',
    description: '專案文件與圖面管理',
    isCore: true,
    routePath: 'files',
    componentName: 'BlueprintFilesComponent'
  },
  {
    value: ModuleType.FINANCIAL,
    label: '財務管理',
    icon: 'dollar',
    description: '合約、費用與請款管理',
    isCore: true,
    routePath: 'financial',
    componentName: 'FinancialOverviewComponent'
  },
  {
    value: ModuleType.ACCEPTANCE,
    label: '品質驗收',
    icon: 'audit',
    description: '工程驗收與簽核',
    isCore: false,
    routePath: 'acceptances',
    componentName: 'BlueprintAcceptancesComponent'
  }
];

/**
 * Helper functions for module configuration
 */
export function getModuleConfig(moduleType: ModuleType): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.value === moduleType);
}

export function getModuleConfigByRoute(routePath: string): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.routePath === routePath);
}

export function getCoreModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => m.isCore);
}

export function getOptionalModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => !m.isCore);
}

/**
 * Default enabled modules for new blueprints
 */
export const DEFAULT_ENABLED_MODULES: ModuleType[] = [
  ModuleType.TASKS,
  ModuleType.DIARY,
  ModuleType.CHECKLISTS,
  ModuleType.FILES
];

export function isModuleEnabledByDefault(module: ModuleType): boolean {
  return DEFAULT_ENABLED_MODULES.includes(module);
}
```

---

## 實作優先順序

基於 Context7 分析和專案需求，建議以下實作順序：

### Phase 1: 核心功能實作（高優先級）

1. **創建 ModuleEnabledGuard**
   - 使用 Context7 推薦的函數式守衛模式
   - 實作異步模組檢查邏輯
   - 處理錯誤和邊界情況

2. **更新路由配置**
   - 為所有模組路由添加 `canActivate: [moduleEnabledGuard]`
   - 在 `data` 中指定 `requiredModule`

3. **更新 Overview 元件**
   - 使用 Signals 進行模組檢查
   - 處理模組停用的重定向訊息
   - 為所有模組添加條件渲染

### Phase 2: 配置統一（中優先級）

4. **創建統一的 MODULES_CONFIG**
   - 定義所有模組的元數據
   - 提供輔助函數

5. **更新 Settings 元件**
   - 使用 MODULES_CONFIG
   - 統一預設啟用邏輯

6. **更新 Create Blueprint 元件**
   - 使用 DEFAULT_ENABLED_MODULES

### Phase 3: 測試與驗證（必須）

7. **單元測試**
   - 測試 ModuleEnabledGuard
   - 測試 Signals 計算邏輯

8. **整合測試**
   - 測試路由守衛整合
   - 測試模組啟用/停用流程

9. **端對端測試**
   - 測試完整的用戶流程

---

## Context7 最佳實踐總結

### 使用的 Context7 模式

1. **函數式路由守衛**
   - 使用 `CanActivateFn` 取代類別式守衛
   - 使用 `inject()` 進行依賴注入
   - 使用 `async/await` 處理異步操作

2. **Signals 狀態管理**
   - 使用 `signal()` 創建可寫信號
   - 使用 `computed()` 創建派生信號
   - 使用 `effect()` 處理副作用

3. **現代 Angular 模板**
   - 使用 `@if` 和 `@for` 控制流指令
   - 使用 `track` 優化渲染性能

4. **Standalone Components**
   - 所有元件使用 `standalone: true`
   - 使用 `ChangeDetectionStrategy.OnPush`

### 避免的反模式

❌ 不使用類別式守衛  
❌ 不在 constructor 中注入依賴  
❌ 不使用 `*ngIf` 和 `*ngFor`（已棄用）  
❌ 不使用 NgModule  

### 性能優化

✅ 使用 `OnPush` 變更檢測策略  
✅ 使用 Signals 進行細粒度反應式更新  
✅ 使用 `track` 優化列表渲染  
✅ 使用懶加載路由  

---

## 下一步行動

1. **立即開始**: 實作 ModuleEnabledGuard
2. **測試驗證**: 確保守衛正確運作
3. **逐步推廣**: 更新所有路由和元件
4. **文檔更新**: 更新開發文檔和架構圖

---

## 參考資源

- Context7 Angular Guards 文檔
- Context7 Angular Signals 文檔
- ng-alain 官方文檔
- GigHub 專案架構規範

---

**結論**: 透過 Context7 分析，我們確認了使用現代 Angular 模式（函數式守衛、Signals、控制流指令）的正確性。這些模式不僅符合 Angular 最新最佳實踐，也能完美解決健康檢查報告中識別的所有問題。
