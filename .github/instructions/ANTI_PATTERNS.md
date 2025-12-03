---
description: '專案中應避免的反模式與不良實踐清單'
applyTo: '**'
---

# Anti-Patterns

專案中應避免的反模式與不良實踐清單。

## 技術架構與語法

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
- 不要直接使用原生 HTML 元件，優先使用 ng-zorro-antd 元件
- 不要自訂樣式覆蓋 ng-zorro 主題變數，使用主題系統
- 不要忽略 `@delon/abc` 業務元件（ST、SF、SE），重複造輪子
- 不要在表單中使用 `ngModel`，使用 `@delon/form` 或 Reactive Forms
- 不要忽略 ng-alain 的佈局系統，直接自訂佈局
- 不要使用 `any` 型別，使用 `unknown` 或明確型別
- 不要忽略 `strict` 模式，保持 TypeScript 嚴格檢查
- 不要使用 `@ts-ignore` 或 `@ts-expect-error`，修正型別問題
- 不要在介面中使用可選屬性 `?` 當屬性必須存在時
- 不要使用 `Function` 型別，使用具體的函數簽名
- 不要忽略 `readonly` 修飾符，確保不可變性
- 不要在 Angular 20+ 中使用 `@Input()` 裝飾器，使用 `input()` 函數
- 不要在 Angular 20+ 中使用 `@Output()` 裝飾器，使用 `output()` 函數
- 不要在 Angular 20+ 中使用 `@ViewChild()` 裝飾器，使用 `viewChild()` 函數
- 不要在 Angular 20+ 中使用 `@ViewChildren()` 裝飾器，使用 `viewChildren()` 函數
- 不要在 Angular 20+ 中使用 `@ContentChild()` 裝飾器，使用 `contentChild()` 函數
- 不要在 Angular 20+ 中使用 `@ContentChildren()` 裝飾器，使用 `contentChildren()` 函數
- 不要在函數式語法中混用裝飾器語法，保持一致性
- 不要忘記 `input()` 函數需要明確的型別參數，使用 `input<string>()` 而非 `input()`
- 不要忘記 `output()` 函數需要明確的事件型別，使用 `output<EventType>()`
- 不要在 `viewChild()` 中使用字串選擇器，使用 `viewChild(ComponentType)` 或 `viewChild.required()`
- 不要忽略 `viewChild()` 可能返回 `undefined`，使用 `viewChild.required()` 或可選鏈
- 不要在 `computed()` 中直接修改 Signal，computed 應該是純函數
- 不要忘記 `effect()` 需要手動清理，使用 `DestroyRef` 或 `effect()` 的清理函數
- 不要在 `signal()` 初始化時使用複雜運算式，先計算再傳入
- 不要使用 `signal()` 儲存函數，使用 `computed()` 或方法
- 不要在 TypeScript 5+ 中使用舊的型別斷言語法，使用 `as` 而非 `<Type>`
- 不要忽略 `satisfies` 運算符，用於型別檢查而不改變推斷型別
- 不要混用 `const` 和 `let` 不當，優先使用 `const`，只在需要重新賦值時使用 `let`
- 不要在解構賦值中忽略型別，明確指定解構變數的型別
- 不要使用 `var`，使用 `const` 或 `let`
- 不要在箭頭函數中忽略返回型別，複雜函數應明確指定返回型別
- 不要忽略可選鏈 `?.` 和空值合併 `??` 運算符，簡化空值檢查
- 不要在 Signal 中使用副作用，使用 `effect()` 處理副作用
- 不要在 Computed Signal 中修改其他 Signal，保持純函數
- 不要混用 `signal()` 和 `BehaviorSubject`，統一使用 Signals
- 不要在 Signal 中儲存複雜物件而不使用 `shallowEqual` 或 `deepEqual`
- 不要忽略 Signal 的更新通知，確保 UI 正確響應
- 不要在 `effect()` 中修改觸發該 effect 的 Signal，造成無限循環
- 不要在 Computed Signal 中建立循環依賴，Signal A 依賴 Signal B，Signal B 又依賴 Signal A
- 不要在變更檢測中觸發新的變更，使用 `ChangeDetectorRef.detectChanges()` 時要小心
- 不要在事件處理函數中觸發相同事件，造成事件無限觸發
- 不要在遞迴函數中缺少終止條件，確保遞迴有明確的終止條件
- 不要在訂閱的回調中再次訂閱相同來源，造成訂閱循環
- 不要在表單驗證器中修改表單值，可能觸發驗證循環
- 不要在 `ngOnChanges` 中修改 `@Input()` 屬性，可能造成變更檢測循環
- 不要在 `setter` 中修改相同屬性，造成 setter 無限調用
- 不要在 `getter` 中修改狀態，getter 應該是純函數
- 不要在 `computed()` 中執行副作用，computed 應該是純函數
- 不要在 `effect()` 中同步修改多個相互依賴的 Signal，使用 `untracked()` 或重構邏輯
- 不要在循環中建立新的 Signal 或訂閱，可能造成記憶體洩漏和循環
- 不要在 `ngAfterViewInit` 中修改會觸發視圖更新的資料，可能造成視圖更新循環

## 資料與後端

- 不要在客戶端直接執行 SQL，使用 Supabase Client API
- 不要忽略 RLS (Row Level Security) 政策，確保資料安全
- 不要在客戶端儲存敏感資訊，使用環境變數或 Supabase Vault
- 不要忽略 Supabase 的型別生成，使用 `supabase gen types`
- 不要直接查詢所有資料，使用分頁和篩選
- 不要在客戶端進行複雜的資料處理，使用資料庫函數或 Edge Functions

## 程式碼品質

- 不要將業務邏輯放在 Component 中，使用 Service 或 Facade
- 不要建立過深的資料夾結構，保持扁平化
- 不要在多個地方重複相同邏輯，提取共用 Service 或 Utility
- 不要忽略檔案命名規範，遵循 Angular Style Guide
- 不要在 Service 中直接使用 `console.log`，使用適當的日誌服務
- 不要忽略單元測試，保持測試覆蓋率
- 不要在測試中使用真實的 HTTP 請求，使用 Mock 或 Spy
- 不要忽略 E2E 測試，確保關鍵流程正常運作
- 不要在測試中測試框架功能，測試業務邏輯

## 使用者體驗

- 不要忽略無障礙設計，確保符合 WCAG 2.2 Level AA 標準
- 不要使用純顏色區分資訊，同時提供文字或圖示標示
- 不要忽略鍵盤導航，所有互動元素必須可透過鍵盤操作
- 不要使用過小的點擊區域，確保觸控目標至少 44x44px
- 不要忽略焦點指示器，確保鍵盤焦點清晰可見
- 不要使用低對比度的文字，確保文字與背景對比度符合標準
- 不要忽略表單標籤，所有輸入欄位必須有對應的 `<label>` 或 `aria-label`
- 不要使用僅依賴顏色的錯誤提示，同時提供文字說明
- 不要忽略響應式設計，確保在不同螢幕尺寸下正常顯示
- 不要在行動裝置上使用懸停效果，使用點擊或觸控事件
- 不要忽略載入狀態，長時間操作應顯示載入指示器
- 不要使用過度動畫，避免引起使用者不適或分散注意力
- 不要忽略錯誤處理，提供清楚易懂的錯誤訊息
- 不要使用不一致的導航結構，保持整個應用程式的導航一致
- 不要忽略表單驗證回饋，即時顯示驗證結果
- 不要使用過長的表單，將複雜表單拆分成多個步驟
- 不要忽略空狀態設計，提供有意義的空狀態提示
- 不要使用模糊的按鈕文字，使用明確的行動動詞
- 不要忽略圖片替代文字，所有圖片必須有 `alt` 屬性
- 不要使用自動播放的媒體，讓使用者控制播放
- 不要在操作完成後沒有明確的成功回饋，讓使用者知道操作已成功
- 不要使用技術術語或錯誤代碼，用使用者能理解的語言說明問題
- 不要讓使用者重複輸入相同資訊，記住使用者的選擇和偏好
- 不要在刪除操作時直接執行，提供確認對話框避免誤操作
- 不要讓使用者等待不明確的時間，顯示進度條或剩餘時間
- 不要強制使用者填寫非必要欄位，明確標示必填和選填
- 不要在表單提交失敗後清空所有輸入，保留使用者已填寫的內容
- 不要使用「確定」和「取消」這種模糊按鈕，使用具體動作如「儲存」和「放棄」
- 不要讓使用者猜測下一步該做什麼，提供明確的操作指引
- 不要在錯誤發生時只顯示錯誤訊息，提供解決方案或幫助連結
- 不要讓使用者在不同頁面間來回跳轉完成一個任務，保持流程順暢
- 不要使用過於複雜的導航結構，保持層級清晰不超過三層
- 不要在載入時顯示空白畫面，顯示骨架屏或載入動畫
- 不要讓使用者手動刷新頁面查看更新，使用自動更新或即時通知
- 不要在行動裝置上隱藏重要功能，確保核心功能在所有裝置上可用
- 不要使用過小的字體或過緊的行距，確保文字易讀
- 不要讓使用者等待過長時間，超過 3 秒的操作應顯示進度
- 不要在表單驗證時只顯示錯誤，同時顯示如何修正的提示
- 不要讓使用者重複登入，使用適當的 Session 管理

## 效能與安全

- 不要載入不必要的模組，使用 Lazy Loading
- 不要忽略 Bundle 大小，定期使用 `yarn analyze` 檢查
- 不要在初始載入時載入所有資料，使用分頁和虛擬滾動
- 不要忽略圖片優化，使用適當的格式和尺寸
- 不要在循環中進行昂貴操作，使用快取或優化演算法
- 不要在程式碼中硬編碼 API Key 或密碼，使用環境變數
- 不要忽略輸入驗證，使用 Angular Validators 或自訂驗證器
- 不要直接渲染使用者輸入，使用 Angular 的內建清理機制
- 不要忽略 CORS 設定，正確配置 Supabase 允許的來源
- 不要在客戶端進行敏感業務邏輯驗證，在後端驗證

## 開發流程

- 不要提交 `node_modules`、`.env` 或建置產物
- 不要使用模糊的 Commit 訊息，遵循 Conventional Commits
- 不要在主分支直接開發，使用 Feature Branch
- 不要忽略 `.gitignore`，確保敏感檔案不被追蹤
