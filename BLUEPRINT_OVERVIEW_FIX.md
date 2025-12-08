# 藍圖概覽頁面問題修復報告

## 問題描述

用戶反映點開藍圖頁面時出現以下問題：
1. 頁面一直處於載入狀態
2. 功能不完整或只顯示標題
3. 控制台出現多個錯誤

## 錯誤日誌分析

### 1. 圖標錯誤
```
GET http://localhost:4200/assets/outline/bug.svg 404 (Not Found)
Uncaught Error: [@ant-design/icons-angular]:the icon bug-o does not exist or is not registered.
```

**原因**: `bug` 圖標（BugOutline）未在應用程式中註冊，導致 Angular 試圖從檔案系統載入 SVG，但該檔案不存在。

**影響**: 使用該圖標的「問題追蹤」功能無法正確顯示圖標。

### 2. Locale 錯誤
```
ERROR RuntimeError: NG02100: InvalidPipeArgument: 'NG0701: Missing locale data for the locale "zh-TW".' for pipe '_DatePipe'
```

**原因**: 多個組件（overview.component.ts, blueprint-edit-drawer.component.ts, activities.component.ts 等）使用 `new DatePipe('zh-TW')` 來格式化日期，但 Angular 應用程式在啟動時沒有註冊 zh-TW locale 資料。

**影響**: 
- 藍圖的建立時間和更新時間無法顯示
- 可能導致整個組件渲染失敗
- 用戶看到空白或錯誤訊息

### 3. 已棄用組件警告
```
[NG-ZORRO]: <nz-tabset> is deprecated, please use <nz-tabs> instead.
```

**原因**: 使用了 ng-zorro-antd 中已棄用的 `<nz-tabset>` 組件。

**影響**: 雖然功能仍可使用，但在未來版本中可能會被移除，且可能影響效能。

## 修復方案

### 修復 1: 註冊 BugOutline 圖標

**檔案**: `src/style-icons.ts`

**修改前**:
```typescript
import {
  BellOutline,
  BulbOutline,
  // ... 其他圖標
} from '@ant-design/icons-angular/icons';

export const ICONS = [
  BellOutline,
  BulbOutline,
  // ... 其他圖標
];
```

**修改後**:
```typescript
import {
  BellOutline,
  BugOutline,  // 新增
  BulbOutline,
  // ... 其他圖標
} from '@ant-design/icons-angular/icons';

export const ICONS = [
  BellOutline,
  BugOutline,  // 新增註冊
  BulbOutline,
  // ... 其他圖標
];
```

### 修復 2: 註冊 zh-TW Locale

**檔案**: `src/app/app.config.ts`

**修改前**:
```typescript
import { default as ngLang } from '@angular/common/locales/zh';
```

**修改後**:
```typescript
import { registerLocaleData } from '@angular/common';
import { default as ngLang } from '@angular/common/locales/zh';
import ngZhTw from '@angular/common/locales/zh-Hant';

// Register zh-TW locale for DatePipe
registerLocaleData(ngZhTw, 'zh-TW');
```

**說明**: 
- 導入 `registerLocaleData` 函數和 zh-Hant locale 資料
- 在應用程式配置階段註冊 zh-TW locale
- 這確保了所有使用 `DatePipe('zh-TW')` 的組件都能正確運作

### 修復 3: 更新已棄用組件

**檔案**: `src/app/routes/blueprint/overview/overview.component.ts`

**修改內容**:
- 將 `<nz-tabset>` 更新為 `<nz-tabs>`
- 將 `<nz-tab>` 更新為 `<nz-tab-pane>`

**修改範例**:

修改前:
```html
<nz-tabset class="content-tabs" [(nzSelectedIndex)]="selectedTabIndex">
  <nz-tab nzTitle="概覽">
    <!-- 內容 -->
  </nz-tab>
  <nz-tab nzTitle="任務管理">
    <!-- 內容 -->
  </nz-tab>
</nz-tabset>
```

修改後:
```html
<nz-tabs class="content-tabs" [(nzSelectedIndex)]="selectedTabIndex">
  <nz-tab-pane nzTitle="概覽">
    <!-- 內容 -->
  </nz-tab-pane>
  <nz-tab-pane nzTitle="任務管理">
    <!-- 內容 -->
  </nz-tab-pane>
</nz-tabs>
```

## 資料庫連接分析

### Supabase 配置檢查

**檔案**: `src/environments/environment.ts`

配置狀態：✅ 正確
```typescript
supabase: {
  url: 'https://obwyowvbsnqsxsnlsbhl.supabase.co',
  anonKey: '...'  // 已正確配置
}
```

### 藍圖載入邏輯檢查

**檔案**: `src/app/routes/blueprint/overview/overview.component.ts`

**載入流程**:
```typescript
async loadBlueprint(): Promise<void> {
  const id = this.blueprintId();
  if (!id) {
    this.error.set('無效的藍圖 ID');
    return;
  }

  this.loading.set(true);  // 設定載入中
  this.error.set(null);

  try {
    const blueprint = await this.blueprintFacade.findById(id);
    if (blueprint) {
      this.blueprint.set(blueprint);
      // 載入相關資料
      const members = await this.blueprintFacade.getBlueprintMembers(id);
      this.members.set(members);
      this.loadFinancialData(id);
      if (blueprint.enabled_modules?.includes(ModuleType.TASKS)) {
        this.loadTasks(id);
      }
    } else {
      this.error.set('找不到藍圖');
    }
  } catch (err) {
    this.logger.error('[BlueprintOverviewComponent] Failed to load blueprint:', err);
    this.error.set(err instanceof Error ? err.message : '載入藍圖失敗');
  } finally {
    this.loading.set(false);  // 確保載入狀態重置
  }
}
```

**分析結果**: 
- ✅ 載入邏輯正確
- ✅ 使用 try-catch-finally 確保 loading 狀態正確重置
- ✅ 錯誤處理完善
- ✅ 非同步操作處理正確

## 測試步驟

### 前置準備
```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm start
```

### 測試檢查清單

#### 1. 圖標測試
- [ ] 導航到藍圖概覽頁面
- [ ] 檢查「問題追蹤」卡片是否顯示 bug 圖標
- [ ] 控制台不應出現 bug.svg 404 錯誤

#### 2. 日期顯示測試
- [ ] 檢查藍圖的「建立時間」統計卡片
- [ ] 檢查藍圖的「更新時間」統計卡片
- [ ] 兩個欄位都應顯示正確的日期格式（yyyy/MM/dd）
- [ ] 控制台不應出現 zh-TW locale 錯誤

#### 3. 分頁標籤測試
- [ ] 檢查「概覽」、「任務管理」、「成員管理」、「財務」、「活動」等標籤
- [ ] 所有標籤都應正確顯示且可點擊
- [ ] 控制台不應出現 nz-tabset 棄用警告

#### 4. 資料載入測試
- [ ] 確認藍圖資訊正確載入（名稱、描述、標籤等）
- [ ] 確認統計數據顯示（啟用模組、成員數、時間等）
- [ ] 確認快速導航卡片正常顯示
- [ ] 如果啟用任務模組，確認任務列表正常顯示
- [ ] 確認成員列表正常顯示
- [ ] 確認財務資訊正常顯示（如有資料）
- [ ] 確認活動時間軸正常顯示

#### 5. 控制台檢查
```
✅ 不應有以下錯誤:
- GET http://localhost:4200/assets/outline/bug.svg 404
- the icon bug-o does not exist or is not registered
- Missing locale data for the locale "zh-TW"
- <nz-tabset> is deprecated
```

## 可能的其他問題

如果修復後藍圖頁面仍然持續載入或顯示不完整，請檢查：

### 1. 網路連接
```bash
# 測試 Supabase 連接
curl -I https://obwyowvbsnqsxsnlsbhl.supabase.co
```

### 2. Supabase 資料庫狀態
- 登入 Supabase Dashboard
- 檢查專案是否啟用且運作正常
- 檢查 blueprints 資料表是否有資料

### 3. RLS (Row Level Security) 政策
- 確認已啟用 RLS 政策
- 確認當前用戶有讀取權限
- 檢查政策規則是否正確

### 4. 資料庫資料
```sql
-- 檢查藍圖資料
SELECT id, name, status, created_at, updated_at 
FROM blueprints 
WHERE status != 'deleted'
LIMIT 10;

-- 檢查成員資料
SELECT blueprint_id, account_id, role 
FROM blueprint_members 
LIMIT 10;
```

### 5. 瀏覽器快取
```bash
# 清除瀏覽器快取
# 或使用無痕模式測試
```

## 技術細節

### Angular Locale 註冊機制

Angular 的 DatePipe 需要 locale 資料來正確格式化日期。預設情況下，只有 'en-US' locale 會被註冊。要使用其他 locale（如 zh-TW），需要：

1. 導入對應的 locale 資料
2. 使用 `registerLocaleData()` 註冊
3. 在 DatePipe 中指定 locale ID

### ng-zorro-antd 版本更新

ng-zorro-antd 20.x 版本中：
- `<nz-tabset>` 已被標記為棄用
- 新的 `<nz-tabs>` 組件提供更好的效能和 API
- `<nz-tab>` 改為 `<nz-tab-pane>` 以更清楚表達其用途

### 圖標註冊機制

@ant-design/icons-angular 使用靜態註冊機制：
- 圖標需要在應用程式啟動時預先註冊
- 未註冊的圖標會嘗試從檔案系統載入
- 建議將常用圖標統一註冊在 `style-icons.ts`

## 結論

本次修復解決了三個關鍵問題：
1. ✅ 圖標註冊問題
2. ✅ Locale 資料問題
3. ✅ 已棄用組件問題

這些修復應該能夠解決藍圖概覽頁面的載入和顯示問題。如果問題持續存在，建議進一步檢查網路連接、資料庫狀態和 RLS 政策配置。

## 相關檔案

### 修改的檔案
- `src/style-icons.ts` - 註冊 BugOutline 圖標
- `src/app/app.config.ts` - 註冊 zh-TW locale
- `src/app/routes/blueprint/overview/overview.component.ts` - 更新已棄用組件

### 相關檔案
- `src/app/core/supabase/supabase.service.ts` - Supabase 連接服務
- `src/app/core/facades/blueprint/blueprint.facade.ts` - 藍圖業務邏輯門面
- `src/app/shared/services/blueprint/blueprint.service.ts` - 藍圖資料服務
- `src/environments/environment.ts` - 環境配置

## 後續建議

1. **定期更新依賴**: 確保 Angular、ng-zorro-antd 等依賴保持最新
2. **監控棄用警告**: 及時更新使用已棄用 API 的程式碼
3. **完善錯誤處理**: 為所有 Supabase 操作添加適當的錯誤處理和用戶提示
4. **添加載入狀態**: 為長時間操作添加明確的載入指示器
5. **優化效能**: 考慮使用快取機制減少不必要的資料庫查詢
