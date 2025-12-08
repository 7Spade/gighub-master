# MenuManagementService 無限循環問題 - 深度分析

## 問題概述

`MenuManagementService` 在更新菜單時可能觸發無限循環，導致應用性能問題或崩潰。本文檔提供詳細的原因分析和解決方案。

## 代碼結構分析

### 關鍵組件和服務

1. **MenuManagementService** (`src/app/shared/services/menu/menu-management.service.ts`)
   - 負責載入菜單配置和更新菜單
   - `updateMenu()` 方法調用 `menuService.add()`

2. **WorkspaceContextService** (`src/app/shared/services/account/workspace-context.service.ts`)
   - 管理上下文狀態（contextType, contextId）
   - 包含兩個 effect 監聽認證和載入狀態
   - `restoreContext()` 方法恢復保存的上下文

3. **LayoutBasicComponent** (`src/app/layout/basic/basic.component.ts`)
   - 主佈局組件
   - 包含一個 effect 監聽 contextType 和 contextId 的變化
   - effect 中調用 `syncMenu()` 更新菜單

4. **StartupService** (`src/app/core/startup/startup.service.ts`)
   - 應用啟動時初始化
   - 調用 `menuManagementService.updateMenu(ContextType.USER)`

## 無限循環的根本原因

### 原因 1：雙重菜單更新機制

存在兩個地方同時更新菜單：

#### 位置 A：StartupService 初始化時

```80:90:src/app/core/startup/startup.service.ts
        // 載入菜單配置（MenuManagementService 會處理菜單更新）
        this.menuManagementService
          .loadConfig()
          .then(() => {
            // 初始化時載入預設菜單（USER 菜單）
            // 注意：LayoutBasicComponent 的 effect 會監聽上下文變化並自動更新菜單
            this.menuManagementService.updateMenu(ContextType.USER);
          })
          .catch(error => {
            console.error('[StartupService] Failed to load menu config:', error);
          });
```

#### 位置 B：LayoutBasicComponent 的 effect

```245:259:src/app/layout/basic/basic.component.ts
  constructor() {
    // 監聽上下文變化並更新菜單
    // Listen to context changes and update menu
    effect(() => {
      const contextType = this.workspaceContext.contextType();
      const contextId = this.workspaceContext.contextId();

      // 日誌記錄上下文變化
      console.log('[LayoutBasicComponent] Context changed:', { contextType, contextId });

      // 根據上下文類型同步菜單
      // Sync menu based on context type
      this.syncMenu(contextType, contextId);
    });
  }
```

**問題**：當應用啟動時，這兩個地方可能會同時調用 `updateMenu()`，導致重複更新。

### 原因 2：restoreContext() 的調用時機問題

```165:177:src/app/shared/services/account/workspace-context.service.ts
    // 資料載入完成後自動恢復上下文
    effect(() => {
      const isLoading = this.loading();
      const userId = this.currentUser()?.id;

      console.log('[WorkspaceContextService] 📊 Loading state:', { isLoading, userId, hasRestored: this.hasRestored });

      if (!isLoading && userId && !this.hasRestored) {
        this.hasRestored = true;
        console.log('[WorkspaceContextService] 🔄 Restoring context...');
        this.restoreContext();
      }
    });
```

```274:300:src/app/shared/services/account/workspace-context.service.ts
  restoreContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[WorkspaceContextService] 💾 Saved context:', saved);

      if (saved) {
        const context = JSON.parse(saved) as ContextState;
        if (context.type && context.id) {
          console.log('[WorkspaceContextService] ✅ Restoring saved context:', context);
          this.contextTypeState.set(context.type);
          this.contextIdState.set(context.id);
          return;
        }
      }

      // 預設使用用戶上下文
      const userId = this.currentUser()?.id;
      console.log('[WorkspaceContextService] 👤 Default to user context, userId:', userId);
      if (userId) {
        this.switchToUser(userId);
      }
    } catch (error) {
      console.error('[WorkspaceContextService] Restore failed:', error);
    }
  }
```

**問題**：
1. `restoreContext()` 在 effect 中被調用
2. 它會設置 `contextTypeState` 和 `contextIdState`
3. 這會觸發 `LayoutBasicComponent` 的 effect
4. 如果 `StartupService` 的 `updateMenu` 同時執行，就會導致重複更新

### 原因 3：缺少防重複更新機制

```85:93:src/app/shared/services/menu/menu-management.service.ts
  updateMenu(contextType: ContextType, params?: ContextParams): void {
    const config = this.configState();
    if (!config) return;

    const baseMenu = this.getBaseMenu(contextType, config);
    const menu = this.processParams(baseMenu, params);

    this.menuService.add(menu);
  }
```

**問題**：
- `updateMenu()` 沒有檢查是否與當前菜單相同
- 每次調用都會執行 `menuService.add()`，即使菜單沒有變化
- 如果 `menuService.add()` 有副作用（例如觸發路由變化），就可能導致循環

### 原因 4：effect 執行時機不穩定

```248:258:src/app/layout/basic/basic.component.ts
    effect(() => {
      const contextType = this.workspaceContext.contextType();
      const contextId = this.workspaceContext.contextId();

      // 日誌記錄上下文變化
      console.log('[LayoutBasicComponent] Context changed:', { contextType, contextId });

      // 根據上下文類型同步菜單
      // Sync menu based on context type
      this.syncMenu(contextType, contextId);
    });
```

**問題**：
- effect 沒有條件檢查，每次 contextType 或 contextId 變化都會執行
- 即使值沒有實際變化（例如從 `null` 到 `null`），effect 也會執行
- 如果 `syncMenu()` 執行時某些狀態還不穩定，可能會導致重複觸發

### 原因 5：buildMenuParams() 中的信號讀取

```284:302:src/app/layout/basic/basic.component.ts
  private buildMenuParams(type: ContextType, id: string) {
    const currentUser = this.workspaceContext.currentUser();
    const baseParams = {
      userId: currentUser?.id
    };

    switch (type) {
      case ContextType.USER:
        return { ...baseParams, userId: id };
      case ContextType.ORGANIZATION:
        return { ...baseParams, organizationId: id };
      case ContextType.TEAM:
        return { ...baseParams, teamId: id };
      case ContextType.BOT:
        return { ...baseParams, botId: id };
      default:
        return baseParams;
    }
  }
```

**問題**：
- `buildMenuParams()` 讀取 `currentUser()`，這是一個 computed signal
- 如果 `currentUser` 的計算依賴於其他信號，而這些信號在 `menuService.add()` 執行時可能會變化
- 這可能會觸發其他 effect，導致 contextType 或 contextId 變化

## 無限循環的觸發場景

### 場景 A：應用啟動時的競爭條件

```
1. 應用啟動
   ↓
2. StartupService.load() 執行
   ↓
3. menuManagementService.loadConfig() 完成
   ↓
4. menuManagementService.updateMenu(ContextType.USER) 被調用
   ↓
5. 同時，WorkspaceContextService 的 effect 監聽到 loading 變為 false
   ↓
6. restoreContext() 被調用，設置 contextType 和 contextId
   ↓
7. LayoutBasicComponent 的 effect 被觸發
   ↓
8. syncMenu() 被調用，再次調用 updateMenu()
   ↓
9. 如果 menuService.add() 有副作用，可能會導致 contextType 或 contextId 再次變化
   ↓
10. 回到步驟 7，形成循環
```

### 場景 B：menuService.add() 觸發路由變化

```
1. updateMenu() 被調用
   ↓
2. menuService.add(menu) 被執行
   ↓
3. 如果 menuService.add() 會觸發路由變化（例如自動導航到第一個菜單項）
   ↓
4. 路由變化可能會觸發某些邏輯，導致 contextType 或 contextId 變化
   ↓
5. LayoutBasicComponent 的 effect 被觸發
   ↓
6. 回到步驟 1，形成循環
```

### 場景 C：buildMenuParams() 中的信號讀取觸發連鎖反應

```
1. LayoutBasicComponent 的 effect 被觸發
   ↓
2. syncMenu() 被調用
   ↓
3. buildMenuParams() 讀取 currentUser()
   ↓
4. 如果 currentUser 的計算依賴於其他信號，而這些信號在 menuService.add() 執行時可能會變化
   ↓
5. 這可能會觸發其他 effect，導致 contextType 或 contextId 變化
   ↓
6. 回到步驟 1，形成循環
```

## 解決方案

### 方案 1：移除 StartupService 中的 updateMenu 調用（推薦）

讓 `LayoutBasicComponent` 的 effect 統一處理菜單更新：

```typescript
// src/app/core/startup/startup.service.ts
// 移除這部分代碼：
this.menuManagementService
  .loadConfig()
  .then(() => {
    // 移除：this.menuManagementService.updateMenu(ContextType.USER);
    // LayoutBasicComponent 的 effect 會自動處理菜單更新
  })
```

**優點**：
- 統一菜單更新邏輯
- 避免重複更新
- 減少競爭條件

### 方案 2：添加防重複更新機制

在 `MenuManagementService.updateMenu()` 中添加狀態檢查：

```typescript
// src/app/shared/services/menu/menu-management.service.ts
private lastMenuContext?: { type: ContextType; params?: ContextParams };

updateMenu(contextType: ContextType, params?: ContextParams): void {
  // 檢查是否與上次相同
  const currentContext = { type: contextType, params };
  if (
    this.lastMenuContext?.type === contextType &&
    JSON.stringify(this.lastMenuContext?.params) === JSON.stringify(params)
  ) {
    console.log('[MenuManagementService] Menu unchanged, skipping update');
    return; // 跳過重複更新
  }

  const config = this.configState();
  if (!config) return;

  const baseMenu = this.getBaseMenu(contextType, config);
  const menu = this.processParams(baseMenu, params);

  this.menuService.add(menu);

  // 記錄本次更新
  this.lastMenuContext = currentContext;
}
```

**優點**：
- 避免重複更新相同的菜單
- 不影響現有邏輯
- 易於實施

### 方案 3：添加 effect 條件檢查

在 `LayoutBasicComponent` 的 effect 中添加條件檢查：

```typescript
// src/app/layout/basic/basic.component.ts
constructor() {
  let lastContextType: ContextType | null = null;
  let lastContextId: string | null = null;

  effect(() => {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();

    // 檢查是否真的變化
    if (contextType === lastContextType && contextId === lastContextId) {
      return; // 跳過重複執行
    }

    lastContextType = contextType;
    lastContextId = contextId;

    console.log('[LayoutBasicComponent] Context changed:', { contextType, contextId });
    this.syncMenu(contextType, contextId);
  });
}
```

**優點**：
- 避免 effect 重複執行
- 提高性能
- 減少不必要的菜單更新

### 方案 4：添加防抖機制

在 `MenuManagementService.updateMenu()` 中添加防抖邏輯：

```typescript
// src/app/shared/services/menu/menu-management.service.ts
private updateMenuDebounceTimer?: ReturnType<typeof setTimeout>;

updateMenu(contextType: ContextType, params?: ContextParams): void {
  // 清除之前的定時器
  if (this.updateMenuDebounceTimer) {
    clearTimeout(this.updateMenuDebounceTimer);
  }

  // 設置新的定時器
  this.updateMenuDebounceTimer = setTimeout(() => {
    const config = this.configState();
    if (!config) return;

    const baseMenu = this.getBaseMenu(contextType, config);
    const menu = this.processParams(baseMenu, params);

    this.menuService.add(menu);
  }, 100); // 100ms 防抖
}
```

**優點**：
- 避免短時間內重複調用
- 提高性能
- 減少不必要的更新

## 推薦實施順序

1. **立即實施**：方案 1 - 移除 `StartupService` 中的 `updateMenu` 調用
2. **增強保護**：方案 2 - 添加防重複更新機制
3. **優化性能**：方案 3 - 添加 effect 條件檢查
4. **長期優化**：方案 4 - 如果需要，添加防抖機制

## 測試建議

1. **監控調用次數**：
   - 在 `updateMenu()` 中添加計數器
   - 檢查是否在短時間內被多次調用

2. **檢查控制台日誌**：
   - 查看是否有重複的 `[LayoutBasicComponent] Context changed` 日誌
   - 查看是否有重複的 `[MenuManagementService]` 日誌

3. **使用 Chrome DevTools**：
   - Performance 工具檢查是否有無限循環
   - Memory 工具檢查是否有內存洩漏

4. **測試場景**：
   - 應用啟動時
   - 從 USER 切換到 ORGANIZATION
   - 從 ORGANIZATION 切換到 TEAM
   - 刷新頁面後恢復上下文
   - 登出後登入

## 相關文件

- `src/app/shared/services/menu/menu-management.service.ts`
- `src/app/shared/services/account/workspace-context.service.ts`
- `src/app/layout/basic/basic.component.ts`
- `src/app/core/startup/startup.service.ts`
- `src/app/layout/basic/widgets/context-switcher.component.ts`

## 總結

無限循環的根本原因是：
1. **雙重更新機制**：StartupService 和 LayoutBasicComponent 的 effect 都會更新菜單
2. **缺少防重複更新機制**：updateMenu() 沒有檢查是否與當前菜單相同
3. **effect 執行時機不穩定**：effect 在 contextType 和 contextId 還沒有穩定時就可能執行
4. **可能的副作用**：menuService.add() 可能會觸發路由變化或其他副作用

建議優先實施方案 1 和方案 2，這兩個方案可以解決大部分問題。

