/**
 * Organization Business Models
 *
 * 組織業務模型定義（業務層）
 * Organization business model definitions (Business Layer)
 *
 * @module shared/models/account
 */

import {
  AccountType,
  AccountStatus,
  Organization,
  OrganizationMember,
  OrganizationRole
} from '@core';

/**
 * Organization entity type (camelCase)
 */
export type OrganizationModel = Organization;

/**
 * 組織模型（業務層）
 * Organization model (Business layer)
 *
 * Organizations are accounts with type='org'
 */
export interface OrganizationBusinessModel extends Organization {
  type?: typeof AccountType.ORG;
  /** 組織成員數 | Member count (optional, populated separately) */
  memberCount?: number;
  /** 團隊數 | Team count (optional, populated separately) */
  teamCount?: number;
}

/**
 * OrganizationMember entity type (camelCase)
 */
export type OrganizationMemberModel = OrganizationMember;

/**
 * 組織成員詳細資訊
 * Organization member detail
 *
 * Combines OrganizationMember with Account information
 */
export interface OrganizationMemberDetail extends OrganizationMember {
  /** 成員帳戶資訊 | Member account info */
  account?: Organization;
}

/**
 * 創建組織請求
 * Create organization request
 */
export interface CreateOrganizationRequest {
  name: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}

/**
 * 更新組織請求
 * Update organization request
 */
export interface UpdateOrganizationRequest {
  name?: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}

/**
 * 添加組織成員請求
 * Add organization member request
 */
export interface AddOrganizationMemberRequest {
  organizationId: string;
  accountId: string;
  role: OrganizationRole;
}
