# 實現總結：藍圖模組守衛與 WorkspaceContextService 優化

## 概述

根據 `BLUEPRINT_HEALTH_CHECK_REPORT.md` 的分析，成功實現了以下改進：

1. **WorkspaceContextService 性能優化** - 解決反覆刷新浪費 API 成本的問題
2. **模組守衛機制** - 實現路由級別的模組啟用檢查
3. **統一模組配置** - 建立單一數據源 (Single Source of Truth)

## 遵循的原則

### 奧卡姆剃刀 (Occam's Razor)
- 使用最簡單有效的解決方案
- 避免過度設計
- 減少重複代碼

### Angular 最佳實踐
- Standalone Components
- Signals 狀態管理
- OnPush 變更檢測策略
- 響應式編程

## 實現細節

### 1. WorkspaceContextService 優化

**問題分析：**
- Effect 監聽 `supabaseUser()` 每次變化都會觸發 `loadWorkspaceData`
- `loadWorkspaceData` 缺乏防重入機制
- 可能導致同一用戶的資料被重複載入

**解決方案：**

```typescript
// 添加追蹤變量
private loadingAuthUserId: string | null = null;

// 在 effect 中檢查
effect(() => {
  const user = this.supabaseUser();
  const authUserId = user?.id;

  if (authUserId) {
    // 只在未載入該用戶時才載入
    if (this.loadingAuthUserId !== authUserId) {
      this.loadWorkspaceData(authUserId);
    } else {
      console.log('⏭️ Already loading data for user:', authUserId);
    }
  } else {
    this.reset();
  }
});

// 在 loadWorkspaceData 中防止重入
async loadWorkspaceData(authUserId: string): Promise<void> {
  if (this.loadingState() || this.loadingAuthUserId === authUserId) {
    console.log('⏭️ Load already in progress for user:', authUserId);
    return;
  }

  this.loadingAuthUserId = authUserId;
  // ... 載入邏輯
}
```

**效果：**
- ✅ 避免同一用戶的重複載入
- ✅ 減少不必要的 API 調用
- ✅ 降低 Supabase 使用成本

### 2. 模組守衛機制

**實現文件：**
- `src/app/core/guards/module-enabled.guard.ts`

**功能：**
- 檢查藍圖的 `enabled_modules` 陣列
- 阻止訪問未啟用的模組路由
- 重定向到 overview 頁面並顯示提示

**使用方式：**

```typescript
{
  path: 'tasks',
  loadComponent: () => import('./tasks/tasks.component'),
  canActivate: [moduleEnabledGuard],
  data: {
    title: '任務管理',
    requiredModule: ModuleType.TASKS
  }
}
```

**受保護的路由：**
- `tasks` (ModuleType.TASKS)
- `diaries` (ModuleType.DIARY)
- `qc-inspections` (ModuleType.CHECKLISTS)
- `files` (ModuleType.FILES)
- `financial` (ModuleType.FINANCIAL)
- `problems` (ModuleType.ISSUES)
- `acceptances` (ModuleType.ACCEPTANCE)
- `gantt` (ModuleType.TASKS - 甘特圖依賴任務模組)

**不受保護的路由：**
- `overview` - 概覽頁面（總是可訪問）
- `members` - 成員管理（核心功能）
- `settings` - 設定（核心功能）
- `permissions` - 權限管理（核心功能）
- `activities` - 活動歷史（核心追蹤功能）
- `notifications` - 通知設定（核心功能）
- `search` - 搜尋（核心功能）
- `reports` - 報表分析（核心功能）
- `api-gateway` - API 閘道（核心整合功能）

### 3. 統一模組配置

**新增的配置和函數：**

```typescript
// 擴展的模組配置介面
export interface ExtendedModuleConfig extends ModuleConfig {
  routePath: string;       // 路由路徑
  componentName: string;   // 元件名稱
}

// 統一配置（單一數據源）
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
  // ... 其他模組
];

// 預設啟用的模組
export const DEFAULT_ENABLED_MODULES: ModuleType[] = [
  ModuleType.TASKS,
  ModuleType.DIARY,
  ModuleType.CHECKLISTS,
  ModuleType.FILES
];

// 輔助函數
export function getModuleConfig(moduleType: ModuleType): ExtendedModuleConfig | undefined;
export function getModuleConfigByRoute(routePath: string): ExtendedModuleConfig | undefined;
export function isModuleEnabledByDefault(module: ModuleType): boolean;
export function getCoreModules(): ExtendedModuleConfig[];
export function getOptionalModules(): ExtendedModuleConfig[];
```

**更新的元件：**

1. **overview.component.ts**
   - 導入 `getModuleConfig`
   - 添加 `isModuleEnabled` computed 檢查任意模組
   - 處理 `moduleDisabled` query parameter

2. **settings.component.ts**
   - 使用 `MODULES_CONFIG` 生成模組設定
   - 使用 `isModuleEnabledByDefault` 設置預設值

3. **create-blueprint.component.ts**
   - 使用 `DEFAULT_ENABLED_MODULES` 作為預設啟用模組

## 模組映射對照表

| 模組類型 (ModuleType) | 路由路徑 | 元件名稱 | 中文名稱 | 預設啟用 |
|---------------------|---------|---------|---------|---------|
| TASKS | tasks | BlueprintTasksComponent | 任務管理 | ✅ |
| DIARY | diaries | BlueprintDiariesComponent | 施工日誌 | ✅ |
| CHECKLISTS | qc-inspections | BlueprintQcInspectionsComponent | 檢查清單 | ✅ |
| FILES | files | BlueprintFilesComponent | 檔案管理 | ✅ |
| ISSUES | problems | BlueprintProblemsComponent | 問題追蹤 | ❌ |
| FINANCIAL | financial | FinancialOverviewComponent | 財務管理 | ❌ |
| ACCEPTANCE | acceptances | BlueprintAcceptancesComponent | 品質驗收 | ❌ |

## 使用者體驗改進

### 之前
1. 用戶停用模組後，仍可通過直接 URL 訪問
2. WorkspaceContextService 不斷重複刷新
3. 模組標籤在不同元件間不一致

### 之後
1. ✅ 停用模組後無法訪問，會被重定向到 overview
2. ✅ WorkspaceContextService 只載入一次，不會重複刷新
3. ✅ 所有元件使用相同的模組配置和標籤

## 測試建議

### 功能測試
1. **模組守衛測試**
   - 創建藍圖並啟用特定模組
   - 嘗試訪問已啟用的模組路由 → 應該成功
   - 嘗試訪問未啟用的模組路由 → 應該重定向到 overview 並顯示警告

2. **WorkspaceContextService 測試**
   - 登入後檢查控制台日誌
   - 確認 `loadWorkspaceData` 只執行一次
   - 切換組織/團隊時確認不會重複載入

3. **模組配置一致性測試**
   - 檢查 settings 頁面的模組設定
   - 檢查 create blueprint 的預設啟用模組
   - 確認標籤和描述一致

### 性能測試
1. 監控 Supabase API 調用次數
2. 比較優化前後的 API 使用量
3. 確認減少不必要的網路請求

## 後續工作建議

### 優先級：中
1. 添加單元測試
   - `module-enabled.guard.spec.ts`
   - `workspace-context.service.spec.ts`

2. 添加 E2E 測試
   - 測試模組啟用/停用流程
   - 測試路由守衛行為

### 優先級：低
1. 考慮添加模組變更的審計日誌
2. 在 Overview 頁面顯示被停用模組的卡片（灰色顯示）
3. 提供批量啟用/停用模組的功能

## 文件變更清單

### 新增文件
- `src/app/core/guards/module-enabled.guard.ts`

### 修改文件
- `src/app/core/guards/index.ts`
- `src/app/core/infra/types/blueprint/index.ts`
- `src/app/routes/blueprint/routes.ts`
- `src/app/routes/blueprint/overview/overview.component.ts`
- `src/app/routes/blueprint/settings/settings.component.ts`
- `src/app/routes/blueprint/create-blueprint/create-blueprint.component.ts`
- `src/app/shared/services/account/workspace-context.service.ts`

## 總結

此次實現完全遵循奧卡姆剃刀原則，使用最簡單有效的方法解決了：

1. ✅ WorkspaceContextService 反覆刷新的性能問題
2. ✅ 模組啟用功能未完全實踐的問題
3. ✅ 模組配置不一致的問題

所有實現都符合 Angular 20 Standalone Components 和 Signals 架構，並且代碼簡潔易維護。
