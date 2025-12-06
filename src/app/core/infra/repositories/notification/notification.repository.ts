/**
 * Notification Repository
 *
 * 通知資料存取層
 * Notification data access layer
 *
 * Provides CRUD operations for the notifications table using Supabase client.
 * Includes Supabase Realtime subscription for live notifications.
 *
 * Uses Angular 20 patterns:
 * - inject() function for dependency injection
 * - RxJS for reactive data streams
 *
 * @module core/infra/repositories/notification
 */

import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import { Notification, NotificationQueryOptions, CreateNotificationRequest } from '../../types/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  // Angular 20: 使用 inject() 函數進行依賴注入
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Query Methods (查詢方法)
  // ============================================================================

  /**
   * 根據 ID 查詢通知
   * Find notification by ID
   */
  findById(id: string): Observable<Notification | null> {
    return from(this.supabase.client.from('notifications').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          this.logger.error('[NotificationRepository] findById error:', error);
          return null;
        }
        return data as Notification;
      })
    );
  }

  /**
   * 取得當前用戶的通知列表
   * Find notifications for current user
   *
   * RLS will automatically filter by account_id
   */
  findByCurrentUser(options?: NotificationQueryOptions): Observable<Notification[]> {
    let query = this.supabase.client.from('notifications').select('*').order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options?.notificationType) {
      query = query.eq('notification_type', options.notificationType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] findByCurrentUser error:', error);
          return [];
        }
        return (data || []) as Notification[];
      })
    );
  }

  /**
   * 取得未讀通知數量
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    return from(this.supabase.client.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)).pipe(
      map(({ count, error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] getUnreadCount error:', error);
          return 0;
        }
        return count || 0;
      })
    );
  }

  // ============================================================================
  // Mutation Methods (修改方法)
  // ============================================================================

  /**
   * 建立通知
   * Create a new notification
   */
  create(request: CreateNotificationRequest): Observable<Notification | null> {
    return from(this.supabase.client.from('notifications').insert(request).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] create error:', error);
          return null;
        }
        return data as Notification;
      })
    );
  }

  /**
   * 標記通知為已讀
   * Mark notification as read
   */
  markAsRead(id: string): Observable<boolean> {
    return from(this.supabase.client.from('notifications').update({ is_read: true }).eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] markAsRead error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 標記多個通知為已讀
   * Mark multiple notifications as read
   */
  markMultipleAsRead(ids: string[]): Observable<boolean> {
    return from(this.supabase.client.from('notifications').update({ is_read: true }).in('id', ids)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] markMultipleAsRead error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 標記所有通知為已讀
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<boolean> {
    return from(this.supabase.client.from('notifications').update({ is_read: true }).eq('is_read', false)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] markAllAsRead error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 刪除通知
   * Delete notification
   */
  delete(id: string): Observable<boolean> {
    return from(this.supabase.client.from('notifications').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[NotificationRepository] delete error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Realtime Methods (即時訂閱方法)
  // ============================================================================

  /**
   * 訂閱即時通知
   * Subscribe to realtime notifications
   *
   * Uses Supabase Realtime to listen for new notifications
   * for a specific account.
   *
   * @param accountId - The account ID to subscribe for
   * @param onInsert - Callback for new notifications
   * @param onUpdate - Optional callback for updated notifications
   * @returns Unsubscribe function
   */
  subscribeToNotifications(
    accountId: string,
    onInsert: (notification: Notification) => void,
    onUpdate?: (notification: Notification) => void
  ): () => void {
    const channel: RealtimeChannel = this.supabase.client
      .channel(`notifications:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${accountId}`
        },
        payload => {
          onInsert(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `account_id=eq.${accountId}`
        },
        payload => {
          if (onUpdate) {
            onUpdate(payload.new as Notification);
          }
        }
      )
      .subscribe();

    // 返回取消訂閱函數
    return () => {
      this.supabase.client.removeChannel(channel);
    };
  }
}
