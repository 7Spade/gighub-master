# Supabase Edge Functions

本目錄將包含 GigHub 專案的 Supabase Edge Functions。

## 📋 計劃中的 Functions

| Function | 說明 | 狀態 |
|----------|------|------|
| `send-notification` | 發送推播通知 | 計劃中 |
| `generate-report` | 生成報表 | 計劃中 |
| `sync-calendar` | 行事曆同步 | 計劃中 |
| `export-data` | 資料匯出 | 計劃中 |

## 🔧 開發指南

### 創建新 Function

```bash
# 創建新函數
supabase functions new my-function

# 本地測試
supabase functions serve my-function

# 部署
supabase functions deploy my-function
```

### 目錄結構

```
functions/
├── README.md
├── _shared/           # 共用程式碼
│   └── utils.ts
├── send-notification/
│   └── index.ts
└── generate-report/
    └── index.ts
```

---

*詳細說明請參考 [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)*
