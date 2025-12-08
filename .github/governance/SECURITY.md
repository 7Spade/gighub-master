# 安全政策 (Security Policy)

## 支援版本

| 版本 | 支援狀態 |
| ------- | ------------------ |
| 20.x.x  | ✅ 積極維護 |
| 19.x.x  | ⚠️ 僅安全更新 |
| < 19.0  | ❌ 不再支援 |

## 回報安全漏洞

我們非常重視安全性。如果您發現安全漏洞，請遵循以下步驟：

### 🔒 私密回報

**請勿**在公開 Issue 中回報安全漏洞。

請透過以下方式私密回報：

1. **GitHub Security Advisories** (推薦)
   - 前往 [Security Advisories](../../security/advisories/new)
   - 填寫漏洞詳細資訊

2. **電子郵件**
   - 寄送至專案維護者信箱
   - 標題加上 `[SECURITY]` 前綴

### 📝 回報內容應包含

- 漏洞描述
- 重現步驟
- 影響範圍評估
- 可能的修復建議（如有）
- 您的聯絡方式

### ⏱️ 回應時間

| 階段 | 時間 |
|------|------|
| 初步回應 | 48 小時內 |
| 漏洞確認 | 7 天內 |
| 修復發佈 | 視嚴重程度，1-30 天 |

## 安全最佳實踐

### 🔐 認證與授權

本專案使用 Supabase Auth，遵循以下原則：

- Row Level Security (RLS) 強制執行
- 最小權限原則
- JWT Token 短期有效期
- 敏感操作需二次驗證

### 🛡️ 資料保護

- 所有外部流量採 HTTPS
- 敏感資料加密儲存
- 環境變數管理機密資訊
- 定期資料備份

### 🔍 程式碼安全

- CodeQL 自動掃描
- 依賴項漏洞監控 (Dependabot)
- OWASP Top 10 防護
- 輸入驗證與輸出編碼

### 📋 安全檢查清單

開發時請確認：

- [ ] 無硬編碼憑證
- [ ] 使用參數化查詢
- [ ] 實施適當的 RLS 政策
- [ ] 驗證所有使用者輸入
- [ ] 記錄安全相關事件
- [ ] 定期更新依賴項

## 安全相關資源

- [OWASP 安全指引](./instructions/security/security-and-owasp.instructions.md)
- [RLS 政策指南](./copilot/agents/rls-policy.agent.md)
- [程式碼審查標準](./instructions/quality/code-review-generic.instructions.md)

## 致謝

感謝所有協助發現並負責任地揭露安全漏洞的研究人員。

---

**最後更新**: 2025-12-02
