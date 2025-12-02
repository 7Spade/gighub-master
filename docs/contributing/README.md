# 🤝 貢獻指南

> 歡迎為 GigHub 專案貢獻

---

## 📋 目錄

1. [開發環境設定](./development-setup.md)
2. [程式碼審查指南](./code-review-guidelines.md)
3. [發佈流程](./release-process.md)

---

## 🚀 快速開始

### 1. Fork 專案

在 GitHub 上 Fork 本專案。

### 2. Clone 你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/gighub-master.git
cd gighub-master
```

### 3. 建立分支

```bash
git checkout -b feature/your-feature-name
```

### 4. 開發與提交

```bash
# 安裝依賴
yarn install

# 開發
yarn start

# 提交
git commit -m "feat: your feature description"
```

### 5. 推送並建立 PR

```bash
git push origin feature/your-feature-name
```

在 GitHub 上建立 Pull Request。

---

## 📝 Commit 規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文件
- `style`: 格式調整
- `refactor`: 重構
- `test`: 測試
- `chore`: 維護

---

## 🔍 程式碼審查

PR 需要至少一位 reviewer 批准才能合併。

審查重點：
- [ ] 程式碼品質
- [ ] 測試覆蓋
- [ ] 文件更新
- [ ] 安全性考量

---

## 🔗 相關資源

- [編碼標準](../reference/coding-standards.md)
- [Git 工作流](../reference/git-workflow.md)
- [測試策略](../reference/testing-strategy.md)

---

**最後更新**: 2025-12-02
