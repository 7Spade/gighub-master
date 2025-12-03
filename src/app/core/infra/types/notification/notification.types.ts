/**
 * Notification Types
 *
 * 通知類型定義
 * Notification type definitions
 *
 * Maps to the database schema for notifications table
 * and related enums (notification_type, notification_channel).
 *
 * @module core/infra/types/notification
 */

/**
 * 通知類型枚舉
 * Notification type enum
 *
 * Maps to: notification_type enum in database
 */
export type NotificationType =
  | 'info' // 一般資訊
  | 'warning' // 警告
  | 'error' // 錯誤
  | 'success' // 成功
  | 'mention' // 提及
  | 'assignment' // 指派
  | 'approval' // 審核
  | 'reminder' // 提醒
  | 'system'; // 系統

/**
 * 通知渠道枚舉
 * Notification channel enum
 *
 * Maps to: notification_channel enum in database
 */
export type NotificationChannel =
  | 'in_app' // 應用內
  | 'email' // 電子郵件
  | 'push' // 推播
  | 'sms'; // 簡訊

/**
 * 實體類型（用於關聯通知與業務實體）
 * Entity type for linking notifications to business entities
 */
export type NotificationEntityType = 'task' | 'diary' | 'issue' | 'blueprint' | 'account' | 'file' | null;

/**
 * 通知介面
 * Notification interface
 *
 * Maps to: notifications table in database
 */
export interface Notification {
  id: string;
  account_id: string;
  blueprint_id: string | null;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  sent_channels: NotificationChannel[];
  entity_type: NotificationEntityType;
  entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
}

/**
 * 通知偏好設定介面
 * Notification preference interface
 *
 * Maps to: notification_preferences table in database
 */
export interface NotificationPreference {
  id: string;
  account_id: string;
  blueprint_id: string | null;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 通知查詢選項
 * Notification query options
 */
export interface NotificationQueryOptions {
  /** 限制返回數量 */
  limit?: number;
  /** 只返回未讀通知 */
  unreadOnly?: boolean;
  /** 按藍圖 ID 過濾 */
  blueprintId?: string;
  /** 按通知類型過濾 */
  notificationType?: NotificationType;
}

/**
 * 建立通知請求
 * Create notification request
 */
export interface CreateNotificationRequest {
  account_id: string;
  blueprint_id?: string;
  type: string;
  title: string;
  content?: string;
  notification_type?: NotificationType;
  entity_type?: NotificationEntityType;
  entity_id?: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}

/**
 * 通知分類配置
 * Notification category configuration
 *
 * Used for grouping notifications in the UI (e.g., NoticeIcon tabs)
 */
export interface NotificationCategory {
  /** 分類鍵值 */
  key: string;
  /** 分類標題 */
  title: string;
  /** 該分類的通知列表 */
  list: Notification[];
  /** 空狀態文字 */
  emptyText: string;
  /** 空狀態圖片 */
  emptyImage: string;
  /** 清空按鈕文字 */
  clearText: string;
}

/**
 * 通知類型配置
 * Notification type configuration for UI display
 */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    label: string;
    color: string;
    icon: string;
    category: 'system' | 'task' | 'message';
  }
> = {
  info: { label: '資訊', color: 'blue', icon: 'info-circle', category: 'system' },
  warning: { label: '警告', color: 'orange', icon: 'warning', category: 'system' },
  error: { label: '錯誤', color: 'red', icon: 'close-circle', category: 'system' },
  success: { label: '成功', color: 'green', icon: 'check-circle', category: 'system' },
  mention: { label: '提及', color: 'purple', icon: 'message', category: 'message' },
  assignment: { label: '指派', color: 'cyan', icon: 'user-add', category: 'task' },
  approval: { label: '審核', color: 'gold', icon: 'audit', category: 'task' },
  reminder: { label: '提醒', color: 'lime', icon: 'bell', category: 'task' },
  system: { label: '系統', color: 'geekblue', icon: 'setting', category: 'system' }
};

/**
 * 通知分類配置
 * Notification category configuration for UI grouping
 */
export const NOTIFICATION_CATEGORY_CONFIG: Record<
  'system' | 'task' | 'message',
  {
    title: string;
    emptyText: string;
    emptyImage: string;
    clearText: string;
    types: NotificationType[];
  }
> = {
  system: {
    title: '系統通知',
    emptyText: '暫無系統通知',
    emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg',
    clearText: '清空系統通知',
    types: ['system', 'info', 'warning', 'error', 'success']
  },
  task: {
    title: '任務相關',
    emptyText: '暫無任務通知',
    emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg',
    clearText: '清空任務通知',
    types: ['assignment', 'approval', 'reminder']
  },
  message: {
    title: '訊息提醒',
    emptyText: '暫無新訊息',
    emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg',
    clearText: '清空訊息',
    types: ['mention']
  }
};
