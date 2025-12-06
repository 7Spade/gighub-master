# 備份資料夾 (Backup Folder)

**建立日期**: 2025-12-06  
**目的**: 保存原始 Demo 內容作為未來開發參考

---

## 📁 內容說明

此資料夾包含從 `src/app/routes/demo/` 遷移過來的所有示範頁面和元件。這些內容已從主要專案中移除，以符合奧卡姆剃刀原則（Occam's Razor），減少專案複雜度。

### 備份內容統計

- **總檔案數**: 135 個
- **主要類別**:
  - Dashboard 示範（工作台、分析、監控、v1）
  - DataV 示範（關聯圖）
  - Delon 元件示範（ACL、Cache、Form、ST、Util、XLSX、ZIP 等）
  - Exception 示範（異常頁面）
  - Extras 示範（POI、幫助中心、設定）
  - Pro 示範（帳戶中心、表單、列表、個人資料、結果頁）
  - Style 示範（色彩、網格、排版）
  - Widgets 示範（小部件）

---

## 🎯 遷移原因

根據 2025-12-06 全面進度分析報告：

### 收斂計畫（Phase 5）

**目標**: 應用奧卡姆剃刀原則，移除不必要的複雜性

**原因**:
1. **專案聚焦**: GigHub 是工地施工進度追蹤管理系統，不需要所有通用 Demo 頁面
2. **代碼簡化**: 減少 ~30% Demo 代碼，降低維護成本
3. **效能提升**: 減少 build 時間和 bundle 大小
4. **清晰架構**: 專注於核心業務功能，避免混淆

**預期收益**:
- 減少約 15-20 個檔案
- 減少 ~30% Demo 相關代碼
- 提升專案可維護性

---

## 📚 如何使用此備份

### 作為開發參考

1. **查看元件實現方式**:
   ```bash
   # 參考 Delon ST 表格使用
   cat backup/demo/delon/st/st.component.ts
   
   # 參考表單實現
   cat backup/demo/pro/form/basic-form/basic-form.component.ts
   ```

2. **複製特定功能**:
   - 如果需要某個 Demo 的功能，可以從備份中複製相關代碼
   - 建議將代碼調整為符合 GigHub 專案的命名和架構規範

3. **學習最佳實踐**:
   - Delon 元件的使用範例
   - Angular 20 Standalone Components 模式
   - ng-zorro-antd 元件整合方式

### 恢復特定 Demo（如需要）

```bash
# 恢復特定 Demo 到專案中
cp -r backup/demo/delon/st src/app/routes/demo/delon/

# 記得更新 routes.ts 以包含該路由
```

---

## 🗂️ 目錄結構

```
backup/demo/
├── dashboard/              # Dashboard 示範頁面
│   ├── analysis/          # 分析頁面
│   ├── monitor/           # 監控頁面
│   ├── v1/                # Dashboard v1
│   └── workplace/         # 工作台
├── data-v/                # DataV 視覺化
│   └── relation/          # 關係圖
├── delon/                 # Delon 元件示範
│   ├── acl/               # 權限控制
│   ├── cache/             # 快取管理
│   ├── downfile/          # 檔案下載
│   ├── form/              # 動態表單
│   ├── guard/             # 路由守衛
│   ├── print/             # 列印功能
│   ├── qr/                # QR Code
│   ├── st/                # 簡易表格
│   ├── util/              # 工具函數
│   ├── xlsx/              # Excel 處理
│   └── zip/               # ZIP 壓縮
├── exception/             # 異常頁面
├── extras/                # 額外功能
│   ├── helpcenter/        # 幫助中心
│   ├── poi/               # POI 管理
│   └── settings/          # 設定頁面
├── pro/                   # Pro 示範頁面
│   ├── account/           # 帳戶管理
│   │   ├── center/        # 個人中心
│   │   └── settings/      # 帳戶設定
│   ├── form/              # 表單頁面
│   │   ├── advanced-form/ # 進階表單
│   │   ├── basic-form/    # 基礎表單
│   │   └── step-form/     # 步驟表單
│   ├── list/              # 列表頁面
│   │   ├── applications/  # 應用列表
│   │   ├── articles/      # 文章列表
│   │   ├── basic-list/    # 基礎列表
│   │   ├── card-list/     # 卡片列表
│   │   ├── projects/      # 專案列表
│   │   └── table-list/    # 表格列表
│   ├── profile/           # 個人資料
│   │   ├── advanced/      # 進階資料
│   │   └── basic/         # 基礎資料
│   └── result/            # 結果頁面
│       ├── fail/          # 失敗頁面
│       └── success/       # 成功頁面
├── style/                 # 樣式示範
│   ├── colors/            # 色彩系統
│   ├── gridmasonry/       # 網格佈局
│   └── typography/        # 排版系統
└── widgets/               # 小部件
    └── widgets/           # 小部件元件
```

---

## 🔗 相關文檔

- [全面進度分析報告](../docs/analysis/2025-12-06-comprehensive-progress-analysis.md)
- [進度更新摘要](../docs/progress/2025-12-06-progress-update-summary.md)
- [待完成項目清單](../docs/progress/todo.md)

---

## ⚠️ 注意事項

1. **不要直接修改此備份**: 此備份僅供參考，修改不會影響專案
2. **版本凍結**: 此備份反映 2025-12-06 的 Demo 狀態
3. **技術更新**: 未來 Angular/ng-alain 版本更新後，這些 Demo 可能需要調整
4. **選擇性使用**: 僅在需要時參考，不建議全部恢復到專案中

---

**備份完成時間**: 2025-12-06  
**備份來源**: `src/app/routes/demo/`  
**備份目的**: 符合奧卡姆剃刀原則，簡化專案架構，同時保留參考資料
