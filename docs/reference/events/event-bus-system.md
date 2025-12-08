# 事件總線系統 (Event Bus System) 技術文件

> 基於 Context7 MCP 查詢的最新技術文檔，為 GigHub 專案設計的事件總線系統實施指南。

**更新日期**: 2025-12-03  
**技術棧**: Angular 20 + RxJS 7.8 + Supabase Realtime

---

## 📋 目錄

1. [概述](#概述)
2. [技術背景](#技術背景)
3. [架構設計](#架構設計)
4. [事件類型定義](#事件類型定義)
5. [實作規格](#實作規格)
6. [與通知系統整合](#與通知系統整合)
7. [測試策略](#測試策略)

---

## 概述

### 什麼是事件總線？

事件總線是一個跨模組通訊的基礎架構，允許系統各部分通過發布/訂閱模式進行鬆耦合的溝通。

### 為什麼需要事件總線？

根據 `NEXT_DEVELOPMENT_GUIDE.md` 的分析：

- **模組間解耦** - 任務、日誌、問題等模組可獨立開發
- **通知系統依賴** - 通知中心需要監聽所有業務事件
- **審計日誌依賴** - 審計系統需要記錄所有重要操作
- **搜尋索引依賴** - 搜尋引擎需要即時更新索引

### 依賴關係圖

```
事件總線 (Event Bus)
  ├─→ 通知中心 (Notification Hub) ✅ 已完成 Phase 1 & 2
  │     └─ NotificationService.handleSystemEvent()
  ├─→ 審計日誌 (Audit Log) 🔴 待建立
  ├─→ 搜尋索引 (Search Engine) 🔴 待建立
  └─→ 業務模組
        ├─ 任務模組 (Task Module) ✅
        ├─ 日誌模組 (Diary Module) 🔴 待建立
        └─ 問題模組 (Issue Module) 🔴 待建立
```

---

## 技術背景

### RxJS Subject 模式 (Context7 查詢結果)

根據 RxJS 官方文檔，Subject 是實現事件總線的最佳選擇：

```typescript
import { Subject } from 'rxjs';

// Subject 是 Observable 和 Observer 的結合
const subject = new Subject<number>();

// 多個訂閱者
subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

// 發布事件
subject.next(1);
subject.next(2);
```

### Subject 類型選擇

| 類型 | 用途 | 適用場景 |
|------|------|---------|
| `Subject` | 基礎多播 | 即時事件，不需要歷史 |
| `BehaviorSubject` | 保持最後值 | 狀態廣播 |
| `ReplaySubject` | 重播歷史 | 需要事件重播 |
| `AsyncSubject` | 只發最後值 | 完成時通知 |

**GigHub 選擇**: 使用 `Subject` 配合 `ReplaySubject` 實現事件重播功能。

### Supabase Realtime Broadcast (Context7 查詢結果)

Supabase Realtime 支援跨客戶端的事件廣播：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('your_url', 'your_key');

// 訂閱頻道
const myChannel = supabase.channel('events-channel');

// 監聽廣播事件
myChannel
  .on('broadcast', { event: 'task-assigned' }, (payload) => {
    console.log('Received:', payload);
  })
  .subscribe();

// 發送廣播
myChannel.send({
  type: 'broadcast',
  event: 'task-assigned',
  payload: { taskId: '123', assigneeId: '456' }
});
```

### Angular Signals 整合 (Context7 查詢結果)

Angular 20 的 Signals 可用於管理事件狀態：

```typescript
import { signal, computed, effect } from '@angular/core';

// 事件計數器
const eventCount = signal(0);

// 計算屬性
const hasEvents = computed(() => eventCount() > 0);

// 副作用
effect(() => {
  console.log(`Event count: ${eventCount()}`);
});
```

---

## 架構設計

### 整體架構

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Bus System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐   │
│  │  Publishers │    │  EventBusService│    │   Subscribers   │   │
│  │             │───▶│                 │───▶│                 │   │
│  │ TaskService │    │ - RxJS Subject  │    │ NotificationSvc │   │
│  │ DiaryService│    │ - Event Queue   │    │ AuditLogService │   │
│  │ IssueService│    │ - Filter/Route  │    │ SearchService   │   │
│  └─────────────┘    └────────┬────────┘    └─────────────────┘   │
│                              │                                     │
│                    ┌─────────▼─────────┐                          │
│                    │ Supabase Realtime │                          │
│                    │  (跨客戶端同步)    │                          │
│                    └───────────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 事件流程

1. **發布者** (Publisher) 發送事件到 EventBusService
2. **EventBusService** 處理事件：
   - 本地廣播給 RxJS 訂閱者
   - 通過 Supabase Realtime 廣播給其他客戶端
3. **訂閱者** (Subscriber) 接收並處理事件

### 目錄結構

```
src/app/
├── core/infra/types/event/
│   ├── event.types.ts          # 事件類型定義
│   ├── event-category.ts       # 事件分類
│   └── index.ts
├── shared/services/event-bus/
│   ├── event-bus.service.ts    # 事件總線核心服務
│   ├── event-filter.ts         # 事件過濾器
│   └── index.ts
└── shared/services/index.ts    # 導出
```

---

## 事件類型定義

### 基礎事件介面

```typescript
// src/app/core/infra/types/event/event.types.ts

/**
 * 事件類別
 */
export type EventCategory = 
  | 'system'    // 系統事件（認證、權限）
  | 'task'      // 任務事件
  | 'diary'     // 日誌事件
  | 'issue'     // 問題事件
  | 'financial' // 財務事件
  | 'file'      // 檔案事件
  | 'member';   // 成員事件

/**
 * 事件動作類型
 */
export type EventAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'assigned'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'commented';

/**
 * 基礎事件介面
 */
export interface BaseEvent<T = unknown> {
  /** 事件唯一 ID */
  id: string;
  /** 事件類別 */
  category: EventCategory;
  /** 事件動作 */
  action: EventAction;
  /** 事件類型 (category.action 格式) */
  type: string;
  /** 事件資料 */
  payload: T;
  /** 相關資源 */
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  /** 觸發者 */
  actor: {
    id: string;
    name: string;
    type: 'user' | 'system' | 'bot';
  };
  /** 藍圖 ID (資料隔離) */
  blueprintId?: string;
  /** 時間戳 */
  timestamp: string;
  /** 元數據 */
  metadata?: Record<string, unknown>;
}

/**
 * 事件類型配置
 */
export const EVENT_TYPE_CONFIG: Record<EventCategory, {
  label: string;
  color: string;
  icon: string;
}> = {
  system: { label: '系統', color: 'blue', icon: 'setting' },
  task: { label: '任務', color: 'orange', icon: 'carry-out' },
  diary: { label: '日誌', color: 'green', icon: 'file-text' },
  issue: { label: '問題', color: 'red', icon: 'warning' },
  financial: { label: '財務', color: 'gold', icon: 'dollar' },
  file: { label: '檔案', color: 'cyan', icon: 'file' },
  member: { label: '成員', color: 'purple', icon: 'team' }
};
```

### 任務事件定義

```typescript
// src/app/core/infra/types/event/task-events.ts

import { BaseEvent } from './event.types';
import { Task, TaskStatus, TaskPriority } from '../task';

/**
 * 任務建立事件 Payload
 */
export interface TaskCreatedPayload {
  task: Task;
}

/**
 * 任務更新事件 Payload
 */
export interface TaskUpdatedPayload {
  task: Task;
  changes: {
    field: keyof Task;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

/**
 * 任務指派事件 Payload
 */
export interface TaskAssignedPayload {
  task: Task;
  previousAssignee?: {
    id: string;
    name: string;
  };
  newAssignee: {
    id: string;
    name: string;
  };
}

/**
 * 任務狀態變更事件 Payload
 */
export interface TaskStatusChangedPayload {
  task: Task;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

/**
 * 任務完成事件 Payload
 */
export interface TaskCompletedPayload {
  task: Task;
  completedAt: string;
  completedBy: {
    id: string;
    name: string;
  };
}

// 類型別名
export type TaskCreatedEvent = BaseEvent<TaskCreatedPayload>;
export type TaskUpdatedEvent = BaseEvent<TaskUpdatedPayload>;
export type TaskAssignedEvent = BaseEvent<TaskAssignedPayload>;
export type TaskStatusChangedEvent = BaseEvent<TaskStatusChangedPayload>;
export type TaskCompletedEvent = BaseEvent<TaskCompletedPayload>;
```

### 系統事件定義

```typescript
// src/app/core/infra/types/event/system-events.ts

import { BaseEvent } from './event.types';

/**
 * 使用者登入事件 Payload
 */
export interface UserLoginPayload {
  userId: string;
  userName: string;
  loginAt: string;
  ip?: string;
  userAgent?: string;
}

/**
 * 權限變更事件 Payload
 */
export interface PermissionChangedPayload {
  userId: string;
  blueprintId: string;
  previousRole?: string;
  newRole: string;
  changedBy: {
    id: string;
    name: string;
  };
}

/**
 * 成員加入事件 Payload
 */
export interface MemberJoinedPayload {
  userId: string;
  userName: string;
  blueprintId: string;
  blueprintName: string;
  role: string;
  invitedBy?: {
    id: string;
    name: string;
  };
}

// 類型別名
export type UserLoginEvent = BaseEvent<UserLoginPayload>;
export type PermissionChangedEvent = BaseEvent<PermissionChangedPayload>;
export type MemberJoinedEvent = BaseEvent<MemberJoinedPayload>;
```

---

## 實作規格

### EventBusService 核心服務

```typescript
// src/app/shared/services/event-bus/event-bus.service.ts

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subject, Observable, filter, takeUntil } from 'rxjs';
import { SupabaseService } from '@core/supabase';
import { BaseEvent, EventCategory } from '@core';

/**
 * 事件過濾選項
 */
export interface EventFilterOptions {
  /** 按類別過濾 */
  category?: EventCategory | EventCategory[];
  /** 按動作過濾 */
  action?: string | string[];
  /** 按藍圖過濾 */
  blueprintId?: string;
  /** 按資源類型過濾 */
  resourceType?: string;
  /** 按觸發者過濾 */
  actorId?: string;
}

/**
 * 事件總線服務
 * 
 * 提供跨模組事件發布/訂閱機制，整合 Supabase Realtime 實現跨客戶端同步。
 * 
 * @example
 * ```typescript
 * // 發布事件
 * eventBus.publish({
 *   category: 'task',
 *   action: 'assigned',
 *   type: 'task.assigned',
 *   payload: { task, newAssignee },
 *   resource: { type: 'task', id: task.id },
 *   actor: { id: userId, name: userName, type: 'user' },
 *   blueprintId: task.blueprint_id,
 *   timestamp: new Date().toISOString()
 * });
 * 
 * // 訂閱事件
 * eventBus.on({ category: 'task' }).subscribe(event => {
 *   console.log('Task event:', event);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventBusService implements OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  
  /** 本地事件流 */
  private readonly eventSubject = new Subject<BaseEvent>();
  
  /** 銷毀信號 */
  private readonly destroy$ = new Subject<void>();
  
  /** Supabase Realtime 頻道 */
  private realtimeChannel: ReturnType<typeof this.supabaseService.client.channel> | null = null;
  
  /** 當前藍圖 ID (用於過濾) */
  private currentBlueprintId: string | null = null;
  
  // ============================================================
  // State Signals
  // ============================================================
  
  /** 事件計數 */
  private readonly eventCountState = signal(0);
  
  /** 最近事件列表 (保留最後 50 個) */
  private readonly recentEventsState = signal<BaseEvent[]>([]);
  
  /** 是否已連接 Realtime */
  private readonly isConnectedState = signal(false);
  
  // ============================================================
  // Public Readonly Signals
  // ============================================================
  
  /** 事件計數 */
  readonly eventCount = this.eventCountState.asReadonly();
  
  /** 最近事件 */
  readonly recentEvents = this.recentEventsState.asReadonly();
  
  /** 是否已連接 */
  readonly isConnected = this.isConnectedState.asReadonly();
  
  /** 有未處理事件 */
  readonly hasRecentEvents = computed(() => this.recentEventsState().length > 0);
  
  // ============================================================
  // Public Methods
  // ============================================================
  
  /**
   * 初始化事件總線
   * @param blueprintId 藍圖 ID (可選，用於資料隔離)
   */
  initialize(blueprintId?: string): void {
    this.currentBlueprintId = blueprintId || null;
    this.subscribeToRealtime();
    console.log('[EventBusService] Initialized', { blueprintId });
  }
  
  /**
   * 發布事件
   * @param event 事件資料
   */
  publish<T>(event: Omit<BaseEvent<T>, 'id' | 'timestamp'>): void {
    const fullEvent: BaseEvent<T> = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    } as BaseEvent<T>;
    
    // 本地廣播
    this.eventSubject.next(fullEvent);
    
    // 更新狀態
    this.eventCountState.update(count => count + 1);
    this.recentEventsState.update(events => 
      [fullEvent, ...events].slice(0, 50)
    );
    
    // Supabase Realtime 廣播 (跨客戶端)
    this.broadcastToRealtime(fullEvent);
    
    console.log('[EventBusService] Event published:', fullEvent.type, fullEvent);
  }
  
  /**
   * 訂閱事件
   * @param options 過濾選項
   * @returns 事件 Observable
   */
  on<T = unknown>(options?: EventFilterOptions): Observable<BaseEvent<T>> {
    return this.eventSubject.pipe(
      filter(event => this.matchesFilter(event, options)),
      takeUntil(this.destroy$)
    ) as Observable<BaseEvent<T>>;
  }
  
  /**
   * 訂閱特定類型事件
   * @param type 事件類型 (e.g., 'task.assigned')
   * @returns 事件 Observable
   */
  onType<T = unknown>(type: string): Observable<BaseEvent<T>> {
    return this.eventSubject.pipe(
      filter(event => event.type === type),
      takeUntil(this.destroy$)
    ) as Observable<BaseEvent<T>>;
  }
  
  /**
   * 訂閱特定類別事件
   * @param category 事件類別
   * @returns 事件 Observable
   */
  onCategory<T = unknown>(category: EventCategory): Observable<BaseEvent<T>> {
    return this.on<T>({ category });
  }
  
  /**
   * 清除最近事件
   */
  clearRecentEvents(): void {
    this.recentEventsState.set([]);
  }
  
  /**
   * 銷毀服務
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribeFromRealtime();
    console.log('[EventBusService] Destroyed');
  }
  
  // ============================================================
  // Private Methods
  // ============================================================
  
  /**
   * 檢查事件是否符合過濾條件
   */
  private matchesFilter(event: BaseEvent, options?: EventFilterOptions): boolean {
    if (!options) return true;
    
    // 類別過濾
    if (options.category) {
      const categories = Array.isArray(options.category) 
        ? options.category 
        : [options.category];
      if (!categories.includes(event.category)) return false;
    }
    
    // 動作過濾
    if (options.action) {
      const actions = Array.isArray(options.action) 
        ? options.action 
        : [options.action];
      if (!actions.includes(event.action)) return false;
    }
    
    // 藍圖過濾
    if (options.blueprintId && event.blueprintId !== options.blueprintId) {
      return false;
    }
    
    // 資源類型過濾
    if (options.resourceType && event.resource.type !== options.resourceType) {
      return false;
    }
    
    // 觸發者過濾
    if (options.actorId && event.actor.id !== options.actorId) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 訂閱 Supabase Realtime
   */
  private subscribeToRealtime(): void {
    this.unsubscribeFromRealtime();
    
    const channelName = this.currentBlueprintId 
      ? `events:${this.currentBlueprintId}`
      : 'events:global';
    
    this.realtimeChannel = this.supabaseService.client
      .channel(channelName, {
        config: { private: !!this.currentBlueprintId }
      })
      .on('broadcast', { event: '*' }, (payload) => {
        // 接收來自其他客戶端的事件
        if (payload.payload) {
          const event = payload.payload as BaseEvent;
          this.eventSubject.next(event);
          this.recentEventsState.update(events => 
            [event, ...events].slice(0, 50)
          );
        }
      })
      .subscribe((status) => {
        this.isConnectedState.set(status === 'SUBSCRIBED');
        console.log('[EventBusService] Realtime status:', status);
      });
  }
  
  /**
   * 取消訂閱 Supabase Realtime
   */
  private unsubscribeFromRealtime(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      this.isConnectedState.set(false);
    }
  }
  
  /**
   * 廣播事件到 Supabase Realtime
   */
  private broadcastToRealtime(event: BaseEvent): void {
    if (!this.realtimeChannel) return;
    
    this.realtimeChannel.send({
      type: 'broadcast',
      event: event.type,
      payload: event
    }).catch(err => {
      console.error('[EventBusService] Broadcast error:', err);
    });
  }
}
```

### 事件工廠函數

```typescript
// src/app/shared/services/event-bus/event-factory.ts

import { BaseEvent, EventCategory, EventAction } from '@core';

/**
 * 建立事件物件
 */
export function createEvent<T>(params: {
  category: EventCategory;
  action: EventAction;
  payload: T;
  resource: { type: string; id: string; name?: string };
  actor: { id: string; name: string; type?: 'user' | 'system' | 'bot' };
  blueprintId?: string;
  metadata?: Record<string, unknown>;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return {
    category: params.category,
    action: params.action,
    type: `${params.category}.${params.action}`,
    payload: params.payload,
    resource: params.resource,
    actor: {
      ...params.actor,
      type: params.actor.type || 'user'
    },
    blueprintId: params.blueprintId,
    metadata: params.metadata
  };
}

/**
 * 建立任務事件
 */
export function createTaskEvent<T>(params: {
  action: EventAction;
  payload: T;
  taskId: string;
  taskName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'task',
    action: params.action,
    payload: params.payload,
    resource: {
      type: 'task',
      id: params.taskId,
      name: params.taskName
    },
    actor: {
      id: params.actorId,
      name: params.actorName,
      type: 'user'
    },
    blueprintId: params.blueprintId
  });
}

/**
 * 建立系統事件
 */
export function createSystemEvent<T>(params: {
  action: EventAction;
  payload: T;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'system',
    action: params.action,
    payload: params.payload,
    resource: {
      type: params.resourceType,
      id: params.resourceId,
      name: params.resourceName
    },
    actor: {
      id: 'system',
      name: 'GigHub System',
      type: 'system'
    }
  });
}
```

---

## 與通知系統整合

### NotificationService 整合範例

```typescript
// 在 NotificationService 中訂閱事件總線

import { EventBusService, BaseEvent } from '@shared/services/event-bus';
import { TaskAssignedPayload } from '@core';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly eventBus = inject(EventBusService);
  
  constructor() {
    this.subscribeToEvents();
  }
  
  private subscribeToEvents(): void {
    // 訂閱任務指派事件
    this.eventBus.onType<TaskAssignedPayload>('task.assigned')
      .subscribe(event => {
        this.createNotificationFromEvent(event);
      });
    
    // 訂閱所有任務事件
    this.eventBus.onCategory('task')
      .subscribe(event => {
        console.log('[NotificationService] Task event:', event);
      });
  }
  
  private async createNotificationFromEvent(event: BaseEvent<TaskAssignedPayload>): Promise<void> {
    const { task, newAssignee } = event.payload;
    
    // 建立通知
    await this.createNotification({
      type: 'task_assigned',
      category: 'task',
      title: '新任務指派',
      content: `您被指派了任務：${task.name}`,
      accountId: newAssignee.id,
      blueprintId: task.blueprint_id,
      link: `/blueprint/${task.blueprint_id}/tasks?taskId=${task.id}`,
      metadata: {
        eventId: event.id,
        taskId: task.id
      }
    });
  }
}
```

### TaskService 發布事件範例

```typescript
// 在 TaskService 中發布事件

import { EventBusService, createTaskEvent } from '@shared/services/event-bus';
import { TaskAssignedPayload } from '@core';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly eventBus = inject(EventBusService);
  private readonly supabaseService = inject(SupabaseService);
  
  async assignTask(taskId: string, assigneeId: string): Promise<void> {
    const currentUser = this.supabaseService.currentUser;
    const task = await this.getTask(taskId);
    const assignee = await this.getUser(assigneeId);
    
    // 更新任務
    await this.updateTask(taskId, { assignee_id: assigneeId });
    
    // 發布事件
    this.eventBus.publish<TaskAssignedPayload>(
      createTaskEvent({
        action: 'assigned',
        payload: {
          task,
          previousAssignee: task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.display_name
          } : undefined,
          newAssignee: {
            id: assignee.id,
            name: assignee.display_name
          }
        },
        taskId: task.id,
        taskName: task.name,
        blueprintId: task.blueprint_id,
        actorId: currentUser.id,
        actorName: currentUser.user_metadata?.display_name || 'Unknown'
      })
    );
  }
}
```

---

## 測試策略

### 單元測試範例

```typescript
// src/app/shared/services/event-bus/event-bus.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { EventBusService } from './event-bus.service';
import { SupabaseService } from '@core/supabase';

describe('EventBusService', () => {
  let service: EventBusService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SupabaseService', ['client']);
    spy.client = {
      channel: jasmine.createSpy().and.returnValue({
        on: jasmine.createSpy().and.returnThis(),
        subscribe: jasmine.createSpy().and.returnThis()
      }),
      removeChannel: jasmine.createSpy()
    };

    TestBed.configureTestingModule({
      providers: [
        EventBusService,
        { provide: SupabaseService, useValue: spy }
      ]
    });

    service = TestBed.inject(EventBusService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should publish and receive events', (done) => {
    const testEvent = {
      category: 'task' as const,
      action: 'created' as const,
      type: 'task.created',
      payload: { taskId: '123' },
      resource: { type: 'task', id: '123' },
      actor: { id: 'user1', name: 'Test User', type: 'user' as const }
    };

    service.on({ category: 'task' }).subscribe(event => {
      expect(event.type).toBe('task.created');
      expect(event.payload).toEqual({ taskId: '123' });
      done();
    });

    service.publish(testEvent);
  });

  it('should filter events by category', (done) => {
    let taskEventReceived = false;
    let diaryEventReceived = false;

    service.onCategory('task').subscribe(() => {
      taskEventReceived = true;
    });

    service.onCategory('diary').subscribe(() => {
      diaryEventReceived = true;
    });

    service.publish({
      category: 'task',
      action: 'created',
      type: 'task.created',
      payload: {},
      resource: { type: 'task', id: '1' },
      actor: { id: 'u1', name: 'User', type: 'user' }
    });

    setTimeout(() => {
      expect(taskEventReceived).toBeTrue();
      expect(diaryEventReceived).toBeFalse();
      done();
    }, 100);
  });

  it('should track event count', () => {
    expect(service.eventCount()).toBe(0);

    service.publish({
      category: 'task',
      action: 'created',
      type: 'task.created',
      payload: {},
      resource: { type: 'task', id: '1' },
      actor: { id: 'u1', name: 'User', type: 'user' }
    });

    expect(service.eventCount()).toBe(1);
  });
});
```

---

## 📚 參考資源

### Context7 查詢來源

- **RxJS Subject**: `/reactivex/rxjs` - Subject 多播模式
- **Supabase Realtime**: `/supabase/supabase` - Broadcast 機制
- **Angular Signals**: `/llmstxt/angular_dev-llms.txt` - signal/computed/effect
- **RxAngular**: `/rx-angular/rx-angular` - 狀態管理模式

### 相關文件

- [NEXT_DEVELOPMENT_GUIDE.md](../NEXT_DEVELOPMENT_GUIDE.md) - 專案發展指南
- [WIDGET_TRANSFORMATION_ANALYSIS.md](../analysis/WIDGET_TRANSFORMATION_ANALYSIS.md) - Widget 改造分析
- [GigHub_Architecture.md](../GigHub_Architecture.md) - 系統架構

---

**建立者**: GitHub Copilot  
**日期**: 2025-12-03  
**技術來源**: Context7 MCP
