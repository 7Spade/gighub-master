# 發佈流程

> 版本發佈的標準流程

---

## 📋 版本規範

遵循 [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: 不相容的 API 變更
- **MINOR**: 新增功能（向後相容）
- **PATCH**: Bug 修復（向後相容）

---

## �� 發佈步驟

### 1. 確認 main 分支狀態

```bash
git checkout main
git pull origin main
```

### 2. 執行測試

```bash
yarn lint
yarn test
yarn build
```

### 3. 更新版本號

```bash
# 使用 npm version
npm version patch  # 或 minor / major
```

### 4. 建立 Git Tag

```bash
git tag v1.2.3
git push origin v1.2.3
```

### 5. GitHub Actions 自動發佈

推送 Tag 後，GitHub Actions 會自動：
- 建置專案
- 產生 Changelog
- 建立 GitHub Release

---

## 📝 Changelog

Changelog 會根據 Commit 訊息自動生成：

- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes
- `docs:` → 📖 Documentation
- `chore:` → 🔧 Maintenance

---

**最後更新**: 2025-12-02
