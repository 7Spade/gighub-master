/**
 * Blueprint Enums
 *
 * Enum definitions for Blueprint business logic
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/enums/blueprint.enums
 */

/**
 * Blueprint status enum (matches account_status in database)
 */
export enum BlueprintStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * Blueprint role enum for members
 */
export enum BlueprintRoleEnum {
  VIEWER = 'viewer',
  CONTRIBUTOR = 'contributor',
  MAINTAINER = 'maintainer'
}

/**
 * Blueprint team access level enum
 */
export enum BlueprintTeamAccessEnum {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

/**
 * Module type enum for blueprint enabled_modules
 */
export enum ModuleTypeEnum {
  TASKS = 'tasks',
  DIARY = 'diary',
  DASHBOARD = 'dashboard',
  BOT_WORKFLOW = 'bot_workflow',
  FILES = 'files',
  TODOS = 'todos',
  CHECKLISTS = 'checklists',
  ISSUES = 'issues'
}
