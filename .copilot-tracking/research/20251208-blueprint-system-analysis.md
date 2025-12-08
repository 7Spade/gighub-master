<!-- markdownlint-disable-file -->

# Task Research Notes: Blueprint System Consistency Analysis

## Research Executed

### File Analysis

- `/home/runner/work/gighub-master/gighub-master/BLUEPRINT_HEALTH_CHECK_REPORT.md`
  - Comprehensive analysis of blueprint container inconsistencies and issues
  - Identified problems with module guard implementation, naming conventions, and configuration management
  - Provided detailed recommendations with priority levels

- `/home/runner/work/gighub-master/gighub-master/CONTEXT7_ANALYSIS.md`
  - Analysis based on Context7 Angular best practices
  - Confirmed use of modern Angular patterns (Signals, functional guards, control flow directives)
  - Provided implementation examples aligned with Angular latest standards

- `/home/runner/work/gighub-master/gighub-master/src/app/core/infra/types/blueprint/index.ts`
  - Found comprehensive type definitions and module configurations
  - **MODULES_CONFIG** already exists with complete metadata including routing info
  - **DEFAULT_ENABLED_MODULES** defined with TASKS, DIARY, CHECKLISTS, FILES
  - Helper functions already implemented: `getModuleConfig()`, `getModuleConfigByRoute()`, `isModuleEnabledByDefault()`

- `/home/runner/work/gighub-master/gighub-master/src/app/routes/blueprint/routes.ts`
  - Routes configured with **moduleEnabledGuard** for module-specific routes
  - Proper separation between core routes (no guard) and module routes (with guard)
  - Guard applied to: TASKS, DIARY, CHECKLISTS, FILES, FINANCIAL, ISSUES, ACCEPTANCE, GANTT

- `/home/runner/work/gighub-master/gighub-master/src/app/core/guards/module-enabled.guard.ts`
  - **ModuleEnabledGuard** already implemented as functional guard (CanActivateFn)
  - Uses async/await pattern for blueprint data fetching
  - Redirects to overview with query parameter when module is disabled
  - Includes comprehensive logging for debugging

- `/home/runner/work/gighub-master/gighub-master/src/app/routes/blueprint/overview/overview.component.ts`
  - Uses Angular Signals for module checking
  - Has `isModuleEnabled()` computed signal
  - Has individual computed signals for specific modules (isTasksModuleEnabled, etc.)
  - **PARTIALLY IMPLEMENTED**: Only checks some modules (TASKS, FINANCIAL, DIARY, CHECKLISTS, FILES, ISSUES)
  - Missing: ACCEPTANCE module check in navigation cards

- `/home/runner/work/gighub-master/gighub-master/src/app/routes/blueprint/settings/settings.component.ts`
  - Uses MODULES_CONFIG for module settings display
  - Implements module enable/disable functionality
  - Uses `isModuleEnabledByDefault()` for initialization

### Code Search Results

- Search for "ModuleType" usage across the codebase
  - Found consistent enum usage in routes, components, guards, and type definitions
  - All modules properly typed with ModuleType enum

- Search for "MODULES_CONFIG" usage
  - Found in: settings component, overview component (partially), type definitions
  - Used as single source of truth for module metadata

- Search for "moduleEnabledGuard" usage
  - Applied to all module-specific routes in blueprint routing configuration
  - Properly configured with `requiredModule` in route data

### External Research

- #githubRepo:"angular/angular guards"
  - Confirmed functional guards (CanActivateFn) are the modern Angular pattern
  - Class-based guards are deprecated in favor of functional guards with inject()

- #githubRepo:"angular/angular signals"
  - Verified Signals (signal(), computed(), effect()) are the recommended state management pattern
  - Control flow directives (@if, @for) are the modern template syntax

- #fetch:https://angular.dev/guide/guards
  - Official Angular documentation confirms functional guards best practices
  - Router.parseUrl() is the recommended method for programmatic navigation in guards

### Project Conventions

- Standards referenced: Angular 18+ best practices, Signals-based state management
- Instructions followed: Functional components with ChangeDetectionStrategy.OnPush
- Coding style: TypeScript strict mode, comprehensive JSDoc comments

## Key Discoveries

### Project Structure

**Blueprint Module Organization**:
```
src/app/
├── core/
│   ├── guards/
│   │   └── module-enabled.guard.ts ✅ IMPLEMENTED
│   ├── infra/types/blueprint/
│   │   └── index.ts ✅ COMPREHENSIVE TYPE DEFINITIONS
│   └── facades/blueprint/
│       └── blueprint.facade.ts
├── routes/blueprint/
│   ├── routes.ts ✅ GUARDS APPLIED
│   ├── overview/ ⚠️ PARTIALLY COMPLETE
│   ├── settings/ ✅ FULLY IMPLEMENTED
│   ├── tasks/ (with guard)
│   ├── diaries/ (with guard)
│   ├── qc-inspections/ (with guard)
│   ├── files/ (with guard)
│   ├── financial/ (with guard)
│   ├── problems/ (with guard)
│   ├── acceptances/ (with guard)
│   └── gantt/ (with guard)
└── shared/
    ├── models/blueprint/
    └── services/blueprint/
```

### Implementation Patterns

**Already Implemented (✅)**:
1. **ModuleEnabledGuard** - Functional guard with async/await pattern
2. **MODULES_CONFIG** - Single source of truth for module metadata
3. **Route Configuration** - Guards applied to all module-specific routes
4. **Settings Component** - Complete module management with MODULES_CONFIG
5. **Type Safety** - ModuleType enum used consistently throughout

**Partially Implemented (⚠️)**:
1. **Overview Component** - Module checks implemented but incomplete:
   - ✅ Has `isModuleEnabled()` computed signal
   - ✅ Checks: TASKS, FINANCIAL, DIARY, CHECKLISTS, FILES, ISSUES
   - ❌ Missing: ACCEPTANCE module navigation card
   - ❌ Missing: Query parameter handling for disabled module message

**Inconsistencies Found (❌)**:
1. **Route-to-Module Mapping Discrepancies**:
   - ModuleType.CHECKLISTS → route: 'qc-inspections' (不一致)
   - ModuleType.ISSUES → route: 'problems' (不一致)
   - ModuleType.DIARY → route: 'diaries' (複數形式)
   - ModuleType.ACCEPTANCE → route: 'acceptances' (複數形式)

2. **Component Naming Inconsistencies**:
   - Financial sub-modules lack "Blueprint" prefix
   - Some components use different naming patterns

3. **Module Label Inconsistencies**:
   - Settings component: CHECKLISTS → "檢查清單"
   - Overview component navigation: CHECKLISTS → "品質管控"
   - Routes data title: qc-inspections → "品質管控"

### Complete Examples

**Functional Guard Pattern (Already Implemented)**:
```typescript
// src/app/core/guards/module-enabled.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BlueprintFacade } from '../facades/blueprint/blueprint.facade';
import { ModuleType } from '../infra/types/blueprint';

export const moduleEnabledGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const blueprintFacade = inject(BlueprintFacade);
  const router = inject(Router);

  const requiredModule = route.data['requiredModule'] as ModuleType;
  const blueprintId = route.paramMap.get('id');

  if (!requiredModule || !blueprintId) {
    return true;
  }

  try {
    const blueprint = await blueprintFacade.findById(blueprintId);
    if (!blueprint) {
      return router.parseUrl('/blueprint/list');
    }

    const enabledModules = blueprint.enabled_modules || [];
    const isModuleEnabled = enabledModules.includes(requiredModule);

    if (!isModuleEnabled) {
      return router.parseUrl(`/blueprint/${blueprintId}/overview?moduleDisabled=${requiredModule}`);
    }

    return true;
  } catch (error) {
    console.error('[ModuleEnabledGuard] Failed to check module status:', error);
    return router.parseUrl('/blueprint/list');
  }
};
```

**Signals-based Module Checking (Already in Overview Component)**:
```typescript
// overview.component.ts
readonly isModuleEnabled = computed(() => {
  const enabledModules = this.blueprint()?.enabled_modules || [];
  return (module: ModuleType) => enabledModules.includes(module);
});

readonly isTasksModuleEnabled = computed(() => 
  this.isModuleEnabled()(ModuleType.TASKS)
);

readonly isFinancialModuleEnabled = computed(() => 
  this.isModuleEnabled()(ModuleType.FINANCIAL)
);
```

**MODULES_CONFIG Usage (Already in Settings Component)**:
```typescript
// settings.component.ts
import { MODULES_CONFIG, isModuleEnabledByDefault } from '@core';

private initModuleSettings(blueprint: BlueprintBusinessModel): void {
  const modules: ModuleSetting[] = MODULES_CONFIG.map(config => ({
    key: config.value,
    name: config.label,
    description: config.description,
    icon: config.icon,
    enabled: blueprint.enabled_modules?.includes(config.value) ?? 
             isModuleEnabledByDefault(config.value)
  }));
  this.moduleSettings.set(modules);
}
```

### API and Schema Documentation

**ModuleType Enum (Complete)**:
```typescript
export enum ModuleType {
  TASKS = 'tasks',
  DIARY = 'diary',
  CHECKLISTS = 'checklists',
  ISSUES = 'issues',
  FILES = 'files',
  FINANCIAL = 'financial',
  ACCEPTANCE = 'acceptance',
  // Deprecated
  DASHBOARD = 'dashboard',
  BOT_WORKFLOW = 'bot_workflow',
  TODOS = 'todos'
}
```

**ExtendedModuleConfig Interface**:
```typescript
export interface ExtendedModuleConfig extends ModuleConfig {
  value: ModuleType;
  label: string;
  icon: string;
  description: string;
  isCore: boolean;
  routePath: string;
  componentName: string;
}
```

### Configuration Examples

**Route Configuration with Guard**:
```typescript
{
  path: 'tasks',
  loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
  canActivate: [moduleEnabledGuard],
  data: {
    title: '任務管理',
    requiredModule: ModuleType.TASKS
  }
}
```

**Module Configuration Array**:
```typescript
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
  // ... other modules
];
```

### Technical Requirements

**Angular Version**: 18+ (Based on modern features used)
**State Management**: Angular Signals (signal, computed, effect)
**Routing**: Angular Router with functional guards
**Change Detection**: OnPush strategy for performance
**Template Syntax**: Control flow directives (@if, @for)

## Identified Inconsistencies and Issues

### High Priority Issues

#### 1. 不完整的模組檢查 (Incomplete Module Checking)

**問題描述**:
- Overview 元件缺少 ACCEPTANCE 模組的導航卡片檢查
- Overview 元件缺少處理 `moduleDisabled` 查詢參數的邏輯

**影響**:
- 用戶無法從 Overview 導航到 ACCEPTANCE 模組
- 當模組被停用時，用戶看不到提示訊息

**現狀**:
```typescript
// overview.component.ts - 缺少 ACCEPTANCE 檢查
@if (isModuleEnabled()(ModuleType.ISSUES)) {
  <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
    // Issues card
  </div>
}
// ❌ 沒有 ACCEPTANCE 模組的卡片
```

**應該要有**:
```typescript
@if (isModuleEnabled()(ModuleType.ACCEPTANCE)) {
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
```

#### 2. 缺少查詢參數處理邏輯 (Missing Query Parameter Handler)

**問題描述**:
- ModuleEnabledGuard 重定向時帶有 `moduleDisabled` 查詢參數
- Overview 元件應該檢測並顯示提示訊息，但目前沒有實作

**影響**:
- 用戶不知道為什麼被重定向
- 缺乏友善的錯誤提示

**需要添加**:
```typescript
// overview.component.ts - constructor 中
constructor() {
  effect(() => {
    this.route.queryParams.subscribe(params => {
      const disabledModule = params['moduleDisabled'];
      if (disabledModule) {
        const config = getModuleConfig(disabledModule as ModuleType);
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
```

### Medium Priority Issues

#### 3. 路由與模組名稱不一致 (Route-Module Name Mismatches)

**問題描述**:
模組類型、路由路徑和標籤之間存在不一致

| ModuleType | routePath | 中文標籤 | 一致性 |
|-----------|-----------|---------|-------|
| TASKS | tasks | 任務管理 | ✅ 一致 |
| DIARY | diaries | 施工日誌 | ⚠️ 複數形式 |
| CHECKLISTS | qc-inspections | 檢查清單 | ❌ 完全不同 |
| ISSUES | problems | 問題追蹤 | ❌ 完全不同 |
| FILES | files | 檔案管理 | ✅ 一致 |
| FINANCIAL | financial | 財務管理 | ✅ 一致 |
| ACCEPTANCE | acceptances | 品質驗收 | ⚠️ 複數形式 |

**影響**:
- 開發人員容易混淆
- 維護困難
- 新功能難以理解對應關係

**建議**:
- 保持現有路由不變（避免破壞性變更）
- 在 MODULES_CONFIG 中明確記錄對應關係
- 提供清楚的文檔說明

#### 4. 模組標籤不一致 (Inconsistent Module Labels)

**問題描述**:
CHECKLISTS 模組在不同地方有不同的標籤

**發現的差異**:
- MODULES_CONFIG: "檢查清單"
- Settings 元件: "檢查清單"
- Routes data: "品質管控"
- Overview 導航卡片: "品質管控"

**影響**:
- 用戶體驗不一致
- 可能造成混淆

**建議方案**:
1. **統一使用 "品質管控"** - 更符合實際用途和業務需求
2. **更新 MODULES_CONFIG**:
```typescript
{
  value: ModuleType.CHECKLISTS,
  label: '品質管控',  // 從 "檢查清單" 改為 "品質管控"
  icon: 'check-square',
  description: '品質檢查與巡檢清單',
  isCore: true,
  routePath: 'qc-inspections',
  componentName: 'BlueprintQcInspectionsComponent'
}
```

### Low Priority Issues

#### 5. 元件命名不一致 (Inconsistent Component Naming)

**問題描述**:
Financial 子模組的元件缺少 "Blueprint" 前綴

**發現**:
- `FinancialOverviewComponent` (應該是 `BlueprintFinancialOverviewComponent`)
- `ContractListComponent` (應該是 `BlueprintContractListComponent`)
- `ExpenseListComponent` (應該是 `BlueprintExpenseListComponent`)
- `PaymentListComponent` (應該是 `BlueprintPaymentListComponent`)
- `PaymentRequestListComponent` (應該是 `BlueprintPaymentRequestListComponent`)

**影響**:
- 命名規範不統一
- 可能與其他模組的元件名稱衝突
- 降低程式碼可維護性

**風險**:
- 重命名會影響所有引用這些元件的地方
- 需要更新路由配置
- 是破壞性變更，需要謹慎處理

**建議**:
- 作為技術債務記錄
- 在大版本更新時統一重構
- 目前保持現狀，不強制要求

#### 6. 已棄用模組的清理 (Deprecated Modules Cleanup)

**問題描述**:
ModuleType 枚舉中保留了已棄用的模組類型

**已棄用模組**:
```typescript
export enum ModuleType {
  // ...
  /** @deprecated 使用獨立視圖而非模組 */
  DASHBOARD = 'dashboard',
  /** @deprecated 進階功能，暫不支援 */
  BOT_WORKFLOW = 'bot_workflow',
  /** @deprecated 與 tasks 功能重複 */
  TODOS = 'todos'
}
```

**影響**:
- 枚舉定義冗長
- 可能造成誤用
- 程式碼不夠簡潔

**建議**:
- 保持向後相容性
- 確保資料庫中沒有使用這些模組
- 在確認後可以移除

## Recommended Approach

基於深入分析，建議採用**漸進式改進**策略，優先處理高優先級問題，保持現有架構穩定性。

### 實施優先順序

#### Phase 1: 緊急修復 (立即執行)

**目標**: 完成 Overview 元件的缺失功能

**任務清單**:
1. ✅ 添加 ACCEPTANCE 模組導航卡片檢查
2. ✅ 實作查詢參數處理邏輯，顯示模組停用提示
3. ✅ 添加 `goToAcceptances()` 導航方法
4. ✅ 測試模組停用時的用戶流程

**預期成果**:
- Overview 元件完整檢查所有 7 個模組
- 用戶看到友善的模組停用提示訊息
- 導航功能完整可用

**工作量估計**: 2-4 小時

#### Phase 2: 標籤統一 (短期改進)

**目標**: 統一 CHECKLISTS 模組的標籤顯示

**任務清單**:
1. ✅ 更新 MODULES_CONFIG 中的 CHECKLISTS 標籤為 "品質管控"
2. ✅ 驗證 Settings 元件自動使用更新後的標籤
3. ✅ 驗證 Overview 元件自動使用更新後的標籤
4. ✅ 更新相關測試
5. ✅ 更新文檔

**預期成果**:
- 所有地方統一顯示 "品質管控"
- 用戶體驗一致性提升

**工作量估計**: 1-2 小時

#### Phase 3: 文檔完善 (中期改進)

**目標**: 提供清晰的模組對應文檔

**任務清單**:
1. ✅ 在 MODULES_CONFIG 上方添加詳細的 JSDoc 註釋
2. ✅ 記錄路由路徑與模組類型的對應關係
3. ✅ 說明歷史原因導致的命名差異
4. ✅ 提供清晰的使用範例
5. ✅ 創建 README 或技術文檔

**預期成果**:
- 新開發人員能快速理解架構
- 減少因命名差異造成的困惑
- 提升程式碼可維護性

**工作量估計**: 2-3 小時

#### Phase 4: 技術債務處理 (長期優化，可選)

**目標**: 解決命名不一致和已棄用模組清理

**任務清單**:
1. ⏸️ 評估元件重命名的影響範圍
2. ⏸️ 確認資料庫中已棄用模組的使用情況
3. ⏸️ 制定重構計劃
4. ⏸️ 在大版本更新時執行重構

**預期成果**:
- 命名規範完全統一
- 程式碼更加簡潔
- 長期可維護性提升

**工作量估計**: 8-16 小時 (取決於影響範圍)

### 為什麼選擇這個方案？

#### 優勢

1. **最小化風險**
   - 優先處理缺失功能，不修改現有穩定代碼
   - 避免破壞性變更
   - 保持向後相容性

2. **快速見效**
   - Phase 1 和 Phase 2 可以在一天內完成
   - 立即改善用戶體驗
   - 解決關鍵的功能缺失

3. **漸進式改進**
   - 分階段實施，風險可控
   - 每個階段都有明確的成果
   - 可以根據需求靈活調整

4. **充分利用現有實作**
   - ModuleEnabledGuard 已完整實作
   - MODULES_CONFIG 已經是統一配置來源
   - Settings 元件已經使用正確模式
   - 只需補完 Overview 元件的缺失部分

5. **技術債務明確**
   - 低優先級問題作為技術債務記錄
   - 不強制立即處理
   - 可在合適時機統一重構

#### 與替代方案比較

**替代方案 1: 大規模重構**
- ❌ 風險高：可能破壞現有功能
- ❌ 工時長：需要數週時間
- ❌ 測試成本高：需要全面回歸測試
- ✅ 完全統一：所有命名一致

**替代方案 2: 完全不改**
- ✅ 風險低：不會破壞現有功能
- ❌ 問題持續：用戶體驗不佳
- ❌ 技術債務累積：未來更難改進

**推薦方案: 漸進式改進** ⭐
- ✅ 平衡風險與收益
- ✅ 快速解決關鍵問題
- ✅ 保持架構穩定性
- ✅ 技術債務可控

## Implementation Guidance

### Objectives

1. **完成 Overview 元件的模組檢查功能**
   - 添加 ACCEPTANCE 模組的導航卡片和檢查邏輯
   - 實作查詢參數處理，顯示模組停用提示

2. **統一 CHECKLISTS 模組標籤**
   - 將所有地方的標籤統一為 "品質管控"

3. **完善技術文檔**
   - 記錄模組對應關係
   - 說明歷史命名差異原因

### Key Tasks

#### Task 1: 完成 Overview 元件 (高優先級)

**檔案**: `src/app/routes/blueprint/overview/overview.component.ts`

**要修改的部分**:

1. 添加 ACCEPTANCE 模組的 computed signal（如果還沒有）:
```typescript
readonly isAcceptanceModuleEnabled = computed(() => 
  this.isModuleEnabled()(ModuleType.ACCEPTANCE)
);
```

2. 在 constructor 中添加查詢參數處理:
```typescript
constructor() {
  effect(() => {
    this.route.queryParams.subscribe(params => {
      const disabledModule = params['moduleDisabled'];
      if (disabledModule) {
        const config = getModuleConfig(disabledModule as ModuleType);
        const moduleName = config?.label || disabledModule;
        this.msg.warning(`「${moduleName}」模組未啟用，請在設定中啟用後使用`);
        
        this.router.navigate([], { 
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true 
        });
      }
    });
  });
}
```

3. 添加導航方法:
```typescript
goToAcceptances(): void {
  const id = this.blueprint()?.id;
  if (id) {
    this.router.navigate(['/blueprint', id, 'acceptances']);
  }
}
```

4. 在模板中添加 ACCEPTANCE 導航卡片:
```html
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
```

#### Task 2: 統一 CHECKLISTS 標籤 (中優先級)

**檔案**: `src/app/core/infra/types/blueprint/index.ts`

**要修改的部分**:
```typescript
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  // ...
  {
    value: ModuleType.CHECKLISTS,
    label: '品質管控',  // 從 "檢查清單" 改為 "品質管控"
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'qc-inspections',
    componentName: 'BlueprintQcInspectionsComponent'
  },
  // ...
];
```

**驗證範圍**:
- Settings 元件會自動使用更新後的標籤 ✅
- Overview 元件會自動使用更新後的標籤 ✅
- 路由 data title 需要保持為 "品質管控" ✅ (已經是)

#### Task 3: 添加技術文檔 (低優先級)

**檔案**: `src/app/core/infra/types/blueprint/index.ts`

**要添加的 JSDoc**:
```typescript
/**
 * Complete modules configuration with routing information
 * 完整模組配置（包含路由資訊）
 *
 * Single source of truth for all module metadata including:
 * - Module type identifiers (ModuleType enum values)
 * - Display labels (Chinese localization)
 * - Icons (ng-zorro-antd icon names)
 * - Descriptions (feature explanations)
 * - Core vs optional classification
 * - Route path segments (URL paths)
 * - Component names (for documentation)
 *
 * **Route Path Mapping Notes**:
 * Some modules have route paths that differ from their type names due to historical reasons:
 * - CHECKLISTS → 'qc-inspections' (originally designed for QC inspection workflows)
 * - ISSUES → 'problems' (user-facing term for issue tracking)
 * - DIARY → 'diaries' (plural form for consistency with other routes)
 * - ACCEPTANCE → 'acceptances' (plural form for consistency)
 *
 * These differences are intentional and should not be changed to maintain
 * backward compatibility with existing URLs and bookmarks.
 *
 * **Usage Examples**:
 * ```typescript
 * // Get module configuration
 * const config = getModuleConfig(ModuleType.TASKS);
 * console.log(config.label); // "任務管理"
 * console.log(config.routePath); // "tasks"
 *
 * // Get configuration by route
 * const config2 = getModuleConfigByRoute('qc-inspections');
 * console.log(config2?.value); // ModuleType.CHECKLISTS
 *
 * // Check if core module
 * const coreModules = getCoreModules();
 * console.log(coreModules.length); // 6
 * ```
 */
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  // ...
];
```

### Dependencies

**必需的依賴**:
- Angular Router (已有)
- Angular Signals (已有)
- NzMessageService (已有)
- BlueprintFacade (已有)
- MODULES_CONFIG (已有)
- ModuleType enum (已有)

**無需新增依賴**

### Success Criteria

#### Phase 1 完成標準:

- [ ] Overview 元件有 `isAcceptanceModuleEnabled` computed signal
- [ ] Overview 元件在模板中顯示 ACCEPTANCE 導航卡片（當模組啟用時）
- [ ] Overview 元件有查詢參數處理邏輯
- [ ] 當從停用的模組重定向時，用戶看到友善的提示訊息
- [ ] 提示訊息自動清除，不影響後續導航

#### Phase 2 完成標準:

- [ ] MODULES_CONFIG 中 CHECKLISTS 標籤為 "品質管控"
- [ ] Settings 元件顯示 "品質管控" 標籤
- [ ] Overview 元件導航卡片顯示 "品質管控"
- [ ] 所有引用 CHECKLISTS 標籤的地方一致

#### Phase 3 完成標準:

- [ ] MODULES_CONFIG 上方有詳細的 JSDoc 註釋
- [ ] JSDoc 包含路由對應表和歷史原因說明
- [ ] JSDoc 包含使用範例
- [ ] 技術文檔清晰易懂

### Testing Strategy

#### 單元測試 (Unit Tests):

```typescript
describe('BlueprintOverviewComponent', () => {
  it('should show ACCEPTANCE navigation card when module is enabled', () => {
    // Test ACCEPTANCE module card visibility
  });

  it('should hide ACCEPTANCE navigation card when module is disabled', () => {
    // Test ACCEPTANCE module card hidden
  });

  it('should display warning message for disabled module', () => {
    // Test query parameter handling
  });

  it('should clear query parameters after showing message', () => {
    // Test query parameter cleanup
  });
});
```

#### 整合測試 (Integration Tests):

```typescript
describe('Module Access Flow', () => {
  it('should redirect to overview when accessing disabled module', async () => {
    // 1. Disable a module in settings
    // 2. Try to navigate to that module's route
    // 3. Verify redirect to overview
    // 4. Verify message displayed
  });

  it('should allow access when module is enabled', async () => {
    // 1. Enable a module in settings
    // 2. Navigate to that module's route
    // 3. Verify successful navigation
  });
});
```

#### 手動測試檢查清單:

- [ ] 在 Settings 中停用 ACCEPTANCE 模組
- [ ] 嘗試訪問 `/blueprint/:id/acceptances`
- [ ] 驗證重定向到 `/blueprint/:id/overview`
- [ ] 驗證看到提示訊息 "「品質驗收」模組未啟用，請在設定中啟用後使用"
- [ ] 驗證 Overview 頁面不顯示 ACCEPTANCE 導航卡片
- [ ] 在 Settings 中啟用 ACCEPTANCE 模組
- [ ] 驗證 Overview 頁面顯示 ACCEPTANCE 導航卡片
- [ ] 點擊卡片，驗證成功導航到 ACCEPTANCE 頁面

## Conclusion

通過深入分析，發現 GigHub 藍圖系統的**核心架構已經完整實作**，包括：
- ✅ ModuleEnabledGuard 守衛機制
- ✅ MODULES_CONFIG 統一配置
- ✅ Settings 元件完整功能
- ✅ 現代 Angular 模式 (Signals, 函數式守衛)

**主要問題是 Overview 元件的功能不完整**，缺少：
- ❌ ACCEPTANCE 模組的導航卡片檢查
- ❌ 查詢參數處理邏輯

**次要問題是命名和標籤的小差異**：
- ⚠️ CHECKLISTS 標籤不一致（"檢查清單" vs "品質管控"）
- ⚠️ 路由路徑與模組名稱差異（歷史原因，需要文檔說明）

**建議採用漸進式改進策略**：
1. **立即修復** Overview 元件的缺失功能 (2-4 小時)
2. **短期統一** CHECKLISTS 模組標籤 (1-2 小時)
3. **中期完善** 技術文檔和對應關係說明 (2-3 小時)
4. **長期優化** 元件命名規範化（技術債務，可選）

這個方案能夠在最短時間內解決關鍵問題，同時保持系統穩定性和向後相容性。
