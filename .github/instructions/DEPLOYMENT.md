---
description: '部署流程與注意事項說明'
applyTo: '**/*.yml,**/*.yaml,**/*.json,**/*.env*,**/Dockerfile*,**/*.sh'
---

# Deployment

部署流程與注意事項說明。

記錄部署步驟、環境配置與發布檢查清單。

## 套件管理

- 必須使用 `yarn` 作為套件管理工具，不要使用 `npm` 或 `pnpm`
- 使用 `yarn install` 安裝依賴，不要使用 `npm install`
- 使用 `yarn add <package>` 安裝套件，不要使用 `npm install <package>`
- 使用 `yarn remove <package>` 移除套件，不要使用 `npm uninstall`
- 所有指令必須使用 `yarn` 前綴，不要直接使用 `ng` 或 `npm`

## 建置與部署

- 使用 `yarn build` 建置生產版本
- 建置前執行 `yarn lint` 確保程式碼品質
- 建置前執行 `yarn test` 確保測試通過
- 檢查建置產物大小，使用 `yarn analyze` 分析 bundle
- 確保環境變數正確設定
- 驗證 Supabase 連線與 RLS 政策

## 部署檢查清單

- 確認所有依賴已正確安裝
- 確認建置成功無錯誤
- 確認環境變數已設定
- 確認資料庫遷移已執行
- 確認靜態資源路徑正確
- 確認 CDN 快取已清除（如適用）