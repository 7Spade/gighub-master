/**
 * 事件總線服務
 *
 * 提供跨模組事件發布/訂閱機制，整合 Supabase Realtime 實現跨客戶端同步。
 *
 * @packageDocumentation
 * @module EventBus
 */

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { LoggerService } from '../../../core/logger/logger.service';
import { SupabaseService, BaseEvent, EventCategory, EventFilterOptions } from '@core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subject, Observable, filter, takeUntil } from 'rxjs';

// ============================================================
// Service
// ============================================================

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
 *   payload: { taskId: '123', newAssignee: { id: 'u1', name: 'John' } },
 *   resource: { type: 'task', id: '123' },
 *   actor: { id: 'u2', name: 'Admin', type: 'user' },
 *   blueprintId: 'bp1'
 * });
 *
 * // 訂閱事件
 * eventBus.on({ category: 'task' }).subscribe(event => {
 *   console.log('Task event:', event);
 * });
 *
 * // 訂閱特定類型事件
 * eventBus.onType('task.assigned').subscribe(event => {
 *   console.log('Task assigned:', event);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventBusService implements OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /** 本地事件流 */
  private readonly eventSubject = new Subject<BaseEvent>();

  /** 銷毀信號 */
  private readonly destroy$ = new Subject<void>();

  /** Supabase Realtime 頻道 */
  private realtimeChannel: RealtimeChannel | null = null;

  /** 當前藍圖 ID (用於過濾) */
  private currentBlueprintId: string | null = null;

  /** 最大保留事件數量 */
  private readonly MAX_RECENT_EVENTS = 100;

  // ============================================================
  // State Signals
  // ============================================================

  /** 事件計數 */
  private readonly eventCountState = signal(0);

  /** 最近事件列表 */
  private readonly recentEventsState = signal<BaseEvent[]>([]);

  /** 是否已連接 Realtime */
  private readonly isConnectedState = signal(false);

  /** 錯誤狀態 */
  private readonly errorState = signal<string | null>(null);

  // ============================================================
  // Public Readonly Signals
  // ============================================================

  /** 事件計數 */
  readonly eventCount = this.eventCountState.asReadonly();

  /** 最近事件 */
  readonly recentEvents = this.recentEventsState.asReadonly();

  /** 是否已連接 */
  readonly isConnected = this.isConnectedState.asReadonly();

  /** 錯誤訊息 */
  readonly error = this.errorState.asReadonly();

  /** 有未處理事件 */
  readonly hasRecentEvents = computed(() => this.recentEventsState().length > 0);

  /** 按類別分組的最近事件 */
  readonly recentEventsByCategory = computed(() => {
    const events = this.recentEventsState();
    const grouped: Record<EventCategory, BaseEvent[]> = {
      system: [],
      task: [],
      diary: [],
      issue: [],
      financial: [],
      file: [],
      member: [],
      notification: []
    };

    for (const event of events) {
      if (grouped[event.category]) {
        grouped[event.category].push(event);
      }
    }

    return grouped;
  });

  // ============================================================
  // Lifecycle
  // ============================================================

  constructor() {
    this.logger.debug('EventBusService', 'Initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribeFromRealtime();
    this.logger.debug('EventBusService', 'Destroyed');
  }

  // ============================================================
  // Public Methods - Initialization
  // ============================================================

  /**
   * 初始化事件總線
   *
   * @param blueprintId 藍圖 ID (可選，用於資料隔離)
   */
  initialize(blueprintId?: string): void {
    this.currentBlueprintId = blueprintId || null;
    this.subscribeToRealtime();
    this.logger.debug('EventBusService', 'Initialized with blueprint', { blueprintId });
  }

  /**
   * 切換藍圖上下文
   *
   * @param blueprintId 新的藍圖 ID
   */
  switchBlueprint(blueprintId: string | null): void {
    if (this.currentBlueprintId === blueprintId) return;

    this.currentBlueprintId = blueprintId;
    this.unsubscribeFromRealtime();
    this.subscribeToRealtime();
    this.logger.debug('EventBusService', 'Switched to blueprint', { blueprintId });
  }

  // ============================================================
  // Public Methods - Publishing
  // ============================================================

  /**
   * 發布事件
   *
   * @param event 事件資料 (不含 id 和 timestamp)
   * @param broadcast 是否廣播到其他客戶端 (預設 true)
   */
  publish<T>(event: Omit<BaseEvent<T>, 'id' | 'timestamp'>, broadcast = true): BaseEvent<T> {
    const fullEvent: BaseEvent<T> = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    } as BaseEvent<T>;

    // 本地廣播
    this.eventSubject.next(fullEvent);

    // 更新狀態
    this.eventCountState.update(count => count + 1);
    this.recentEventsState.update(events => [fullEvent, ...events].slice(0, this.MAX_RECENT_EVENTS));

    // Supabase Realtime 廣播 (跨客戶端)
    if (broadcast) {
      this.broadcastToRealtime(fullEvent);
    }

    this.logger.debug('EventBusService', 'Event published', { type: fullEvent.type, event: fullEvent });

    return fullEvent;
  }

  /**
   * 批次發布事件
   *
   * @param events 事件列表
   */
  publishBatch<T>(events: Array<Omit<BaseEvent<T>, 'id' | 'timestamp'>>): Array<BaseEvent<T>> {
    return events.map(event => this.publish(event));
  }

  // ============================================================
  // Public Methods - Subscribing
  // ============================================================

  /**
   * 訂閱事件
   *
   * @param options 過濾選項
   * @returns 事件 Observable
   *
   * @example
   * ```typescript
   * // 訂閱任務事件
   * eventBus.on({ category: 'task' }).subscribe(event => {
   *   console.log('Task event:', event);
   * });
   *
   * // 訂閱特定藍圖的事件
   * eventBus.on({ blueprintId: 'bp1', category: 'task' }).subscribe(event => {
   *   console.log('Blueprint task event:', event);
   * });
   * ```
   */
  on<T = unknown>(options?: EventFilterOptions): Observable<BaseEvent<T>> {
    return this.eventSubject.pipe(
      filter((event): event is BaseEvent<T> => this.matchesFilter(event, options)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * 訂閱特定類型事件
   *
   * @param type 事件類型 (e.g., 'task.assigned')
   * @returns 事件 Observable
   *
   * @example
   * ```typescript
   * eventBus.onType('task.assigned').subscribe(event => {
   *   console.log('Task assigned:', event);
   * });
   * ```
   */
  onType<T = unknown>(type: string): Observable<BaseEvent<T>> {
    return this.eventSubject.pipe(
      filter((event): event is BaseEvent<T> => event.type === type),
      takeUntil(this.destroy$)
    );
  }

  /**
   * 訂閱多個事件類型
   *
   * @param types 事件類型列表
   * @returns 事件 Observable
   */
  onTypes<T = unknown>(types: string[]): Observable<BaseEvent<T>> {
    return this.eventSubject.pipe(
      filter((event): event is BaseEvent<T> => types.includes(event.type)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * 訂閱特定類別事件
   *
   * @param category 事件類別
   * @returns 事件 Observable
   */
  onCategory<T = unknown>(category: EventCategory): Observable<BaseEvent<T>> {
    return this.on<T>({ category });
  }

  /**
   * 訂閱多個類別事件
   *
   * @param categories 事件類別列表
   * @returns 事件 Observable
   */
  onCategories<T = unknown>(categories: EventCategory[]): Observable<BaseEvent<T>> {
    return this.on<T>({ category: categories });
  }

  /**
   * 訂閱特定資源的事件
   *
   * @param resourceType 資源類型
   * @param resourceId 資源 ID
   * @returns 事件 Observable
   */
  onResource<T = unknown>(resourceType: string, resourceId: string): Observable<BaseEvent<T>> {
    return this.on<T>({ resourceType, resourceId });
  }

  // ============================================================
  // Public Methods - State Management
  // ============================================================

  /**
   * 清除最近事件
   */
  clearRecentEvents(): void {
    this.recentEventsState.set([]);
  }

  /**
   * 重置事件計數
   */
  resetEventCount(): void {
    this.eventCountState.set(0);
  }

  /**
   * 獲取最近 N 個事件
   */
  getRecentEvents(count: number): BaseEvent[] {
    return this.recentEventsState().slice(0, count);
  }

  /**
   * 獲取特定類別的最近事件
   */
  getRecentEventsByCategory(category: EventCategory, count?: number): BaseEvent[] {
    const events = this.recentEventsByCategory()[category];
    return count ? events.slice(0, count) : events;
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
      const categories = Array.isArray(options.category) ? options.category : [options.category];
      if (!categories.includes(event.category)) return false;
    }

    // 動作過濾
    if (options.action) {
      const actions = Array.isArray(options.action) ? options.action : [options.action];
      if (!actions.includes(event.action)) return false;
    }

    // 事件類型過濾
    if (options.type) {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      if (!types.includes(event.type)) return false;
    }

    // 藍圖過濾
    if (options.blueprintId && event.blueprintId !== options.blueprintId) {
      return false;
    }

    // 組織過濾
    if (options.organizationId && event.organizationId !== options.organizationId) {
      return false;
    }

    // 資源類型過濾
    if (options.resourceType && event.resource.type !== options.resourceType) {
      return false;
    }

    // 資源 ID 過濾
    if (options.resourceId && event.resource.id !== options.resourceId) {
      return false;
    }

    // 觸發者過濾
    if (options.actorId && event.actor.id !== options.actorId) {
      return false;
    }

    // 觸發者類型過濾
    if (options.actorType && event.actor.type !== options.actorType) {
      return false;
    }

    return true;
  }

  /**
   * 訂閱 Supabase Realtime
   */
  private subscribeToRealtime(): void {
    this.unsubscribeFromRealtime();

    const channelName = this.currentBlueprintId ? `events:${this.currentBlueprintId}` : 'events:global';

    try {
      this.realtimeChannel = this.supabaseService.client
        .channel(channelName, {
          config: { private: !!this.currentBlueprintId }
        })
        .on('broadcast', { event: '*' }, (payload: { payload?: unknown }) => {
          // 接收來自其他客戶端的事件
          if (payload.payload && typeof payload.payload === 'object') {
            const event = payload.payload as BaseEvent;

            // 避免重複處理自己發送的事件
            // (透過事件 ID 判斷)

            this.eventSubject.next(event);
            this.recentEventsState.update(events => [event, ...events].slice(0, this.MAX_RECENT_EVENTS));
          }
        })
        .subscribe((status: string) => {
          this.isConnectedState.set(status === 'SUBSCRIBED');

          if (status === 'SUBSCRIBED') {
            this.errorState.set(null);
            this.logger.debug('EventBusService', 'Realtime connected', { channelName });
          } else if (status === 'CHANNEL_ERROR') {
            this.errorState.set('Realtime 連線錯誤');
            this.logger.error('EventBusService - Realtime channel error');
          }
        });
    } catch (err: unknown) {
      this.logger.error('EventBusService - Failed to subscribe to realtime', err);
      this.errorState.set('無法連接 Realtime');
    }
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
    if (!this.realtimeChannel) {
      this.logger.warn('EventBusService', 'Cannot broadcast - channel not connected', { channelName });
      return;
    }

    this.realtimeChannel
      .send({
        type: 'broadcast',
        event: event.type,
        payload: event
      })
      .catch((err: unknown) => {
        this.logger.error('EventBusService - Broadcast error', err);
      });
  }
}
