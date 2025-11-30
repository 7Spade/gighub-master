/**
 * Account Types Module
 *
 * Exports all account-related type definitions (unified identity abstraction and business domains).
 * This includes user, organization, team, bot types for flat access.
 *
 * @module core/infra/types/account
 */

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
 * Account entity interface
 * 帳戶實體介面
 */
export interface Account {
  id: string;
  auth_user_id?: string | null;
  type: AccountType;
  status: AccountStatus;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
// Organization Types (組織類型)
// ============================================================================

/**
 * 組織角色枚舉
 * Organization role enumeration
 */
export enum OrganizationRole {
  /** 擁有者 | Owner */
  OWNER = 'owner',
  /** 管理員 | Admin */
  ADMIN = 'admin',
  /** 成員 | Member */
  MEMBER = 'member'
}

/**
 * Organization entity interface
 * 組織實體介面
 */
export interface Organization {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * OrganizationMember entity interface
 * 組織成員實體介面
 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  account_id: string;
  role: OrganizationRole;
  created_at?: string;
  updated_at?: string;
}

/**
 * 組織成員查詢選項
 * Organization member query options
 */
export interface OrganizationMemberQueryOptions {
  /** Auth 用戶 ID | Auth user ID */
  authUserId?: string;
  /** 角色過濾 | Filter by role */
  role?: OrganizationRole;
}

// ============================================================================
// Team Types (團隊類型)
// ============================================================================

/**
 * 團隊角色枚舉
 * Team role enumeration
 */
export enum TeamRole {
  /** 團隊領導 | Team leader */
  LEADER = 'leader',
  /** 團隊成員 | Team member */
  MEMBER = 'member'
}

/**
 * Team entity interface
 * 團隊實體介面
 */
export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * TeamMember entity interface
 * 團隊成員實體介面
 */
export interface TeamMember {
  id: string;
  team_id: string;
  account_id: string;
  role: TeamRole;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type OrganizationModel = Organization;
export type TeamModel = Team;
