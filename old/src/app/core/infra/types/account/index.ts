/**
 * Account Types Module
 *
 * Exports all account-related type definitions (unified identity abstraction and business domains).
 * This includes user, organization, team, bot types for flat access.
 *
 * @module core/infra/types/account
 */

import { Database } from '../database.types';

// ============================================================================
// Account Unified Identity Abstraction Types (統一身份抽象類型)
// ============================================================================

/**
 * 帳戶類型枚舉
 * Account type enumeration
 *
 * Corresponds to database accounts.type field
 * Values match PostgreSQL enum: 'user', 'org', 'bot'
 */
export enum AccountType {
  /** 用戶帳戶 | User account */
  USER = 'user',
  /** 機器人帳戶 | Bot account */
  BOT = 'bot',
  /** 組織帳戶 | Organization account */
  ORG = 'org'
}

/**
 * 帳戶狀態枚舉
 * Account status enumeration
 *
 * Corresponds to database accounts.status field
 */
export enum AccountStatus {
  /** 活躍 | Active */
  ACTIVE = 'active',
  /** 非活躍 | Inactive */
  INACTIVE = 'inactive',
  /** 已暫停 | Suspended */
  SUSPENDED = 'suspended',
  /** 已刪除 | Deleted */
  DELETED = 'deleted'
}

/**
 * Account entity type (unified identity abstraction)
 */
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * 上下文類型枚舉
 * Context type enumeration
 *
 * Defines the different workspace context types available in the application
 * Note: APP context has been removed - default context is now USER
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

/**
 * 帳戶查詢選項
 * Account query options
 */
export interface AccountQueryOptions {
  /** 按類型過濾 | Filter by type */
  type?: AccountType;
  /** 按狀態過濾 | Filter by status */
  status?: AccountStatus;
  /** 是否包含已刪除的帳戶 | Include deleted accounts */
  includeDeleted?: boolean;
}

// ============================================================================
// Business Domain Types (業務域類型 - 扁平化導出)
// ============================================================================

// User domain types
// Note: UserAccount is exported to avoid conflict with Supabase User type
export type { UserAccount, UserAccountInsert, UserAccountUpdate, UserQueryOptions } from './user.types';

// Organization domain types
export * from './organization.types';

// Team domain types
export * from './team.types';

// Bot domain types
export * from './bot.types';
