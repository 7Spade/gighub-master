# 環境需求

> 開發環境的前置需求

---

## 📋 必要軟體

### Node.js
- **版本**: 20.x 或更高
- **下載**: [nodejs.org](https://nodejs.org/)
- **驗證**: `node -v`

### Yarn
- **版本**: 4.x (專案使用 Berry)
- **安裝**: `corepack enable && corepack prepare yarn@4.9.2 --activate`
- **驗證**: `yarn -v`

### Git
- **版本**: 2.x 或更高
- **下載**: [git-scm.com](https://git-scm.com/)
- **驗證**: `git --version`

---

## 🔧 推薦工具

### IDE
- **VS Code** (推薦)
  - [下載](https://code.visualstudio.com/)
  - 推薦擴展：
    - Angular Language Service
    - ESLint
    - Prettier
    - GitHub Copilot

### 瀏覽器
- Chrome (推薦) 或 Firefox
- 安裝 Vue DevTools / Angular DevTools

---

## ☁️ Supabase 帳號

本專案使用 Supabase 作為後端服務：

1. 前往 [supabase.com](https://supabase.com/) 註冊帳號
2. 建立新專案
3. 取得專案 URL 和 API Key
4. 設定環境變數（見安裝指南）

---

## 🔐 環境變數

建立 `.env` 檔案（請勿提交至版本控制）：

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 其他
NODE_ENV=development
```

---

## ✅ 驗證清單

- [ ] Node.js 20.x 已安裝
- [ ] Yarn 4.x 已安裝
- [ ] Git 已安裝
- [ ] VS Code 已安裝（含推薦擴展）
- [ ] Supabase 帳號已建立
- [ ] 專案已 Clone

---

**下一步**: [安裝指南](./installation.md)
