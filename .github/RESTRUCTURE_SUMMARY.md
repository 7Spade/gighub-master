# .github 目錄重構摘要

> 完成日期：2025-12-08

## 🎯 重構目標

根據 @7Spade 的要求，重新組織 `.github` 目錄結構，將所有 Copilot 相關資源整合至 `.github/copilot/`，保持 `.github/agents/` 僅包含 3 個核心專案特化 agents。

## 📦 檔案遷移清單

### 保留在 `.github/agents/` (3 個核心 Agents)

```
✅ 0-GigHub.agent.md         - GigHub 專案主要 Agent (GigHub-Plus)
✅ 0-context7+.agent.md      - Context7 Angular 專家（基礎版）
✅ 0-context7++.agent.md     - Context7 Angular 專家（進階版）
✅ README.md                 - 核心 Agents 說明文件
```

### 遷移至 `.github/copilot/agents/` (28 個 Agents)

```
📂 架構類 Agents:
  - 0-arch.agent.md
  - arch.agent.md
  - adr-generator.agent.md
  - api-architect.agent.md
  - architecture.agent.md

📂 規劃類 Agents:
  - 0-implementation-plan.agent.md
  - implementation-plan.agent.md
  - plan.agent.md
  - planner.agent.md
  - task-planner.agent.md
  - task-researcher.agent.md

📂 開發類 Agents:
  - software-engineer-agent-v1.agent.md
  - 0-principal-software-engineer.agent.md
  - principal-software-engineer.agent.md
  - debug.agent.md
  - janitor.agent.md
  - code-tour.agent.md
  - mentor.agent.md
  - critical-thinking.agent.md

📂 資料庫類 Agents:
  - 0-postgresql-dba.agent.md
  - postgresql-dba.agent.md

📂 測試類 Agents:
  - 0-playwright-tester.agent.md
  - playwright-tester.agent.md

📂 品質類 Agents:
  - tech-debt-remediation-plan.agent.md

📂 文件類 Agents:
  - specification.agent.md

📂 專案特化 Agents:
  - 0-ng-ArchAI-v1.agent.md
  - 0-ng-governance-v1.md
  - 0-supabase.angular.md
  - 0-meta-agentic-project-scaffold.agent.md
  - context7.agent.md
  - business-model.agent.md
  - code-review.agent.md
  - prd-analysis.agent.md
  - rls-policy.agent.md
```

### 遷移至 `.github/copilot/prompts/` (27 個 Prompts)

```
📝 規劃類:
  - create-specification.prompt.md
  - breakdown-feature-prd.prompt.md
  - create-implementation-plan.prompt.md
  - breakdown-plan.prompt.md

📝 程式碼生成類:
  - create-agentsmd.prompt.md
  - create-readme.prompt.md
  - create-llms.prompt.md
  - conventional-commit.prompt.md
  - generate-component.prompt.md (已存在於 copilot)
  - generate-feature.prompt.md (已存在於 copilot)

📝 架構類:
  - architecture-blueprint-generator.prompt.md
  - create-architectural-decision-record.prompt.md
  - folder-structure-blueprint-generator.prompt.md
  - technology-stack-blueprint-generator.prompt.md
  - copilot-instructions-blueprint-generator.prompt.md (已存在於 copilot)

📝 程式碼品質類:
  - remember.prompt.md
  - review-and-refactor.prompt.md
  - code-exemplars-blueprint-generator.prompt.md
  - add-educational-comments.prompt.md (已存在於 copilot)
  - prd-to-tasks.prompt.md (已存在於 copilot)

📝 資料庫類:
  - postgresql-code-review.prompt.md
  - postgresql-optimization.prompt.md
  - sql-code-review.prompt.md
  - sql-optimization.prompt.md

📝 測試類:
  - playwright-generate-test.prompt.md

📝 GitHub 整合類:
  - create-github-action-workflow-specification.prompt.md
  - create-github-issue-feature-from-specification.prompt.md
  - create-github-issues-feature-from-implementation-plan.prompt.md

📝 其他:
  - model-recommendation.prompt.md
```

### 遷移至 `.github/copilot/collections/` (2 個集合)

```
📦 database-data-management.md
📦 frontend-web-dev.md
```

### 配置檔案重新配置

```
舊位置 → 新位置:

.github/agents/agent-config.yml
  → .github/copilot/agents/config.yml

.github/agents/auto-triggers.yml
  → .github/copilot/agents/auto-triggers.yml

.github/agents/mcp-servers.yml
  → .github/copilot/mcp-servers.yml (全域配置)

.github/agents/security-rules.yml
  → .github/copilot/security-rules.yml (全域配置)
```

## 🔄 路徑更新

### 已更新的檔案

1. **`.github/agents/README.md`**
   - 更新為核心 3 個 agents 的說明
   - 新增其他 agents 位置說明

2. **`.github/README.md`**
   - 更新目錄結構總覽
   - 反映新的組織方式

3. **`.github/copilot-instructions.md`**
   - 更新所有 agent 檔案路徑
   - 更新 MCP 配置檔案路徑
   - 修正：`.github/agents/mcp-servers.yml` → `.github/copilot/mcp-servers.yml`
   - 修正：`.github/agents/context7.agent.md` → `.github/copilot/agents/context7.agent.md`
   - 修正：`.github/agents/0-ng-ArchAI-v1.agent.md` → `.github/copilot/agents/0-ng-ArchAI-v1.agent.md`

## 📊 統計資訊

| 項目 | 數量 |
|------|------|
| 保留在 .github/agents/ | 3 個 agents + 1 個 README |
| 遷移的 agents | 28 個 |
| 遷移的 prompts | 27 個 |
| 遷移的 collections | 2 個 |
| 遷移的配置檔案 | 4 個 |
| 更新的文件 | 3 個 |

## 🎨 新目錄結構

```
.github/
├── agents/                       (精簡：僅 3 個核心 agents)
│   ├── 0-GigHub.agent.md
│   ├── 0-context7+.agent.md
│   ├── 0-context7++.agent.md
│   └── README.md
│
└── copilot/                      (完整：所有 Copilot 資源)
    ├── agents/                   (28 個 agents + 配置)
    │   ├── config.yml
    │   ├── auto-triggers.yml
    │   └── [所有其他 agents...]
    │
    ├── prompts/                  (33 個 prompts)
    │   └── [所有 prompts...]
    │
    ├── collections/              (2 個集合)
    │   ├── database-data-management.md
    │   └── frontend-web-dev.md
    │
    ├── mcp-servers.yml           (全域 MCP 配置)
    ├── security-rules.yml        (全域安全規則)
    └── [其他 copilot 資源...]
```

## ✨ 重構效益

### 1. 清晰的職責分離
- `.github/agents/` 專注於 3 個核心專案特化 agents
- `.github/copilot/` 管理所有 Copilot 相關資源

### 2. 更好的可維護性
- 所有 agents、prompts、collections 集中管理
- 配置檔案放在最接近使用位置
- 減少檔案分散帶來的管理複雜度

### 3. 結構化組織
- Agents 按類別組織（架構、規劃、開發、資料庫、測試、品質）
- Prompts 統一管理，避免重複
- Collections 作為主題集合，易於擴展

### 4. 符合最佳實踐
- 核心 agents 放在頂層，快速存取
- 通用資源放在 copilot 子目錄，結構清晰
- 配置檔案分為全域和區域，層次分明

## ⚠️ 破壞性變更

此次重構包含破壞性變更，會影響：

1. **外部引用路徑**
   - 任何直接引用 `.github/agents/` 下非核心 agents 的路徑需要更新
   - 任何直接引用 `.github/prompts/` 的路徑需要更新
   - 任何直接引用 `.github/collections/` 的路徑需要更新

2. **配置檔案路徑**
   - MCP 配置：`.github/agents/mcp-servers.yml` → `.github/copilot/mcp-servers.yml`
   - Agent 配置：`.github/agents/agent-config.yml` → `.github/copilot/agents/config.yml`
   - 其他配置檔案需要更新參照路徑

3. **建議行動**
   - 搜尋專案中所有對舊路徑的引用
   - 更新 CI/CD 配置中的路徑參照
   - 更新文件中的路徑參照
   - 通知團隊成員新的檔案位置

## 🔍 驗證清單

重構完成後，請驗證：

- [ ] 核心 3 個 agents 在 `.github/agents/` 正常運作
- [ ] `.github/copilot/agents/` 中的 agents 可以正常載入
- [ ] `.github/copilot/prompts/` 中的 prompts 可以正常使用
- [ ] MCP 配置路徑正確，MCP 伺服器可以正常連接
- [ ] 所有文件中的路徑參照已更新
- [ ] CI/CD 流程沒有受到影響

## 📝 後續工作

1. 檢查其他可能需要更新的檔案：
   - 專案根目錄的 README.md
   - 其他文件中的 .github 路徑參照
   - VS Code workspace 設定

2. 考慮是否需要：
   - 更新 .github/COPILOT_RESOURCES.md
   - 更新 .github/copilot/README.md
   - 建立遷移指南供其他開發者參考

3. 監控：
   - GitHub Copilot 是否能正常載入 agents
   - MCP 伺服器連接是否正常
   - 團隊成員是否能順利適應新結構

---

**重構執行者**: @copilot  
**審查者**: @7Spade  
**完成日期**: 2025-12-08
