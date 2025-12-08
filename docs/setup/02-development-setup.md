# 開發環境設定

> 設定本地開發環境的詳細步驟

---

## 📋 前置需求

確保已安裝：
- Node.js 20.x
- Yarn 4.x
- Git
- VS Code (推薦)

詳見 [環境需求](../getting-started/prerequisites.md)

---

## 🔧 VS Code 設定

### 推薦擴展

安裝以下擴展：

```json
{
  "recommendations": [
    "angular.ng-template",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "github.copilot",
    "github.copilot-chat"
  ]
}
```

### 工作區設定

專案已包含 `.vscode/settings.json`，無需額外設定。

---

## 🗄️ Supabase 本地開發

### 安裝 Supabase CLI

```bash
npm install -g supabase
```

### 啟動本地服務

```bash
npx supabase start
```

### 停止本地服務

```bash
npx supabase stop
```

---

## 🧪 執行測試

```bash
# 單元測試
yarn test

# E2E 測試
yarn e2e

# 測試覆蓋率
yarn test-coverage
```

---

## 🔍 Lint 檢查

```bash
# TypeScript + HTML
yarn lint:ts

# 樣式
yarn lint:style

# 全部
yarn lint
```

---

**最後更新**: 2025-12-02
