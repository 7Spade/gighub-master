# 文件存檔 / Documentation Archive

> 本目錄包含已完成的歷史文件和文檔  
> This directory contains completed historical files and documentation

## 📁 目錄結構 / Directory Structure

### `restructuring/`
文件重組相關的已完成文件，包括實施摘要和重組指南。
- `IMPLEMENTATION_SUMMARY.md` - 文件重組實施總結
- `RESTRUCTURING_GUIDE.md` - 文件架構重組說明
- `CONTRIBUTING_REDIRECT.md` - 貢獻指南重定向通知（已過渡期）
- `SECURITY_REDIRECT.md` - 安全政策重定向通知（已過渡期）

**相關 PR**: #188  
**實施日期**: 2025-12-08  
**狀態**: ✅ 已完成

---

### `implementations/`
已完成的功能實施摘要文件。
- `implementation-summary-module-guard-optimization.md` - 模組守衛優化實施摘要

---

### `progress/`
歷史進度報告和追蹤記錄。
- `2025-12-06-demo-migration-complete.md` - Demo 遷移完成報告
- `2025-12-06-progress-update-summary.md` - 進度更新摘要
- `done.md` - 已完成項目記錄

---

### `testing/`
已完成的測試報告和驗證記錄。
- `2025-12-06-phase1-build-test.md` - 第一階段建置測試
- `2025-12-08-verification-report.md` - 驗證報告

---

### `design-drafts/`
已完成的設計草稿、分析和參考文件。
- `AZURE_DRAGON_INTEGRATION_SUMMARY.md` - Azure Dragon 整合摘要
- `WIDGET_TRANSFORMATION_ANALYSIS.md` - Widget 轉換分析
- `analysis-menu-infinite-loop.md` - 選單無限迴圈分析
- `keep-001-reference.md` - 保留參考文件 001
- `keep-002-reference.md` - 保留參考文件 002
- `real-time-collaboration-pricing.md` - 即時協作定價
- `versioned-file-space-design.md` - 版本化檔案空間設計

---

### `issues/`
歷史問題分析和功能審查文件。
- `2025-12-06-comprehensive-progress-analysis.md` - 綜合進度分析
- `2025-12-08-bugfix-summary.md` - 錯誤修復摘要
- `basic-feature-review.md` - 基本功能審查

---

## 📝 存檔原則 / Archive Principles

文件會在以下情況被移至存檔：

1. **已完成的實施** - 功能已完整實施且穩定運行
2. **歷史記錄** - 時間點的進度報告和狀態快照
3. **已過期的臨時文件** - 過渡期結束的重定向通知
4. **完成的分析** - 已解決的問題分析和研究文件
5. **舊版草稿** - 已定案或不再使用的設計草稿

---

## 🔍 如何查找活躍文件 / Finding Active Documents

活躍的文件組織結構：

```
docs/
├── overview/          # 專案總覽
├── setup/             # 環境設定
├── guides/            # 操作指南
├── reference/         # 技術參考
├── design/            # 設計文件（活躍）
│   ├── architecture/  # 架構設計
│   ├── adr/          # 架構決策記錄
│   ├── flows/        # 流程圖
│   └── drafts/       # 進行中的草稿
├── development/       # 開發追蹤（活躍）
│   ├── issues/       # 當前問題
│   └── plans/        # 功能計劃
├── progress/          # 進度追蹤（活躍）
├── testing/           # 測試文件（活躍）
└── archive/           # 📦 歷史存檔（本目錄）
```

---

## 📅 存檔日期 / Archive Date

**建立日期**: 2025-12-08  
**最後更新**: 2025-12-08

---

## ℹ️ 備註 / Notes

- 存檔文件保留供歷史參考和查閱
- 這些文件已不再活躍維護，但保留其歷史價值
- 如需引用存檔文件，請使用完整路徑：`docs/archive/[category]/[filename].md`
- 對於正在進行的工作，請參考 `docs/` 根目錄下的活躍文件
