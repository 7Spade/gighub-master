/**
 * Team Business Models
 *
 * 團隊業務模型定義（業務層）
 * Team business model definitions (Business Layer)
 *
 * @module shared/models/account
 */

import { Team, TeamMember, TeamMemberRole } from '@core';

/**
 * Team entity type (camelCase)
 */
export type TeamModel = Team;

/**
 * 團隊模型（業務層）
 * Team model (Business layer)
 */
export interface TeamBusinessModel extends Team {
  /** 所屬組織名稱 | Organization name (optional, populated via join) */
  organizationName?: string;
  /** 團隊成員數 | Member count (optional, populated separately) */
  memberCount?: number;
}

/**
 * TeamMember entity type (camelCase)
 */
export type TeamMemberModel = TeamMember;

/**
 * 團隊成員詳細資訊
 * Team member detail
 *
 * Combines TeamMember with Account information
 */
export interface TeamMemberDetail extends TeamMember {
  /** 成員帳戶資訊 | Member account info */
  account?: Team;
}

/**
 * 創建團隊請求
 * Create team request
 */
export interface CreateTeamRequest {
  organizationId: string;
  name: string;
  description?: string;
  avatar?: string;
}

/**
 * 更新團隊請求
 * Update team request
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar?: string;
}

/**
 * 添加團隊成員請求
 * Add team member request
 */
export interface AddTeamMemberRequest {
  teamId: string;
  accountId: string;
  role: TeamMemberRole;
}
