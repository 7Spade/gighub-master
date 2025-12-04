# 專案開發筆記整理

## 一、專案架構與設計理念

### 認證流程
- **認證鏈**：Supabase Auth → Delon Auth → DA_SERVICE_TOKEN → Angular Application
- **上下文監控**：使用 `effect()` 進行上下文監控
- **統一認證**：supabase auth > delon/auth > DA_SERVICE_TOKEN > @delon/acl

### 資料模型設計
- **Account 類型**：用戶、組織、bot 使用 `type` 區分
- **組織角色**：擁有者、管理者、成員
- **團隊**：組織的子帳戶
- **團隊角色**：團長、團隊成員
- **藍圖**：只有用戶、組織可以建立
- **藍圖定義**：實際邏輯容器，容器內包含多種模組（任務、日誌等）

### 藍圖邏輯容器功能
藍圖邏輯容器提供以下功能：
1. **上下文注入**：自動注入
2. **權限系統**：RBAC 多層級權限
3. **時間軸服務**：跨模組活動追蹤
4. **通知中心**：多渠道通知路由
5. **事件總線**：模組間解耦通訊
6. **搜尋引擎**：跨模組全文檢索
7. **關聯管理**：跨模組資源引用
8. **資料隔離**：RLS 多租戶隔離
9. **生命週期**：Draft/Active/Archived/Deleted
10. **配置中心**：藍圖級配置管理
11. **元數據系統**：自訂欄位支援
12. **API 閘道**：對外 API 統一入口

### 藍圖內部模組
- 任務模組
- 施工日誌模組
- 待辦模組
- 檔案模組
- 儀表板模組

### 資料庫設計疑問
- 不理解表格設計原因：`blueprints`、`workspace_members`、`workspace`
- 因為 blueprints / workspace 在設計上 blueprints 在...

## 二、開發規範與要求

### 核心原則
1. **企業化標準**
2. **奧卡姆剃刀**：最簡約實現
3. **單一職責原則 (SRP)**
4. **NG-ALAIN** 優先
5. **@delon** 優先使用 `src/app/shared/shared-imports.ts`
6. **橫向分層架構**（適用於 core、shared、routes、layout）
7. **垂直切片架構**（適用於 features）
8. **Sequential Thinking**（序列化思考）
9. **模組邊界管理 (Module Boundary)**
10. **狀態管理標準**
11. **狀態管理流向**（重要：區分架構模式）
12. **Store 在垂直切片架構中的位置**
13. **Angular 20+ 模板語法規範**
14. **新控制流語法**

### 元件使用優先級
- 優先使用 NG-ZORRO 元件
- 次要使用 NG-ALAIN 企業級元件
- 避免自行開發已有的標準元件

### Agent 使用規範
- **判斷 Agent 是否需要使用 Context7 MCP 查詢**
  - Agent 有絕對把握 → 不查
  - Agent 沒有把握 → 使用 MCP

### 禁止事項
1. 對專案造成破壞性更改
2. 禁止破壞結構
3. 完成需運行 build 確保正常
4. 禁止重複造輪子
5. 禁止繞路

### 長期目標
1. 使專案更現代化
2. 使專案更統一
3. 使專案符合企業化標準

### 漸進式推進策略
- 目的：先把專案中"最基礎"的部分完成，基礎就是那些看得見、用得著的東西
- 策略：使用 Supabase MCP 查詢現有表/RLS/觸發器等，新增的表等都要符合奧卡姆剃刀最簡約實現
- 既有表除非連代碼一起變動否則不做更改，避免造成破壞性更改

## 三、當前問題清單

### 問題 1：建立組織失敗 (RLS 42501 錯誤)
**錯誤訊息**：
```
POST https://hbiihihbbicwktdtgcqc.supabase.co/rest/v1/accounts?select=* 403 (Forbidden)
Error in create for accounts: 
{code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "accounts"'}
[OrganizationFacade] Failed to create 組織
```

**問題本質**：違反行級安全策略 (RLS)，當初在規劃就說過特別注意 42501 這個問題，現在又出現

### 問題 2：建立藍圖失敗
**情況 A - 個人尚未建立藍圖時組織建立藍圖**：
```
Failed to load resource: the server responded with a status of 400 ()
[BlueprintService] Failed to create blueprint: Object
[BlueprintFacade] Failed to create 藍圖: Object
```

**情況 B - 個人建立藍圖成功後組織建立藍圖**：
```
POST https://uppudvdqgkflvdolguit.supabase.co/rest/v1/rpc/create_blueprint 400 (Bad Request)
[BlueprintService] Failed to create blueprint: 
{code: 'P0001', details: null, hint: null, message: 'Owner account not found'}
[BlueprintFacade] Failed to create 藍圖: 
{code: 'P0001', details: null, hint: null, message: 'Owner account not found'}
```

**問題本質**：Owner account not found

### 問題 3：資料隔離問題
- 個人建立藍圖後，組織也會出現同樣藍圖（表示沒有隔離）
- **最優先處理**：租戶隔離，因為現在個人的藍圖會出現在組織藍圖表示沒有隔離

### 問題 4：藍圖功能未實現
- 點開藍圖沒有任何反應，表示藍圖內容沒有實現
- 因此"任務管理"是否實現也無法得知

### 問題 5：UI 顯示問題
- "建立藍圖"的按鈕不顯示
- 藍圖按鈕一直無法顯示

### 問題 6：功能缺失
1. 組織設定完成，但個人設定沒有完成（需搭配上下文切換器）
2. 成員管理功能沒有真正實現
3. 團隊管理中的團隊成員管理沒有真正實現
4. 組織成員列表與邀請組織成員尚未完成
5. 已經建立團隊，但因為團隊成員代碼尚未實現，因此無法確定是否有加入團隊功能，也無法確認上下文切換器是否能夠顯示團隊

### 問題 7：核心功能未實現
以下功能都尚未實現，需要使用 context7 查詢相關文件：
- 共享上下文（資料共享基礎）
- 事件入口（通訊基礎）
- 生命週期（控制基礎）
- 錯誤邊界（穩定性基礎）
- 序列化介面（持久化基礎）

## 四、待辦任務

### 高優先級任務
1. **修復 RLS 42501 錯誤**
   - 從註冊用戶到建立組織、建立團隊、建立藍圖、建立任務，重新制定與修改代碼
   - 確保未來開發不再出現 42501
   - 使用 Supabase MCP 查看遠端數據庫，全面了解專案後對專案及數據庫進行修復
   - 改好 `supabase/migrations`、`supabase/policies`、`supabase/seeds`，然後執行 `supabase migration up`
   - 或者改專案代碼，讓功能正常

2. **修復建立藍圖功能**
   - 修復現在建立藍圖 & 建立任務
   - 處理到顯示按鈕為止
   - 處理 `[AccountService] ✅ 查詢用戶帳戶成功` 的問題

3. **實現租戶隔離**
   - 最優先處理租戶隔離問題
   - 確保個人藍圖不會出現在組織藍圖中

4. **實現藍圖詳情頁面**
   - 點開藍圖沒有任何反應與內容，需要實現

### 中優先級任務
1. **藍圖表單簡化**
   - 移除"分類"
   - 移除"可見性"，只保留公開/隱藏
   - 移除"圖示 URL"
   - 移除"縮圖 URL"
   - 藍圖詳情移除：使用次數、評分、藍圖結構模板

2. **實現團隊成員管理**
   - 團隊管理 & 新建團隊已經實施，但缺少團隊成員管理
   - 請提供代碼

3. **實現組織成員管理**
   - 組織成員列表與邀請組織成員尚未完成
   - 請透過 context7 查詢相關文件後將要實施的代碼貼在 RP

4. **實現個人設定**
   - 個人設定沒有完成（需搭配上下文切換器）

### 低優先級任務
1. **規劃實現路由頁面**
   - `/account/dashboard`
   - `/blueprint/list`
   - `/account/teams`
   - `/account/members`
   - `/account/settings`
   - 請與 `supabase/seeds/init.sql` 互相搭配，設計現代化的頁面
   - 並遵守奧卡姆剃刀原則

2. **設計 AGENTS.md 文件**
   - 依據 `docs/architecture/system-architecture.md`、`docs/prd/construction-site-management.md` 與 src 真實情況
   - 設計以下 AGENTS.md：
     - `src/app/core/AGENTS.md`
     - `src/app/features/blueprint/AGENTS.md`
     - `src/app/features/AGENTS.md`
     - `src/app/layout/AGENTS.md`
     - `src/app/routes/AGENTS.md`
     - `src/app/shared/AGENTS.md`
     - `src/app/AGENTS.md`
     - `AGENTS.md`
   - 每一個 AGENTS.md 需要符合該層真實情況

3. **現代化改進**
   - 針對專案中不夠現代化、不夠統一的部分，在不影響運行前提下漸進式實施
   - 過程不可使上下文切換器損壞

4. **上下文切換器現代化**
   - 關於整個上下文切換器包括上下文感知與監控，是否可以使用更現代化方式統一
   - 因為現在藍圖按鈕一直無法顯示，評估是否需要完全重構或有效方式，請提案出來後繼續討論

5. **分析完全體所需功能**
   - 推導完全體所需功能，例如藍圖功能 & Modules 功能
   - Workspace = 藍圖（邏輯容器），Workspace 內有多個 Modules
   - 肯定會需要：共享上下文（資料共享基礎）、事件入口、錯誤邊界、生命週期等技術
   - 請用 context7 查詢相關文件，分析藍圖功能 & Modules 功能需要那些技術，包括細節或者設計理念等等
   - 分析目前那些功能未完成，缺少那些功能

## 五、相關文件引用

### 核心組件文件
- `src/app/layout/basic/widgets/context-switcher.component.ts` - 上下文切換器 UI 組件，顯示個人、組織、團隊切換選單

### 核心服務文件
- `src/app/shared/services/workspace-context/workspace-context.service.ts` - 上下文狀態管理服務，提供切換方法：switchToApp(), switchToUser(), switchToOrganization(), switchToTeam()
- `src/app/shared/services/workspace-context/workspace-data.service.ts` - 工作區數據加載服務，根據上下文類型加載對應數據（組織、團隊、藍圖等）
- `src/app/shared/services/workspace-context/workspace-persistence.service.ts` - 上下文持久化服務，使用 @delon/cache 保存/恢復上下文狀態到 localStorage

### Facade 層文件
- `src/app/core/facades/workspace/workspace-context.facade.ts` - 工作區上下文 Facade（統一對外接口），整合 ContextService、DataService、MenuService，自動同步菜單更新
- `src/app/core/facades/workspace/index.ts` - Facade 導出文件

### 菜單服務文件
- `src/app/core/services/workspace-menu.service.ts` - 工作區菜單管理服務，處理不同上下文下的菜單切換

### 使用上下文切換器的組件
- `src/app/layout/basic/basic.component.ts`
- `src/app/core/startup/startup.service.ts` - 應用啟動服務，初始化菜單數據並傳遞給 WorkspaceContextFacade

### 相關服務依賴
- `src/app/shared/services/account/account.service.ts` - 帳戶服務（被上下文服務使用）
- `src/app/core/infra/repositories/account/team.repository.ts` - 團隊 Repository（查詢團隊數據）

### 藍圖相關組件
- `src/app/features/blueprint/ui/blueprint-detail/blueprint-detail.component.ts`
- `src/app/features/blueprint/ui/dashboard/diary-list-skeleton/diary-list-skeleton.component.ts`
- `src/app/features/blueprint/ui/dashboard/link-list-skeleton/link-list-skeleton.component.ts`
- `src/app/features/blueprint/ui/task/task-list/task-list.component.html`
- `src/app/features/blueprint/ui/task/task-list/task-list.component.ts`

### 文檔文件
- `docs/workspace/README.md` - 工作區上下文系統總覽
- `docs/workspace/workspace-context-overview.md` - 工作區上下文功能總覽
- `docs/workspace/workspace-context-usage-guide.md` - 使用指南
- `docs/workspace/workspace-context-architecture-review.md` - 架構審查文檔
- `docs/workspace/workspace-context-switch-flowchart.mermaid.md` - 上下文切換流程圖
- `docs/workspace/workspace-context-migration-plan.md` - 遷移計劃文檔
- `docs/workspace/WORKSPACE_CONTEXT_OPTIMIZATION_SUMMARY.md` - 優化總結
- `docs/workspace/WORKSPACE_CONTEXT_COMPREHENSIVE_REVIEW.md` - 全面審查報告
- `docs/workspace/workspace-context-integration-pr1-summary.md` - 整合 PR1 總結
- `docs/implementation/context-switcher-modernization.md` - 上下文切換器現代化（已完成）
- `docs/implementation/context-switcher-thought-chain.md` - 上下文切換器思考鏈（已完成）

### 故障排除文檔
- `docs/troubleshooting/postgresql-42501-analysis.md`
- `docs/troubleshooting/README.md`
- `docs/troubleshooting/rls-best-practices.md`
- `postgresql-code-review.prompt.md`

### 架構與規劃文檔
- `docs/prd/construction-site-management.md` - PRD
- `docs/agent/mindmap.md` - 思維導圖
- `docs/architecture/system-architecture.md` - 系統架構總覽
- `docs/specs/setc/**.setc.md` - 規格文件
- `.github/copilot/architecture-rules.md`
- `.github/collections/project-planning.md`
- `docs/README.agents.md`
- `docs/README.collections.md`
- `docs/README.instructions.md`
- `docs/README.prompts.md`
- `KEEP.md` - 必須遵守的理念規範

### 參考 PR/Issue
- `#15` - feat(routes): Add account/blueprint management pages and workspace container architecture with complete implementation
- `#16` - Add awesome-copilot resources and workflows guide for .github/copilot optimization（因為裡面沒有藍圖詳情因此看不到任務）
- `#18` - Implement account routes with context-aware components（只能參考禁止直接複製，因為架構不符合標準，但許多功能都是未來需要實施的）
- `#19` - 待實施
- `#25` - docs: Blueprint & Module architecture technical analysis with implementation code
- `docs/PROJECT-ANALYSIS-REPORT.md`

## 六、測試資訊

### 測試帳號
- **帳號 1**：`122sp7@gmail.com` / 密碼：`123123`
- **帳號 2**：`ac7x@pm.me` / 密碼：`123123`

### 測試步驟
1. 使用 Playwright MCP 前往 `http://localhost:4200/`
2. 登錄後，點開左上頭像
3. 按建立組織，嘗試建立，查看控制台消息，分析錯誤本質
4. 前往藍圖，分析"建立藍圖"的按鈕不顯示的問題
5. 測試建立藍圖功能
6. 測試建立任務功能

## 七、開發工具與 MCP 資源

### 可用 MCP 工具
- context7
- github
- supabase
- redis
- memory
- sequential-thinking
- software-planning-tool
- everything
- filesystem
- playwright
- git
- time
- fetch
- puppeteer

### 開發工作流程
1. 查看 `["docs/README.agents.md", "docs/README.collections.md", "docs/README.instructions.md", "docs/README.prompts.md"]`
2. 在 `.github/agents` & `.github/collections` & `.github/instructions` & `.github/prompts` 選擇適合配置與策略
3. 彈性使用 MCP 工具來合理增強自身能力

### 資料庫操作
- 使用 Supabase MCP 查看遠端數據庫
- 使用 Supabase MCP 更新表與 RLS
- 先用 Supabase MCP 查詢現有表/RLS/觸發器等，寫在最底部，然後把專案要用的再加進去

## 八、實施計劃

### 根據分支評論內容實施
根據以下三個分支評論內容實施：
1. `feat(routes): Add account/blueprint management pages and workspace container architecture with complete implementation #15` 評論
2. `docs: Blueprint & Module architecture technical analysis with implementation code #25`
3. 實施 `#19`

### 缺失功能修復順序
1. 修復建立組織失敗（RLS 42501）
2. 修復建立藍圖失敗（Owner account not found）
3. 實現租戶隔離
4. 實現藍圖詳情頁面
5. 實現團隊成員管理
6. 實現組織成員管理
7. 實現個人設定
8. 實現核心功能（共享上下文、事件入口、生命週期、錯誤邊界、序列化介面）

---

**備註**：
- 所有實施必須遵守 KEEP.md 理念
- 過程不可使上下文切換器損壞
- 完成需運行 build 確保正常
- 禁止對專案造成破壞性更改
