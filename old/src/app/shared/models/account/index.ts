/**
 * Account Models Module
 *
 * Exports all account-related business models (unified identity abstraction and business domains).
 * This includes user, organization, team, bot models for flat access.
 *
 * @module shared/models/account
 */

import { Database, AccountType, AccountStatus, ContextType, ContextState } from '@core';

import type { OrganizationBusinessModel } from './organization.models';
import type { TeamBusinessModel } from './team.models';
import type { UserAccountModel } from './user.models';

// ============================================================================
// Account Unified Identity Abstraction (統一身份抽象)
// ============================================================================

/**
 * Re-export account-related enumerations from core layer
 * This maintains backward compatibility and allows importing from @shared/models/account
 */
export { AccountType, AccountStatus, ContextType };
export type { ContextState };

/**
 * Account entity type (camelCase)
 * Note: BaseRepository automatically converts snake_case → camelCase
 *
 * This is the unified identity abstraction - the base type for all account types (User, Organization, Bot)
 */
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * 帳戶模型（業務層）
 * Account model (Business layer)
 *
 * Currently a type alias. In the future, can be extended with computed properties or business logic methods.
 * This represents the unified account abstraction before type discrimination.
 */
export type AccountModel = Account;

/**
 * 工作區資料
 * Workspace data
 *
 * Contains all data needed for workspace context switching.
 * This aggregates data from multiple business domains (user, organization, team).
 */
export interface WorkspaceData {
  /** 當前用戶帳戶 | Current user account */
  currentUserAccount: UserAccountModel | null;
  /** 用戶創建的組織 | Organizations created by user */
  createdOrganizations: OrganizationBusinessModel[];
  /** 用戶加入的組織 | Organizations user has joined */
  joinedOrganizations: OrganizationBusinessModel[];
  /** 用戶所屬團隊 | Teams user belongs to */
  userTeams: TeamBusinessModel[];
  /** 按組織分組的團隊 | Teams grouped by organization */
  teamsByOrganization: Map<string, TeamBusinessModel[]>;
}

/**
 * 上下文切換結果
 * Context switch result
 */
export interface ContextSwitchResult {
  success: boolean;
  previousContext: ContextState;
  newContext: ContextState;
  error?: string;
}

// ============================================================================
// Business Domain Models (業務域模型 - 扁平化導出)
// ============================================================================

// User domain models
export type { UserAccountEntity, UserAccountModel, CreateUserAccountRequest, UpdateUserAccountRequest } from './user.models';

// Organization domain models
export type {
  OrganizationModel,
  OrganizationBusinessModel,
  OrganizationMemberModel,
  OrganizationMemberDetail,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  AddOrganizationMemberRequest
} from './organization.models';

// Team domain models
export type {
  TeamModel,
  TeamBusinessModel,
  TeamMemberModel,
  TeamMemberDetail,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest
} from './team.models';

// Bot domain models
export type { BotModel, BotAccountModel, CreateBotRequest, UpdateBotRequest } from './bot.models';
