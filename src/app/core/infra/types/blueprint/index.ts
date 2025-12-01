/**
 * Blueprint Types Module
 * 藍圖類型定義模組
 *
 * Exports all blueprint-related type definitions.
 * Types match PostgreSQL enums and table definitions in init.sql.
 *
 * @module core/infra/types/blueprint
 */

import { AccountStatus } from '../account';

// ============================================================================
// Blueprint Role Enums (藍圖角色枚舉)
// ============================================================================

/**
 * 藍圖成員角色枚舉
 * Blueprint member role enumeration
 *
 * Corresponds to database blueprint_role enum
 */
export enum BlueprintRole {
  /** 檢視者 - 僅檢視 | Viewer - read only */
  VIEWER = 'viewer',
  /** 貢獻者 - 可編輯內容 | Contributor - can edit content */
  CONTRIBUTOR = 'contributor',
  /** 維護者 - 可管理成員與設定 | Maintainer - can manage members and settings */
  MAINTAINER = 'maintainer'
}

/**
 * 藍圖團隊存取等級枚舉
 * Blueprint team access level enumeration
 *
 * Corresponds to database blueprint_team_access enum
 */
export enum BlueprintTeamAccess {
  /** 唯讀 | Read only */
  READ = 'read',
  /** 可寫入 | Write */
  WRITE = 'write',
  /** 完整管理權限 | Full admin */
  ADMIN = 'admin'
}

/**
 * 模組類型枚舉
 * Module type enumeration
 *
 * Corresponds to database module_type enum
 */
export enum ModuleType {
  /** 任務管理 | Task management */
  TASKS = 'tasks',
  /** 施工日誌 | Construction diary */
  DIARY = 'diary',
  /** 儀表板 | Dashboard */
  DASHBOARD = 'dashboard',
  /** 自動化流程 | Bot workflow */
  BOT_WORKFLOW = 'bot_workflow',
  /** 檔案管理 | File management */
  FILES = 'files',
  /** 待辦事項 | Todos */
  TODOS = 'todos',
  /** 檢查清單 | Checklists */
  CHECKLISTS = 'checklists',
  /** 問題追蹤 | Issue tracking */
  ISSUES = 'issues'
}

// ============================================================================
// Blueprint Entity Interfaces (藍圖實體介面)
// ============================================================================

/**
 * Blueprint entity interface
 * 藍圖實體介面
 *
 * Corresponds to database blueprints table
 */
export interface Blueprint {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_url?: string | null;
  is_public: boolean;
  status: AccountStatus;
  metadata?: Record<string, unknown>;
  enabled_modules: ModuleType[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * BlueprintMember entity interface
 * 藍圖成員實體介面
 *
 * Corresponds to database blueprint_members table
 */
export interface BlueprintMember {
  id: string;
  blueprint_id: string;
  account_id: string;
  role: BlueprintRole;
  is_external: boolean;
  invited_by?: string | null;
  invited_at?: string | null;
  /** 業務角色 | Business role for permission checking */
  business_role?: string | null;
  /** 自訂角色 ID | Reference to custom role definition */
  custom_role_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * BlueprintRoleDefinition entity interface
 * 藍圖角色定義實體介面
 *
 * Corresponds to database blueprint_roles table
 */
export interface BlueprintRoleDefinition {
  id: string;
  blueprint_id: string;
  name: string;
  display_name: string;
  description?: string | null;
  /** 業務角色 | Maps to permission set */
  business_role: string;
  /** 自訂權限 JSON | Custom permissions override */
  permissions?: string[];
  /** 是否為預設角色 | Cannot be deleted */
  is_default: boolean;
  sort_order: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * BlueprintTeamRole entity interface
 * 藍圖團隊授權實體介面
 *
 * Corresponds to database blueprint_team_roles table
 */
export interface BlueprintTeamRole {
  id: string;
  blueprint_id: string;
  team_id: string;
  access_level: BlueprintTeamAccess;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Blueprint Query Options (藍圖查詢選項)
// ============================================================================

/**
 * 藍圖查詢選項
 * Blueprint query options
 */
export interface BlueprintQueryOptions {
  /** 按擁有者過濾 | Filter by owner */
  ownerId?: string;
  /** 按狀態過濾 | Filter by status */
  status?: AccountStatus;
  /** 按公開性過濾 | Filter by public status */
  isPublic?: boolean;
  /** 是否包含已刪除的藍圖 | Include deleted blueprints */
  includeDeleted?: boolean;
}

/**
 * 藍圖成員查詢選項
 * Blueprint member query options
 */
export interface BlueprintMemberQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 帳戶 ID | Account ID */
  accountId?: string;
  /** 角色過濾 | Filter by role */
  role?: BlueprintRole;
  /** 是否外部協作者 | Filter by external status */
  isExternal?: boolean;
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type BlueprintModel = Blueprint;
export type BlueprintMemberModel = BlueprintMember;
export type BlueprintTeamRoleModel = BlueprintTeamRole;
export type BlueprintRoleDefinitionModel = BlueprintRoleDefinition;
