# GigHub 專案生產就緒度分析報告

> **Production Readiness Analysis Report**  
> 深度分析：一致性、統一性、隔離性與生產標準

**分析日期**: 2025-12-08  
**專案版本**: 20.1.0  
**分析範圍**: 程式碼品質、架構設計、開發流程、部署準備

---

## 📋 執行摘要 (Executive Summary)

本報告針對 GigHub 專案進行全面的生產就緒度評估，重點分析：
1. **一致性問題** (Consistency Issues)
2. **統一性改進** (Unification Improvements)
3. **隔離性評估** (Isolation Assessment)
4. **生產標準差距** (Production Standards Gaps)

### 🎯 整體評分

| 類別 | 評分 | 狀態 |
|------|------|------|
| 程式碼一致性 | 7/10 | ⚠️ 需要改進 |
| 架構統一性 | 8/10 | ✅ 良好 |
| 模組隔離性 | 6/10 | ⚠️ 需要改進 |
| 生產就緒度 | 6.5/10 | ⚠️ 未達標準 |

---

## 1. 一致性分析 (Consistency Analysis)

### 1.1 命名一致性問題 ❌

#### 問題 1: 路由與模組類型不一致

**發現**:
```typescript
// ModuleType 定義
ModuleType.CHECKLISTS = 'checklists'  // 模組類型名稱
ModuleType.ISSUES = 'issues'           // 模組類型名稱
ModuleType.DIARY = 'diary'             // 單數形式

// 但路由配置使用不同名稱
'/blueprint/:id/qc-inspections'  // CHECKLISTS 對應路由
'/blueprint/:id/problems'        // ISSUES 對應路由
'/blueprint/:id/diaries'         // DIARY 對應路由（複數）
```

**影響**:
- 開發者困惑：需要記住兩套命名
- 維護困難：搜尋程式碼時需要查找多個名稱
- 文件不一致：API 文件與實際路由不符

**建議修復**:
```typescript
// 選項 1: 統一使用模組類型作為路由
'/blueprint/:id/checklists'
'/blueprint/:id/issues'
'/blueprint/:id/diary'

// 選項 2: 在 MODULES_CONFIG 中明確標註差異原因
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  {
    value: ModuleType.CHECKLISTS,
    label: '品質管控',
    routePath: 'qc-inspections', // Historical: Originally for QC workflows
    componentName: 'BlueprintQcInspectionsComponent'
  }
];
```

#### 問題 2: 元件命名不一致

**發現**:
```
✅ 一致: list.component.ts, overview.component.ts, settings.component.ts
❌ 不一致: 
  - qc-inspections.component.ts (使用路由名稱)
  - problems.component.ts (使用路由名稱)
  vs
  - tasks.component.ts, files.component.ts (使用功能名稱)
```

**建議**: 統一使用功能導向命名
```
checklist.component.ts 或 quality-control.component.ts
issue.component.ts 或 issue-tracking.component.ts
```

#### 問題 3: Service 命名規範不統一

**發現**:
```
✅ 好的命名:
  - blueprint.service.ts
  - task.service.ts
  - diary.service.ts

❌ 不一致:
  - file/file.service.ts (多了資料夾層級)
  - problem/problem.service.ts
  - acceptance/acceptance.service.ts
```

**建議**: 選擇統一的組織方式
```
選項 1: 扁平結構
services/
  ├── blueprint.service.ts
  ├── task.service.ts
  ├── file.service.ts

選項 2: 按領域分組（推薦）
services/
  ├── blueprint/
  │   ├── blueprint.service.ts
  │   ├── blueprint-member.service.ts
  ├── task/
  │   ├── task.service.ts
  ├── file/
      ├── file.service.ts
```

### 1.2 錯誤處理一致性 ⚠️

#### 問題: 錯誤處理模式不統一

**發現的模式**:
```typescript
// 模式 1: Service 中使用 signal
private errorState = signal<string | null>(null);

// 模式 2: Component 中直接處理
catch (error) {
  this.message.error('操作失敗');
}

// 模式 3: 混合使用 console.log (開發階段殘留)
catch (error) {
  console.log(error); // ❌ 不應該存在
  this.logger.error('操作失敗', error);
}
```

**建議**:
1. 建立統一的錯誤處理策略
2. 移除所有 console.log
3. 使用 LoggerService 統一記錄
4. 實作全域錯誤攔截器

```typescript
// 建議的錯誤處理模式
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  handleError(error: Error, context?: string): void {
    // 1. 記錄到日誌
    this.logger.error(context || 'Unhandled error', error);
    
    // 2. 轉換為使用者友善訊息
    const userMessage = this.getUserFriendlyMessage(error);
    
    // 3. 顯示通知
    this.message.error(userMessage);
    
    // 4. 可選：回報到監控系統
    this.reportToMonitoring(error, context);
  }
}
```

### 1.3 State Management 一致性 ✅

**優點**: 使用 Angular Signals 的模式相當一致

```typescript
// 統一的 Signal 模式
private dataState = signal<T[]>([]);
private loadingState = signal<boolean>(false);
private errorState = signal<string | null>(null);

readonly data = this.dataState.asReadonly();
readonly loading = this.loadingState.asReadonly();
readonly error = this.errorState.asReadonly();
```

**建議**: 繼續保持這個良好的模式

---

## 2. 統一性改進 (Unification Improvements)

### 2.1 模組配置統一 ✅ 已改進

**現況**: 已經實作 `MODULES_CONFIG` 作為單一真實來源

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
  // ...
];
```

**優點**:
- 集中管理所有模組元資料
- 避免多處定義造成不一致
- 提供輔助函數進行查詢

**待改進**: 
- Component 中仍有部分硬編碼的模組清單
- 建議全面使用 `getModuleConfig()` 函數

### 2.2 API 呼叫模式統一 ⚠️

**問題**: 混用不同的 API 呼叫方式

```typescript
// 方式 1: 直接使用 Repository
const data = await firstValueFrom(this.repo.findById(id));

// 方式 2: 使用 Service 層
const data = await this.service.findById(id);

// 方式 3: 直接使用 Supabase Client
const { data } = await this.supabase.client.from('table').select();
```

**建議的統一架構**:
```
Component
    ↓ (呼叫)
Service (Business Logic)
    ↓ (呼叫)
Repository (Data Access)
    ↓ (呼叫)
Supabase Client
```

**規則**:
1. Component 只呼叫 Service
2. Service 包含業務邏輯，呼叫 Repository
3. Repository 負責資料存取，呼叫 Supabase
4. 特殊情況（如 RPC）可在 Service 中直接呼叫 Supabase

### 2.3 表單驗證統一 ❌ 待改進

**問題**: 缺乏統一的表單驗證策略

**建議**:
```typescript
// 建立統一的驗證器
export class CommonValidators {
  static blueprintName(control: AbstractControl): ValidationErrors | null {
    // 統一的藍圖名稱驗證邏輯
  }
  
  static email(control: AbstractControl): ValidationErrors | null {
    // 統一的 Email 驗證
  }
}

// 統一的錯誤訊息
export const VALIDATION_MESSAGES = {
  required: '此欄位為必填',
  email: '請輸入有效的 Email 地址',
  minlength: '長度不得少於 {requiredLength} 個字元'
};
```

---

## 3. 隔離性評估 (Isolation Assessment)

### 3.1 模組隔離 ⚠️ 部分隔離

#### 優點: 使用 Module Guards

```typescript
{
  path: 'tasks',
  canActivate: [moduleEnabledGuard],
  data: {
    requiredModule: ModuleType.TASKS
  }
}
```

這提供了良好的**路由層級隔離**。

#### 問題: 元件間耦合度較高

**發現**:
```typescript
// Overview Component 直接嵌入其他元件
<app-blueprint-tasks></app-blueprint-tasks>
<app-blueprint-members></app-blueprint-members>
```

**影響**:
- Overview 元件依賴多個子元件
- 難以獨立測試
- 模組未啟用時仍載入元件程式碼

**建議改進**:
```typescript
// 使用動態載入和條件渲染
@if (isModuleEnabled(ModuleType.TASKS)) {
  <ng-container *ngComponentOutlet="tasksComponent"></ng-container>
}

// 或使用 Lazy Loading
async loadTasksComponent() {
  const { BlueprintTasksComponent } = await import('./tasks/tasks.component');
  return BlueprintTasksComponent;
}
```

### 3.2 資料隔離 ✅ 良好

**優點**: 使用 Supabase RLS (Row Level Security)

```sql
-- 藍圖資料的 RLS 政策
CREATE POLICY "Users can view their blueprints"
ON blueprints FOR SELECT
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT blueprint_id FROM blueprint_members
    WHERE account_id = auth.uid()
  )
);
```

這提供了**資料庫層級的隔離**，是最佳實踐。

### 3.3 狀態隔離 ⚠️ 待改進

**問題**: 全域狀態可能洩漏

```typescript
// Service 中的 Signal 是全域的
@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasksState = signal<Task[]>([]); // 全域狀態
}
```

**影響**:
- 在不同藍圖間切換時，狀態可能殘留
- 需要手動清理狀態

**建議**:
```typescript
// 選項 1: 按藍圖 ID 隔離狀態
private tasksByBlueprint = signal<Map<string, Task[]>>(new Map());

getTasks(blueprintId: string): Signal<Task[]> {
  return computed(() => this.tasksByBlueprint().get(blueprintId) || []);
}

// 選項 2: 使用 Workspace Context
@Injectable()
export class TaskService {
  // 透過 WorkspaceContextService 注入當前藍圖 ID
  private blueprintId = this.workspaceContext.currentBlueprintId;
}
```

### 3.4 依賴注入隔離 ✅ 良好

**優點**: 使用 Angular DI 系統

```typescript
@Injectable({ providedIn: 'root' })  // 單例服務
@Injectable()                         // 元件層級服務
```

良好使用了 Angular 的依賴注入隔離機制。

---

## 4. 生產標準差距 (Production Standards Gaps)

### 4.1 測試覆蓋率 ❌ 嚴重不足

**現況**:
- 只有 1 個測試檔案: `i18n.service.spec.ts`
- 測試覆蓋率: < 1%

**生產標準**:
- 最低要求: 60% 覆蓋率
- 推薦: 80% 覆蓋率
- 關鍵業務邏輯: 100% 覆蓋率

**需要補充的測試**:
```
優先級 P0 (必須):
├── 認證流程測試 (login, register)
├── 藍圖 CRUD 測試
├── 權限檢查測試
├── Module Guards 測試
└── 核心 Service 單元測試

優先級 P1 (重要):
├── 任務管理測試
├── 財務模組測試
├── 表單驗證測試
└── API 整合測試

優先級 P2 (建議):
├── E2E 測試
├── 效能測試
└── 可訪問性測試
```

**建議行動計畫**:
```typescript
// 1. 設定測試基礎設施
// karma.conf.js - 已存在
// 需要確保測試可以執行

// 2. 為核心服務編寫測試
describe('BlueprintService', () => {
  it('should create blueprint with enabled modules', async () => {
    // 測試藍圖建立
  });
  
  it('should enforce module guards', async () => {
    // 測試模組守衛
  });
});

// 3. 設定 CI/CD 中的測試門檻
// .github/workflows/ci.yml
- name: Run tests
  run: npm run test -- --code-coverage --watch=false
- name: Check coverage
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 60 ]; then
      echo "Coverage below 60%"
      exit 1
    fi
```

### 4.2 環境配置管理 ⚠️ 需要改進

**現況**:
```typescript
// .env.example 包含公開金鑰（正確）
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

// 但缺少環境切換機制
```

**問題**:
1. 沒有 `.env.development` 和 `.env.production`
2. 敏感資訊直接寫在 environment 檔案中
3. 沒有環境變數驗證

**建議**:
```typescript
// 1. 建立環境檔案結構
.env.local         # 本地開發（git ignored）
.env.development   # 開發環境
.env.staging       # 測試環境
.env.production    # 生產環境

// 2. 使用環境變數驗證
// src/environments/environment.validator.ts
export function validateEnvironment(env: Environment): void {
  const required = ['supabaseUrl', 'supabaseKey'];
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// 3. 在 main.ts 中驗證
validateEnvironment(environment);
```

### 4.3 錯誤監控與日誌 ❌ 缺失

**現況**:
- 有 `LoggerService` 但未連接到外部監控系統
- 沒有錯誤追蹤（如 Sentry）
- 沒有效能監控（如 Google Analytics）

**生產標準需求**:
```typescript
// 1. 整合 Sentry 錯誤追蹤
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  tracesSampleRate: 0.1,
});

// 2. 整合 Google Analytics 或類似工具
// 3. 設定日誌等級
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// 4. 結構化日誌
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  blueprintId?: string;
}
```

### 4.4 安全性檢查 ⚠️ 部分完成

**已完成**:
- ✅ TypeScript strict mode 啟用
- ✅ Supabase RLS 政策
- ✅ 認證守衛
- ✅ 模組守衛

**缺失**:
- ❌ 沒有 Content Security Policy (CSP)
- ❌ 沒有 CSRF 保護配置
- ❌ 沒有 Rate Limiting
- ❌ 沒有 API 金鑰輪換機制
- ❌ 沒有安全標頭配置

**建議**:
```typescript
// 1. 在 index.html 中添加 CSP
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline';">

// 2. 配置 HTTP 安全標頭（在 hosting 層）
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains

// 3. 實作 Rate Limiting（在 Supabase Edge Functions）
import { corsHeaders, rateLimiter } from './utils';

const handler = async (req: Request) => {
  const userId = getUserId(req);
  
  if (!await rateLimiter.check(userId, 100, 60)) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // 處理請求
};
```

### 4.5 部署與 CI/CD ✅ 基本完成，可強化

**現有配置**:
- ✅ GitHub Actions CI (.github/workflows/ci.yml)
- ✅ CodeQL 安全掃描
- ✅ 部署到 Vercel
- ✅ Release workflow

**可強化項目**:
```yaml
# 1. 添加自動測試步驟
- name: Run unit tests
  run: npm run test -- --code-coverage --watch=false

- name: Run E2E tests
  run: npm run e2e

# 2. 添加效能測試
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://staging.gighub.com
    uploadArtifacts: true

# 3. 添加依賴安全檢查
- name: Run npm audit
  run: npm audit --audit-level=moderate

# 4. 添加 Docker 建置（可選）
- name: Build Docker image
  run: docker build -t gighub:${{ github.sha }} .
```

### 4.6 文件完整性 ⚠️ 部分完成

**已有文件**:
- ✅ README.md
- ✅ FEATURES.md (剛建立)
- ✅ 架構文件 (docs/)
- ✅ API 參考 (docs/reference/api/)

**缺失的生產必要文件**:
```
❌ DEPLOYMENT.md - 部署指南
   ├── 環境準備
   ├── 建置步驟
   ├── 部署檢查清單
   └── 回滾程序

❌ TROUBLESHOOTING.md - 疑難排解
   ├── 常見問題
   ├── 錯誤碼對照
   ├── 除錯指南
   └── 聯絡支援

❌ SECURITY.md - 安全政策
   ├── 漏洞回報流程
   ├── 安全更新政策
   └── 合規性說明

❌ MONITORING.md - 監控指南
   ├── 關鍵指標
   ├── 告警設定
   ├── 日誌查詢
   └── 儀表板說明

❌ API_VERSIONING.md - API 版本策略
   ├── 版本命名規則
   ├── 棄用政策
   └── 遷移指南
```

### 4.7 效能優化 ⚠️ 待改進

**現況**:
- ✅ Lazy Loading 路由
- ✅ OnPush Change Detection (部分元件)
- ✅ Angular Signals (響應式狀態)

**待優化**:
```typescript
// 1. 圖片優化
// 使用 NgOptimizedImage
<img ngSrc="assets/blueprint-cover.jpg" 
     width="800" 
     height="600" 
     priority>

// 2. Bundle 大小分析
npm run analyze:view

// 3. 樹搖優化確認
// 檢查是否有未使用的程式碼

// 4. 快取策略
// Service Worker 配置
// API 快取策略

// 5. 資料預載
// 關鍵資料預先載入
async preloadCriticalData() {
  const blueprintId = this.route.snapshot.params['id'];
  
  // 並行載入
  await Promise.all([
    this.blueprintService.findById(blueprintId),
    this.memberService.loadMembers(blueprintId),
    this.taskService.loadTasks(blueprintId)
  ]);
}
```

### 4.8 可訪問性 (a11y) ❌ 未評估

**需要檢查**:
```
□ ARIA 標籤
□ 鍵盤導航
□ 螢幕閱讀器支援
□ 色彩對比度
□ 焦點管理
□ 表單錯誤通知
```

**建議工具**:
```bash
# 安裝 axe-core
npm install --save-dev @axe-core/playwright

# 執行可訪問性測試
npx @axe-core/cli http://localhost:4200
```

### 4.9 國際化完整性 ⚠️ 部分完成

**現況**:
- ✅ i18n 基礎設施
- ✅ 支援多語言切換

**待完善**:
```typescript
// 1. 確保所有文字都已國際化
// 搜尋硬編碼的中文字串
grep -r "[\u4e00-\u9fa5]" src/app --include="*.html" --include="*.ts"

// 2. 翻譯完整性檢查
// 確保所有語言檔案包含相同的鍵值

// 3. 日期與數字格式化
// 根據語言環境正確格式化

// 4. RTL 支援（如果需要阿拉伯語等）
```

### 4.10 資料備份與災難復原 ❌ 缺失

**需要建立**:
```
□ 自動備份策略
  ├── 資料庫每日備份
  ├── 檔案儲存備份
  └── 配置備份

□ 災難復原計畫 (DRP)
  ├── RTO (Recovery Time Objective)
  ├── RPO (Recovery Point Objective)
  ├── 復原步驟文件
  └── 定期演練計畫

□ 資料遷移程序
  ├── 資料匯出
  ├── 資料匯入
  └── 資料驗證
```

---

## 5. 優先改進建議 (Prioritized Recommendations)

### 🔴 P0 - 立即修復（必須在生產前完成）

1. **建立測試覆蓋率**
   - 目標: 達到 60% 最低覆蓋率
   - 重點: 認證、權限、核心業務邏輯

2. **完善錯誤監控**
   - 整合 Sentry 或類似服務
   - 設定告警規則
   - 建立錯誤響應流程

3. **環境配置管理**
   - 分離開發/測試/生產環境
   - 移除硬編碼的配置
   - 實作環境變數驗證

4. **安全性強化**
   - 配置 CSP 標頭
   - 實作 Rate Limiting
   - 設定安全標頭

5. **移除 console.log**
   - 搜尋並移除所有 console.log
   - 統一使用 LoggerService

### 🟡 P1 - 高優先級（生產後儘快完成）

1. **統一命名規範**
   - 決定路由命名策略
   - 統一元件命名
   - 更新文件

2. **完善 CI/CD**
   - 添加自動測試步驟
   - 添加效能測試
   - 設定部署檢查清單

3. **改善狀態隔離**
   - 實作藍圖層級的狀態隔離
   - 添加狀態清理邏輯

4. **補全生產文件**
   - DEPLOYMENT.md
   - TROUBLESHOOTING.md
   - SECURITY.md

### 🟢 P2 - 中優先級（持續改進）

1. **效能優化**
   - Bundle 大小分析
   - 圖片優化
   - 實作快取策略

2. **可訪問性改進**
   - 執行 a11y 審計
   - 修復發現的問題

3. **完善國際化**
   - 檢查翻譯完整性
   - 測試所有語言版本

4. **元件解耦**
   - 減少 Overview 元件的依賴
   - 實作動態元件載入

### ⚪ P3 - 低優先級（長期優化）

1. **架構重構**
   - 評估微前端架構
   - 考慮 Monorepo 結構

2. **開發者體驗**
   - 改進開發工具
   - 添加程式碼生成器

3. **進階監控**
   - 使用者行為分析
   - 效能持續監控

---

## 6. 檢查清單 (Production Readiness Checklist)

### 程式碼品質

- [ ] 測試覆蓋率 ≥ 60%
- [ ] 無 TypeScript 編譯錯誤
- [ ] 無 ESLint 警告
- [ ] 無 console.log 殘留
- [ ] 程式碼審查通過

### 安全性

- [ ] RLS 政策已設定
- [ ] 認證流程已測試
- [ ] 權限檢查完整
- [ ] CSP 標頭已配置
- [ ] 安全標頭已設定
- [ ] Rate Limiting 已實作
- [ ] 依賴安全掃描通過

### 效能

- [ ] Lighthouse 分數 ≥ 90
- [ ] 首次內容繪製 < 1.5s
- [ ] 可互動時間 < 3s
- [ ] Bundle 大小 < 500KB (gzip)
- [ ] 圖片已優化

### 監控

- [ ] 錯誤追蹤已設定
- [ ] 效能監控已設定
- [ ] 日誌系統已配置
- [ ] 告警規則已定義
- [ ] 儀表板已建立

### 文件

- [ ] README 完整
- [ ] API 文件完整
- [ ] 部署指南完整
- [ ] 疑難排解指南完整
- [ ] 安全政策文件完整

### 基礎設施

- [ ] CI/CD 流程完整
- [ ] 自動備份已設定
- [ ] 災難復原計畫已制定
- [ ] 環境配置已分離
- [ ] Rollback 機制已測試

### 營運

- [ ] 監控儀表板已就緒
- [ ] 值班輪換已排定
- [ ] 事故響應流程已定義
- [ ] 聯絡清單已更新
- [ ] 客戶支援流程已建立

---

## 7. 結論與建議

### 整體評估

GigHub 專案在**架構設計**和**技術選型**上表現良好，使用了現代化的技術堆疊（Angular 21、Signals、Supabase），並且遵循了許多最佳實踐。然而，在**測試覆蓋**、**錯誤監控**、**文件完整性**等生產必要項目上仍有顯著差距。

### 關鍵風險

1. **測試不足** - 最大風險，可能導致生產問題
2. **錯誤追蹤缺失** - 無法及時發現和修復問題
3. **命名不一致** - 增加維護成本和學習曲線

### 生產就緒時程建議

```
第 1 週: P0 項目（測試、監控、安全）
第 2-3 週: P1 項目（統一性、CI/CD）
第 4-8 週: P2 項目（效能、可訪問性）
持續: P3 項目（長期優化）
```

### 最終建議

**建議在完成所有 P0 和 P1 項目後才上線生產環境。**

目前專案適合：
- ✅ 內部測試環境
- ✅ Alpha 測試
- ✅ 小規模 Beta 測試

**不建議用於**：
- ❌ 大規模公開發布
- ❌ 企業正式環境
- ❌ 關鍵業務系統

透過系統性地解決上述問題，GigHub 專案可以在 6-8 週內達到生產就緒標準。

---

**報告產生日期**: 2025-12-08  
**下次審查建議**: 完成 P0 項目後  
**聯絡人**: Development Team

---

## 附錄 A: 快速命令參考

```bash
# 測試相關
npm run test                          # 執行單元測試
npm run test -- --code-coverage       # 執行測試並產生覆蓋率報告
npm run e2e                          # 執行 E2E 測試

# 程式碼品質
npm run lint                         # 執行 linter
npm run lint:ts                      # TypeScript linting
npm run lint:style                   # 樣式 linting

# 建置相關
npm run build                        # 建置生產版本
npm run analyze                      # 分析 bundle 大小
npm run analyze:view                 # 視覺化 bundle

# 檢查
grep -r "console.log" src/app        # 搜尋 console.log
find src/app -name "*.spec.ts"       # 查找測試檔案
```

## 附錄 B: 參考資源

- [Angular 最佳實踐](https://angular.dev/best-practices)
- [Supabase 生產指南](https://supabase.com/docs/guides/platform/going-into-prod)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
