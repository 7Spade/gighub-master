---
description: '開發環境設定與本地啟動說明'
applyTo: '**'
---

# Development

開發環境設定與本地啟動說明。

說明開發環境安裝、啟動步驟與常用開發指令。

## 環境要求

- Node.js >= 20.x
- Yarn >= 4.9.x
- Angular CLI 20.3.x
- TypeScript >= 5.8.x

## 初始設定

- 使用 `yarn install` 安裝所有依賴套件
- 確保開發環境符合版本要求
- 設定 IDE 支援 TypeScript 與 Angular

## 開發流程

- 使用 `yarn start` 啟動開發伺服器
- 使用 `yarn hmr` 啟用熱模組替換模式
- 開發時保持程式碼格式一致
- 定期執行 `yarn lint` 檢查程式碼品質