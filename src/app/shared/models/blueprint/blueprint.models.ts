/**
 * Blueprint Business Models
 *
 * 藍圖業務模型定義（業務層）
 * Blueprint business model definitions (Business Layer)
 *
 * @module shared/models/blueprint
 */

import {
  AccountStatus,
  Blueprint,
  BlueprintMember,
  BlueprintRole,
  ModuleType
} from '@core';

/**
 * Blueprint entity type
 */
export type BlueprintModel = Blueprint;

/**
 * 藍圖模型（業務層）
 * Blueprint model (Business layer)
 */
export interface BlueprintBusinessModel extends Blueprint {
  /** 成員數 | Member count (optional, populated separately) */
  memberCount?: number;
  /** 任務數 | Task count (optional, populated separately) */
  taskCount?: number;
  /** 擁有者名稱 | Owner name (optional, populated separately) */
  ownerName?: string;
}

/**
 * BlueprintMember entity type
 */
export type BlueprintMemberModel = BlueprintMember;

/**
 * 藍圖成員詳細資訊
 * Blueprint member detail
 *
 * Combines BlueprintMember with Account information
 */
export interface BlueprintMemberDetail extends BlueprintMember {
  /** 成員帳戶名稱 | Member account name */
  accountName?: string;
  /** 成員帳戶頭像 | Member account avatar */
  accountAvatar?: string | null;
  /** 成員帳戶電子郵件 | Member account email */
  accountEmail?: string | null;
}

/**
 * 創建藍圖請求
 * Create blueprint request
 */
export interface CreateBlueprintRequest {
  ownerId: string;
  name: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
}

/**
 * 更新藍圖請求
 * Update blueprint request
 */
export interface UpdateBlueprintRequest {
  name?: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  status?: AccountStatus;
  enabledModules?: ModuleType[];
}

/**
 * 添加藍圖成員請求
 * Add blueprint member request
 */
export interface AddBlueprintMemberRequest {
  blueprintId: string;
  accountId: string;
  role: BlueprintRole;
  isExternal?: boolean;
}

/**
 * 更新藍圖成員請求
 * Update blueprint member request
 */
export interface UpdateBlueprintMemberRequest {
  role?: BlueprintRole;
  isExternal?: boolean;
}
