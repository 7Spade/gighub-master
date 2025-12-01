---
title: "SETC-07 協作報表上線 — 任務啟動"
labels: ["epic", "spec", "setc"]
assignees: []
---

# SETC-07: 協作報表上線 — 任務啟動

目的：將協作報表模組推向生產環境，整合日誌、任務與驗收資料，提供可過濾、可匯出、且符合權限控管的報表功能。

參考文件：

- `docs/specs/setc/07-collaboration-reports-launch.setc.md`
- `docs/prd/construction-site-management.md`

---

## 任務摘要

- 優先級：🔴 最高
- 預估工期：2–4 週
- 依賴：SETC-04、SETC-05、SETC-06

## 初始工作項目（可勾選）

- [ ] Phase A — 設計：資料模型、API 規格、權限設計（Owner: @）
- [ ] Phase B — 後端：報表聚合 API、匯出、效能優化（Owner: @）
- [ ] Phase C — 前端：報表頁、匯出按鈕、使用者偏好（Owner: @）
- [ ] Phase D — 測試與上線：單元/整合/Playwright E2E、性能驗證（Owner: @）

## 驗收準則（Definition of Done）

- 報表 UI 與後端 API 已完成整合，包含 CSV/Excel 匯出功能。  
- 報表資料能正確匯聚日誌（Diary）、任務系統與品質檢查的關鍵欄位，且通過整合測試。  
- 權限與資料存取控制（ACL / RLS）已驗證並生效。  
- Playwright E2E 測試與單元測試已覆蓋核心流程，且在 CI 中通過。  
- 上線文件、使用者說明與 Release Notes 已撰寫並提交。  

## 備註

1. 建議 Phase A 先產出 OpenAPI / contract 與權限矩陣，Phase B 可先提供匯出 API 的最小實作以供前端開發。
2. 若資料量大於預期，匯出流程應採非同步任務並使用快取/分頁限制匯出筆數。

---

（若要直接在本機建立 Issue，請安裝 GitHub CLI 並執行以下命令：）

```powershell
# 建立 Issue（範例）
gh issue create --title "SETC-07 協作報表上線 — 任務啟動" --body-file "docs/issues/SETC-07-collaboration-reports-issue.md" --label "epic,spec,setc"
```
