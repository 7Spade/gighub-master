# Blueprint Testing - Issues and Remediation Guide

## 問題總結 (Issues Summary)

### 🔴 Critical Issue: Network Connectivity Failure

**問題**: Supabase API 無法連線，導致所有認證相關功能失敗

**錯誤類型**:
1. `ERR_NAME_NOT_RESOLVED` - DNS 解析失敗
2. `ERR_CERT_AUTHORITY_INVALID` - SSL 證書驗證失敗
3. `TypeError: Failed to fetch` - HTTP 請求失敗

---

## 詳細解決方案 (Detailed Solutions)

### Solution 1: 配置 Playwright 忽略 HTTPS 錯誤

**檔案**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // 新增: 忽略 HTTPS 錯誤
    ignoreHTTPSErrors: true,
    
    // 新增: 自定義 HTTP 標頭
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 新增: 忽略證書錯誤
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },
  ],
});
```

**優點**:
- 快速實施
- 不需要修改應用程式碼
- 適合開發和測試環境

**缺點**:
- 降低安全性（僅限測試環境使用）
- 無法解決 DNS 問題

---

### Solution 2: 使用 API Mocking

**建立 Mock 文件**: `e2e-tests/helpers/api-mock.ts`

```typescript
import { Page } from '@playwright/test';

export async function mockSupabaseAuth(page: Page) {
  // Mock 登入請求
  await page.route('**/auth/v1/token**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token-' + Date.now(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'ac7x@pm.me',
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {
            name: '測試使用者'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
    });
  });

  // Mock 使用者資訊請求
  await page.route('**/auth/v1/user**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'ac7x@pm.me',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          name: '測試使用者'
        }
      })
    });
  });
}

export async function mockBlueprintAPI(page: Page) {
  // Mock 藍圖列表
  await page.route('**/rest/v1/blueprints**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'blueprint-1',
          name: '測試藍圖 1',
          description: '這是測試藍圖',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'test-user-id'
        }
      ])
    });
  });

  // Mock 建立藍圖
  await page.route('**/rest/v1/blueprints', async route => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-blueprint-' + Date.now(),
          ...postData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'test-user-id'
        })
      });
    }
  });
}
```

**更新測試文件**: `e2e-tests/blueprint.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockBlueprintAPI } from './helpers/api-mock';

test.describe('Blueprint Functionality with Mock API', () => {
  test.beforeEach(async ({ page }) => {
    // 設置 API Mock
    await mockSupabaseAuth(page);
    await mockBlueprintAPI(page);
  });

  test('Login with mocked API', async ({ page }) => {
    await page.goto('/passport/login');
    
    // 填寫表單
    await page.fill('input[type="email"]', 'ac7x@pm.me');
    await page.fill('input[type="password"]', '123123');
    
    // 提交
    await page.click('button[type="submit"]');
    
    // 等待導航
    await page.waitForURL('**/account/**', { timeout: 10000 });
    
    // 驗證成功
    expect(page.url()).toContain('/account');
  });
});
```

**優點**:
- 完全控制測試環境
- 不依賴外部服務
- 測試執行快速且穩定
- 可以測試各種邊界情況

**缺點**:
- 需要維護 Mock 數據
- 無法測試真實的後端整合

---

### Solution 3: 使用測試專用 Supabase 實例

**步驟**:

1. **建立測試專用 Supabase 項目**:
   - 前往 https://supabase.com
   - 建立新項目 "gighub-testing"
   - 記錄 URL 和 anon key

2. **建立測試專用環境配置**:

**檔案**: `src/environments/environment.test.ts`

```typescript
import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  supabase: {
    url: 'https://YOUR-TEST-PROJECT.supabase.co',
    anonKey: 'YOUR-TEST-ANON-KEY'
  },
  providers: [],
  interceptorFns: []
} as Environment;
```

3. **配置測試數據**:

```sql
-- 在測試 Supabase 實例中執行

-- 建立測試使用者 (需要在 Supabase Dashboard 中建立)
-- Email: ac7x@pm.me
-- Password: 123123

-- 建立測試藍圖表
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 設置 RLS 政策
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blueprints"
  ON blueprints FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create blueprints"
  ON blueprints FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 插入測試數據
INSERT INTO blueprints (name, description, owner_id)
VALUES 
  ('測試藍圖 1', '這是第一個測試藍圖', 'USER_ID_HERE'),
  ('測試藍圖 2', '這是第二個測試藍圖', 'USER_ID_HERE');
```

4. **更新 Angular 配置使用測試環境**:

```bash
# 使用測試環境啟動
ng serve --configuration=test
```

**優點**:
- 真實的後端整合測試
- 完整的功能驗證
- 獨立的測試數據

**缺點**:
- 需要額外的 Supabase 項目
- 需要管理測試數據
- 執行速度較慢

---

### Solution 4: 配置本地網路環境

**Linux/macOS**:

```bash
# 檢查 DNS 解析
nslookup obwyowvbsnqsxsnlsbhl.supabase.co

# 如果無法解析，添加到 /etc/hosts
echo "YOUR_IP obwyowvbsnqsxsnlsbhl.supabase.co" | sudo tee -a /etc/hosts

# 配置證書信任
# 下載 Supabase 證書
echo | openssl s_client -connect obwyowvbsnqsxsnlsbhl.supabase.co:443 | \
  openssl x509 > supabase.crt

# 添加到系統證書庫
sudo cp supabase.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

**Windows**:

```powershell
# 檢查 DNS 解析
nslookup obwyowvbsnqsxsnlsbhl.supabase.co

# 添加到 hosts 文件
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "YOUR_IP obwyowvbsnqsxsnlsbhl.supabase.co"

# 證書需要通過 certmgr.msc 手動導入
```

**優點**:
- 解決根本問題
- 適用於所有應用程式

**缺點**:
- 需要系統管理員權限
- 可能影響其他應用程式
- 配置較複雜

---

## 實施步驟 (Implementation Steps)

### Phase 1: 快速修復 (2-4 小時)

1. **實施 Solution 1**: 配置 Playwright 忽略 HTTPS 錯誤
   ```bash
   cd /home/runner/work/gighub-master/gighub-master
   # 編輯 playwright.config.ts，添加 ignoreHTTPSErrors: true
   ```

2. **測試基本連線**:
   ```bash
   # 手動測試 Supabase 連線
   curl -I https://obwyowvbsnqsxsnlsbhl.supabase.co
   ```

3. **驗證帳號**:
   - 登入 Supabase Dashboard
   - 確認 ac7x@pm.me 帳號存在
   - 重設密碼為 123123（如需要）

4. **重新執行測試**:
   ```bash
   npx playwright test
   ```

### Phase 2: 穩定測試環境 (1-2 天)

1. **實施 Solution 2**: 建立 API Mock 層
   - 建立 `e2e-tests/helpers/api-mock.ts`
   - 更新測試文件使用 Mock
   - 建立 Mock 數據工廠

2. **實施 Solution 3**: 設置測試 Supabase 實例
   - 建立新的 Supabase 項目
   - 配置測試數據庫
   - 建立測試使用者和數據

3. **設置 CI/CD**:
   - 配置 GitHub Actions
   - 設置環境變數
   - 自動執行測試

### Phase 3: 完善測試套件 (3-5 天)

1. **擴展測試覆蓋**:
   - 完成所有藍圖功能測試
   - 添加邊界測試
   - 添加性能測試

2. **視覺回歸測試**:
   - 配置視覺快照
   - 建立基準線
   - 自動比對差異

3. **測試報告**:
   - 集成測試報告工具
   - 生成覆蓋率報告
   - 設置通知機制

---

## 驗證檢查清單 (Verification Checklist)

### 網路連線檢查

- [ ] 可以 ping 通 obwyowvbsnqsxsnlsbhl.supabase.co
- [ ] 可以通過 curl 訪問 Supabase API
- [ ] SSL 證書驗證通過
- [ ] DNS 解析正常

### 測試環境檢查

- [ ] Node.js 和 Yarn 已安裝
- [ ] Angular CLI 可用
- [ ] Playwright 已安裝並配置
- [ ] 測試服務器可以啟動

### 帳號檢查

- [ ] ac7x@pm.me 帳號存在於 Supabase
- [ ] 密碼正確 (123123)
- [ ] 帳號已驗證
- [ ] 帳號有必要的權限

### 測試執行檢查

- [ ] 登入頁面可以載入
- [ ] 表單可以填寫
- [ ] 登入請求可以發送
- [ ] 認證成功後可以導航
- [ ] 藍圖列表可以載入

---

## 監控和日誌 (Monitoring and Logging)

### Playwright 測試日誌

**位置**: `test-results/playwright-output.log`

**內容**:
- 測試執行時間
- 錯誤訊息
- 瀏覽器控制台輸出
- 網路請求失敗

### Angular 服務器日誌

**位置**: `/tmp/angular-server.log`

**內容**:
- 編譯警告
- 構建時間
- 服務器狀態

### 截圖

**位置**: `test-results/screenshots/`

**命名格式**: `{step-name}-{timestamp}.png`

**已捕獲**:
- 01-login-page: 登入頁面
- 02-login-filled: 填寫表單後
- 03-login-error: 登入失敗

---

## 常見問題 (FAQ)

### Q1: 為什麼會出現 ERR_NAME_NOT_RESOLVED？

**A**: 這通常是 DNS 解析問題。可能的原因：
1. 網路連線問題
2. DNS 服務器無法解析域名
3. 防火牆阻止了 DNS 請求
4. 本地 hosts 文件配置錯誤

**解決方法**: 
- 檢查網路連線
- 使用公共 DNS (8.8.8.8, 1.1.1.1)
- 檢查防火牆設置

### Q2: 為什麼會出現 ERR_CERT_AUTHORITY_INVALID？

**A**: 這是 SSL 證書驗證失敗。可能的原因：
1. 證書鏈不完整
2. 系統證書庫過期
3. 中間人攻擊檢測
4. 測試環境證書配置

**解決方法**:
- 更新系統證書庫
- 配置 Playwright 忽略證書錯誤（僅測試環境）
- 檢查網路代理設置

### Q3: 測試在 CI 環境中失敗怎麼辦？

**A**: CI 環境常見問題：
1. 網路限制
2. 時間不同步
3. 資源限制
4. 環境變數未設置

**解決方法**:
- 使用 Mock API
- 配置 CI 環境變數
- 增加超時時間
- 檢查 CI 網路政策

### Q4: 如何快速驗證 Supabase 連線？

**A**: 使用以下命令：

```bash
# 測試 API 連線
curl -X POST https://obwyowvbsnqsxsnlsbhl.supabase.co/auth/v1/token \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"ac7x@pm.me","password":"123123"}'

# 測試 REST API
curl https://obwyowvbsnqsxsnlsbhl.supabase.co/rest/v1/blueprints \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 聯絡資訊 (Contact Information)

如有問題或需要協助，請：

1. **建立 GitHub Issue**:
   - 標籤: `testing`, `bug`, `e2e`
   - 附上錯誤日誌和截圖

2. **查看文檔**:
   - [TEST_REPORT.md](./TEST_REPORT.md) - 完整測試報告
   - [README.md](./README.md) - 專案說明

3. **檢查日誌**:
   - `test-results/playwright-output.log`
   - `test-results/screenshots/`
   - `/tmp/angular-server.log`

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-06  
**作者**: Playwright MCP Testing Team
