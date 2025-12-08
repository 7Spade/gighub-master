# GigHub 專案功能清單

> **GigHub - 工地施工進度追蹤管理系統**  
> 完整功能模組清單與說明

**版本**: 20.1.0  
**最後更新**: 2025-12-08  
**文檔類型**: 功能清單 (Features List)

---

## 📋 目錄

1. [系統概述](#系統概述)
2. [核心功能模組](#核心功能模組)
3. [使用者管理功能](#使用者管理功能)
4. [認證與授權功能](#認證與授權功能)
5. [輔助功能](#輔助功能)
6. [技術基礎設施](#技術基礎設施)

---

## 系統概述

GigHub 是一個基於 Angular + NG-ALAIN 的企業級工地施工進度追蹤管理系統，採用模組化設計架構，提供完整的專案管理、團隊協作、財務管理等功能。

### 技術架構
- **前端框架**: Angular 21.x
- **UI 框架**: NG-ALAIN 20.1.0 + ng-zorro-antd 20.4.3
- **後端服務**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **狀態管理**: Angular Signals (Reactive State Management)
- **路由策略**: Lazy Loading + Module Guards

---

## 核心功能模組

### 1. 藍圖管理 (Blueprint Management) 📐

藍圖是專案的核心容器，所有功能都圍繞藍圖展開。

#### 1.1 藍圖基礎功能
- **藍圖列表** (`/blueprint/list`)
  - 查看所有可訪問的藍圖
  - 藍圖搜尋與篩選
  - 藍圖狀態管理 (活躍/歸檔/刪除)
  
- **藍圖建立** (`/blueprint/create`)
  - 建立新專案藍圖
  - 選擇啟用的功能模組
  - 設定專案基本資訊
  
- **藍圖概覽** (`/blueprint/:id/overview`)
  - 專案儀表板與總覽
  - 關鍵指標展示
  - 最新活動動態
  - 模組啟用狀態檢視
  
- **藍圖設定** (`/blueprint/:id/settings`)
  - 修改專案基本資訊
  - 管理啟用的功能模組
  - 專案封面與描述設定
  - 專案刪除與歸檔

#### 1.2 任務管理 (Tasks) ✅
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/tasks`

- 工作項目追蹤與進度管理
- 任務建立、編輯、刪除
- 任務狀態管理 (待辦/進行中/已完成)
- 任務指派與負責人設定
- 任務優先級設定
- 任務截止日期追蹤
- 任務附件與留言
- 任務篩選與搜尋
- 甘特圖視圖支援

#### 1.3 施工日誌 (Diary) 📝
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/diaries`

- 每日施工記錄
- 天氣資訊記錄 (整合 CWB 氣象局 API)
- 施工人力統計
- 施工機具使用記錄
- 工地照片上傳
- 施工進度描述
- 異常事件記錄
- 日誌搜尋與匯出

#### 1.4 品質管控 (QC Inspections) ✔️
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/qc-inspections`

- 品質檢查清單管理
- 巡檢項目建立與執行
- 檢查結果記錄
- 合格/不合格判定
- 缺失追蹤與改善
- 檢查照片證據
- 檢查報告產生
- 檢查歷史查詢

#### 1.5 問題追蹤 (Issues) ⚠️
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/problems`

- 施工問題登記
- 問題分類管理
- 問題優先級設定
- 問題狀態追蹤 (開啟/處理中/已解決/已關閉)
- 問題指派與負責人
- 問題討論與留言
- 問題附件上傳
- 問題解決方案記錄
- 問題搜尋與統計

#### 1.6 檔案管理 (Files) 📁
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/files`

- 專案文件儲存
- 資料夾結構管理
- 檔案上傳與下載
- 檔案版本控制
- 檔案搜尋與篩選
- 檔案權限管理
- 檔案預覽
- 圖面管理 (CAD, PDF)
- 檔案標籤分類

#### 1.7 財務管理 (Financial) 💰
**模組類型**: 核心模組 | **路由**: `/blueprint/:id/financial`

財務模組包含多個子功能：

- **財務概覽** (`/financial/overview`)
  - 財務儀表板
  - 預算與支出統計
  - 財務健康度指標
  
- **合約管理** (`/financial/contracts`)
  - 工程合約登記
  - 合約金額與期限
  - 合約附件管理
  - 合約執行進度
  
- **費用管理** (`/financial/expenses`)
  - 費用項目記錄
  - 費用分類
  - 費用核銷
  - 費用統計分析
  
- **請款管理** (`/financial/payment-requests`)
  - 請款單建立
  - 請款審核流程
  - 請款進度追蹤
  - 請款歷史記錄
  
- **付款紀錄** (`/financial/payments`)
  - 付款記錄登記
  - 付款憑證管理
  - 付款統計分析

#### 1.8 品質驗收 (Acceptance) 🏆
**模組類型**: 選用模組 | **路由**: `/blueprint/:id/acceptances`

- 工程驗收登記
- 驗收項目清單
- 驗收標準檢查
- 驗收結果記錄
- 驗收簽核流程
- 缺失整改追蹤
- 驗收證明文件
- 驗收報告產生

### 2. 藍圖協作功能 👥

#### 2.1 成員管理 (Members)
**路由**: `/blueprint/:id/members`

- 專案成員邀請
- 成員角色指派 (擁有者/管理員/成員/訪客)
- 外部協作者管理
- 成員權限設定
- 成員移除
- 業務角色對應
- 自訂角色定義

#### 2.2 權限管理 (Permissions)
**路由**: `/blueprint/:id/permissions`

- 角色定義管理
- 權限矩陣設定
- 業務角色對應
- 自訂權限規則
- 權限繼承設定
- 團隊授權管理

#### 2.3 通知設定 (Notifications)
**路由**: `/blueprint/:id/notifications`

- 通知規則設定
- 郵件通知設定
- 系統通知設定
- 通知頻率控制
- 訂閱管理

### 3. 藍圖輔助功能 🔧

#### 3.1 甘特圖 (Gantt Chart)
**路由**: `/blueprint/:id/gantt`  
**依賴**: 需啟用任務管理模組

- 專案時程視覺化
- 任務相依關係展示
- 關鍵路徑分析
- 時程調整
- 進度追蹤
- 里程碑標示

#### 3.2 活動歷史 (Activities)
**路由**: `/blueprint/:id/activities`

- 專案活動時間軸
- 成員操作記錄
- 系統事件追蹤
- 變更歷史查詢
- 活動篩選
- 活動匯出

#### 3.3 進階搜尋 (Advanced Search)
**路由**: `/blueprint/:id/search`

- 全域內容搜尋
- 進階篩選條件
- 搜尋結果分類
- 搜尋歷史記錄
- 儲存搜尋條件

#### 3.4 報表分析 (Reports)
**路由**: `/blueprint/:id/reports`

- 專案進度報表
- 財務分析報表
- 品質統計報表
- 資源使用報表
- 報表匯出 (PDF, Excel)
- 自訂報表範本

#### 3.5 API 閘道 (API Gateway)
**路由**: `/blueprint/:id/api-gateway`

- API 金鑰管理
- Webhook 設定
- 外部整合配置
- API 使用統計
- API 文件查閱

---

## 使用者管理功能

### 4. 帳戶管理 (Account Management) 👤

#### 4.1 帳戶儀表板 (Dashboard)
**路由**: `/account/dashboard`

- 個人工作總覽
- 待辦事項摘要
- 最近活動
- 快速操作入口
- 通知提醒

#### 4.2 待辦事項 (Todos)
**路由**: `/account/todos`

- 個人待辦清單
- 跨專案任務彙整
- 優先級管理
- 截止日期提醒
- 完成度追蹤

#### 4.3 團隊管理 (Teams)
**路由**: `/account/teams`

- 建立組織團隊
- 團隊成員管理
- 團隊權限設定
- 團隊資訊編輯
- 團隊解散

#### 4.4 組織成員 (Members)
**路由**: `/account/members`

- 組織成員查看
- 成員邀請
- 成員權限管理
- 成員移除
- 成員資訊編輯

#### 4.5 帳戶設定 (Settings)
**路由**: `/account/settings`

- 個人資料編輯
- 密碼變更
- 通知偏好設定
- 介面語言切換
- 帳戶安全設定
- 隱私設定

---

## 認證與授權功能

### 5. 使用者認證 (Passport) 🔐

#### 5.1 登入 (Login)
**路由**: `/passport/login`

- 帳號密碼登入
- 第三方登入整合 (OAuth)
- 記住我功能
- 登入驗證碼
- 登入錯誤處理

#### 5.2 註冊 (Register)
**路由**: `/passport/register`

- 使用者註冊
- Email 驗證
- 註冊資料驗證
- 隱私條款同意
- 註冊成功引導

#### 5.3 註冊結果 (Register Result)
**路由**: `/passport/register-result`

- 註冊成功提示
- Email 驗證指引
- 下一步操作引導

#### 5.4 鎖屏 (Lock)
**路由**: `/passport/lock`

- 鎖屏功能
- 快速解鎖
- 安全保護

#### 5.5 OAuth 回調 (Callback)
**路由**: `/passport/callback/:type`

- 第三方登入回調處理
- Token 驗證
- 使用者資訊同步
- 登入狀態建立

---

## 輔助功能

### 6. 系統輔助功能 🛠️

#### 6.1 國際化 (i18n)
- 繁體中文 (zh-TW)
- 簡體中文 (zh-CN)
- 英文 (en-US)
- 多語言切換
- 動態載入語言包

#### 6.2 主題系統
- 預設主題
- 深色模式
- 自訂主題色
- 主題預覽
- RTL 支援

#### 6.3 響應式設計
- 桌面版介面
- 平板適配
- 手機版優化
- 彈性佈局
- 觸控優化

#### 6.4 離線支援
- Service Worker
- 離線快取
- 資料同步
- 離線提示

---

## 技術基礎設施

### 7. 核心基礎設施 ⚙️

#### 7.1 認證與授權
- JWT Token 管理
- Session 管理
- Route Guards
- Permission Guards
- Module Guards (模組啟用檢查)
- Role-Based Access Control (RBAC)
- Row-Level Security (RLS)

#### 7.2 狀態管理
- Angular Signals
- Computed Signals
- Effect Signals
- 響應式狀態更新
- 跨元件狀態共享

#### 7.3 資料服務
- Supabase Client
- Real-time Subscriptions
- Database Queries
- File Storage
- RESTful API
- GraphQL Support

#### 7.4 事件系統
- Event Bus
- Domain Events
- Event Handlers
- Event Logging
- Event Replay

#### 7.5 錯誤處理
- Global Error Handler
- HTTP Interceptors
- Error Logging
- User Feedback
- Error Recovery

#### 7.6 效能優化
- Lazy Loading
- Code Splitting
- Tree Shaking
- AOT Compilation
- OnPush Change Detection
- Virtual Scrolling
- Image Lazy Loading

#### 7.7 測試基礎設施
- Unit Testing (Jasmine + Karma)
- E2E Testing (Protractor)
- Component Testing
- Service Testing
- Guard Testing
- Mock Data Support

#### 7.8 開發工具
- Angular CLI
- ESLint
- Prettier
- Stylelint
- Husky (Git Hooks)
- Lint-staged

---

## 功能模組統計

### 模組分類統計

| 分類 | 數量 | 說明 |
|------|------|------|
| **藍圖核心模組** | 7 | 任務、日誌、品管、問題、檔案、財務、驗收 |
| **藍圖協作功能** | 3 | 成員、權限、通知 |
| **藍圖輔助功能** | 5 | 甘特圖、活動、搜尋、報表、API |
| **帳戶管理** | 5 | 儀表板、待辦、團隊、成員、設定 |
| **認證功能** | 5 | 登入、註冊、結果、鎖屏、回調 |
| **系統輔助** | 4 | 國際化、主題、響應式、離線 |
| **基礎設施** | 8 | 認證、狀態、資料、事件、錯誤、效能、測試、工具 |

### 路由統計

- **藍圖路由**: 17 個主要路由 + 5 個財務子路由
- **帳戶路由**: 5 個路由
- **認證路由**: 5 個路由
- **總計**: 32 個功能路由

---

## 模組依賴關係

### 核心依賴
```
藍圖 (Blueprint)
├── 概覽 (Overview) [核心，無需守衛]
├── 成員管理 (Members) [核心，無需守衛]
├── 設定 (Settings) [核心，無需守衛]
├── 活動歷史 (Activities) [核心，無需守衛]
├── 通知設定 (Notifications) [核心，無需守衛]
├── 進階搜尋 (Search) [核心，無需守衛]
├── 權限管理 (Permissions) [核心，無需守衛]
├── 報表分析 (Reports) [核心，無需守衛]
├── API 閘道 (API Gateway) [核心，無需守衛]
├── 任務管理 (Tasks) [模組守衛]
├── 施工日誌 (Diary) [模組守衛]
├── 品質管控 (QC Inspections) [模組守衛]
├── 問題追蹤 (Issues) [模組守衛]
├── 檔案管理 (Files) [模組守衛]
├── 財務管理 (Financial) [模組守衛]
│   ├── 財務概覽
│   ├── 合約管理
│   ├── 費用管理
│   ├── 請款管理
│   └── 付款紀錄
├── 品質驗收 (Acceptance) [模組守衛]
└── 甘特圖 (Gantt) [模組守衛，依賴 Tasks]
```

### 模組守衛說明
- **核心功能**: 不需要模組守衛，始終可訪問
- **可選模組**: 使用 `moduleEnabledGuard` 檢查是否啟用
- **依賴模組**: 甘特圖依賴任務管理模組

---

## 預設啟用模組

新建立的藍圖預設啟用以下模組：

1. ✅ 任務管理 (Tasks)
2. ✅ 施工日誌 (Diary)
3. ✅ 品質管控 (Checklists)
4. ✅ 檔案管理 (Files)

其他模組可在建立時或後續透過設定頁面啟用。

---

## 技術堆疊

### 前端技術
- **Angular**: 21.x
- **TypeScript**: 5.9.x
- **NG-ALAIN**: 20.1.0
- **ng-zorro-antd**: 20.4.3
- **RxJS**: 7.8.x
- **@delon**: 20.1.0 (ABC, ACL, Auth, Form, Chart)

### 後端技術
- **Supabase**: 2.86.0
  - PostgreSQL Database
  - Real-time Subscriptions
  - Authentication
  - Storage
  - Row-Level Security
  - Edge Functions

### 開發工具
- **Angular CLI**: 21.0.2
- **ESLint**: 9.35.0
- **Prettier**: 3.6.2
- **Stylelint**: 16.24.0
- **Husky**: 9.1.7
- **Karma + Jasmine**: 單元測試

---

## 部署方式

- **Docker**: 支援容器化部署
- **Vercel**: 支援無伺服器部署
- **傳統主機**: 支援靜態檔案部署
- **CDN**: 支援全球加速

---

## 文件資源

- 📖 [專案文件](./docs/README.md)
- 🎯 [專案願景](./docs/overview/01-project-vision.md)
- ⚙️ [開發環境設定](./docs/setup/02-development-setup.md)
- 📘 [API 文件](./docs/reference/api/)
- 🗃️ [資料庫 Schema](./docs/reference/database/schema/)

---

## 版本資訊

- **目前版本**: 20.1.0
- **Angular 版本**: 21.0.3
- **NG-ALAIN 版本**: 20.1.0
- **Node.js 要求**: 18.x+
- **瀏覽器支援**: 
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)

---

## 授權資訊

MIT License - 詳見 [LICENSE](./LICENSE) 檔案

---

**文檔維護者**: GigHub Development Team  
**最後更新日期**: 2025-12-08  
**文檔版本**: 1.0.0
