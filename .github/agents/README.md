# 🤖 AI Agents 目錄已遷移

> ⚠️ 此目錄已廢棄，所有 agents 已遷移至 `.github/copilot/agents/`

---

## 📍 新位置

所有 AI Agents 已統一遷移至：

**主要位置**: [`.github/copilot/agents/`](../copilot/agents/)

---

## 🔄 遷移對照表

| 舊檔案（此目錄） | 新檔案（copilot/agents/） | 狀態 |
|----------------|------------------------|------|
| `GigHub.agent.md` | `0-GigHub.agent.md` | ✅ 已遷移 |
| `arch.agent.md` | `0-arch.agent.md` | ✅ 已遷移 |
| `context7+.agent.md` | `0-context7+.agent.md` | ✅ 已遷移 |
| `context7++.agent.md` | `0-context7++.agent.md` | ✅ 已遷移 |
| `postgresql-dba.agent.md` | `0-postgresql-dba.agent.md` | ✅ 已遷移 |
| `janitor.agent.md` | `janitor.agent.md` | ✅ 已遷移 |
| `plan.agent.md` | `plan.agent.md` | ✅ 已遷移 |
| `task-planner.agent.md` | `task-planner.agent.md` | ✅ 已遷移 |
| `software-engineer-agent-v1.agent.md` | `software-engineer-agent-v1.agent.md` | ✅ 已遷移 |
| `tech-debt-remediation-plan.agent.md` | `tech-debt-remediation-plan.agent.md` | ✅ 已遷移 |
| `blueprint-mode.agent.md` | `blueprint-mode.agent.md` | ⚠️ 待評估 |
| `blueprint-mode-codex.agent.md` | `blueprint-mode-codex.agent.md` | ⚠️ 待評估 |
| `prompt-builder.agent.md` | `prompt-builder.agent.md` | ⚠️ 待評估 |
| `supabase.agent.md` | `0-supabase.angular.md` | ✅ 已整合 |
| `microsoft_learn_contributor.agent.md` | `microsoft_learn_contributor.agent.md` | ✅ 已遷移 |

---

## 🎯 為什麼遷移？

### 原因

1. **統一管理**: 所有 Copilot 相關資源集中在 `.github/copilot/` 目錄
2. **避免重複**: 消除兩個目錄中的重複 agents
3. **清晰結構**: 更容易找到和維護 agents
4. **更好組織**: copilot/agents/ 目錄有更完善的分類和文檔

### 新結構優勢

```
.github/copilot/agents/
├── README.md                           # Agents 使用指南
├── 0-*.agent.md                        # 核心/優先級 agents（以 0- 開頭）
├── [分類 agents]                       # 按功能分類的 agents
│   ├── 架構類 agents
│   ├── 規劃類 agents
│   ├── 開發類 agents
│   ├── 資料庫類 agents
│   ├── 測試類 agents
│   └── 品質類 agents
└── config.yml                          # Agents 配置（如有）
```

---

## 📅 時間線

- **2025-12-08**: 創建此遷移通知
- **2025-12-15**: 開始廢棄警告期
- **2025-12-22**: 移除此目錄中的重複 agents
- **2026-01-05**: 完全移除此目錄

---

## 🔧 如何更新你的引用

### VS Code 中使用 Agents

舊的引用方式仍可使用一段時間，但建議更新為新路徑：

**舊方式**（將逐步停止支持）:
```
@GigHub
@arch
@plan
```

**新方式**（推薦）:
```
@0-GigHub
@0-arch
@plan
```

### 在文檔中引用

更新所有指向此目錄的連結：

**舊連結**:
```markdown
[GigHub Agent](./.github/agents/GigHub.agent.md)
```

**新連結**:
```markdown
[GigHub Agent](./.github/copilot/agents/0-GigHub.agent.md)
```

---

## 🆘 需要幫助？

如果你在遷移過程中遇到問題：

1. 查看 [Copilot Agents README](../copilot/agents/README.md)
2. 參考 [Agent 使用指南](../../docs/meta/agent-guide.md)
3. 提交 [GitHub Issue](https://github.com/7Spade/gighub-master/issues)

---

## 🔗 相關資源

- [新的 Agents 目錄](../copilot/agents/)
- [Copilot 配置指南](../copilot/README.md)
- [專案治理文件](../governance/)

---

**最後更新**: 2025-12-08  
**維護**: GigHub Development Team

**注意**: 此目錄將在 2026-01-05 後完全移除。
