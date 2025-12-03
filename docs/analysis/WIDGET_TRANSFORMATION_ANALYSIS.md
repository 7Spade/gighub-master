# Header Widget 改造分析報告

> 分析 `task.component.ts` 和 `notify.component.ts` 如何從 DEMO 元件改造成專案發展助力

**建立日期**: 2025-12-03  
**關聯文件**: [NEXT_DEVELOPMENT_GUIDE.md](../NEXT_DEVELOPMENT_GUIDE.md)

---

## 📋 執行摘要

根據 `NEXT_DEVELOPMENT_GUIDE.md` 的規劃，專案目前缺乏**通知中心基礎架構 (Notification Hub)** 這一骨架級別功能。現有的兩個 header widget 元件：

1. **`task.component.ts`** - 名為 "header-task"，但實際顯示的是靜態通知列表（硬編碼的 DEMO 資料）
2. **`notify.component.ts`** - 名為 "header-notify"，使用 ng-alain NoticeIcon 元件顯示模擬資料

這兩個元件目前都是**純 DEMO 展示**，沒有與後端資料庫整合。透過適當改造，它們可以成為：

- **通知中心 UI 元件**（整合 Supabase Realtime）
- **個人任務快速入口**（整合 TaskService）
- **事件總線的消費者**（監聽系統事件）

---

## 🔍 現況分析

### 1. task.component.ts

**檔案位置**: `src/app/layout/basic/widgets/task.component.ts`

#### 現況問題

| 問題 | 說明 | 影響 |
|------|------|------|
| 🔴 名稱誤導 | 元件名為 `header-task`，但顯示的是「通知」而非任務 | 語義混亂 |
| 🔴 硬編碼資料 | 5 個靜態用戶頭像和訊息 | 無法顯示真實資料 |
| 🔴 無後端整合 | 沒有使用任何 Service 或 Repository | 純展示用途 |
| 🔴 無響應式狀態 | 未使用 Angular Signals | 不符合專案標準 |
| 🟠 功能重疊 | 與 `notify.component.ts` 功能類似 | 資源浪費 |

#### 程式碼分析

```typescript
// 目前的問題程式碼
loading = true;

change(): void {
  setTimeout(() => {
    this.loading = false;  // 模擬載入，無實際資料
    this.cdr.detectChanges();
  }, 500);
}
```

**模板中的硬編碼資料**:
```html
<nz-avatar [nzSrc]="'./assets/tmp/img/1.png'" />
<strong>cipchk</strong>
<p class="mb0">Please tell me what happened...</p>
```

---

### 2. notify.component.ts

**檔案位置**: `src/app/layout/basic/widgets/notify.component.ts`

#### 現況問題

| 問題 | 說明 | 影響 |
|------|------|------|
| 🔴 模擬資料 | `loadData()` 使用 `setTimeout` 模擬 12 筆假資料 | 無法顯示真實通知 |
| 🔴 無後端整合 | 沒有使用 SupabaseService 或任何 Repository | 資料無法持久化 |
| 🔴 無 Realtime | 沒有 Supabase Realtime 整合 | 無法即時推送 |
| 🔴 無響應式狀態 | 未使用 Angular Signals | 不符合專案標準 |
| 🟠 分類設計合理 | 「通知、消息、待办」三分類 | 可保留並擴展 |

#### 程式碼分析

```typescript
// 目前的模擬資料
loadData(): void {
  this.loading = true;
  setTimeout(() => {
    this.data = this.updateNoticeData([
      // 12 筆硬編碼的假資料
      { id: '000000001', title: '你收到了 14 份新周报', ... },
      // ...
    ]);
    this.loading = false;
  }, 500);
}
```

**優點**: 使用 ng-alain 的 `NoticeIconModule`，三分類設計（通知、消息、待辦）符合業務需求。

---

## 🎯 改造方向建議

基於 `NEXT_DEVELOPMENT_GUIDE.md` 的骨架級別功能規劃，建議將這兩個元件改造為：

### 方案 A：合併為統一通知中心（推薦）

將 `task.component.ts` **移除或重命名**，將 `notify.component.ts` **改造為完整的通知中心元件**。

#### 理由

1. **避免功能重疊** - 兩個元件目前功能相似
2. **符合骨架級別規劃** - 通知中心是 ⭐⭐⭐⭐ 高優先級骨架功能
3. **資料表已就緒** - `notifications` 和 `notification_preferences` 表已設計完成

#### 改造後的 `notify.component.ts`

**新功能**:
- ✅ 整合 `NotificationService`（需新建）
- ✅ 使用 Angular Signals 管理狀態
- ✅ 整合 Supabase Realtime 即時推送
- ✅ 三分類：系統通知、任務相關、訊息提醒
- ✅ 未讀計數、標記已讀、清空功能
- ✅ 點擊導航到相關實體（任務、日誌等）

---

### 方案 B：分別改造為兩個獨立功能

將兩個元件改造為不同用途：

| 元件 | 改造方向 | 說明 |
|------|---------|------|
| `task.component.ts` | **我的任務快速入口** | 顯示指派給當前用戶的任務列表 |
| `notify.component.ts` | **通知中心** | 顯示系統通知、消息、待辦 |

#### 改造後的 `task.component.ts`（重命名為 `my-tasks.component.ts`）

**新功能**:
- ✅ 整合 `TaskService`
- ✅ 顯示當前用戶被指派的任務
- ✅ 按狀態分組（待處理、進行中、已完成）
- ✅ 快速更新任務狀態
- ✅ 點擊導航到任務詳情

#### 改造後的 `notify.component.ts`

**新功能**:
- ✅ 整合 `NotificationService`
- ✅ Supabase Realtime 即時通知
- ✅ 通知偏好設定入口

---

## 📐 詳細改造規格

### 1. 新建 NotificationRepository

**位置**: `src/app/core/infra/repositories/notification/`

```typescript
// notification.repository.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '@core/supabase';

export interface Notification {
  id: string;
  account_id: string;
  blueprint_id: string | null;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  notification_type: NotificationType;
  entity_type: EntityType | null;
  entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
}

export type NotificationType = 
  | 'info' | 'warning' | 'error' | 'success' 
  | 'mention' | 'assignment' | 'approval' | 'reminder' | 'system';

@Injectable({ providedIn: 'root' })
export class NotificationRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 取得當前用戶的通知列表
   */
  findByCurrentUser(options?: { limit?: number; unreadOnly?: boolean }): Observable<Notification[]> {
    let query = this.supabase.client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[NotificationRepository] findByCurrentUser error:', error);
          return [];
        }
        return (data || []) as Notification[];
      })
    );
  }

  /**
   * 標記通知為已讀
   */
  markAsRead(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
    ).pipe(
      map(({ error }) => !error)
    );
  }

  /**
   * 標記所有通知為已讀
   */
  markAllAsRead(): Observable<boolean> {
    return from(
      this.supabase.client
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
    ).pipe(
      map(({ error }) => !error)
    );
  }

  /**
   * 取得未讀通知數量
   */
  getUnreadCount(): Observable<number> {
    return from(
      this.supabase.client
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
    ).pipe(
      map(({ count, error }) => {
        if (error) return 0;
        return count || 0;
      })
    );
  }

  /**
   * 訂閱即時通知（Supabase Realtime）
   */
  subscribeToNotifications(accountId: string, callback: (notification: Notification) => void): () => void {
    const channel = this.supabase.client
      .channel(`notifications:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    // 返回取消訂閱函數
    return () => {
      this.supabase.client.removeChannel(channel);
    };
  }
}
```

---

### 2. 新建 NotificationService

**位置**: `src/app/shared/services/notification/`

```typescript
// notification.service.ts
import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { NotificationRepository, Notification, NotificationType } from '@core';
import { firstValueFrom } from 'rxjs';

// 通知分類（對應 ng-alain NoticeIcon 的三個 Tab）
export interface NotificationCategory {
  key: string;
  title: string;
  list: Notification[];
  emptyText: string;
  emptyImage: string;
  clearText: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly repo = inject(NotificationRepository);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  private notificationsState = signal<Notification[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private unsubscribeFn: (() => void) | null = null;

  // Readonly signals
  readonly notifications = this.notificationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals
  readonly unreadCount = computed(() => 
    this.notificationsState().filter(n => !n.is_read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  // 分類後的通知（系統、任務、訊息）
  readonly categorizedNotifications = computed<NotificationCategory[]>(() => {
    const all = this.notificationsState();
    
    return [
      {
        key: 'system',
        title: '系統通知',
        list: all.filter(n => ['system', 'info', 'warning', 'error', 'success'].includes(n.notification_type)),
        emptyText: '暫無系統通知',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg',
        clearText: '清空系統通知'
      },
      {
        key: 'task',
        title: '任務相關',
        list: all.filter(n => ['assignment', 'approval', 'reminder'].includes(n.notification_type)),
        emptyText: '暫無任務通知',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg',
        clearText: '清空任務通知'
      },
      {
        key: 'message',
        title: '訊息提醒',
        list: all.filter(n => ['mention'].includes(n.notification_type)),
        emptyText: '暫無新訊息',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg',
        clearText: '清空訊息'
      }
    ];
  });

  constructor() {
    // 組件銷毀時取消訂閱
    this.destroyRef.onDestroy(() => {
      this.unsubscribeFromRealtime();
    });
  }

  /**
   * 載入通知列表
   */
  async loadNotifications(limit: number = 50): Promise<Notification[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const notifications = await firstValueFrom(
        this.repo.findByCurrentUser({ limit })
      );
      this.notificationsState.set(notifications);
      return notifications;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入通知失敗';
      this.errorState.set(message);
      throw err;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 標記單一通知為已讀
   */
  async markAsRead(id: string): Promise<void> {
    const success = await firstValueFrom(this.repo.markAsRead(id));
    if (success) {
      this.notificationsState.update(list =>
        list.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  }

  /**
   * 標記所有通知為已讀
   */
  async markAllAsRead(): Promise<void> {
    const success = await firstValueFrom(this.repo.markAllAsRead());
    if (success) {
      this.notificationsState.update(list =>
        list.map(n => ({ ...n, is_read: true }))
      );
    }
  }

  /**
   * 清空特定類型的通知
   */
  async clearByCategory(category: string): Promise<void> {
    // 根據類型標記為已讀（或軟刪除）
    const typeMap: Record<string, NotificationType[]> = {
      system: ['system', 'info', 'warning', 'error', 'success'],
      task: ['assignment', 'approval', 'reminder'],
      message: ['mention']
    };

    const types = typeMap[category] || [];
    const toClear = this.notificationsState()
      .filter(n => types.includes(n.notification_type as NotificationType))
      .map(n => n.id);

    for (const id of toClear) {
      await this.markAsRead(id);
    }
  }

  /**
   * 訂閱即時通知
   */
  subscribeToRealtime(accountId: string): void {
    this.unsubscribeFromRealtime();
    
    this.unsubscribeFn = this.repo.subscribeToNotifications(
      accountId,
      (newNotification) => {
        // 新通知加到列表最前面
        this.notificationsState.update(list => [newNotification, ...list]);
      }
    );
  }

  /**
   * 取消訂閱
   */
  unsubscribeFromRealtime(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }
}
```

---

### 3. 改造後的 notify.component.ts

```typescript
// src/app/layout/basic/widgets/notify.component.ts
import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NoticeIconList, NoticeIconModule, NoticeIconSelect, NoticeItem } from '@delon/abc/notice-icon';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { NzMessageService } from 'ng-zorro-antd/message';

import { NotificationService } from '@shared/services/notification';
import { SupabaseService } from '@core/supabase';
import { Notification } from '@core';

@Component({
  selector: 'header-notify',
  template: `
    <notice-icon
      [data]="noticeData()"
      [count]="notificationService.unreadCount()"
      [loading]="notificationService.loading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="onSelect($event)"
      (clear)="onClear($event)"
      (popoverVisibleChange)="onPopoverVisibleChange($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotifyComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly msg = inject(NzMessageService);
  private readonly router = inject(Router);

  // Computed signal for notice-icon data format
  noticeData = computed<NoticeItem[]>(() => {
    const categories = this.notificationService.categorizedNotifications();
    
    return categories.map(cat => ({
      title: cat.title,
      list: cat.list.map(n => this.mapNotificationToNoticeItem(n)),
      emptyText: cat.emptyText,
      emptyImage: cat.emptyImage,
      clearText: cat.clearText
    }));
  });

  ngOnInit(): void {
    this.loadNotifications();
    this.subscribeToUserNotifications();
  }

  /**
   * 載入通知列表
   */
  private async loadNotifications(): Promise<void> {
    try {
      await this.notificationService.loadNotifications();
    } catch (err) {
      this.msg.error('載入通知失敗');
    }
  }

  /**
   * 訂閱即時通知
   */
  private async subscribeToUserNotifications(): Promise<void> {
    const accountId = await this.getCurrentAccountId();
    if (accountId) {
      this.notificationService.subscribeToRealtime(accountId);
    }
  }

  /**
   * 取得當前用戶的 account_id
   */
  private async getCurrentAccountId(): Promise<string | null> {
    // TODO: 從 AccountService 或 SupabaseService 取得
    return null;
  }

  /**
   * 將 Notification 轉換為 NoticeIconList 格式
   */
  private mapNotificationToNoticeItem(notification: Notification): NoticeIconList {
    return {
      id: notification.id,
      title: notification.title,
      description: notification.content || '',
      datetime: formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: zhTW
      }),
      read: notification.is_read,
      extra: this.getExtraLabel(notification.notification_type),
      status: this.getStatus(notification.notification_type),
      avatar: this.getAvatar(notification.notification_type)
    };
  }

  /**
   * 取得額外標籤
   */
  private getExtraLabel(type: string): string | undefined {
    const labels: Record<string, string> = {
      assignment: '待處理',
      approval: '待審核',
      reminder: '提醒',
      warning: '警告',
      error: '錯誤'
    };
    return labels[type];
  }

  /**
   * 取得狀態（用於顏色）
   */
  private getStatus(type: string): string {
    const statusMap: Record<string, string> = {
      assignment: 'processing',
      approval: 'urgent',
      reminder: 'doing',
      warning: 'urgent',
      error: 'urgent',
      success: 'todo'
    };
    return statusMap[type] || 'todo';
  }

  /**
   * 取得頭像圖標
   */
  private getAvatar(type: string): string {
    const avatars: Record<string, string> = {
      assignment: 'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
      approval: 'https://gw.alipayobjects.com/zos/rmsportal/OKJXDXrmkNshAMvwtvhu.png',
      reminder: 'https://gw.alipayobjects.com/zos/rmsportal/kISTdvpyTAhtGxpovNWd.png',
      system: 'https://gw.alipayobjects.com/zos/rmsportal/GvqBnKhFgObvnSGkDsje.png'
    };
    return avatars[type] || avatars.system;
  }

  /**
   * Popover 顯示時載入資料
   */
  onPopoverVisibleChange(visible: boolean): void {
    if (visible) {
      this.loadNotifications();
    }
  }

  /**
   * 點擊通知項目
   */
  async onSelect(event: NoticeIconSelect): Promise<void> {
    const notification = this.notificationService.notifications()
      .find(n => n.id === event.item['id']);

    if (notification) {
      // 標記為已讀
      await this.notificationService.markAsRead(notification.id);

      // 導航到相關頁面
      if (notification.action_url) {
        this.router.navigateByUrl(notification.action_url);
      } else if (notification.entity_type && notification.entity_id) {
        const url = this.buildEntityUrl(notification.entity_type, notification.entity_id, notification.blueprint_id);
        if (url) {
          this.router.navigateByUrl(url);
        }
      }
    }
  }

  /**
   * 根據實體類型構建 URL
   */
  private buildEntityUrl(entityType: string, entityId: string, blueprintId: string | null): string | null {
    if (!blueprintId) return null;

    const urlMap: Record<string, string> = {
      task: `/blueprint/${blueprintId}/tasks?taskId=${entityId}`,
      diary: `/blueprint/${blueprintId}/diary/${entityId}`,
      issue: `/blueprint/${blueprintId}/issues/${entityId}`
    };

    return urlMap[entityType] || null;
  }

  /**
   * 清空特定類型通知
   */
  async onClear(title: string): Promise<void> {
    const categoryMap: Record<string, string> = {
      '系統通知': 'system',
      '任務相關': 'task',
      '訊息提醒': 'message'
    };

    const category = categoryMap[title];
    if (category) {
      await this.notificationService.clearByCategory(category);
      this.msg.success(`已清空 ${title}`);
    }
  }
}
```

---

### 4. 改造後的 task.component.ts（重命名為 my-tasks.component.ts）

如果採用**方案 B**，將此元件改造為「我的任務快速入口」：

```typescript
// src/app/layout/basic/widgets/my-tasks.component.ts
import { ChangeDetectionStrategy, Component, inject, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { TaskRepository, Task, TaskStatus, TASK_STATUS_CONFIG } from '@core';
import { SupabaseService } from '@core/supabase';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'header-my-tasks',
  template: `
    <div
      class="alain-default__nav-item"
      nz-dropdown
      [nzDropdownMenu]="taskMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
      (nzVisibleChange)="onVisibleChange($event)"
    >
      <nz-badge [nzCount]="pendingCount()">
        <i nz-icon nzType="carry-out" class="alain-default__nav-item-icon"></i>
      </nz-badge>
    </div>
    <nz-dropdown-menu #taskMenu="nzDropdownMenu">
      <div nz-menu class="wd-lg">
        @if (loading()) {
          <div class="mx-lg p-lg text-center"><nz-spin /></div>
        } @else if (myTasks().length === 0) {
          <nz-empty 
            nzNotFoundContent="暫無待處理任務" 
            [nzNotFoundImage]="'simple'"
            class="p-lg"
          />
        } @else {
          <nz-card 
            nzTitle="我的任務" 
            [nzExtra]="extraTpl"
            nzBordered="false" 
            class="ant-card__body-nopadding"
          >
            @for (task of myTasks().slice(0, 5); track task.id) {
              <div 
                nz-row 
                [nzJustify]="'space-between'" 
                [nzAlign]="'middle'" 
                class="py-sm px-md point bg-grey-lighter-h"
                (click)="navigateToTask(task)"
              >
                <div nz-col [nzSpan]="16">
                  <strong class="text-truncate d-block" style="max-width: 200px;">
                    {{ task.title }}
                  </strong>
                  <small class="text-grey">
                    {{ task.blueprint_id | slice:0:8 }}...
                  </small>
                </div>
                <div nz-col [nzSpan]="8" class="text-right">
                  <nz-tag [nzColor]="getStatusColor(task.status)">
                    {{ getStatusLabel(task.status) }}
                  </nz-tag>
                </div>
              </div>
            }
            @if (myTasks().length > 5) {
              <div 
                nz-row 
                class="pt-md border-top-1 text-center text-grey point"
                (click)="viewAllTasks()"
              >
                查看全部 ({{ myTasks().length }})
              </div>
            }
          </nz-card>
        }
      </div>
    </nz-dropdown-menu>
    
    <ng-template #extraTpl>
      <a (click)="refresh()">
        <i nz-icon nzType="reload"></i>
      </a>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzDropDownModule, 
    NzBadgeModule, 
    NzIconModule, 
    NzSpinModule, 
    NzGridModule, 
    NzCardModule,
    NzTagModule,
    NzEmptyModule
  ]
})
export class HeaderMyTasksComponent implements OnInit {
  private readonly taskRepo = inject(TaskRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // State signals
  private tasksState = signal<Task[]>([]);
  private loadingState = signal<boolean>(false);

  // Readonly signals
  readonly myTasks = this.tasksState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  // Computed signals
  readonly pendingCount = computed(() => 
    this.tasksState().filter(t => 
      t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
    ).length
  );

  ngOnInit(): void {
    this.loadMyTasks();
  }

  /**
   * 載入指派給當前用戶的任務
   */
  async loadMyTasks(): Promise<void> {
    const user = this.supabaseService.currentUser;
    if (!user) return;

    this.loadingState.set(true);

    try {
      const tasks = await firstValueFrom(
        this.taskRepo.findByAssignee(user.id)
      );
      
      // 過濾出未完成的任務
      const activeTasks = tasks.filter(t => 
        t.status !== TaskStatus.COMPLETED && 
        t.status !== TaskStatus.CANCELLED
      );
      
      this.tasksState.set(activeTasks);
    } catch (err) {
      console.error('[HeaderMyTasksComponent] loadMyTasks error:', err);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Dropdown 顯示時載入資料
   */
  onVisibleChange(visible: boolean): void {
    if (visible) {
      this.loadMyTasks();
    }
  }

  /**
   * 刷新任務列表
   */
  refresh(): void {
    this.loadMyTasks();
  }

  /**
   * 導航到任務詳情
   */
  navigateToTask(task: Task): void {
    this.router.navigate(['/blueprint', task.blueprint_id, 'tasks'], {
      queryParams: { taskId: task.id }
    });
  }

  /**
   * 查看全部任務
   */
  viewAllTasks(): void {
    this.router.navigate(['/my-tasks']);
  }

  /**
   * 取得狀態顏色
   */
  getStatusColor(status: TaskStatus): string {
    return TASK_STATUS_CONFIG[status]?.color || 'default';
  }

  /**
   * 取得狀態標籤
   */
  getStatusLabel(status: TaskStatus): string {
    return TASK_STATUS_CONFIG[status]?.label || status;
  }
}
```

---

## 📊 與骨架級別功能的關聯

### 改造後元件如何支援骨架級別功能

| 骨架級別功能 | 關聯元件 | 整合方式 |
|-------------|---------|---------|
| **事件總線系統** | `notify.component.ts` | 監聽系統事件並顯示通知 |
| **通知中心基礎架構** | `notify.component.ts` | 作為通知中心的 UI 入口 |
| **操作審計日誌** | `notify.component.ts` | 顯示審計相關通知 |
| **權限控制** | 兩個元件 | 根據權限顯示/隱藏功能 |

### 資料流設計

```
┌──────────────────────────────────────────────────────────────────┐
│                        事件總線 (Event Bus)                        │
│                                                                   │
│  任務模組 ──┬──→ TaskAssignedEvent ──→ NotificationService       │
│             │                              │                      │
│  日誌模組 ──┼──→ DiaryApprovedEvent ──────┤                      │
│             │                              │                      │
│  問題模組 ──┘──→ IssueCreatedEvent ───────┴──→ Supabase         │
│                                                   │               │
│                                              Realtime             │
│                                                   │               │
│                           HeaderNotifyComponent ←─┘               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 實作路線圖

### Phase 1: 基礎設施（Week 1）✅ 已完成

1. [x] 建立 `NotificationRepository`
2. [x] 建立 `NotificationService`
3. [x] 更新 `core/index.ts` 和 `shared/index.ts`
4. [ ] 測試 Repository 和 Service

### Phase 2: UI 改造（Week 1-2）✅ 已完成

1. [x] 改造 `notify.component.ts` - 整合 NotificationService + Supabase Realtime
2. [x] 改造 `task.component.ts` - 改為「我的任務快速入口」
3. [x] 整合 Supabase Realtime
4. [ ] 測試 UI 功能

### Phase 3: 事件整合（Week 2-3）✅ 已完成

1. [x] 建立事件總線系統
   - `src/app/core/infra/types/event/event.types.ts` - 事件類型定義
   - `src/app/core/infra/types/event/event.factory.ts` - 事件工廠函數
   - `src/app/shared/services/event-bus/event-bus.service.ts` - 事件總線服務
2. [x] 整合 NotificationService 訂閱事件
3. [ ] 整合 TaskService 發布事件（待完成）
4. [ ] 整合日誌模組事件（日誌模組完成後）
5. [ ] 測試事件流

### 實作記錄

**2025-12-03 (Phase 3)**: 事件總線系統建立
- 建立 `src/app/core/infra/types/event/event.types.ts` - 事件類型、Payload 定義
- 建立 `src/app/core/infra/types/event/event.factory.ts` - 事件建立工廠函數
- 建立 `src/app/shared/services/event-bus/event-bus.service.ts` - 事件總線核心服務
- 更新 `NotificationService` - 訂閱事件總線處理任務指派、完成、成員加入事件
- 建立技術文件 `docs/reference/event-bus-system.md` - 基於 Context7 查詢的技術參考

**2025-12-03 (Phase 1 & 2)**: 通知中心基礎設施
- 建立 `src/app/core/infra/types/notification/notification.types.ts` - 通知類型定義
- 建立 `src/app/core/infra/repositories/notification/notification.repository.ts` - 通知資料存取層（含 Supabase Realtime 訂閱）
- 建立 `src/app/shared/services/notification/notification.service.ts` - 通知服務層（使用 Angular Signals）
- 改造 `notify.component.ts` - 從硬編碼 DEMO 改為真實資料整合
- 改造 `task.component.ts` - 從通知展示改為「我的任務快速入口」

---

## 📝 建議

### 推薦方案

**採用方案 A**：將 `task.component.ts` 移除或重命名，將 `notify.component.ts` 改造為完整的通知中心元件。

### 理由

1. **符合骨架級別規劃** - 通知中心是高優先級基礎設施
2. **避免功能重疊** - 兩個 DEMO 元件功能類似
3. **資料表已就緒** - `notifications` 表設計完善
4. **可擴展性強** - 未來可整合更多通知渠道（Email、Push）

### 後續擴展

1. **Email 通知** - 整合郵件服務
2. **Push 通知** - 整合 Web Push API
3. **通知偏好設定** - 使用 `notification_preferences` 表
4. **批量操作** - 批量已讀、批量刪除

---

## 📚 相關檔案

- `src/app/layout/basic/widgets/task.component.ts` - 待改造元件
- `src/app/layout/basic/widgets/notify.component.ts` - 待改造元件
- `supabase/seeds/seed.sql` - 資料庫結構（notifications 表）
- `docs/NEXT_DEVELOPMENT_GUIDE.md` - 專案發展指南

---

**分析者**: GitHub Copilot  
**日期**: 2025-12-03
