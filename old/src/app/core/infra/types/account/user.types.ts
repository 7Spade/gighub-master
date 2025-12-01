/**
 * User Type Definitions
 *
 * 用戶相關類型定義（基礎設施層）
 * User-related type definitions (Infrastructure Layer)
 *
 * @module core/infra/types/account
 */

import { Database } from '../database.types';

/**
 * User entity type (from accounts table with type='User')
 */
export type UserAccount = Database['public']['Tables']['accounts']['Row'];
export type UserAccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type UserAccountUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * 用戶查詢選項
 * User query options
 */
export interface UserQueryOptions {
  /** 按狀態過濾 | Filter by status */
  status?: 'active' | 'inactive' | 'suspended' | 'deleted';
  /** 是否包含已刪除的用戶 | Include deleted users */
  includeDeleted?: boolean;
}
