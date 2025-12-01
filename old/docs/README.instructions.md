# GitHub Copilot Instructions

本文件說明本專案保留的 GitHub Copilot 開發指令檔案，為程式碼生成提供上下文感知的指引。

**最後更新**：2025-01-26  
**檔案位置**：[.github/instructions/](../.github/instructions/)  
**指令數量**：14 個

---

## 如何運作

Instructions 檔案會自動被 GitHub Copilot 讀取，並根據 `applyTo` 配置應用於對應的檔案類型。當您在符合條件的檔案中編輯時，Copilot 會自動套用相關的最佳實踐。

---

## 指令分類索引

### Angular 開發類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [angular.instructions.md](../.github/instructions/angular.instructions.md) | Angular 專屬編碼標準與最佳實踐 | Angular 組件、服務、模組開發 |

**自動套用**：`**/*.ts, **/*.html, **/*.scss, **/*.css`

---

### TypeScript 開發類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [typescript-5-es2022.instructions.md](../.github/instructions/typescript-5-es2022.instructions.md) | TypeScript 5.x + ES2022 開發指南 | TypeScript 專案開發 |

**自動套用**：`**/*.ts, **/*.js, **/package.json`

---

### 測試類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [playwright-python.instructions.md](../.github/instructions/playwright-python.instructions.md) | Playwright Python | Playwright Python 測試框架指引 |

---

### 程式碼品質類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [gilfoyle-code-review.instructions.md](../.github/instructions/gilfoyle-code-review.instructions.md) | Gilfoyle 程式碼審查 | 毒舌但精準的程式碼審查指引 |
| [self-explanatory-code-commenting.instructions.md](../.github/instructions/self-explanatory-code-commenting.instructions.md) | 自解釋程式碼註解指引 | 撰寫少量但有效的註解，解釋「為什麼」而非「做什麼」|

---

### Shell 腳本類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [shell.instructions.md](../.github/instructions/shell.instructions.md) | Shell 腳本最佳實踐 | Bash、sh、zsh 腳本撰寫 |

**自動套用**：`**/*.sh`

---

### Copilot 配置類

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [instructions.instructions.md](../.github/instructions/instructions.instructions.md) | 自訂指令檔案建立指南 | 建立高品質的 Copilot 自訂指令檔案 |
| [prompt.instructions.md](../.github/instructions/prompt.instructions.md) | Prompt 檔案建立指南 | 建立高品質的 Copilot Prompt 檔案 |
| [taming-copilot.instructions.md](../.github/instructions/taming-copilot.instructions.md) | Copilot 控制指引 | 防止 Copilot 過度修改程式碼庫 |
| [copilot-thought-logging.instructions.md](../.github/instructions/copilot-thought-logging.instructions.md) | Copilot 思考日誌 | Copilot 思考過程記錄指引 |

---

### 架構相關

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [dotnet-architecture-good-practices.instructions.md](../.github/instructions/dotnet-architecture-good-practices.instructions.md) | .NET 架構最佳實踐 | .NET 架構設計最佳實踐 |

---

### 平台相關

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [pcf-code-components.instructions.md](../.github/instructions/pcf-code-components.instructions.md) | PCF 程式碼元件 | Power Apps Component Framework 程式碼元件指引 |
| [pcf-model-driven-apps.instructions.md](../.github/instructions/pcf-model-driven-apps.instructions.md) | PCF 模型驅動應用 | Power Apps Component Framework 模型驅動應用指引 |

---

### Prompt 工程相關

| 指令檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [ai-prompt-engineering-safety-best-practices.instructions.md](../.github/instructions/ai-prompt-engineering-safety-best-practices.instructions.md) | AI Prompt 安全性最佳實踐 | AI Prompt 安全性與最佳實踐 |

---

## 使用指南

### 按開發階段使用

| 階段 | 推薦指令 |
|------|----------|
| **Angular 開發** | `angular.instructions.md` + `typescript-5-es2022.instructions.md` |
| **測試撰寫** | `playwright-python.instructions.md` |
| **程式碼審查** | `gilfoyle-code-review.instructions.md` |
| **Shell 腳本** | `shell.instructions.md` |

### 按檔案類型自動套用

| 檔案類型 | 自動套用的指令 |
|----------|----------------|
| `*.ts`, `*.html`, `*.scss`, `*.css` | `angular.instructions.md` |
| `*.ts`, `*.js` | `typescript-5-es2022.instructions.md` |
| `*.sh` | `shell.instructions.md` |

---

## 主要指令說明

### `angular.instructions.md`
適用於 Angular 20+ 專案，涵蓋：
- Standalone Components 設計
- Angular Signals 狀態管理
- ng-zorro-antd UI 元件使用
- OnPush 變更檢測策略
- Lazy Loading 路由配置
- RxJS 資料流處理

### `typescript-5-es2022.instructions.md`
適用於 TypeScript 5.x 專案，涵蓋：
- 嚴格模式型別檢查
- ES2022 特性使用
- ESM 模組系統
- 非同步程式碼處理
- 安全實踐

---

## 維護記錄

- **2025-01-26**: 更新文件以反映實際檔案數量（14 個指令檔案）
  - 移除：不存在的指令檔案引用（typescript-mcp-server, playwright-typescript, a11y, security-and-owasp, security-guidelines, actions, github-actions-ci-cd-best-practices, devops-core-principles, object-calisthenics, style-guide, performance-optimization, markdown, localization, spec-driven-workflow-v1, task-implementation, tasksync, memory-bank）
  - 保留：實際存在的 14 個指令檔案
- **2025-01-20**: 補上所有指令文件介紹，包含 3 個待完善的空文件
- **2025-11-26**: 更新文件以反映 Copilot 配置清理後的狀態
- **2025-11-25**: 從 awesome-copilot 複製有價值的 instructions
- **2025-11-23**: 初始化指令目錄

---

## 來源

部分指令精選自 [awesome-copilot](https://github.com/github/awesome-copilot) 開源專案。
