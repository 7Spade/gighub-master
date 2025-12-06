即時協作- Supabase 即時狀態與廣播功能
延遲載入- Angular 的@defer模組延遲載入區塊
導航與使用者體驗- 路徑解析器、麵包屑導航、標籤導航、視圖過渡
狀態管理增強功能- NgRx 訊號儲存集成
國際化 (i18n) - 多語言支持
抽屜和側板- 使用 nz-drawer 的任務詳情抽屜
離線和 PWA 支援- Service Worker 集成
分析與監控- 活動日誌記錄和錯誤追蹤
輔助功能 (a11y) - 鍵盤導航和螢幕閱讀器支持


即時協作（即時）

線上狀態系統（顯示誰在線上）
廣播事件（跨用戶即時更新）
即時通知（即時+推播）
🔴延遲載入（@defer）

使用@deferblocks做模組加載
prefetch when智慧預載策略
@placeholder,@loading載入狀態
🟡 導航與使用者體驗

路線解析器（預先載入藍圖資料）
麵包屑 麵包屑導航
Tab頁簽式模組切換
視圖轉換 動畫
🟡狀態管理加強

NgRx 訊號儲存( withEntities())
樂觀更新（即時UI回饋）
離線狀態
🟡其他

任務詳情抽屜（nz-drawer）
i18n 國際化支持
離線/PWA 支持
活動記錄
a11y 無障礙支持


請協助根據問題內容擴展SQL以及處理現有SQL問題
1.請先完整查看"supabase\seeds\init.sql"
2處理現有問題.Error: Failed to run sql query: ERROR: 42883: function public.create_default_blueprint_roles(uuid) does not exist
2.擴展問題中12點supabase數據庫所需的Postgres
Tables
Views
Materialized Views
Schemas
Sequences
Enums
Functions
Procedures
Triggers
Trigger Functions
Event Triggers
Roles
Users
Grants
RLS Policies
Primary Keys
Foreign Keys
Unique Constraints
Check Constraints
Not Null Constraints
Indexes
Extensions
Auth Schema
Storage Buckets
Storage Policies
Realtime Channels
RPC (Exposed Functions)


對專案做全盤了解後,分析下一步該怎麼做，同時也把專案里程碑立出來，還有開發路線圖
數據庫資料"supabase\seeds\init.sql"一定要看仔細不要與數據庫背離
數據庫缺少甚麼可以另外提出在文件中,但我們先以現有下去開發

根據docs/GigHub_Architecture.md內容使用context7查看相關文件,並評估如何現代化的實現
任務需要使用ng-zorro-antd的ng-zorro-antd/tree-view組件實施一個可切換的
多視圖切換（樹狀圖、表格、看板）
任務狀態流轉
任務樹狀結構（父子任務關係可無限拆出子任務,無限層）
進度計算部分使用最後一層往上算因此需要數量
但沒關係我們先從易擴展的雛型開始

根據"feat(tasks): Multi-view task management with tree, table, and kanban views #61"RP 繼續擴展,擴展前先使用context7查詢相關文件,進行現代化的實施,符合奧卡姆剃刀定律
分析supabase\migrations\20241202104900_add_financial_extension.sql 與plan\feature-financial-module-extension-1.md是否適用於本專案未來擴展,是否有錯誤能不能跟supabase\seeds\init.sql分析後需用supabase MCP 檢視 確認完美銜接