/**
 * Organization Type Definitions
 *
 * 組織相關類型定義（基礎設施層）
 * Organization-related type definitions (Infrastructure Layer)
 *
 * @module core/infra/types/account
 */

import { Database } from '../database.types';

/**
 * Organization entity type (from accounts table with type='Organization')
 */
export type Organization = Database['public']['Tables']['accounts']['Row'];
export type OrganizationInsert = Database['public']['Tables']['accounts']['Insert'];
export type OrganizationUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * OrganizationMember entity type
 */
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert'];
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update'];

/**
 * 組織成員角色枚舉
 * Organization member role enumeration
 */
export enum OrganizationMemberRole {
  /** 組織擁有者 | Organization owner */
  OWNER = 'owner',
  /** 組織管理員 | Organization admin */
  ADMIN = 'admin',
  /** 組織成員 | Organization member */
  MEMBER = 'member'
}

/**
 * 組織查詢選項
 * Organization query options
 */
export interface OrganizationQueryOptions {
  /** 按狀態過濾 | Filter by status */
  status?: 'active' | 'inactive' | 'suspended' | 'deleted';
  /** 是否包含已刪除的組織 | Include deleted organizations */
  includeDeleted?: boolean;
}

/**
 * 組織成員查詢選項
 * Organization member query options
 */
export interface OrganizationMemberQueryOptions {
  /** 按組織 ID 過濾 | Filter by organization ID */
  organizationId?: string;
  /** 按帳戶 ID 過濾 | Filter by account ID */
  accountId?: string;
  /** 按 auth_user_id 過濾 | Filter by auth_user_id */
  authUserId?: string;
  /** 按角色過濾 | Filter by role */
  role?: OrganizationMemberRole;
}
