/**
 * Notification Service
 *
 * 通知管理服務（Shared 層）
 * Notification management service (Shared layer)
 *
 * Provides business logic for notification operations including:
 * - Loading and managing notifications
 * - Marking notifications as read
 * - Categorizing notifications for UI display
 * - Supabase Realtime subscription for live updates
 *
 * Uses Angular 20 modern patterns:
 * - inject() function for dependency injection
 * - signal(), computed() for reactive state
 * - firstValueFrom() for Observable-to-Promise conversion
 *
 * @module shared/services/notification
 */

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import {
  NotificationRepository,
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationQueryOptions,
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
  BaseEvent,
  TaskAssignedPayload,
  TaskCompletedPayload,
  MemberJoinedPayload
} from '@core';
import { firstValueFrom, Subscription } from 'rxjs';

import { EventBusService } from '../event-bus';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Angular 20: 使用 inject() 函數進行依賴注入
  private readonly repo = inject(NotificationRepository);
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);

  // Realtime subscription cleanup function
  private unsubscribeFn: (() => void) | null = null;

  // Event bus subscriptions
  private eventSubscriptions: Subscription[] = [];

  // ============================================================================
  // State Signals (狀態信號)
  // ============================================================================

  // Core state signals
  private notificationsState = signal<Notification[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals for external consumption
  readonly notifications = this.notificationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // ============================================================================
  // Computed Signals (計算信號)
  // ============================================================================

  /**
   * 未讀通知數量
   * Unread notification count
   */
  readonly unreadCount = computed(() => this.notificationsState().filter(n => !n.is_read).length);

  /**
   * 是否有未讀通知
   * Whether there are unread notifications
   */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /**
   * 是否有錯誤
   * Whether there is an error
   */
  readonly hasError = computed(() => this.errorState() !== null);

  /**
   * 分類後的通知
   * Categorized notifications for UI display
   *
   * Groups notifications into three categories:
   * - System: info, warning, error, success, system
   * - Task: assignment, approval, reminder
   * - Message: mention
   */
  readonly categorizedNotifications = computed<NotificationCategory[]>(() => {
    const all = this.notificationsState();

    return (['system', 'task', 'message'] as const).map(categoryKey => {
      const config = NOTIFICATION_CATEGORY_CONFIG[categoryKey];
      return {
        key: categoryKey,
        title: config.title,
        list: all.filter(n => config.types.includes(n.notification_type)),
        emptyText: config.emptyText,
        emptyImage: config.emptyImage,
        clearText: config.clearText
      };
    });
  });

  constructor() {
    // 訂閱事件總線
    this.subscribeToEventBus();

    // 組件銷毀時取消訂閱
    this.destroyRef.onDestroy(() => {
      this.unsubscribeFromRealtime();
      this.unsubscribeFromEventBus();
    });
  }

  // ============================================================================
  // Public Methods (公開方法)
  // ============================================================================

  /**
   * 載入通知列表
   * Load notifications for current user
   */
  async loadNotifications(options?: NotificationQueryOptions): Promise<Notification[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const notifications = await firstValueFrom(this.repo.findByCurrentUser(options));
      this.notificationsState.set(notifications);
      return notifications;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入通知失敗';
      this.errorState.set(message);
      console.error('[NotificationService] loadNotifications error:', err);
      throw err;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 重新載入通知
   * Reload notifications
   */
  async refresh(): Promise<void> {
    await this.loadNotifications({ limit: 50 });
  }

  /**
   * 標記單一通知為已讀
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const success = await firstValueFrom(this.repo.markAsRead(id));
    if (success) {
      this.notificationsState.update(list => list.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    }
  }

  /**
   * 標記所有通知為已讀
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const success = await firstValueFrom(this.repo.markAllAsRead());
    if (success) {
      this.notificationsState.update(list => list.map(n => ({ ...n, is_read: true })));
    }
  }

  /**
   * 清空特定分類的通知（標記為已讀）
   * Clear notifications by category (mark as read)
   */
  async clearByCategory(categoryKey: 'system' | 'task' | 'message'): Promise<void> {
    const config = NOTIFICATION_CATEGORY_CONFIG[categoryKey];
    const types = config.types;

    const toClear = this.notificationsState()
      .filter(n => !n.is_read && types.includes(n.notification_type))
      .map(n => n.id);

    if (toClear.length > 0) {
      const success = await firstValueFrom(this.repo.markMultipleAsRead(toClear));
      if (success) {
        this.notificationsState.update(list => list.map(n => (toClear.includes(n.id) ? { ...n, is_read: true } : n)));
      }
    }
  }

  /**
   * 刪除通知
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    const success = await firstValueFrom(this.repo.delete(id));
    if (success) {
      this.notificationsState.update(list => list.filter(n => n.id !== id));
    }
  }

  // ============================================================================
  // Realtime Methods (即時訂閱方法)
  // ============================================================================

  /**
   * 訂閱即時通知
   * Subscribe to realtime notifications
   *
   * @param accountId - The account ID to subscribe for
   */
  subscribeToRealtime(accountId: string): void {
    // 先取消之前的訂閱
    this.unsubscribeFromRealtime();

    this.unsubscribeFn = this.repo.subscribeToNotifications(
      accountId,
      // onInsert: 新通知加到列表最前面
      newNotification => {
        this.notificationsState.update(list => [newNotification, ...list]);
      },
      // onUpdate: 更新現有通知
      updatedNotification => {
        this.notificationsState.update(list => list.map(n => (n.id === updatedNotification.id ? updatedNotification : n)));
      }
    );
  }

  /**
   * 取消即時訂閱
   * Unsubscribe from realtime notifications
   */
  unsubscribeFromRealtime(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }

  // ============================================================================
  // Event Bus Methods (事件總線方法)
  // ============================================================================

  /**
   * 訂閱事件總線
   * Subscribe to event bus for automatic notification generation
   */
  private subscribeToEventBus(): void {
    // 訂閱任務指派事件
    const taskAssignedSub = this.eventBus.onType<TaskAssignedPayload>('task.assigned').subscribe(event => {
      this.handleTaskAssignedEvent(event);
    });
    this.eventSubscriptions.push(taskAssignedSub);

    // 訂閱任務完成事件
    const taskCompletedSub = this.eventBus.onType<TaskCompletedPayload>('task.completed').subscribe(event => {
      this.handleTaskCompletedEvent(event);
    });
    this.eventSubscriptions.push(taskCompletedSub);

    // 訂閱成員加入事件
    const memberJoinedSub = this.eventBus.onType<MemberJoinedPayload>('member.joined').subscribe(event => {
      this.handleMemberJoinedEvent(event);
    });
    this.eventSubscriptions.push(memberJoinedSub);

    console.log('[NotificationService] Subscribed to event bus');
  }

  /**
   * 取消事件總線訂閱
   */
  private unsubscribeFromEventBus(): void {
    this.eventSubscriptions.forEach(sub => sub.unsubscribe());
    this.eventSubscriptions = [];
  }

  /**
   * 處理任務指派事件
   */
  private handleTaskAssignedEvent(event: BaseEvent<TaskAssignedPayload>): void {
    const { newAssignee, taskName } = event.payload;

    // 這裡可以建立一個臨時的本地通知
    // 實際的通知會通過 Supabase Realtime 推送
    console.log('[NotificationService] Task assigned event:', {
      taskName,
      assignee: newAssignee.name
    });
  }

  /**
   * 處理任務完成事件
   */
  private handleTaskCompletedEvent(event: BaseEvent<TaskCompletedPayload>): void {
    const { taskName, completedBy } = event.payload;

    console.log('[NotificationService] Task completed event:', {
      taskName,
      completedBy: completedBy.name
    });
  }

  /**
   * 處理成員加入事件
   */
  private handleMemberJoinedEvent(event: BaseEvent<MemberJoinedPayload>): void {
    const { userName, blueprintName } = event.payload;

    console.log('[NotificationService] Member joined event:', {
      userName,
      blueprintName
    });
  }

  // ============================================================================
  // Utility Methods (工具方法)
  // ============================================================================

  /**
   * 取得通知類型的配置
   * Get notification type configuration
   */
  getTypeConfig(type: NotificationType) {
    return NOTIFICATION_TYPE_CONFIG[type];
  }

  /**
   * 根據通知類型取得分類鍵值
   * Get category key by notification type
   */
  getCategoryKeyByType(type: NotificationType): 'system' | 'task' | 'message' {
    return NOTIFICATION_TYPE_CONFIG[type].category;
  }
}
