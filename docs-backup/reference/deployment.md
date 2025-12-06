# 部署指南

> 專案的部署策略與流程

---

## 🌍 部署環境

| 環境 | 用途 | URL |
|------|------|-----|
| Development | 開發測試 | localhost:4200 |
| Staging | 預覽測試 | preview-*.surge.sh |
| Production | 正式環境 | (TBD) |

---

## 🚀 部署方式

### 自動部署

PR 合併後自動部署：

1. **CI 建置**: GitHub Actions 執行建置
2. **測試**: 執行 Lint 和測試
3. **部署**: 推送到 Surge.sh (預覽)

### 手動部署

```bash
# 建置生產版本
yarn build

# 部署到 Surge
npx surge ./dist/ng-alain/browser https://your-domain.surge.sh
```

---

## ⚙️ 環境設定

### 環境變數

```env
# Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-key
```

### Angular 環境

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  supabaseUrl: '...',
  supabaseKey: '...'
};
```

---

## 📊 部署檢查清單

- [ ] 所有測試通過
- [ ] Lint 無錯誤
- [ ] 環境變數已設定
- [ ] 建置成功
- [ ] 功能驗證通過

---

**最後更新**: 2025-12-02
