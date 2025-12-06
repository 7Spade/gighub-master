# GigHub Production Environment Diagnostic Guide

## 問題概述 (Problem Overview)

**症狀**: 生產環境（Vercel部署）顯示載入中旋轉圖示，但沒有內容顯示  
**影響**: 用戶無法正常使用藍圖功能  
**狀態**: 本地開發環境正常運作，但生產環境有問題

## 測試環境對比

| 環境 | 狀態 | URL |
|-----|------|-----|
| 本地開發環境 | ✅ 正常 | http://localhost:4200 |
| Vercel生產環境 | ❌ 異常 | https://ng-alain-master-gits-80da7661.vercel.app |

## 根本原因分析

E2E測試只驗證了本地開發環境，並未測試實際的生產部署環境。這導致：
1. 本地測試全部通過
2. 但生產環境可能存在不同的問題

## 可能的問題來源

### 1. Supabase API連線問題 🔴 高優先級

**檢查點**:
- Supabase URL 配置是否正確
- Supabase Anon Key 是否有效
- RLS（Row Level Security）政策是否正確配置
- API請求是否被CORS政策阻擋

**診斷步驟**:
```javascript
// 在生產環境瀏覽器控制台執行
console.log('Supabase URL:', window.location.origin);
// 查看 Network 標籤中的 Supabase API 請求
// 檢查是否有 401, 403, 或 CORS 錯誤
```

**配置位置**:
- `src/environments/environment.prod.ts`
- Supabase Dashboard → Settings → API

### 2. 環境變數配置 🔴 高優先級

**Vercel環境變數檢查**:
```bash
# 在 Vercel Dashboard 檢查以下配置
NEXT_PUBLIC_SUPABASE_URL=https://obwyowvbsnqsxsnlsbhl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

**注意**: Angular應用不使用 `NEXT_PUBLIC_` 前綴的環境變數，這些值應該直接編譯到 `environment.prod.ts` 中。

### 3. 資料庫權限和RLS政策 🟡 中優先級

**檢查RLS政策**:
```sql
-- 在 Supabase SQL Editor 執行
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('blueprints', 'blueprint_members', 'users', 'accounts');
```

**必要的RLS政策**:
1. `blueprints` 表 - 允許用戶查看自己擁有的藍圖
2. `blueprint_members` 表 - 允許用戶查看自己是成員的藍圖
3. `users` 表 - 允許讀取用戶資料

### 4. 建置配置問題 🟡 中優先級

**檢查 angular.json 生產配置**:
```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ],
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true
    }
  }
}
```

### 5. 網路請求錯誤 🟢 低優先級

**可能的網路問題**:
- API請求超時
- 網路延遲過高
- 防火牆規則阻擋請求

## 診斷步驟 (Step-by-Step Diagnostic)

### 步驟 1: 檢查瀏覽器控制台

1. 打開生產環境網站
2. 按 F12 開啟開發者工具
3. 切換到 Console 標籤
4. 記錄所有紅色錯誤訊息

**常見錯誤訊息**:
```
❌ Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
❌ Access to fetch at 'https://...supabase.co' has been blocked by CORS policy
❌ 401 Unauthorized
❌ 403 Forbidden
❌ TypeError: Cannot read property 'id' of null
```

### 步驟 2: 檢查 Network 標籤

1. 切換到 Network 標籤
2. 刷新頁面
3. 查看所有失敗的請求（紅色）
4. 點擊失敗的請求查看詳細資訊

**重點檢查**:
- Supabase API 請求狀態碼
- 請求標頭（Headers）
- 回應內容（Response）
- 請求時間（Timing）

### 步驟 3: 驗證認證狀態

在控制台執行：
```javascript
// 檢查 localStorage 中的認證資訊
const authData = localStorage.getItem('supabase.auth.token');
console.log('Auth data:', authData ? 'exists' : 'missing');

// 檢查 session storage
console.log('Session storage keys:', Object.keys(sessionStorage));
```

### 步驟 4: 測試 Supabase 連線

在控制台執行：
```javascript
// 手動測試 Supabase API
fetch('https://obwyowvbsnqsxsnlsbhl.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id3lvd3Zic25xc3hzbmxzYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzcyNDksImV4cCI6MjA4MDQ1MzI0OX0.GkJbX-WILcOOKZPy3ZTV127s7OH_6iBCVWGCBXi2uLA',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id3lvd3Zic25xc3hzbmxzYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzcyNDksImV4cCI6MjA4MDQ1MzI0OX0.GkJbX-WILcOOKZPy3ZTV127s7OH_6iBCVWGCBXi2uLA'
  }
})
.then(r => r.json())
.then(data => console.log('Supabase API response:', data))
.catch(err => console.error('Supabase API error:', err));
```

## 快速修復方案

### 方案 1: 檢查並更新 RLS 政策

```sql
-- 為 blueprints 表添加查詢政策
CREATE POLICY "Users can view their own blueprints"
ON public.blueprints
FOR SELECT
USING (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1 FROM public.blueprint_members
    WHERE blueprint_members.blueprint_id = blueprints.id
    AND blueprint_members.user_id = auth.uid()
  )
);
```

### 方案 2: 驗證 Vercel 建置配置

```json
// vercel.json
{
  "installCommand": "yarn install",
  "buildCommand": "yarn build:prod",
  "outputDirectory": "dist/ng-alain",
  "framework": null
}
```

### 方案 3: 添加詳細的錯誤日誌

修改 `src/app/routes/blueprint/list/list.component.ts`:

```typescript
async loadBlueprints(): Promise<void> {
  const accountId = this.contextAccountId();
  console.log('[Blueprint List] Account ID:', accountId);
  
  if (!accountId) {
    console.warn('[Blueprint List] No account ID available');
    this.blueprints.set([]);
    return;
  }

  this.loading.set(true);
  try {
    const contextType = this.workspaceContext.contextType();
    console.log('[Blueprint List] Context type:', contextType);
    
    let blueprints: BlueprintBusinessModel[];

    if (contextType === ContextType.ORGANIZATION) {
      blueprints = await this.blueprintFacade.findByOwner(accountId);
    } else {
      blueprints = await this.blueprintFacade.getUserAccessibleBlueprints(accountId);
    }

    console.log('[Blueprint List] Loaded blueprints:', blueprints.length);
    this.blueprints.set(blueprints);
  } catch (error) {
    console.error('[Blueprint List] Error details:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
    this.msg.error('載入藍圖失敗');
  } finally {
    this.loading.set(false);
  }
}
```

## 需要收集的資訊

請提供以下資訊以協助診斷：

1. **瀏覽器控制台錯誤** (Console errors)
   - 截圖或複製完整錯誤訊息

2. **網路請求失敗詳情** (Network tab failures)
   - 哪些請求失敗？
   - 狀態碼是什麼？
   - 回應內容是什麼？

3. **認證狀態** (Authentication state)
   - 是否成功登入？
   - localStorage 中是否有認證資訊？

4. **Supabase Dashboard 檢查**
   - RLS 政策是否啟用？
   - 是否有 API 請求記錄？

5. **Vercel 部署日誌** (Vercel deployment logs)
   - 建置是否成功？
   - 是否有錯誤或警告？

## 臨時解決方案

如果需要立即使用系統，可以：

1. **使用本地開發環境**
   ```bash
   git clone https://github.com/7Spade/gighub-master.git
   cd gighub-master
   yarn install
   yarn start
   # 訪問 http://localhost:4200
   ```

2. **清除瀏覽器快取和 Cookie**
   - 按 Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
   - 選擇清除所有內容
   - 重新登入

3. **使用無痕模式**
   - 開啟瀏覽器無痕/隱私模式
   - 訪問生產環境
   - 重新登入

## 下一步行動

### 立即行動（現在就做）
1. ✅ 檢查瀏覽器控制台錯誤
2. ✅ 檢查 Network 標籤失敗的請求
3. ✅ 驗證 Supabase 連線狀態

### 短期行動（24小時內）
1. ⏳ 修正識別的配置問題
2. ⏳ 更新 RLS 政策（如需要）
3. ⏳ 添加更詳細的錯誤日誌
4. ⏳ 重新部署到 Vercel

### 長期改進（本週內）
1. 📋 建立生產環境E2E測試
2. 📋 設置健康檢查端點
3. 📋 建立監控和告警系統
4. 📋 建立錯誤追蹤系統（如 Sentry）

## 聯絡支援

如需進一步協助，請提供：
1. 瀏覽器控制台完整輸出
2. Network 標籤截圖
3. Vercel 部署日誌
4. Supabase 專案ID

## 參考資源

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Deployment Troubleshooting](https://vercel.com/docs/concepts/deployments/troubleshoot-a-build)
- [Angular Production Deployment](https://angular.dev/tools/cli/deployment)
- [Chrome DevTools Network](https://developer.chrome.com/docs/devtools/network/)

---

**建立時間**: 2025-12-06  
**版本**: 1.0  
**狀態**: 等待用戶回饋診斷資訊
