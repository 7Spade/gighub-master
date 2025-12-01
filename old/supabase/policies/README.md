簡要說明

此資料夾保存 Supabase 的 Row Level Security (RLS) 與相關存取控制政策定義與範例。

- 位置：`supabase/policies`
- 內容：RLS 規則、示例 policy 檔案與說明，通常以 SQL 或專案指定格式儲存。
- 審查：變更政策時請小心評估授權影響，並在 PR 中提供測試案例或驗證步驟。

注意：政策為安全關鍵設定，請勿將機敏憑證或未加密的敏感資料放在此處。對生產政策的變更應透過 migration 及審核流程。
