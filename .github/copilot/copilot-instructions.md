# Copilot 全域行為規範

> 定義 GitHub Copilot 在本專案中的行為模式、語氣風格與開發規則

📖 **完整開發指南請參考**: [docs/README.md](../../docs/README.md)

---

## 🎯 核心原則

### 1. 奧卡姆剃刀原則

- **功能最小化**：每個功能只做必要的事，避免過度設計
- **企業標準**：雖然簡潔但符合企業級品質要求
- **易於擴展**：預留擴展接口但不預先實現
- **避免冗餘**：資料表只建立必要欄位，程式碼只寫必要邏輯

### 2. 程式碼品質標準

- 遵循 Angular 20 最佳實踐
- 使用 Standalone Components
- 使用 Angular Signals 狀態管理
- 使用 Repository 模式封裝 Supabase API
- 單一檔案不超過 500 行
- 模板不超過 300 行

### 3. 語氣與風格

- **語言**：中文為主，技術術語保持英文
- **註解**：繁體中文，簡潔明確
- **命名**：英文，遵循專案命名規範
- **錯誤訊息**：對使用者友善的繁體中文

---

## 📋 開發規則

### 必須遵守

1. **Standalone Components** - 永遠使用獨立元件，不使用 NgModule
2. **Signal 狀態管理** - 使用 `signal()`, `computed()`, `effect()`
3. **inject() 函數** - 使用 `inject()` 取代 constructor DI
4. **input/output 函數** - 使用 `input()`, `output()` 取代裝飾器
5. **kebab-case 檔名** - 使用 `feature-name.component.ts` 格式
6. **OnPush 策略** - 元件使用 `ChangeDetectionStrategy.OnPush`
7. **Repository 模式** - Supabase 呼叫必須經過 Repository 封裝

### 絕對禁止

1. ❌ 使用 `@Input()` / `@Output()` 裝飾器
2. ❌ 使用 `any` 類型（除非有明確理由）
3. ❌ 直接在元件中呼叫 Supabase API
4. ❌ 內聯樣式（使用元件 LESS 或 ng-alain 工具類）
5. ❌ 循環依賴
6. ❌ 硬編碼字串（使用常數或 i18n）

---

## 🏗️ 架構決策流程

```
問題：這個功能應該放在哪裡？

1. 涉及用戶身份、組織、認證？
   └── 是 → 基礎層 (Foundation Layer)

2. 涉及藍圖、權限？
   └── 是 → 容器層 (Container Layer)

3. 業務功能（任務、日誌、品質）？
   └── 是 → 業務層 (Business Layer)
```

### 資料夾選擇

| 問題 | 答案 | 位置 |
|------|------|------|
| 是頁面路由嗎？ | 是 | `src/app/routes/` |
| 是多處使用的共用元件？ | 是 | `src/app/shared/components/` |
| 是全域服務？ | 是 | `src/app/core/services/` |
| 是垂直功能切片？ | 是 | `src/app/features/` |

---

## 📝 命名規範

### 檔案命名 (kebab-case)

| 類型 | 格式 | 範例 |
|------|------|------|
| Component | `{name}.component.ts` | `task-tree.component.ts` |
| Store | `{name}.store.ts` | `blueprint.store.ts` |
| Service | `{name}.service.ts` | `blueprint.service.ts` |
| Interface | `{name}.interface.ts` | `task.interface.ts` |
| Model | `{name}.model.ts` | `blueprint.model.ts` |
| Enum | `{name}.enum.ts` | `task-status.enum.ts` |
| Repository | `{name}.repository.ts` | `task.repository.ts` |

### 函數命名前綴

| 前綴 | 用途 | 範例 |
|------|------|------|
| `load` | 載入資料 | `loadBlueprintsByOwner()` |
| `create` | 建立資源 | `createBlueprint()` |
| `update` | 更新資源 | `updateTask()` |
| `delete` | 刪除資源 | `deleteTask()` |
| `get` | 取得單一值 | `getUserAccountId()` |
| `find` | 查詢多筆 | `findTasksByStatus()` |
| `is` | 布林判斷 | `isOrgAdmin()` |
| `has` | 存在判斷 | `hasPermission()` |
| `can` | 權限判斷 | `canEditBlueprint()` |
| `on` | 事件處理 | `onTaskSelect()` |
| `handle` | 處理器 | `handleError()` |

---

## 🔒 安全規則

### RLS 政策

- 每張表必須有 RLS 政策
- 使用 Helper Functions 封裝權限檢查
- 避免在 RLS 中直接查詢受保護的表（防止遞迴）

### 敏感資料

- 密碼使用 Hash 存儲
- Token 不記錄到日誌
- 個人資料遵循 LGPD

### 前端安全

- 輸入驗證使用 Angular Forms
- 避免 innerHTML（使用 DomSanitizer）
- API 錯誤不暴露內部細節

---

## 🧪 測試要求

### 覆蓋率目標

| 層級 | 目標 | 重點 |
|------|------|------|
| Store | 100% | 狀態變更、computed signals |
| Service | 80%+ | API 呼叫、錯誤處理 |
| Component | 60%+ | 關鍵交互、表單提交 |
| Utils | 100% | 純函數、邊界條件 |

### 測試命名

```typescript
// 格式：MethodName_Condition_ExpectedResult
it('loadTasks_whenBlueprintIdValid_shouldReturnTasks', () => { ... });
it('updateStatus_whenNoPermission_shouldThrowError', () => { ... });
```

---

## 📊 效能基準

### 前端指標

| 指標 | 目標 |
|------|------|
| FCP | < 1.5s |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| 任務樹渲染 (1000節點) | < 500ms |

### 後端指標

| 指標 | 目標 |
|------|------|
| API P50 | < 200ms |
| API P95 | < 500ms |
| API P99 | < 1s |
| 資料庫查詢 P95 | < 100ms |

---

## 🔄 Signal 狀態管理

### 重置時機

| 觸發情境 | 重置範圍 |
|----------|----------|
| 登出 | 所有 Store Signal |
| 切換組織 | Blueprint, Task, Diary, Todo Store |
| 切換藍圖 | Task, Diary, Todo Store |

### 快取失效

| 資料類型 | 策略 |
|----------|------|
| 藍圖列表 | 切換組織時失效 |
| 任務樹 | Stale-While-Revalidate (5分鐘) |
| 用戶權限 | 切換上下文時重新載入 |

---

## 📚 參考資源

### 內部文件
- [文件中心](../../docs/README.md)
- [專案架構](../../docs/GigHub_Architecture.md)
- [編碼標準](../../docs/reference/coding-standards.md)
- [Git 工作流](../../docs/reference/git-workflow.md)
- [測試策略](../../docs/reference/testing-strategy.md)

### 外部資源
- [Angular 風格指南](https://angular.dev/style-guide)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd](https://ng.ant.design)
- [Supabase 文檔](https://supabase.com/docs)

---

**最後更新**: 2025-12-03
