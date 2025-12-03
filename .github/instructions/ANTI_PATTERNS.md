---
description: '專案中應避免的反模式與不良實踐清單'
applyTo: '**'
---

# Anti-Patterns

專案中應避免的反模式與不良實踐清單。

## Angular 架構

- 不要在 Angular 20+ 專案中使用 NgModules，優先使用 Standalone Components
- 不要混用 Signals 和 RxJS Observable 進行狀態管理，統一使用 Signals
- 不要在 Component 中直接操作 DOM，使用 Angular 的資料綁定和指令
- 不要在 Component 中直接呼叫 `HttpClient`，使用 Service 層封裝
- 不要使用 `any` 型別，使用明確的 TypeScript 介面或型別
- 不要在模板中使用複雜的運算式，將邏輯移到 Component 或 Pipe
- 不要忽略 `OnPush` 變更檢測策略，效能敏感元件應使用 `OnPush`
- 不要在 `ngFor` 中缺少 `trackBy` 函數，影響列表渲染效能
- 不要使用 `setTimeout` 或 `setInterval` 處理非同步，使用 RxJS 或 Signals
- 不要在 Component 中直接訂閱 Observable 而不取消訂閱，使用 `takeUntilDestroyed` 或 `async` pipe

## ng-alain / ng-zorro-antd

- 不要直接使用原生 HTML 元件，優先使用 ng-zorro-antd 元件
- 不要自訂樣式覆蓋 ng-zorro 主題變數，使用主題系統
- 不要忽略 `@delon/abc` 業務元件（ST、SF、SE），重複造輪子
- 不要在表單中使用 `ngModel`，使用 `@delon/form` 或 Reactive Forms
- 不要忽略 ng-alain 的佈局系統，直接自訂佈局

## TypeScript

- 不要使用 `any` 型別，使用 `unknown` 或明確型別
- 不要忽略 `strict` 模式，保持 TypeScript 嚴格檢查
- 不要使用 `@ts-ignore` 或 `@ts-expect-error`，修正型別問題
- 不要在介面中使用可選屬性 `?` 當屬性必須存在時
- 不要使用 `Function` 型別，使用具體的函數簽名
- 不要忽略 `readonly` 修飾符，確保不可變性

## Angular Signals

- 不要在 Signal 中使用副作用，使用 `effect()` 處理副作用
- 不要在 Computed Signal 中修改其他 Signal，保持純函數
- 不要混用 `signal()` 和 `BehaviorSubject`，統一使用 Signals
- 不要在 Signal 中儲存複雜物件而不使用 `shallowEqual` 或 `deepEqual`
- 不要忽略 Signal 的更新通知，確保 UI 正確響應

## Supabase / 資料庫

- 不要在客戶端直接執行 SQL，使用 Supabase Client API
- 不要忽略 RLS (Row Level Security) 政策，確保資料安全
- 不要在客戶端儲存敏感資訊，使用環境變數或 Supabase Vault
- 不要忽略 Supabase 的型別生成，使用 `supabase gen types`
- 不要直接查詢所有資料，使用分頁和篩選
- 不要在客戶端進行複雜的資料處理，使用資料庫函數或 Edge Functions

## 效能

- 不要載入不必要的模組，使用 Lazy Loading
- 不要忽略 Bundle 大小，定期使用 `yarn analyze` 檢查
- 不要在初始載入時載入所有資料，使用分頁和虛擬滾動
- 不要忽略圖片優化，使用適當的格式和尺寸
- 不要在循環中進行昂貴操作，使用快取或優化演算法

## 安全

- 不要在程式碼中硬編碼 API Key 或密碼，使用環境變數
- 不要忽略輸入驗證，使用 Angular Validators 或自訂驗證器
- 不要直接渲染使用者輸入，使用 Angular 的內建清理機制
- 不要忽略 CORS 設定，正確配置 Supabase 允許的來源
- 不要在客戶端進行敏感業務邏輯驗證，在後端驗證

## 程式碼組織

- 不要將業務邏輯放在 Component 中，使用 Service 或 Facade
- 不要建立過深的資料夾結構，保持扁平化
- 不要在多個地方重複相同邏輯，提取共用 Service 或 Utility
- 不要忽略檔案命名規範，遵循 Angular Style Guide
- 不要在 Service 中直接使用 `console.log`，使用適當的日誌服務

## 測試

- 不要忽略單元測試，保持測試覆蓋率
- 不要在測試中使用真實的 HTTP 請求，使用 Mock 或 Spy
- 不要忽略 E2E 測試，確保關鍵流程正常運作
- 不要在測試中測試框架功能，測試業務邏輯

## Git / 版本控制

- 不要提交 `node_modules`、`.env` 或建置產物
- 不要使用模糊的 Commit 訊息，遵循 Conventional Commits
- 不要在主分支直接開發，使用 Feature Branch
- 不要忽略 `.gitignore`，確保敏感檔案不被追蹤
