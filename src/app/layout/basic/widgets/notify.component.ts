/**
 * Header Notify Component
 *
 * 通知中心 Header Widget
 * Notification Hub Header Widget
 *
 * Displays notifications using ng-alain's NoticeIcon component,
 * integrated with NotificationService and Supabase Realtime.
 *
 * Features:
 * - Three notification categories: System, Task, Message
 * - Real-time updates via Supabase Realtime
 * - Mark as read / clear by category
 * - Navigation to related entities
 *
 * Uses Angular 20 modern patterns:
 * - inject() for dependency injection
 * - Signals for reactive state management
 * - computed() for derived state
 *
 * @module layout/basic/widgets
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Notification, NOTIFICATION_TYPE_CONFIG, SupabaseService, AccountRepository } from '@core';
import { NoticeIconList, NoticeIconModule, NoticeIconSelect, NoticeItem } from '@delon/abc/notice-icon';
import { NotificationService } from '@shared';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

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
  // Angular 20: 使用 inject() 函數進行依賴注入
  readonly notificationService = inject(NotificationService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly accountRepo = inject(AccountRepository);
  private readonly msg = inject(NzMessageService);
  private readonly router = inject(Router);

  /**
   * 將 NotificationService 的分類資料轉換為 NoticeIcon 格式
   * Transform categorized notifications to NoticeIcon format
   */
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
    // 初始載入通知
    this.loadNotifications();

    // 訂閱即時通知
    this.subscribeToRealtimeNotifications();
  }

  /**
   * 載入通知列表
   * Load notifications
   */
  private async loadNotifications(): Promise<void> {
    try {
      await this.notificationService.loadNotifications({ limit: 50 });
    } catch {
      // Error is handled by NotificationService
    }
  }

  /**
   * 訂閱即時通知
   * Subscribe to realtime notifications
   */
  private async subscribeToRealtimeNotifications(): Promise<void> {
    try {
      const user = this.supabaseService.currentUser;
      if (!user) return;

      // 透過 AccountRepository 取得當前用戶的 account_id
      const account = await firstValueFrom(this.accountRepo.findByAuthUserId(user.id));
      if (account) {
        this.notificationService.subscribeToRealtime(account.id);
      }
    } catch (err) {
      console.error('[HeaderNotifyComponent] subscribeToRealtimeNotifications error:', err);
    }
  }

  /**
   * 將 Notification 轉換為 NoticeIconList 格式
   * Map Notification to NoticeIconList format
   */
  private mapNotificationToNoticeItem(notification: Notification): NoticeIconList {
    const config = NOTIFICATION_TYPE_CONFIG[notification.notification_type];

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
      avatar: this.getAvatar(notification.notification_type),
      // 儲存原始資料以供點擊時使用
      ['_original']: notification
    };
  }

  /**
   * 取得額外標籤
   * Get extra label for notification type
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
   * Get status for notification type (used for color)
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
   * Get avatar for notification type
   */
  private getAvatar(type: string): string {
    const avatars: Record<string, string> = {
      assignment: 'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
      approval: 'https://gw.alipayobjects.com/zos/rmsportal/OKJXDXrmkNshAMvwtvhu.png',
      reminder: 'https://gw.alipayobjects.com/zos/rmsportal/kISTdvpyTAhtGxpovNWd.png',
      mention: 'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg',
      system: 'https://gw.alipayobjects.com/zos/rmsportal/GvqBnKhFgObvnSGkDsje.png',
      info: 'https://gw.alipayobjects.com/zos/rmsportal/GvqBnKhFgObvnSGkDsje.png',
      warning: 'https://gw.alipayobjects.com/zos/rmsportal/kISTdvpyTAhtGxpovNWd.png',
      error: 'https://gw.alipayobjects.com/zos/rmsportal/kISTdvpyTAhtGxpovNWd.png',
      success: 'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png'
    };
    return avatars[type] || avatars['system'];
  }

  /**
   * Popover 顯示時載入資料
   * Load data when popover becomes visible
   */
  onPopoverVisibleChange(visible: boolean): void {
    if (visible) {
      this.loadNotifications();
    }
  }

  /**
   * 點擊通知項目
   * Handle notification item click
   */
  async onSelect(event: NoticeIconSelect): Promise<void> {
    const originalNotification = event.item['_original'] as Notification | undefined;

    if (originalNotification) {
      // 標記為已讀
      await this.notificationService.markAsRead(originalNotification.id);

      // 導航到相關頁面
      if (originalNotification.action_url) {
        this.router.navigateByUrl(originalNotification.action_url);
      } else if (originalNotification.entity_type && originalNotification.entity_id) {
        const url = this.buildEntityUrl(
          originalNotification.entity_type,
          originalNotification.entity_id,
          originalNotification.blueprint_id
        );
        if (url) {
          this.router.navigateByUrl(url);
        }
      }
    }
  }

  /**
   * 根據實體類型構建 URL
   * Build URL based on entity type
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
   * Clear notifications by category title
   */
  async onClear(title: string): Promise<void> {
    // 將標題對應到分類鍵值
    const categoryMap: Record<string, 'system' | 'task' | 'message'> = {
      系統通知: 'system',
      任務相關: 'task',
      訊息提醒: 'message'
    };

    const categoryKey = categoryMap[title];
    if (categoryKey) {
      await this.notificationService.clearByCategory(categoryKey);
      this.msg.success(`已清空 ${title}`);
    }
  }
}
