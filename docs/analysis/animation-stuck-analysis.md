# 動畫卡住問題分析 (Animation Stuck Issue Analysis)

## 問題描述

應用啟動時，preloader 動畫（藍色背景 + 六個圓點動畫）一直顯示不消失，導致用戶無法正常使用應用。

## 根本原因

### 1. Preloader 移除機制

`AppComponent` 中的 `donePreloader()` 函數**原本只在 `NavigationEnd` 事件時被調用**：

```typescript
// src/app/app.component.ts (修復前)
if (ev instanceof NavigationEnd) {
  this.donePreloader();  // 只有導航完成時才移除 preloader
}
```

### 2. Supabase Session 載入時序問題

`SupabaseService` 的 `loadSession()` 是異步的：

```typescript
constructor() {
  this.loadSession();  // 異步調用，不等待完成
}

private async loadSession(): Promise<void> {
  // 這需要時間完成
  const { data: { session } } = await this.supabase.auth.getSession();
  this._session.next(session);
}
```

### 3. 時序問題流程

```
T0: SupabaseService 初始化
    - loadSession() 被調用（異步）
    - _session 仍為 null

T1: SupabaseAuthService 初始化
    - checkSession() 讀取 supabaseService.session（仍為 null）
    - 沒有 token 被同步到 @delon/auth

T2: 路由開始解析（用戶訪問 /）
    - authSimpleCanActivate guard 執行
    - CheckSimple(token) 返回 false（token 為空）
    - Guard 返回 false，路由被取消
    - NavigationCancel 事件觸發（而非 NavigationEnd）

T3: ToLogin() 使用 setTimeout 異步導航到 /passport/login

T4: 如果導航到登入頁成功 → NavigationEnd 觸發 → Preloader 消失
    如果導航失敗或被取消 → NavigationEnd 永不觸發 → Preloader 永遠顯示！
```

## 修復方案

### 已實施：方案 1 - 在 NavigationCancel 時也移除 Preloader

修改 `src/app/app.component.ts`：

```typescript
// 修復後
if (ev instanceof NavigationEnd || ev instanceof NavigationCancel) {
  this.donePreloader();
  this.titleSrv.setTitle();
  this.modalSrv.closeAll();
}
```

**原理**：當路由被 guard 拒絕時，會觸發 `NavigationCancel` 事件。現在無論是導航成功 (`NavigationEnd`) 還是被取消 (`NavigationCancel`)，preloader 都會被正確移除。

### 潛在的其他優化方案（未實施）

#### 方案 2：在 APP_INITIALIZER 中等待 Session 載入

確保 Supabase session 在應用路由之前就已經載入完成：

```typescript
// 在 app.config.ts 中
provideAppInitializer(async () => {
  const supabaseService = inject(SupabaseService);
  await supabaseService.waitForSession(); // 需要新增此方法
})
```

#### 方案 3：添加 Preloader 超時機制

作為保險措施，確保 preloader 在一定時間後被移除：

```typescript
private donePreloader = stepPreloader();
private preloaderTimeout = setTimeout(() => {
  console.warn('Preloader timeout - forcing removal');
  this.donePreloader();
}, 10000); // 10 秒超時
```

## 相關文件

- `src/app/app.component.ts` - Preloader 控制邏輯
- `src/app/core/supabase/supabase.service.ts` - Supabase 客戶端服務
- `src/app/core/supabase/supabase-auth.service.ts` - Supabase 認證服務
- `src/app/routes/routes.ts` - 路由配置（含認證 guard）
- `src/index.html` - Preloader HTML/CSS

## 測試建議

1. **未登入用戶訪問首頁**
   - 預期：Preloader 消失，顯示登入頁面

2. **已登入用戶訪問首頁**
   - 預期：Preloader 消失，顯示儀表板

3. **Supabase 連接緩慢或失敗**
   - 預期：Preloader 仍能正確消失

4. **路由錯誤**
   - 預期：Preloader 消失，顯示錯誤頁面

## 更新日誌

- 2025-12-05: 初始分析和修復
