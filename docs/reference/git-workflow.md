# Git 工作流

> 專案的 Git 分支策略與工作流程

---

## 🌳 分支策略

### 主要分支

| 分支 | 用途 | 保護 |
|------|------|------|
| `main` | 生產環境 | ✅ 需 PR 審查 |
| `develop` | 開發整合 | ✅ 需 PR 審查 |

### 功能分支

```
feature/<feature-name>   # 新功能
bugfix/<bug-name>        # Bug 修復
hotfix/<issue-name>      # 緊急修復
refactor/<scope>         # 重構
docs/<topic>             # 文件
```

---

## 🔄 開發流程

### 1. 建立分支

```bash
# 從 develop 建立功能分支
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### 2. 開發與提交

```bash
# 小步提交
git add .
git commit -m "feat(blueprint): add create blueprint form"
```

### 3. 推送與建立 PR

```bash
git push origin feature/my-feature
```

在 GitHub 上建立 PR 到 `develop`。

### 4. 程式碼審查

- 至少 1 位 reviewer 批准
- CI 測試通過
- 無衝突

### 5. 合併

使用 Squash and Merge 保持歷史清潔。

---

## 📝 Commit 訊息

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

### Type
- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文件更新
- `style`: 格式調整
- `refactor`: 重構
- `test`: 測試
- `chore`: 維護工作

### Scope (選用)
- `blueprint`, `task`, `diary`, `auth`, `ui`, etc.

### 範例

```
feat(task): add task tree view component
fix(auth): resolve token refresh issue
docs(readme): update installation guide
refactor(blueprint): simplify store logic
```

---

**最後更新**: 2025-12-02
