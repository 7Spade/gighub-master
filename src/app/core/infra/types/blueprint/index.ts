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
 *
 * Following Occam's Razor principle:
 * - Core modules: tasks, diary, checklists, issues, files, financial
 * - Optional: acceptance
 * - Deprecated: dashboard, bot_workflow, todos (kept for backward compatibility)
 */
export enum ModuleType {
  // ============ Core Modules (核心模組) ============
  /** 任務管理 | Task management */
  TASKS = 'tasks',
  /** 施工日誌 | Construction diary */
  DIARY = 'diary',
  /** 檢查清單 | Checklists */
  CHECKLISTS = 'checklists',
  /** 問題追蹤 | Issue tracking */
  ISSUES = 'issues',
  /** 檔案管理 | File management */
  FILES = 'files',
  /** 財務管理 | Financial management */
  FINANCIAL = 'financial',

  // ============ Optional Modules (選用模組) ============
  /** 品質驗收 | Acceptance */
  ACCEPTANCE = 'acceptance',

  // ============ Deprecated (保留但不推薦) ============
  /** @deprecated 使用獨立視圖而非模組 | Use standalone view instead */
  DASHBOARD = 'dashboard',
  /** @deprecated 進階功能，暫不支援 | Advanced feature, not supported yet */
  BOT_WORKFLOW = 'bot_workflow',
  /** @deprecated 與 tasks 功能重複 | Redundant with tasks */
  TODOS = 'todos'
}

/**
 * Essential module configuration
 * 核心模組配置（依據奧卡姆剃刀原則）
 */
export interface ModuleConfig {
  value: ModuleType;
  label: string;
  icon: string;
  description: string;
  isCore: boolean;
}

/**
 * Essential modules list for blueprint creation
 * 藍圖建立時的核心模組列表
 */
export const ESSENTIAL_MODULES: ModuleConfig[] = [
  { value: ModuleType.TASKS, label: '任務管理', icon: 'ordered-list', description: '工作項目追蹤與進度管理', isCore: true },
  { value: ModuleType.DIARY, label: '施工日誌', icon: 'file-text', description: '每日施工記錄與天氣', isCore: true },
  { value: ModuleType.CHECKLISTS, label: '品質管控', icon: 'check-square', description: '品質檢查與巡檢清單', isCore: true },
  { value: ModuleType.ISSUES, label: '問題追蹤', icon: 'warning', description: '施工問題登記與追蹤', isCore: true },
  { value: ModuleType.FILES, label: '檔案管理', icon: 'folder', description: '專案文件與圖面管理', isCore: true },
  { value: ModuleType.FINANCIAL, label: '財務管理', icon: 'dollar', description: '合約、費用與請款管理', isCore: true },
  { value: ModuleType.ACCEPTANCE, label: '品質驗收', icon: 'audit', description: '工程驗收與簽核', isCore: false }
];

/**
 * Extended module configuration with routing info
 * 擴展模組配置，包含路由資訊
 *
 * Following Occam's Razor principle: single source of truth for all module metadata
 */
export interface ExtendedModuleConfig extends ModuleConfig {
  /** Route path segment (e.g., 'tasks', 'qc-inspections') */
  routePath: string;
  /** Component name for documentation */
  componentName: string;
}

/**
 * Complete modules configuration with routing information
 * 完整模組配置（包含路由資訊）
 *
 * Single source of truth for all module metadata including:
 * - Module type identifiers (ModuleType enum values)
 * - Display labels (Chinese localization)
 * - Icons (ng-zorro-antd icon names)
 * - Descriptions (feature explanations)
 * - Core vs optional classification
 * - Route path segments (URL paths)
 * - Component names (for documentation)
 *
 * **Route Path Mapping Notes**:
 * Some modules have route paths that differ from their type names due to historical reasons:
 * - CHECKLISTS → 'qc-inspections' (originally designed for QC inspection workflows)
 * - ISSUES → 'problems' (user-facing term for issue tracking)
 * - DIARY → 'diaries' (plural form for consistency with other routes)
 * - ACCEPTANCE → 'acceptances' (plural form for consistency)
 *
 * These differences are intentional and should not be changed to maintain
 * backward compatibility with existing URLs and bookmarks.
 *
 * **Usage Examples**:
 * ```typescript
 * // Get module configuration
 * const config = getModuleConfig(ModuleType.TASKS);
 * console.log(config.label); // "任務管理"
 * console.log(config.routePath); // "tasks"
 *
 * // Get configuration by route
 * const config2 = getModuleConfigByRoute('qc-inspections');
 * console.log(config2?.value); // ModuleType.CHECKLISTS
 *
 * // Check if core module
 * const coreModules = getCoreModules();
 * console.log(coreModules.length); // 6
 * ```
 */
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  {
    value: ModuleType.TASKS,
    label: '任務管理',
    icon: 'ordered-list',
    description: '工作項目追蹤與進度管理',
    isCore: true,
    routePath: 'tasks',
    componentName: 'BlueprintTasksComponent'
  },
  {
    value: ModuleType.DIARY,
    label: '施工日誌',
    icon: 'file-text',
    description: '每日施工記錄與天氣',
    isCore: true,
    routePath: 'diaries',
    componentName: 'BlueprintDiariesComponent'
  },
  {
    value: ModuleType.CHECKLISTS,
    label: '品質管控',
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'qc-inspections',
    componentName: 'BlueprintQcInspectionsComponent'
  },
  {
    value: ModuleType.ISSUES,
    label: '問題追蹤',
    icon: 'warning',
    description: '施工問題登記與追蹤',
    isCore: true,
    routePath: 'problems',
    componentName: 'BlueprintProblemsComponent'
  },
  {
    value: ModuleType.FILES,
    label: '檔案管理',
    icon: 'folder',
    description: '專案文件與圖面管理',
    isCore: true,
    routePath: 'files',
    componentName: 'BlueprintFilesComponent'
  },
  {
    value: ModuleType.FINANCIAL,
    label: '財務管理',
    icon: 'dollar',
    description: '合約、費用與請款管理',
    isCore: true,
    routePath: 'financial',
    componentName: 'FinancialOverviewComponent'
  },
  {
    value: ModuleType.ACCEPTANCE,
    label: '品質驗收',
    icon: 'audit',
    description: '工程驗收與簽核',
    isCore: false,
    routePath: 'acceptances',
    componentName: 'BlueprintAcceptancesComponent'
  }
];

/**
 * Default enabled modules for new blueprints
 * 新藍圖的預設啟用模組
 *
 * Following Occam's Razor: enable only essential modules by default
 */
export const DEFAULT_ENABLED_MODULES: ModuleType[] = [
  ModuleType.TASKS,
  ModuleType.DIARY,
  ModuleType.CHECKLISTS,
  ModuleType.FILES
];

/**
 * Get module config by module type
 * 根據模組類型獲取配置
 */
export function getModuleConfig(moduleType: ModuleType): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.value === moduleType);
}

/**
 * Get module config by route path
 * 根據路由路徑獲取配置
 */
export function getModuleConfigByRoute(routePath: string): ExtendedModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.routePath === routePath);
}

/**
 * Check if module should be enabled by default
 * 檢查模組是否應該預設啟用
 */
export function isModuleEnabledByDefault(module: ModuleType): boolean {
  return DEFAULT_ENABLED_MODULES.includes(module);
}

/**
 * Get all core modules
 * 獲取所有核心模組
 */
export function getCoreModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => m.isCore);
}

/**
 * Get all optional modules
 * 獲取所有選用模組
 */
export function getOptionalModules(): ExtendedModuleConfig[] {
  return MODULES_CONFIG.filter(m => !m.isCore);
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
