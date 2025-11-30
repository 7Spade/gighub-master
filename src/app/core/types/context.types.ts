/**
 * Context Types
 *
 * 上下文類型定義
 * Context type definitions
 *
 * @module core/types
 */

/**
 * 上下文類型枚舉
 * Context type enumeration
 *
 * Defines the different workspace context types available in the application
 */
export enum ContextType {
  /** 個人帳戶上下文 | User account context */
  USER = 'user',
  /** 組織上下文 | Organization context */
  ORGANIZATION = 'organization',
  /** 團隊上下文 | Team context */
  TEAM = 'team',
  /** 機器人上下文 | Bot context */
  BOT = 'bot'
}

/**
 * 上下文狀態介面
 * Context state interface
 *
 * Represents the current workspace context
 */
export interface ContextState {
  /** 上下文類型 | Context type */
  type: ContextType;
  /** 上下文 ID | Context ID */
  id: string | null;
  /** 上下文標籤（顯示名稱） | Context label (display name) */
  label: string;
  /** 上下文圖標 | Context icon */
  icon: string;
  /** 上下文頭像 URL（可選） | Context avatar URL (optional) */
  avatar?: string | null;
  /** 上下文電子郵件（可選） | Context email (optional) */
  email?: string | null;
}

