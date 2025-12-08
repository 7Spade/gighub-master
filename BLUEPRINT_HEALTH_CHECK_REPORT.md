# 藍圖邏輯容器健康檢查報告
# Blueprint Logic Container Health Check Report

**檢查日期**: 2025-01-27  
**檢查範圍**: `/src/app/routes/blueprint/` 模組及相關核心邏輯  
**檢查人員**: GitHub Copilot AI Agent  

---

## 執行摘要 (Executive Summary)

本次健康檢查針對 GigHub 專案中的藍圖邏輯容器進行全面審查，發現以下核心問題：

### 🔴 嚴重問題 (Critical Issues)
1. **啟用模組功能未完全實踐** - 可在設定頁面啟用/停用模組，但路由和元件存取未檢查模組啟用狀態
2. **缺乏統一的模組守衛機制** - 沒有路由級別的模組啟用檢查

### 🟡 重要問題 (Important Issues)
1. **設計不一致** - 模組定義與使用方式在不同元件間不一致
2. **元件命名不統一** - 部分元件使用 `BlueprintXxxComponent`，部分直接用功能名稱
3. **模組啟用檢查不完整** - 只有 overview 和 routes 做了部分檢查

### 🟢 良好實踐 (Good Practices)
1. Standalone Components 架構
2. 使用 Signal 進行狀態管理
3. 使用 Facade 模式封裝業務邏輯
4. 明確的模組類型定義 (ModuleType enum)

---

## 詳細問題分析 (Detailed Analysis)

### 1. 啟用模組功能實踐問題

#### 問題描述
藍圖設定頁面 (`settings.component.ts`) 允許用戶啟用/停用模組，但此功能未在整個系統中一致實踐：

#### 1.1 設定頁面的模組管理

**檔案**: `src/app/routes/blueprint/settings/settings.component.ts`

```typescript
// 可以啟用/停用模組
private initModuleSettings(blueprint: BlueprintBusinessModel): void {
  const modules: ModuleSetting[] = [
    {
      key: ModuleType.TASKS,
      name: '任務管理',
      description: '管理專案任務、子任務和進度追蹤',
      icon: 'check-square',
      enabled: blueprint.enabled_modules?.includes(ModuleType.TASKS) ?? true
    },
    {
      key: ModuleType.DIARY,
      name: '施工日誌',
      description: '記錄每日施工進度和工作內容',
      icon: 'book',
      enabled: blueprint.enabled_modules?.includes(ModuleType.DIARY) ?? true
    },
    // ... 其他模組
  ];
  this.moduleSettings.set(modules);
}

// 儲存時更新啟用的模組
async saveSettings(): Promise<void> {
  const enabledModulesArray = this.moduleSettings()
    .filter(m => m.enabled)
    .map(m => m.key);
  
  await this.blueprintFacade.updateBlueprint(blueprint.id, {
    enabledModules: enabledModulesArray
  });
}
```

✅ **做對的部分**:
- 提供了 UI 介面讓用戶管理模組
- 正確地將啟用的模組儲存到資料庫

❌ **問題**:
- 更改模組啟用狀態後，沒有實際影響用戶能否訪問對應功能
- 所有路由都是開放的，不檢查模組是否啟用

#### 1.2 路由配置沒有模組檢查

**檔案**: `src/app/routes/blueprint/routes.ts`

```typescript
export const routes: Routes = [
  {
    path: '',
    children: [
      // ... 列表路由
      {
        path: ':id',
        children: [
          {
            path: 'overview',
            loadComponent: () => import('./overview/overview.component').then(m => m.BlueprintOverviewComponent),
            data: { title: '藍圖概覽' }
          },
          {
            path: 'tasks',
            loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
            data: { title: '任務管理' }
            // ❌ 沒有檢查 ModuleType.TASKS 是否啟用
          },
          {
            path: 'diaries',
            loadComponent: () => import('./diaries/diaries.component').then(m => m.BlueprintDiariesComponent),
            data: { title: '施工日誌' }
            // ❌ 沒有檢查 ModuleType.DIARY 是否啟用
          },
          {
            path: 'qc-inspections',
            loadComponent: () => import('./qc-inspections/qc-inspections.component').then(m => m.BlueprintQcInspectionsComponent),
            data: { title: '品質管控' }
            // ❌ 沒有檢查 ModuleType.CHECKLISTS 是否啟用
          },
          {
            path: 'files',
            loadComponent: () => import('./files/files.component').then(m => m.BlueprintFilesComponent),
            data: { title: '檔案管理' }
            // ❌ 沒有檢查 ModuleType.FILES 是否啟用
          },
          {
            path: 'financial',
            loadChildren: () => import('./financial/routes').then(m => m.routes),
            data: { title: '財務管理' }
            // ❌ 沒有檢查 ModuleType.FINANCIAL 是否啟用
          },
          {
            path: 'problems',
            loadComponent: () => import('./problems/problems.component').then(m => m.BlueprintProblemsComponent),
            data: { title: '問題追蹤' }
            // ❌ 沒有檢查 ModuleType.ISSUES 是否啟用
          },
          {
            path: 'acceptances',
            loadComponent: () => import('./acceptances/acceptances.component').then(m => m.BlueprintAcceptancesComponent),
            data: { title: '驗收管理' }
            // ❌ 沒有檢查 ModuleType.ACCEPTANCE 是否啟用
          }
          // ... 其他路由
        ]
      }
    ]
  }
];
```

❌ **問題**:
- 所有模組路由都是無條件可訪問的
- 即使用戶停用了某個模組，仍然可以直接通過 URL 訪問該功能
- 沒有使用 `canActivate` 路由守衛進行模組啟用檢查

#### 1.3 Overview 元件的部分實踐

**檔案**: `src/app/routes/blueprint/overview/overview.component.ts`

```typescript
/** Check if tasks module is enabled */
readonly isTasksModuleEnabled = computed(() => {
  const modules = this.blueprint()?.enabled_modules || [];
  return modules.includes(ModuleType.TASKS);
});

// 在模板中使用
@if (isTasksModuleEnabled()) {
  <nz-tab nzTitle="任務管理">
    <!-- 任務管理內容 -->
  </nz-tab>
}

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
```

✅ **做對的部分**:
- Overview 元件正確檢查任務模組是否啟用
- 根據啟用狀態顯示/隱藏 UI 元素

❌ **問題**:
- **只檢查了 Tasks 模組**，其他模組（日誌、檔案、財務等）的導航卡片都沒有檢查
- 即使隱藏了導航卡片，用戶仍然可以直接訪問 URL

#### 1.4 其他元件完全沒有檢查

檢查以下元件的原始碼：

- ❌ `tasks.component.ts` - 沒有檢查 Tasks 模組是否啟用
- ❌ `diaries.component.ts` - 沒有檢查 Diary 模組是否啟用
- ❌ `files.component.ts` - 沒有檢查 Files 模組是否啟用
- ❌ `financial/*.component.ts` - 沒有檢查 Financial 模組是否啟用
- ❌ `problems.component.ts` - 沒有檢查 Issues 模組是否啟用
- ❌ `qc-inspections.component.ts` - 沒有檢查 Checklists 模組是否啟用
- ❌ `acceptances.component.ts` - 沒有檢查 Acceptance 模組是否啟用
- ❌ `gantt.component.ts` - 沒有檢查 Tasks 模組是否啟用

**分析結果**: 19 個元件路由中，只有 Overview 元件對 Tasks 模組做了部分 UI 檢查，其他全部沒有任何模組啟用檢查。

---

### 2. 設計不一致問題

#### 2.1 模組定義與實際使用不一致

**核心模組定義** (`src/app/core/infra/types/blueprint/index.ts`):

```typescript
export enum ModuleType {
  // ============ Core Modules (核心模組) ============
  TASKS = 'tasks',          // 任務管理
  DIARY = 'diary',          // 施工日誌
  CHECKLISTS = 'checklists', // 檢查清單
  ISSUES = 'issues',        // 問題追蹤
  FILES = 'files',          // 檔案管理
  FINANCIAL = 'financial',  // 財務管理
  
  // ============ Optional Modules (選用模組) ============
  ACCEPTANCE = 'acceptance', // 品質驗收
  
  // ============ Deprecated (保留但不推薦) ============
  DASHBOARD = 'dashboard',
  BOT_WORKFLOW = 'bot_workflow',
  TODOS = 'todos'
}
```

**但實際路由和元件**:

| 模組定義 | 路由路徑 | 元件名稱 | 問題 |
|---------|---------|---------|------|
| `TASKS` | `/tasks` | `BlueprintTasksComponent` | ✅ 一致 |
| `DIARY` | `/diaries` | `BlueprintDiariesComponent` | ⚠️ 路徑是複數形式 |
| `CHECKLISTS` | `/qc-inspections` | `BlueprintQcInspectionsComponent` | ❌ 完全不同的名稱 |
| `ISSUES` | `/problems` | `BlueprintProblemsComponent` | ❌ 完全不同的名稱 |
| `FILES` | `/files` | `BlueprintFilesComponent` | ✅ 一致 |
| `FINANCIAL` | `/financial` | `FinancialOverviewComponent` 等 | ✅ 基本一致 |
| `ACCEPTANCE` | `/acceptances` | `BlueprintAcceptancesComponent` | ⚠️ 路徑是複數形式 |
| N/A | `/gantt` | `BlueprintGanttComponent` | ⚠️ 不是模組，但存在路由 |

**問題分析**:

1. **Checklists 模組映射問題**:
   - 模組名稱: `CHECKLISTS` (檢查清單)
   - 路由: `/qc-inspections` (品質檢查)
   - 元件: `BlueprintQcInspectionsComponent`
   - **問題**: 模組定義和實際實作名稱完全不同，容易造成混淆

2. **Issues 模組映射問題**:
   - 模組名稱: `ISSUES` (問題追蹤)
   - 路由: `/problems` (問題)
   - 元件: `BlueprintProblemsComponent`
   - **問題**: 模組定義和實際實作名稱不同

3. **單複數不一致**:
   - `diary` → `/diaries`
   - `acceptance` → `/acceptances`
   - 但 `tasks` → `/tasks`, `files` → `/files`

4. **非模組路由的存在**:
   - `/gantt`, `/reports`, `/search`, `/permissions`, `/api-gateway`, `/notifications`, `/activities`, `/members`, `/settings`, `/overview`
   - 這些路由不對應任何 ModuleType，但存在於藍圖容器中
   - 應該明確區分「核心路由」和「模組路由」

#### 2.2 元件命名不統一

**檢查所有元件命名**:

| 元件檔案 | 類別名稱 | 命名模式 |
|---------|---------|---------|
| `overview.component.ts` | `BlueprintOverviewComponent` | ✅ Blueprint前綴 |
| `list.component.ts` | `BlueprintListComponent` | ✅ Blueprint前綴 |
| `tasks.component.ts` | `BlueprintTasksComponent` | ✅ Blueprint前綴 |
| `diaries.component.ts` | `BlueprintDiariesComponent` | ✅ Blueprint前綴 |
| `files.component.ts` | `BlueprintFilesComponent` | ✅ Blueprint前綴 |
| `qc-inspections.component.ts` | `BlueprintQcInspectionsComponent` | ✅ Blueprint前綴 |
| `problems.component.ts` | `BlueprintProblemsComponent` | ✅ Blueprint前綴 |
| `acceptances.component.ts` | `BlueprintAcceptancesComponent` | ✅ Blueprint前綴 |
| `members.component.ts` | `BlueprintMembersComponent` | ✅ Blueprint前綴 |
| `settings.component.ts` | `BlueprintSettingsComponent` | ✅ Blueprint前綴 |
| `permissions.component.ts` | `BlueprintPermissionsComponent` | ✅ Blueprint前綴 |
| `gantt.component.ts` | `BlueprintGanttComponent` | ✅ Blueprint前綴 |
| `reports.component.ts` | `BlueprintReportsComponent` | ✅ Blueprint前綴 |
| `search.component.ts` | `BlueprintAdvancedSearchComponent` | ⚠️ 增加了 Advanced |
| `notifications.component.ts` | `BlueprintNotificationSettingsComponent` | ⚠️ 增加了 Settings |
| `activities.component.ts` | `BlueprintActivitiesComponent` | ✅ Blueprint前綴 |
| `api-gateway.component.ts` | `BlueprintApiGatewayComponent` | ✅ Blueprint前綴 |
| `financial/financial-overview.component.ts` | `FinancialOverviewComponent` | ❌ 無Blueprint前綴 |
| `financial/contract-list.component.ts` | `ContractListComponent` | ❌ 無Blueprint前綴 |
| `financial/expense-list.component.ts` | `ExpenseListComponent` | ❌ 無Blueprint前綴 |
| `financial/payment-list.component.ts` | `PaymentListComponent` | ❌ 無Blueprint前綴 |
| `financial/payment-request-list.component.ts` | `PaymentRequestListComponent` | ❌ 無Blueprint前綴 |

**問題**:
- Financial 子模組的元件都沒有 `Blueprint` 前綴
- 部分元件名稱添加了額外的描述詞（`Advanced`, `Settings`）
- 不一致的命名會導致程式碼可讀性和維護性下降

#### 2.3 模組啟用檢查的不一致

**只有 Overview 元件做了檢查**:

```typescript
// overview.component.ts
readonly isTasksModuleEnabled = computed(() => {
  const modules = this.blueprint()?.enabled_modules || [];
  return modules.includes(ModuleType.TASKS);
});
```

**其他元件都沒有類似的檢查**:
- Tasks 元件沒有檢查自己是否啟用
- Diaries 元件沒有檢查
- Files 元件沒有檢查
- 財務相關元件沒有檢查
- 問題追蹤元件沒有檢查
- QC 檢查元件沒有檢查

---

### 3. 缺乏統一的模組守衛機制

#### 問題描述

目前沒有統一的路由守衛機制來檢查模組是否啟用。理想的實作應該是：

```typescript
// 理想的實作（目前不存在）
{
  path: 'tasks',
  loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
  canActivate: [ModuleEnabledGuard],
  data: { 
    title: '任務管理',
    requiredModule: ModuleType.TASKS // 應該檢查這個模組
  }
}
```

**缺失的功能**:

1. **ModuleEnabledGuard 路由守衛** - 不存在
2. **模組啟用狀態的全局管理** - 缺乏
3. **未授權訪問的統一處理** - 沒有統一的錯誤頁面或重定向邏輯

---

## 4. 其他發現的問題

### 4.1 模組標籤映射不一致

**Settings 元件的模組標籤** (`settings.component.ts`):

```typescript
private initModuleSettings(blueprint: BlueprintBusinessModel): void {
  const modules: ModuleSetting[] = [
    { key: ModuleType.TASKS, name: '任務管理', ... },
    { key: ModuleType.DIARY, name: '施工日誌', ... },
    { key: ModuleType.CHECKLISTS, name: '品質管控', ... },  // ← 注意這裡
    { key: ModuleType.FILES, name: '檔案管理', ... },
    { key: ModuleType.FINANCIAL, name: '財務管理', ... },
    { key: ModuleType.ISSUES, name: '問題追蹤', ... }
  ];
}
```

**Overview 元件的模組標籤** (`overview.component.ts`):

```typescript
getModuleLabel(module: string): string {
  const labelMap: Record<string, string> = {
    tasks: '任務管理',
    diary: '施工日誌',
    checklists: '檢查清單',  // ← 與 Settings 不同
    issues: '問題追蹤',
    files: '檔案管理',
    financial: '財務管理',
    acceptance: '品質驗收',
    // ...
  };
  return labelMap[module] || module;
}
```

**核心定義的模組標籤** (`core/infra/types/blueprint/index.ts`):

```typescript
export const ESSENTIAL_MODULES: ModuleConfig[] = [
  { value: ModuleType.TASKS, label: '任務管理', ... },
  { value: ModuleType.DIARY, label: '施工日誌', ... },
  { value: ModuleType.CHECKLISTS, label: '檢查清單', ... },  // ← 與核心定義一致
  { value: ModuleType.ISSUES, label: '問題追蹤', ... },
  { value: ModuleType.FILES, label: '檔案管理', ... },
  { value: ModuleType.FINANCIAL, label: '財務管理', ... },
  { value: ModuleType.ACCEPTANCE, label: '品質驗收', ... }
];
```

**問題**: 
- Settings 元件中 CHECKLISTS 標籤為「品質管控」
- Overview 元件和核心定義為「檢查清單」
- 應該統一使用核心定義的標籤

### 4.2 已棄用模組仍在使用

**核心定義中的已棄用模組**:

```typescript
// ============ Deprecated (保留但不推薦) ============
/** @deprecated 使用獨立視圖而非模組 | Use standalone view instead */
DASHBOARD = 'dashboard',
/** @deprecated 進階功能，暫不支援 | Advanced feature, not supported yet */
BOT_WORKFLOW = 'bot_workflow',
/** @deprecated 與 tasks 功能重複 | Redundant with tasks */
TODOS = 'todos'
```

**但在 Overview 元件中仍然有映射**:

```typescript
getModuleLabel(module: string): string {
  const labelMap: Record<string, string> = {
    // ...
    // Deprecated but kept for backward compatibility
    dashboard: '儀表板',
    bot_workflow: '自動化流程',
    todos: '待辦事項'
  };
  return labelMap[module] || module;
}
```

**問題**: 
- 已棄用的模組仍然保留在標籤映射中
- 可能會造成混淆
- 應該移除或添加明確的棄用標記

### 4.3 Create Blueprint 預設啟用模組

**Create Blueprint 元件** (`create-blueprint.component.ts`):

```typescript
this.form = this.fb.group({
  name: ['', [Validators.required, Validators.maxLength(100)]],
  slug: ['', [Validators.required, Validators.maxLength(50)]],
  description: ['', Validators.maxLength(500)],
  isPublic: [false],
  enabledModules: [[ModuleType.TASKS]],  // ← 預設只啟用 Tasks
});

// 建立時
const blueprint = await this.blueprintFacade.createBlueprint({
  // ...
  enabledModules: this.form.value.enabledModules || [ModuleType.TASKS],
});
```

**問題**:
- 建立藍圖時預設只啟用 Tasks 模組
- 但在 Settings 元件中，預設值是不同的：
  ```typescript
  enabled: blueprint.enabled_modules?.includes(ModuleType.TASKS) ?? true
  enabled: blueprint.enabled_modules?.includes(ModuleType.DIARY) ?? true
  enabled: blueprint.enabled_modules?.includes(ModuleType.CHECKLISTS) ?? true
  enabled: blueprint.enabled_modules?.includes(ModuleType.FILES) ?? true
  enabled: blueprint.enabled_modules?.includes(ModuleType.FINANCIAL) ?? false
  enabled: blueprint.enabled_modules?.includes(ModuleType.ISSUES) ?? false
  ```
- 預設啟用策略不一致

---

## 影響評估 (Impact Assessment)

### 對用戶的影響

1. **安全性風險 (中等)**: 
   - 用戶停用某個模組後，仍然可以通過直接 URL 訪問
   - 可能暴露不應該訪問的功能或資料

2. **用戶體驗混淆 (高)**:
   - UI 顯示模組已停用，但功能仍然可用
   - 用戶不理解為什麼停用模組沒有實際效果
   - 可能導致誤操作和資料混亂

3. **功能一致性 (高)**:
   - 不同元件對同一概念使用不同名稱
   - 增加用戶學習成本和使用難度

### 對開發的影響

1. **可維護性 (高)**:
   - 命名不一致導致程式碼難以理解和維護
   - 模組定義與實作分離，增加重構難度

2. **可擴展性 (中等)**:
   - 缺乏統一的模組管理機制
   - 添加新模組需要在多處修改，容易遺漏

3. **測試複雜度 (中等)**:
   - 沒有統一的模組啟用檢查邏輯
   - 需要為每個元件單獨測試模組啟用狀態

---

## 建議改進方案 (Recommendations)

### 🔴 優先級：高 (High Priority)

#### 1. 建立統一的模組守衛機制

**目標**: 在路由級別統一檢查模組是否啟用

**實作步驟**:

1. **建立 ModuleEnabledGuard 路由守衛**

```typescript
// src/app/core/guards/module-enabled.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BlueprintFacade } from '../facades/blueprint/blueprint.facade';
import { ModuleType } from '../infra/types/blueprint';

export const moduleEnabledGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const blueprintFacade = inject(BlueprintFacade);
  const router = inject(Router);
  
  // 從路由資料中獲取需要的模組
  const requiredModule = route.data['requiredModule'] as ModuleType;
  const blueprintId = route.paramMap.get('id');
  
  if (!requiredModule || !blueprintId) {
    return true; // 沒有指定模組要求，允許訪問
  }
  
  try {
    // 載入藍圖資料
    const blueprint = await blueprintFacade.findById(blueprintId);
    
    if (!blueprint) {
      // 藍圖不存在，重定向到列表
      return router.parseUrl('/blueprint/list');
    }
    
    // 檢查模組是否啟用
    const isModuleEnabled = blueprint.enabled_modules?.includes(requiredModule) ?? false;
    
    if (!isModuleEnabled) {
      // 模組未啟用，重定向到 overview 並顯示訊息
      return router.parseUrl(`/blueprint/${blueprintId}/overview?moduleDisabled=${requiredModule}`);
    }
    
    return true; // 模組已啟用，允許訪問
  } catch (error) {
    console.error('Failed to check module status:', error);
    return router.parseUrl('/blueprint/list');
  }
};
```

2. **更新路由配置**

```typescript
// src/app/routes/blueprint/routes.ts
import { moduleEnabledGuard } from '@core/guards/module-enabled.guard';
import { ModuleType } from '@core';

export const routes: Routes = [
  {
    path: '',
    children: [
      // ...
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
            canActivate: [moduleEnabledGuard],
            data: { 
              title: '任務管理',
              requiredModule: ModuleType.TASKS
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
              requiredModule: ModuleType.TASKS // Gantt 需要 Tasks 模組
            }
          }
        ]
      }
    ]
  }
];
```

3. **在 Overview 元件中處理模組未啟用的情況**

```typescript
// overview.component.ts
ngOnInit(): void {
  this.loadBlueprint();
  
  // 檢查是否因為模組未啟用而被重定向
  this.route.queryParams.subscribe(params => {
    const disabledModule = params['moduleDisabled'];
    if (disabledModule) {
      const moduleName = this.getModuleLabel(disabledModule);
      this.msg.warning(`「${moduleName}」模組未啟用，請在設定中啟用後使用`);
      // 清除 query params
      this.router.navigate([], { 
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true 
      });
    }
  });
}
```

#### 2. 統一模組命名和映射

**目標**: 建立統一的模組資訊來源

**實作步驟**:

1. **擴展核心模組定義**

```typescript
// src/app/core/infra/types/blueprint/index.ts

/**
 * Extended module configuration with routing info
 * 擴展模組配置，包含路由資訊
 */
export interface ExtendedModuleConfig extends ModuleConfig {
  value: ModuleType;
  label: string;
  icon: string;
  description: string;
  isCore: boolean;
  routePath: string;        // 路由路徑
  componentName: string;    // 元件名稱（用於文檔）
}

/**
 * Complete modules configuration
 * 完整模組配置
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
    label: '檢查清單',  // 統一為「檢查清單」
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'qc-inspections',  // 保持現有路由
    componentName: 'BlueprintQcInspectionsComponent'
  },
  {
    value: ModuleType.ISSUES,
    label: '問題追蹤',
    icon: 'warning',
    description: '施工問題登記與追蹤',
    isCore: true,
    routePath: 'problems',  // 保持現有路由
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
 * Get module config by module type
 * 根據模組類型獲取配置
 */
export function getModuleConfig(moduleType: ModuleType): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.value === moduleType);
}

/**
 * Get module config by route path
 * 根據路由路徑獲取配置
 */
export function getModuleConfigByRoute(routePath: string): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.routePath === routePath);
}

/**
 * Get all core modules
 * 獲取所有核心模組
 */
export function getCoreModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => m.isCore);
}

/**
 * Get all optional modules
 * 獲取所有選用模組
 */
export function getOptionalModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => !m.isCore);
}
```

2. **更新 Settings 元件使用統一配置**

```typescript
// settings.component.ts
import { MODULES_CONFIG, getModuleConfig } from '@core';

private initModuleSettings(blueprint: BlueprintBusinessModel): void {
  const modules: ModuleSetting[] = MODULES_CONFIG.map(config => ({
    key: config.value,
    name: config.label,
    description: config.description,
    icon: config.icon,
    enabled: blueprint.enabled_modules?.includes(config.value) ?? config.isCore
  }));
  this.moduleSettings.set(modules);
}
```

3. **更新 Overview 元件使用統一配置**

```typescript
// overview.component.ts
import { getModuleConfig } from '@core';

getModuleLabel(module: string): string {
  const config = getModuleConfig(module as ModuleType);
  return config?.label || module;
}
```

#### 3. 更新 Overview 元件檢查所有模組

**目標**: Overview 元件應該檢查所有模組的啟用狀態

**實作步驟**:

```typescript
// overview.component.ts
import { MODULES_CONFIG, ModuleType } from '@core';

// 為每個模組建立啟用檢查的 computed
readonly isModuleEnabled = computed(() => {
  const enabledModules = this.blueprint()?.enabled_modules || [];
  return (module: ModuleType) => enabledModules.includes(module);
});

// 或者為常用模組建立單獨的 computed
readonly isTasksModuleEnabled = computed(() => {
  return this.isModuleEnabled()(ModuleType.TASKS);
});

readonly isDiaryModuleEnabled = computed(() => {
  return this.isModuleEnabled()(ModuleType.DIARY);
});

// ... 其他模組
```

**更新模板**:

```html
<!-- 只有當模組啟用時才顯示導航卡片 -->
@if (isModuleEnabled()(ModuleType.TASKS)) {
  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
    <nz-card [nzBordered]="false" class="nav-card" (click)="goToTasks()" nzHoverable>
      <!-- 任務管理卡片內容 -->
    </nz-card>
  </div>
}

@if (isModuleEnabled()(ModuleType.DIARY)) {
  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
    <nz-card [nzBordered]="false" class="nav-card" (click)="goToDiaries()" nzHoverable>
      <!-- 施工日誌卡片內容 -->
    </nz-card>
  </div>
}

<!-- 其他模組卡片... -->
```

---

### 🟡 優先級：中 (Medium Priority)

#### 4. 統一元件命名

**目標**: 所有 Blueprint 容器內的元件應該有一致的命名

**建議**:

1. **Financial 子模組元件重命名**:
   - `FinancialOverviewComponent` → `BlueprintFinancialOverviewComponent`
   - `ContractListComponent` → `BlueprintContractListComponent`
   - `ExpenseListComponent` → `BlueprintExpenseListComponent`
   - `PaymentListComponent` → `BlueprintPaymentListComponent`
   - `PaymentRequestListComponent` → `BlueprintPaymentRequestListComponent`

2. **特殊命名的元件調整**:
   - `BlueprintAdvancedSearchComponent` → `BlueprintSearchComponent`
   - `BlueprintNotificationSettingsComponent` → `BlueprintNotificationsComponent`

**注意**: 這個改動會影響到路由配置和其他引用這些元件的地方，需要謹慎進行。

#### 5. 統一預設啟用策略

**目標**: 建立藍圖時和顯示設定時的預設值應該一致

**建議**:

1. **在核心定義中明確預設啟用的模組**:

```typescript
// src/app/core/infra/types/blueprint/index.ts

/**
 * Default enabled modules for new blueprints
 * 新藍圖的預設啟用模組
 */
export const DEFAULT_ENABLED_MODULES: ModuleType[] = [
  ModuleType.TASKS,
  ModuleType.DIARY,
  ModuleType.CHECKLISTS,
  ModuleType.FILES
];

/**
 * Check if module should be enabled by default
 * 檢查模組是否應該預設啟用
 */
export function isModuleEnabledByDefault(module: ModuleType): boolean {
  return DEFAULT_ENABLED_MODULES.includes(module);
}
```

2. **更新 Create Blueprint 元件**:

```typescript
// create-blueprint.component.ts
import { DEFAULT_ENABLED_MODULES } from '@core';

this.form = this.fb.group({
  // ...
  enabledModules: [DEFAULT_ENABLED_MODULES],
});
```

3. **更新 Settings 元件**:

```typescript
// settings.component.ts
import { isModuleEnabledByDefault } from '@core';

private initModuleSettings(blueprint: BlueprintBusinessModel): void {
  const modules: ModuleSetting[] = MODULES_CONFIG.map(config => ({
    key: config.value,
    name: config.label,
    description: config.description,
    icon: config.icon,
    enabled: blueprint.enabled_modules?.includes(config.value) ?? isModuleEnabledByDefault(config.value)
  }));
  this.moduleSettings.set(modules);
}
```

#### 6. 路由路徑與模組類型的對應文檔

**目標**: 明確記錄路由路徑與模組類型的對應關係

**建議**: 在 `MODULES_CONFIG` 中已經包含了 `routePath`，可以利用這個資訊生成文檔：

```typescript
// src/app/core/infra/types/blueprint/index.ts

/**
 * Module to route mapping documentation
 * 模組與路由的對應關係文檔
 * 
 * | 模組類型 | 路由路徑 | 元件名稱 | 說明 |
 * |---------|---------|---------|------|
 * | TASKS | tasks | BlueprintTasksComponent | 任務管理 |
 * | DIARY | diaries | BlueprintDiariesComponent | 施工日誌 |
 * | CHECKLISTS | qc-inspections | BlueprintQcInspectionsComponent | 品質檢查（注意：路由名稱與模組名稱不同） |
 * | ISSUES | problems | BlueprintProblemsComponent | 問題追蹤（注意：路由名稱與模組名稱不同） |
 * | FILES | files | BlueprintFilesComponent | 檔案管理 |
 * | FINANCIAL | financial | BlueprintFinancialOverviewComponent | 財務管理 |
 * | ACCEPTANCE | acceptances | BlueprintAcceptancesComponent | 品質驗收 |
 */
```

---

### 🟢 優先級：低 (Low Priority)

#### 7. 移除已棄用模組的殘留程式碼

**目標**: 清理已棄用模組的相關程式碼

**建議**:

```typescript
// overview.component.ts
getModuleLabel(module: string): string {
  const config = getModuleConfig(module as ModuleType);
  if (config) {
    return config.label;
  }
  
  // 已棄用的模組 - 僅用於向後相容
  const deprecatedMap: Record<string, string> = {
    dashboard: '儀表板 (已棄用)',
    bot_workflow: '自動化流程 (已棄用)',
    todos: '待辦事項 (已棄用)'
  };
  
  return deprecatedMap[module] || module;
}
```

#### 8. 添加模組啟用變更的審計日誌

**目標**: 記錄模組啟用狀態的變更歷史

**建議**: 在 Settings 元件儲存模組設定時，記錄變更到活動日誌：

```typescript
// settings.component.ts
async saveSettings(): Promise<void> {
  const blueprint = this.blueprint();
  if (!blueprint) return;

  try {
    this.loading.set(true);

    const oldModules = blueprint.enabled_modules || [];
    const newModules = this.moduleSettings()
      .filter(m => m.enabled)
      .map(m => m.key);
    
    // 計算變更
    const added = newModules.filter(m => !oldModules.includes(m));
    const removed = oldModules.filter(m => !newModules.includes(m));
    
    await this.blueprintFacade.updateBlueprint(blueprint.id, {
      enabledModules: newModules
    });
    
    // 記錄變更到活動日誌
    if (added.length > 0 || removed.length > 0) {
      const changes = [];
      if (added.length > 0) {
        changes.push(`啟用: ${added.map(m => getModuleConfig(m)?.label).join(', ')}`);
      }
      if (removed.length > 0) {
        changes.push(`停用: ${removed.map(m => getModuleConfig(m)?.label).join(', ')}`);
      }
      // TODO: 記錄到活動日誌系統
      console.log('Module changes:', changes.join('; '));
    }

    this.msg.success('設定已儲存');
  } catch (err) {
    this.msg.error('儲存設定失敗');
  } finally {
    this.loading.set(false);
  }
}
```

---

## 實作優先順序建議 (Implementation Priority)

### Phase 1: 核心功能修復 (1-2 週)
1. ✅ 建立 ModuleEnabledGuard 路由守衛
2. ✅ 更新所有路由配置添加守衛
3. ✅ 在 Overview 元件處理模組未啟用的情況
4. ✅ 測試所有模組路由的存取控制

### Phase 2: 架構改進 (1 週)
1. ✅ 建立統一的 MODULES_CONFIG
2. ✅ 更新 Settings 和 Overview 元件使用統一配置
3. ✅ 統一預設啟用策略
4. ✅ 更新相關測試

### Phase 3: 命名規範化 (1-2 週)
1. ✅ 重命名 Financial 子模組元件
2. ✅ 更新所有引用
3. ✅ 更新路由配置
4. ✅ 更新測試和文檔

### Phase 4: 清理和優化 (依需求)
1. ⏸️ 移除已棄用模組的殘留程式碼
2. ⏸️ 添加模組變更審計日誌
3. ⏸️ 性能優化和程式碼重構

---

## 測試建議 (Testing Recommendations)

### 單元測試

1. **ModuleEnabledGuard 測試**:
   ```typescript
   describe('ModuleEnabledGuard', () => {
     it('should allow access when module is enabled', async () => {
       // 測試模組啟用時允許訪問
     });
     
     it('should redirect when module is disabled', async () => {
       // 測試模組停用時重定向
     });
     
     it('should redirect when blueprint not found', async () => {
       // 測試藍圖不存在時重定向
     });
   });
   ```

2. **Settings 元件測試**:
   ```typescript
   describe('BlueprintSettingsComponent', () => {
     it('should load module settings correctly', () => {
       // 測試正確載入模組設定
     });
     
     it('should toggle module enabled state', () => {
       // 測試切換模組啟用狀態
     });
     
     it('should save module changes', async () => {
       // 測試儲存模組變更
     });
   });
   ```

### 整合測試

1. **路由守衛整合測試**:
   ```typescript
   describe('Blueprint Module Routes', () => {
     it('should navigate to tasks when module is enabled', () => {
       // 測試模組啟用時可以導航到任務頁面
     });
     
     it('should redirect to overview when module is disabled', () => {
       // 測試模組停用時重定向到概覽頁面
     });
   });
   ```

2. **端到端測試**:
   ```typescript
   describe('Module Enable/Disable Flow', () => {
     it('should disable module and prevent access', () => {
       // 1. 導航到設定頁面
       // 2. 停用某個模組
       // 3. 儲存設定
       // 4. 嘗試訪問該模組的路由
       // 5. 驗證被重定向到 overview
     });
     
     it('should enable module and allow access', () => {
       // 1. 導航到設定頁面
       // 2. 啟用某個模組
       // 3. 儲存設定
       // 4. 訪問該模組的路由
       // 5. 驗證成功載入該頁面
     });
   });
   ```

---

## 風險評估 (Risk Assessment)

### 高風險項目

1. **路由守衛實作**:
   - 風險: 可能影響現有用戶的訪問流程
   - 緩解: 充分測試後分階段部署，先在測試環境驗證

2. **元件重命名**:
   - 風險: 可能破壞現有的依賴和引用
   - 緩解: 使用 IDE 的重構功能，確保所有引用都被更新

### 中風險項目

1. **統一配置來源**:
   - 風險: 多處依賴新的配置結構
   - 緩解: 保持向後相容，逐步遷移

2. **預設啟用策略變更**:
   - 風險: 可能影響新建藍圖的預設行為
   - 緩解: 充分溝通並記錄變更

### 低風險項目

1. **清理已棄用程式碼**:
   - 風險: 最小，主要是美化程式碼
   - 緩解: 確保向後相容性

---

## 結論 (Conclusion)

藍圖邏輯容器目前存在的主要問題是**啟用模組功能未完全實踐**和**設計不一致**。這些問題雖然不影響基本功能運作，但會導致用戶體驗不佳、安全性風險和維護困難。

建議按照優先順序實作改進方案：

1. **優先** 建立統一的模組守衛機制，確保模組啟用控制真正生效
2. **其次** 統一模組命名和配置，提升程式碼的可維護性
3. **最後** 進行命名規範化和清理工作，提升整體程式碼品質

這些改進將顯著提升系統的安全性、可維護性和用戶體驗。

---

## 附錄 (Appendix)

### A. 模組類型與路由對應表

| ModuleType | 路由路徑 | 元件名稱 | 中文名稱 | 備註 |
|-----------|---------|---------|---------|------|
| TASKS | tasks | BlueprintTasksComponent | 任務管理 | ✅ 一致 |
| DIARY | diaries | BlueprintDiariesComponent | 施工日誌 | ⚠️ 複數形式 |
| CHECKLISTS | qc-inspections | BlueprintQcInspectionsComponent | 檢查清單/品質管控 | ❌ 名稱不同 |
| ISSUES | problems | BlueprintProblemsComponent | 問題追蹤 | ❌ 名稱不同 |
| FILES | files | BlueprintFilesComponent | 檔案管理 | ✅ 一致 |
| FINANCIAL | financial | FinancialOverviewComponent | 財務管理 | ⚠️ 元件無前綴 |
| ACCEPTANCE | acceptances | BlueprintAcceptancesComponent | 品質驗收 | ⚠️ 複數形式 |

### B. 非模組路由列表

這些路由不對應任何 ModuleType，屬於藍圖的核心功能：

- `overview` - 藍圖概覽
- `list` - 藍圖列表
- `members` - 成員管理
- `settings` - 藍圖設定
- `permissions` - 權限管理
- `notifications` - 通知設定
- `activities` - 活動歷史
- `search` - 進階搜尋
- `reports` - 報表分析
- `gantt` - 甘特圖（依賴 Tasks 模組）
- `api-gateway` - API 閘道

### C. 檢查清單

#### 完整的模組啟用檢查清單

- [ ] Tasks 模組路由添加守衛
- [ ] Diary 模組路由添加守衛
- [ ] Checklists 模組路由添加守衛
- [ ] Issues 模組路由添加守衛
- [ ] Files 模組路由添加守衛
- [ ] Financial 模組路由添加守衛
- [ ] Acceptance 模組路由添加守衛
- [ ] Gantt 路由添加守衛（檢查 Tasks 模組）
- [ ] Overview 元件檢查所有模組
- [ ] Overview 元件處理重定向訊息
- [ ] 單元測試
- [ ] 整合測試
- [ ] 端到端測試
- [ ] 用戶驗收測試

#### 統一配置實作清單

- [ ] 建立 MODULES_CONFIG
- [ ] 建立輔助函數 (getModuleConfig, etc.)
- [ ] 更新 Settings 元件
- [ ] 更新 Overview 元件
- [ ] 更新 Create Blueprint 元件
- [ ] 更新所有使用模組標籤的地方
- [ ] 單元測試
- [ ] 更新文檔

---

**報告結束**

如有任何問題或需要進一步說明，請聯繫開發團隊。
