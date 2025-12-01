---
name: copilot-instructions-blueprint-generator
description: |
  引導 AI 生成適配本專案（GigHub / ng-alain / Supabase）的 `copilot` 指令藍圖 (blueprint)。
  這個 prompt 用於產生 `.github/copilot/blueprints/*.blueprint.md` 檔案範本，包含必要的 metadata、applyTo 規則、範例與驗收條件。
agent: prompt-builder
argument-hint: "請產生或更新一份 blueprint，並回傳完整的 Markdown 範本與一個實例。"
---

目的
-
引導 Copilot 或類似模型在本專案情境下，產生高品質、可重用且與現有 `copilot` 指令整合的 blueprint 檔案。

使用情境
-
- 當你要新增或更新 `.github/copilot/blueprints/*.blueprint.md` 時，使用此 prompt 生成內容。
- 生成後的 blueprint 檔會被放在 `.github/copilot/blueprints/`，並遵守專案既有的格式與指引。

約束條件
-
- 請參考並遵守專案全域指引：`.github/copilot-instructions.md`，以及 `.github/instructions/` 下的相關 instructions（例如 Angular、Accessibility、Security 等）。
- 所有文字以繁體中文 (zh-TW) 撰寫，技術術語保留英文。
- 不要在 blueprint 中包含任何敏感資訊（例如 API keys、私密設定）。
- blueprint 必須可被自動驗證：包含 `applyTo`、`description`、`quality`、`examples` 等欄位。

輸出規範（必填欄位）
-
- `id`: 唯一識別碼（短小、以英文或 kebab-case）
- `title`: 中文標題
- `applyTo`: 檔案匹配或副檔名（可使用 glob，例如 `**/*.ts` 或 `**/*.md`）
- `description`: 一段描述，說明這個 blueprint 的用途與適用情境
- `intent`: 1-2 行說明 AI 生成時要達成的核心目的（機器可直接使用）
- `template`: 真正要寫入的範本內容（含範例片段）
- `examples`: 1~3 個可執行或可複製的使用範例（輸入 → 預期輸出）
- `quality`: 驗收標準（至少 3 條），明確、可測試

產出格式範例
-
以下為 blueprint 檔案的範例結構（請輸出為 Markdown）：

```
---
id: angular-accessibility-guidelines
title: Angular 元件無障礙指南 (Blueprint)
applyTo: 'src/app/**/!(*.spec).ts'
description: 提供 Angular 元件與 template 的 WCAG/keyboard 幫助檢查樣板與註記建議
intent: 自動生成符合本專案可用的無障礙檢查與修正建議
quality:
  - 說明至少包含 keyboard, aria, heading, contrast 四項檢查
  - 範例程式片段可直接套用且通過基本 lint（不改動專案編譯設定）
  - 提供至少一個測試步驟（手動或自動）以驗證修正有效性
examples:
  - input: 'component template with <div onclick=...>'
    output: '替換為 <button> 或 增加 role + tabindex + keydown handler，並補 aria-label'
template: |
  # 指令說明
  - 說明與操作步驟...
```

最佳實踐指引（生成器應遵守）
-
- 以最小變更原則為優先：建議修改點應該是可套用且風險低的修正。
- 優先使用專案現有元件與樣式（ng-zorro / @delon）而非新增第三方依賴。
- 包含可執行的驗收條件（例如：在 `examples` 中給出輸入與預期輸出）。
- 提醒使用者做「人工驗證」，並建議使用工具（Accessibility Insights、axe、lint 規則等）。

生成工作流程建議（AI 使用此 prompt 的步驟）
-
1. 讀取專案根目錄下的 `.github/copilot-instructions.md` 及 `.github/instructions/`，抓取相關約束（accessibility/security/angular 等）。
2. 依據目標 `applyTo` 決定 blueprint 的範圍與粒度。
3. 產出 blueprint Markdown（含 YAML-like header 與 `template`、`examples`、`quality`）。
4. 在 output 中加入一段「如何驗證」的步驟供人員或 CI 使用。

檢查清單（AI 自查）
-
- 是否包含 `id`, `title`, `applyTo`, `description`, `intent`, `quality`, `examples`, `template`？
- `applyTo` 是否過於寬泛（避免 `**/*` 除非必要）？
- 範例是否能直接執行或具可驗證性？
- 是否遵守專案語言（繁體中文）與術語規則？
- 是否避免帶入敏感資訊？

安全與合規備註
-
- 若 blueprint 涉及安全、認證或 token 處理，請僅提供安全設計建議與範例，不要輸出任何實際憑證或密鑰。

使用範例（對話指令）
-
1) 新增 blueprint：

```
請根據專案產生一份 `supabase-repository-guidelines` 的 blueprint，applyTo 指向 `src/app/**/repository/*.ts`，內容要包含：Repository 模式建議、RLS 呼叫注意事項、單元測試範例、quality 驗收標準。
```

2) 更新 blueprint：

```
請把現有 `angular-accessibility-guidelines` blueprint 補充一個 `examples` 範例：一個含有 <img> 無 alt 的 template，並產生修正後的 template 與驗收步驟。
```

備註
-
- 生成出的 blueprint 請存放在 `.github/copilot/blueprints/`，檔名以 `id.blueprint.md` 命名。
- 若要覆寫已存在的 blueprint，請先在 output 中提醒會覆蓋，並說明差異摘要供 reviewer 審核。

---

請依上面規範輸出 blueprint Markdown 的內容範本（不要直接新增到 repo），並同時給出 1 個實際範例（符合本專案環境）。
