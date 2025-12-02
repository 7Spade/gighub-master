/**
 * Permission Types Module
 * 權限類型定義模組
 *
 * Exports all permission-related type definitions for RBAC.
 *
 * @module core/infra/types/permission
 */

// ============================================================================
// Blueprint Business Role Enums (藍圖業務角色枚舉)
// ============================================================================

/**
 * 藍圖業務角色枚舉
 * Blueprint business role enumeration
 *
 * These are high-level business roles that map to permissions.
 * Based on architecture-rules.md specification.
 */
export enum BlueprintBusinessRole {
  /** 專案經理 - 最高藍圖級權限 | Project Manager - highest blueprint-level authority */
  PROJECT_MANAGER = 'project_manager',
  /** 工地主任 - 現場管理權限 | Site Director - on-site management */
  SITE_DIRECTOR = 'site_director',
  /** 現場監督 - 現場監督權限 | Site Supervisor - on-site supervision */
  SITE_SUPERVISOR = 'site_supervisor',
  /** 施工人員 - 任務執行權限 | Worker - task execution */
  WORKER = 'worker',
  /** 品管人員 - 品質驗收權限 | QA Staff - quality assurance */
  QA_STAFF = 'qa_staff',
  /** 公共安全衛生 - 安全衛生管理 | Safety & Health - safety and health management */
  SAFETY_HEALTH = 'safety_health',
  /** 財務 - 財務管理權限 | Finance - financial management */
  FINANCE = 'finance',
  /** 觀察者 - 僅檢視權限 | Observer - view only */
  OBSERVER = 'observer'
}

// ============================================================================
// Permission Definitions (權限定義)
// ============================================================================

/**
 * 權限定義枚舉
 * Permission definition enumeration
 *
 * Fine-grained permissions for RBAC.
 */
export enum Permission {
  // Blueprint permissions
  BLUEPRINT_READ = 'blueprint:read',
  BLUEPRINT_WRITE = 'blueprint:write',
  BLUEPRINT_DELETE = 'blueprint:delete',
  BLUEPRINT_MANAGE_MEMBERS = 'blueprint:manage_members',
  BLUEPRINT_MANAGE_SETTINGS = 'blueprint:manage_settings',

  // Task permissions
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  TASK_REVIEW = 'task:review',

  // Diary permissions
  DIARY_READ = 'diary:read',
  DIARY_CREATE = 'diary:create',
  DIARY_UPDATE = 'diary:update',
  DIARY_DELETE = 'diary:delete',
  DIARY_APPROVE = 'diary:approve',

  // Issue permissions
  ISSUE_READ = 'issue:read',
  ISSUE_CREATE = 'issue:create',
  ISSUE_UPDATE = 'issue:update',
  ISSUE_DELETE = 'issue:delete',
  ISSUE_ASSIGN = 'issue:assign',
  ISSUE_RESOLVE = 'issue:resolve',

  // Checklist & Acceptance permissions
  CHECKLIST_READ = 'checklist:read',
  CHECKLIST_MANAGE = 'checklist:manage',
  ACCEPTANCE_PERFORM = 'acceptance:perform',
  ACCEPTANCE_APPROVE = 'acceptance:approve',

  // File permissions
  FILE_READ = 'file:read',
  FILE_UPLOAD = 'file:upload',
  FILE_DELETE = 'file:delete',
  FILE_SHARE = 'file:share',

  // Todo permissions
  TODO_READ = 'todo:read',
  TODO_MANAGE = 'todo:manage',

  // Notification permissions
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_MANAGE = 'notification:manage'
}

// ============================================================================
// Role-Permission Mappings (角色權限映射)
// ============================================================================

/**
 * 角色權限映射
 * Role to permission mappings
 *
 * Maps each business role to its granted permissions.
 */
export const ROLE_PERMISSIONS: Record<BlueprintBusinessRole, Permission[]> = {
  [BlueprintBusinessRole.PROJECT_MANAGER]: [
    // Blueprint - full access
    Permission.BLUEPRINT_READ,
    Permission.BLUEPRINT_WRITE,
    Permission.BLUEPRINT_DELETE,
    Permission.BLUEPRINT_MANAGE_MEMBERS,
    Permission.BLUEPRINT_MANAGE_SETTINGS,
    // Tasks - full access
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_REVIEW,
    // Diary - full access
    Permission.DIARY_READ,
    Permission.DIARY_CREATE,
    Permission.DIARY_UPDATE,
    Permission.DIARY_DELETE,
    Permission.DIARY_APPROVE,
    // Issues - full access
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_DELETE,
    Permission.ISSUE_ASSIGN,
    Permission.ISSUE_RESOLVE,
    // Checklists & Acceptance - full access
    Permission.CHECKLIST_READ,
    Permission.CHECKLIST_MANAGE,
    Permission.ACCEPTANCE_PERFORM,
    Permission.ACCEPTANCE_APPROVE,
    // Files - full access
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
    Permission.FILE_SHARE,
    // Todos - full access
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications - full access
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_MANAGE
  ],

  [BlueprintBusinessRole.SITE_DIRECTOR]: [
    // Blueprint - read and write
    Permission.BLUEPRINT_READ,
    Permission.BLUEPRINT_WRITE,
    // Tasks - full operational access
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    Permission.TASK_REVIEW,
    // Diary - full access
    Permission.DIARY_READ,
    Permission.DIARY_CREATE,
    Permission.DIARY_UPDATE,
    Permission.DIARY_DELETE,
    Permission.DIARY_APPROVE,
    // Issues - operational access
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_ASSIGN,
    Permission.ISSUE_RESOLVE,
    // Checklists & Acceptance
    Permission.CHECKLIST_READ,
    Permission.CHECKLIST_MANAGE,
    Permission.ACCEPTANCE_PERFORM,
    Permission.ACCEPTANCE_APPROVE,
    // Files - operational access
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
    Permission.FILE_SHARE,
    // Todos
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_MANAGE
  ],

  [BlueprintBusinessRole.WORKER]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - create and update own
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    // Diary - create and update own
    Permission.DIARY_READ,
    Permission.DIARY_CREATE,
    Permission.DIARY_UPDATE,
    // Issues - create and update own
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    // Checklists - read only
    Permission.CHECKLIST_READ,
    // Files - read and upload
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    // Todos - own only
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications - own only
    Permission.NOTIFICATION_READ
  ],

  [BlueprintBusinessRole.QA_STAFF]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - read and review
    Permission.TASK_READ,
    Permission.TASK_REVIEW,
    // Diary - read only
    Permission.DIARY_READ,
    // Issues - full access for quality issues
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_ASSIGN,
    Permission.ISSUE_RESOLVE,
    // Checklists & Acceptance - full access
    Permission.CHECKLIST_READ,
    Permission.CHECKLIST_MANAGE,
    Permission.ACCEPTANCE_PERFORM,
    Permission.ACCEPTANCE_APPROVE,
    // Files - read and upload
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    // Todos
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications
    Permission.NOTIFICATION_READ
  ],

  [BlueprintBusinessRole.SITE_SUPERVISOR]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - supervision access
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_REVIEW,
    // Diary - full access
    Permission.DIARY_READ,
    Permission.DIARY_CREATE,
    Permission.DIARY_UPDATE,
    Permission.DIARY_APPROVE,
    // Issues - full access
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_ASSIGN,
    Permission.ISSUE_RESOLVE,
    // Checklists & Acceptance - read and perform
    Permission.CHECKLIST_READ,
    Permission.ACCEPTANCE_PERFORM,
    // Files - read and upload
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    // Todos
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_MANAGE
  ],

  [BlueprintBusinessRole.SAFETY_HEALTH]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - read and review safety-related
    Permission.TASK_READ,
    Permission.TASK_REVIEW,
    // Diary - read access
    Permission.DIARY_READ,
    // Issues - full access for safety issues
    Permission.ISSUE_READ,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_ASSIGN,
    Permission.ISSUE_RESOLVE,
    // Checklists & Acceptance - full access for safety
    Permission.CHECKLIST_READ,
    Permission.CHECKLIST_MANAGE,
    Permission.ACCEPTANCE_PERFORM,
    Permission.ACCEPTANCE_APPROVE,
    // Files - read and upload
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    // Todos
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_MANAGE
  ],

  [BlueprintBusinessRole.FINANCE]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - read only
    Permission.TASK_READ,
    // Diary - read only
    Permission.DIARY_READ,
    // Issues - read only
    Permission.ISSUE_READ,
    // Checklists - read only
    Permission.CHECKLIST_READ,
    // Files - read and upload (for financial documents)
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    // Todos
    Permission.TODO_READ,
    Permission.TODO_MANAGE,
    // Notifications
    Permission.NOTIFICATION_READ
  ],

  [BlueprintBusinessRole.OBSERVER]: [
    // Blueprint - read only
    Permission.BLUEPRINT_READ,
    // Tasks - read only
    Permission.TASK_READ,
    // Diary - read only
    Permission.DIARY_READ,
    // Issues - read only
    Permission.ISSUE_READ,
    // Checklists - read only
    Permission.CHECKLIST_READ,
    // Files - read only
    Permission.FILE_READ,
    // Notifications - own only
    Permission.NOTIFICATION_READ
  ]
};

// ============================================================================
// Helper Functions (輔助函數)
// ============================================================================

/**
 * 獲取角色的權限列表
 * Get permissions for a given business role
 */
export function getPermissionsForRole(role: BlueprintBusinessRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 檢查角色是否擁有指定權限
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: BlueprintBusinessRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * 獲取多個角色的合併權限列表（去重）
 * Get combined permissions for multiple roles (deduplicated)
 */
export function getCombinedPermissions(roles: BlueprintBusinessRole[]): Permission[] {
  const permissionSet = new Set<Permission>();
  for (const role of roles) {
    const permissions = getPermissionsForRole(role);
    permissions.forEach(p => permissionSet.add(p));
  }
  return Array.from(permissionSet);
}

// ============================================================================
// Permission Context Interface (權限上下文介面)
// ============================================================================

/**
 * 權限上下文介面
 * Permission context interface
 *
 * Holds the current user's permission context for a blueprint.
 */
export interface PermissionContext {
  /** 用戶 ID | User account ID */
  accountId: string;
  /** 藍圖 ID | Blueprint ID */
  blueprintId: string;
  /** 業務角色列表 | List of business roles */
  businessRoles: BlueprintBusinessRole[];
  /** 權限列表 | List of permissions */
  permissions: Permission[];
  /** 是否為藍圖擁有者 | Is blueprint owner */
  isOwner: boolean;
  /** 是否為外部協作者 | Is external collaborator */
  isExternal: boolean;
}
