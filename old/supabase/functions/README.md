簡要說明

此資料夾放置 Supabase Edge Functions 或伺服器端函式（如有），包含函式程式碼、相依套件與部署腳本。

- 位置：`supabase/functions`
- 內容：各函式的原始碼、說明與本機測試或部署指令。
- 部署：通常透過 `supabase functions deploy <name>` 或專案 CI 流程部署至 Supabase Edge，請參考專案根目錄與 CI 指令。

測試與相依性：為每個函式提供簡短的測試說明與必要的相依性清單，並避免在 repo 中提交生產機密。
