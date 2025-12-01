/**
 * Team Type Definitions
 *
 * 團隊相關類型定義（基礎設施層）
 * Team-related type definitions (Infrastructure Layer)
 *
 * @module core/infra/types/account
 */

import { Database } from '../database.types';

/**
 * Team entity type
 */
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];

/**
 * TeamMember entity type
 */
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

/**
 * 團隊成員角色枚舉
 * Team member role enumeration
 */
export enum TeamMemberRole {
  /** 團隊負責人 | Team leader */
  LEADER = 'leader',
  /** 團隊成員 | Team member */
  MEMBER = 'member'
}

/**
 * 團隊查詢選項
 * Team query options
 */
export interface TeamQueryOptions {
  /** 按組織 ID 過濾 | Filter by organization ID */
  organizationId?: string;
  /** 按成員 ID 過濾（查詢用戶所屬團隊） | Filter by member ID (find user's teams) */
  memberId?: string;
}

/**
 * 團隊成員查詢選項
 * Team member query options
 */
export interface TeamMemberQueryOptions {
  /** 按團隊 ID 過濾 | Filter by team ID */
  teamId?: string;
  /** 按帳戶 ID 過濾 | Filter by account ID */
  accountId?: string;
  /** 按角色過濾 | Filter by role */
  role?: TeamMemberRole;
}
