# 📚 編碼標準指引 (Instructions)

> 檔案模式自動套用的編碼標準與最佳實踐

---

## 📁 目錄結構

```
instructions/
├── README.md                 ← 你現在的位置
│
├── frontend/                 ← 🎨 前端開發標準
│   ├── angular.instructions.md ← Angular 20 編碼標準
│   └── typescript-5-es2022.instructions.md ← TypeScript 5 指引
│
├── backend/                  ← 🔧 後端開發標準
│   └── sql-sp-generation.instructions.md ← SQL/預存程序標準
│
├── quality/                  ← 🔍 品質標準
│   ├── code-review-generic.instructions.md ← 程式碼審查標準
│   └── a11y.instructions.md ← 無障礙標準 (WCAG)
│
├── security/                 ← 🔒 安全標準
│   └── security-and-owasp.instructions.md ← OWASP 安全最佳實踐
│
├── performance/              ← ⚡ 效能標準
│   └── performance-optimization.instructions.md ← 效能優化指引
│
└── devops/                   ← ⚙️ DevOps 標準
    ├── devops-core-principles.instructions.md ← DevOps 核心原則
    ├── containerization-docker-best-practices.instructions.md ← Docker 最佳實踐
    └── github-actions-ci-cd-best-practices.instructions.md ← CI/CD 最佳實踐
```

---

## 🎯 自動套用規則

Instructions 會根據檔案模式自動套用：

| 檔案模式 | 套用的 Instruction |
|----------|-------------------|
| `**/*.ts` | `frontend/angular.instructions.md`, `frontend/typescript-5-es2022.instructions.md` |
| `**/*.html`, `**/*.scss` | `frontend/angular.instructions.md` |
| `**/*.sql` | `backend/sql-sp-generation.instructions.md` |
| `**/Dockerfile*`, `**/*.yml` | `devops/containerization-docker-best-practices.instructions.md` |
| `.github/workflows/*.yml` | `devops/github-actions-ci-cd-best-practices.instructions.md` |
| `**/*` (全部) | `quality/code-review-generic.instructions.md`, `security/security-and-owasp.instructions.md` |

---

## 📖 指引內容摘要

### 🎨 前端 (Frontend)

#### Angular Instructions
- Angular 20 最新特性與最佳實踐
- Standalone Components 優先
- Angular Signals 狀態管理
- ng-alain / ng-zorro-antd 整合

#### TypeScript Instructions
- TypeScript 5.x / ES2022 標準
- 嚴格模式 (strict mode)
- 型別安全最佳實踐

### 🔧 後端 (Backend)

#### SQL Instructions
- 資料表命名規範 (單數形式)
- 主鍵命名 (`id`)
- 時間戳欄位 (`created_at`, `updated_at`)
- 外鍵約束規範

### 🔍 品質 (Quality)

#### Code Review Instructions
- 通用程式碼審查標準
- 可讀性、可維護性檢查
- 最佳實踐驗證

#### Accessibility Instructions
- WCAG 2.2 Level AA 合規
- 鍵盤導航支援
- 螢幕閱讀器支援

### 🔒 安全 (Security)

#### OWASP Instructions
- OWASP Top 10 防護
- 輸入驗證與輸出編碼
- 安全認證與授權
- 密鑰管理最佳實踐

### ⚡ 效能 (Performance)

#### Performance Instructions
- 前端效能優化
- 後端效能優化
- 資料庫效能優化
- 快取策略

### ⚙️ DevOps

#### DevOps Principles
- CALMS 框架
- DORA 指標
- 持續改善

#### Docker Instructions
- Dockerfile 最佳實踐
- 多階段建置
- 映像優化

#### CI/CD Instructions
- GitHub Actions 最佳實踐
- 安全性考量
- 效能優化

---

## 🔗 MCP 整合

這些 Instructions 與以下 MCP 服務配合使用：

| Instruction 類別 | MCP 服務 | 用途 |
|-----------------|----------|------|
| `frontend/` | `context7` | 查詢 Angular/TypeScript 文件 |
| `backend/` | `supabase` | 資料庫操作驗證 |
| `devops/` | `github`, `filesystem` | CI/CD 與檔案操作 |
| `quality/` | `sequential-thinking` | 程式碼分析 |

---

**最後更新**: 2025-12-02
