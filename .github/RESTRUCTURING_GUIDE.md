# 📚 GigHub 文件架構重組說明

> Documentation Restructuring Guide - Version 2.0

本文檔說明 GigHub 專案文件結構的重大重組，以提高可維護性和清晰度。

---

## 🎯 重組目標

1. **明確分離** - 治理、AI 指令、技術文檔三者分離
2. **消除重複** - 統一重複的文件和 agents
3. **提高可發現性** - 更清晰的目錄結構和命名
4. **向後兼容** - 提供重定向和過渡期

---

## 📊 新舊結構對照

### 主要變更

| 變更類型 | 舊結構 | 新結構 |
|---------|-------|-------|
| **治理文件** | 分散在多處 | 統一至 `.github/governance/` |
| **AI Agents** | 兩個位置 | 統一至 `.github/copilot/agents/` |
| **AI 指令** | 混合管理文件 | 純 AI 指令在 `.github/instructions/` |
| **技術文檔** | 保持不變 | 維持在 `docs/` |

---

## 🗂️ 詳細結構說明

### 1. 治理文件 `.github/governance/`

**新增的完整治理結構**：

```
.github/governance/
├── README.md                 # 治理概覽與導航
├── GOVERNANCE.md             # 詳細的治理結構文件
│                             # - 組織層級與角色定義
│                             # - 決策流程（日常、重要、重大）
│                             # - RFC 流程
│                             # - 版本發布管理
│                             # - 衝突解決機制
│                             # - 貢獻者晉升路徑
├── CONTRIBUTING.md           # 統一的貢獻指南
│                             # - 整合了三個版本的優點
│                             # - 詳細的開發流程
│                             # - Commit 訊息規範
│                             # - PR 指南
├── CODE_OF_CONDUCT.md        # 完整的行為準則
│                             # - 基於 Contributor Covenant 2.1
│                             # - 詳細的執行流程
│                             # - 申訴程序
└── SECURITY.md               # 安全政策
                              # - 漏洞回報流程
                              # - 安全最佳實踐
```

**遷移的檔案**：
- ~~`.github/CONTRIBUTING.md`~~ → `governance/CONTRIBUTING.md`
- ~~`.github/SECURITY.md`~~ → `governance/SECURITY.md`
- ~~`.github/instructions/CODE_OF_CONDUCT.md`~~ → `governance/CODE_OF_CONDUCT.md`
- ~~`.github/instructions/CONTRIBUTING.md`~~ → `governance/CONTRIBUTING.md`
- ~~`docs/meta/CONTRIBUTING.md`~~ → 參考 `governance/CONTRIBUTING.md`

### 2. AI Agents `.github/copilot/agents/`

**統一的 Agents 結構**：

```
.github/copilot/agents/
├── README.md                           # Agents 使用指南與分類
├── 0-*.agent.md                        # 核心/優先級 agents
│   ├── 0-GigHub.agent.md              # 專案主 agent
│   ├── 0-arch.agent.md                # 架構設計
│   ├── 0-context7+.agent.md           # 文檔專家（基礎）
│   ├── 0-context7++.agent.md          # 文檔專家（進階）
│   ├── 0-postgresql-dba.agent.md      # 資料庫管理
│   └── ...
├── [分類 agents]
│   ├── 規劃類: plan.agent.md, task-planner.agent.md
│   ├── 架構類: architecture.agent.md, api-architect.agent.md
│   ├── 開發類: implementation-plan.agent.md
│   ├── 資料庫類: rls-policy.agent.md
│   ├── 測試類: playwright-tester.agent.md
│   ├── 品質類: code-review.agent.md, janitor.agent.md
│   └── ...
└── config.yml                          # Agents 配置（待添加）
```

**廢棄的目錄**：
- ~~`.github/agents/`~~ → 所有內容遷移至 `.github/copilot/agents/`
- 添加 `.github/agents/README.md` 作為遷移通知

### 3. AI 編碼指令 `.github/instructions/`

**保留純 AI 指令**：

```
.github/instructions/
├── README.md                                        # 更新的說明文件
├── [框架指令]
│   ├── angular.instructions.md
│   └── typescript-5-es2022.instructions.md
├── [資料庫指令]
│   └── sql-sp-generation.instructions.md
├── [安全指令]
│   ├── security-and-owasp.instructions.md
│   └── a11y.instructions.md
├── [效能指令]
│   └── performance-optimization.instructions.md
├── [DevOps 指令]
│   ├── devops-core-principles.instructions.md
│   ├── github-actions-ci-cd-best-practices.instructions.md
│   └── containerization-docker-best-practices.instructions.md
├── [品質指令]
│   ├── code-review-generic.instructions.md
│   ├── self-explanatory-code-commenting.instructions.md
│   └── ANTI_PATTERNS.md
├── [文檔指令]
│   ├── markdown.instructions.md
│   ├── instructions.instructions.md
│   └── prompt.instructions.md
├── [流程指令]
│   ├── spec-driven-workflow-v1.instructions.md
│   ├── task-implementation.instructions.md
│   └── memory-bank.instructions.md
└── [保留的管理文件]
    ├── ARCHITECTURE.md                              # 簡化的架構概覽
    ├── DEPLOYMENT.md                                # 部署流程
    └── DEVELOPMENT.md                               # 開發設定
```

**說明**：
- 移除了重複的治理文件引用
- 保留 ARCHITECTURE.md, DEPLOYMENT.md, DEVELOPMENT.md（格式化為 instructions）
- 所有檔案都是為 AI 編碼助手設計的指令

### 4. 技術文檔 `docs/`

**保持現有結構**（無重大變更）：

```
docs/
├── README.md                    # 文檔導航（更新連結）
├── overview/                    # 專案總覽
├── setup/                       # 環境設定
├── guides/                      # 操作指南
├── reference/                   # 技術參考
├── design/                      # 設計文件
│   ├── architecture/            # 架構設計
│   ├── adr/                     # 架構決策記錄
│   └── ...
├── development/                 # 開發追蹤
├── progress/                    # 進度追蹤
├── meta/                        # 專案元數據（簡化）
│   ├── CHANGELOG.md            # 變更日誌
│   ├── agent-guide.md          # Agent 使用指南
│   └── ...（其他開發相關）
└── ...
```

**更新**：
- `docs/meta/CONTRIBUTING.md` 改為引用 `.github/governance/CONTRIBUTING.md`
- 所有連結更新為指向新位置

---

## 🔄 遷移路徑圖

### Phase 1: 建立治理結構 ✅（已完成）
- [x] 創建 `.github/governance/` 目錄
- [x] 建立完整的治理文件
- [x] 添加重定向文件

### Phase 2: 整理 AI 指令 🔄（進行中）
- [x] 更新 `.github/instructions/README.md`
- [x] 說明治理文件遷移
- [ ] 評估保留的管理文件是否需要整合

### Phase 3: 統一 Agents ⏳（規劃中）
- [x] 創建 `.github/agents/README.md` 遷移通知
- [ ] 驗證 copilot/agents 的完整性
- [ ] 考慮移除 `.github/agents/` 中的重複文件

### Phase 4: 更新所有引用 ⏳（規劃中）
- [ ] 掃描所有 Markdown 文件
- [ ] 更新連結到新位置
- [ ] 添加路徑映射文檔

### Phase 5: 驗證與清理 ⏳（規劃中）
- [ ] 驗證所有連結
- [ ] 測試 Copilot 配置
- [ ] 清理過時文件

---

## 📅 時間線

| 日期 | 階段 | 動作 |
|------|------|------|
| 2025-12-08 | Phase 1 完成 | 建立治理結構 |
| 2025-12-09-15 | Phase 2-3 | 整理指令和 agents |
| 2025-12-16-22 | Phase 4 | 更新所有引用 |
| 2025-12-23-29 | Phase 5 | 驗證與測試 |
| 2025-12-30 | 過渡期開始 | 保留舊路徑 2 週 |
| 2026-01-13 | 過渡期結束 | 移除重定向 |
| 2026-01-20 | 清理完成 | 移除廢棄目錄 |

---

## 🔗 重定向與向後兼容

### 重定向文件

已添加以下重定向文件：

1. `.github/CONTRIBUTING_REDIRECT.md` → 指向 `governance/CONTRIBUTING.md`
2. `.github/SECURITY_REDIRECT.md` → 指向 `governance/SECURITY.md`
3. `.github/agents/README.md` → 說明遷移至 `copilot/agents/`

### 過渡期策略

- **保留舊檔案**: 2 週過渡期
- **重定向通知**: 所有舊位置添加遷移通知
- **更新期限**: 2026-01-13 前更新所有引用
- **清理日期**: 2026-01-20 移除所有重定向

---

## 📖 更新後的快速連結

### 治理與參與
- [專案治理](.github/governance/GOVERNANCE.md)
- [貢獻指南](.github/governance/CONTRIBUTING.md)
- [行為準則](.github/governance/CODE_OF_CONDUCT.md)
- [安全政策](.github/governance/SECURITY.md)

### AI 開發資源
- [Copilot 配置](.github/copilot/README.md)
- [AI Agents](.github/copilot/agents/README.md)
- [AI 編碼指令](.github/instructions/README.md)

### 技術文檔
- [技術文檔入口](docs/README.md)
- [架構設計](docs/design/architecture/)
- [API 參考](docs/reference/api/)

---

## 🆘 需要幫助？

### 常見問題

**Q: 我的舊連結失效了怎麼辦？**
A: 查看重定向文件或參考本文檔的遷移對照表。

**Q: 為什麼要重組？**
A: 為了更好地組織專案文件，消除重複，提高可維護性。

**Q: agents 目錄為什麼有兩個？**
A: 正在整合中，`.github/agents/` 將被廢棄，所有內容遷移至 `.github/copilot/agents/`。

**Q: 我應該更新我的本地引用嗎？**
A: 是的，建議盡快更新以避免未來連結失效。

### 聯繫方式

如有問題或建議：
1. 查閱本文檔
2. 提交 [GitHub Issue](https://github.com/7Spade/gighub-master/issues)
3. 參考 [貢獻指南](.github/governance/CONTRIBUTING.md)

---

## 📊 進度追蹤

| 項目 | 狀態 | 完成度 |
|------|------|--------|
| 治理結構建立 | ✅ 完成 | 100% |
| AI 指令整理 | 🔄 進行中 | 70% |
| Agents 統一 | 🔄 進行中 | 60% |
| 引用更新 | ⏳ 規劃中 | 0% |
| 驗證測試 | ⏳ 規劃中 | 0% |

---

**文檔版本**: 2.0.0  
**最後更新**: 2025-12-08  
**維護**: GigHub Documentation Team

---

## 附錄：完整目錄樹

### 新的 `.github/` 結構

```
.github/
├── governance/                      # ✅ 新增：專案治理
│   ├── README.md
│   ├── GOVERNANCE.md
│   ├── CONTRIBUTING.md
│   ├── CODE_OF_CONDUCT.md
│   └── SECURITY.md
├── copilot/                         # 🔄 優化：Copilot 配置
│   ├── README.md
│   ├── copilot-instructions.md
│   ├── agents/                      # ✅ 主要 agents 位置
│   ├── prompts/
│   ├── blueprints/
│   ├── workflows/
│   ├── collections/
│   ├── tests/
│   └── examples/
├── instructions/                    # 🔄 清理：純 AI 指令
│   ├── README.md
│   └── *.instructions.md
├── agents/                          # ⚠️ 廢棄：即將移除
│   └── README.md (遷移通知)
├── workflows/                       # 保持不變
├── ISSUE_TEMPLATE/                  # 保持不變
├── README.md                        # ✅ 已更新
├── COPILOT_RESOURCES.md            # 保持不變
├── CODEOWNERS                       # 保持不變
├── CONTRIBUTING_REDIRECT.md         # ✅ 新增：重定向
└── SECURITY_REDIRECT.md             # ✅ 新增：重定向
```
