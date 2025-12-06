# Playwright Tests for GigHub Blueprint Functionality
# GigHub 藍圖功能 Playwright 測試

## Overview
## 概述

This directory contains Playwright end-to-end tests for testing the blueprint functionality in the GigHub application.

本目錄包含用於測試 GigHub 應用程序中藍圖功能的 Playwright 端到端測試。

## Test Files
## 測試文件

### 1. `blueprint-exploration.spec.ts`
Main test suite that explores and tests all blueprint functionality including:
- Login flow
- Blueprint list navigation
- Blueprint creation process
- UI component analysis

主要測試套件，探索和測試所有藍圖功能，包括：
- 登入流程
- 藍圖列表導航
- 藍圖創建流程
- UI 組件分析

### 2. `login-debug.spec.ts`
Debug test for analyzing and troubleshooting the login process. Provides detailed information about:
- Form fields
- Button states
- Network requests
- Error messages

用於分析和排除登入流程故障的調試測試。提供有關以下內容的詳細資訊：
- 表單欄位
- 按鈕狀態
- 網絡請求
- 錯誤消息

### 3. `test-helpers.ts`
Utility functions and helpers for tests including:
- Login helper
- Screenshot utilities
- Page state logging
- Angular readiness checks

測試的實用函數和輔助工具，包括：
- 登入輔助函數
- 截圖工具
- 頁面狀態記錄
- Angular 準備檢查

## Running Tests
## 運行測試

### Prerequisites
### 先決條件

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure the development server is running:
   ```bash
   npm start
   ```
   The application should be accessible at http://localhost:4200

### Run All Tests
### 運行所有測試

```bash
npx playwright test
```

### Run Specific Test
### 運行特定測試

```bash
# Run blueprint exploration tests
npx playwright test blueprint-exploration

# Run login debug tests
npx playwright test login-debug
```

### Run with UI Mode
### 以 UI 模式運行

```bash
npx playwright test --ui
```

### Generate HTML Report
### 生成 HTML 報告

```bash
npx playwright show-report
```

## Test Configuration
## 測試配置

Configuration is defined in `playwright.config.ts`:
- Base URL: http://localhost:4200
- Browser: Chromium
- Screenshots: Captured on test failures
- Videos: Recorded for failed tests
- Traces: Enabled for debugging

配置在 `playwright.config.ts` 中定義：
- 基礎 URL: http://localhost:4200
- 瀏覽器: Chromium
- 截圖: 在測試失敗時捕獲
- 視頻: 為失敗的測試錄製
- 追蹤: 啟用以進行調試

## Test Account
## 測試帳號

**Email**: ac7x@pm.me  
**Password**: 123123

⚠️ **Note**: Currently experiencing backend connection issues. See test reports for details.

⚠️ **注意**: 目前遇到後端連接問題。詳見測試報告。

## Test Results
## 測試結果

Test results are stored in:
- `test-results/` - Test artifacts, screenshots, videos, traces
- `playwright-report/` - HTML test report

測試結果存儲在：
- `test-results/` - 測試產出物、截圖、視頻、追蹤
- `playwright-report/` - HTML 測試報告

## Known Issues
## 已知問題

### Critical Issue: Backend Connection Failure
### 關鍵問題：後端連接失敗

**Status**: BLOCKER  
**Description**: Application cannot connect to Supabase backend service

**狀態**: 阻礙性問題  
**描述**: 應用程序無法連接到 Supabase 後端服務

**Error Messages**:
```
Failed to fetch
ERR_NAME_NOT_RESOLVED
```

**Impact**:
- Cannot login
- Cannot access authenticated features
- Cannot test blueprint functionality

**影響**:
- 無法登入
- 無法訪問需要認證的功能
- 無法測試藍圖功能

**See Reports**:
- `BLUEPRINT_TEST_REPORT.md` (English)
- `測試回饋報告.md` (Chinese)

## Debugging
## 調試

### View Trace
### 查看追蹤

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Screenshots
### 截圖

Screenshots are automatically saved to `test-results/screenshots/` with timestamps.

截圖會自動保存到 `test-results/screenshots/`，並帶有時間戳。

### Console Logs
### 控制台日誌

Browser console logs are captured and displayed in test output.

瀏覽器控制台日誌會被捕獲並顯示在測試輸出中。

## Contributing
## 貢獻

When adding new tests:
1. Follow the existing test structure
2. Use helper functions from `test-helpers.ts`
3. Add appropriate comments in both English and Chinese
4. Include proper error handling and logging
5. Capture screenshots at key steps

添加新測試時：
1. 遵循現有的測試結構
2. 使用 `test-helpers.ts` 中的輔助函數
3. 添加適當的英文和中文註釋
4. 包含適當的錯誤處理和日誌記錄
5. 在關鍵步驟捕獲截圖

## Resources
## 資源

- [Playwright Documentation](https://playwright.dev/)
- [Angular Testing](https://angular.dev/guide/testing)
- [NG-ALAIN Documentation](https://ng-alain.com/)
- [Supabase Documentation](https://supabase.com/docs)
