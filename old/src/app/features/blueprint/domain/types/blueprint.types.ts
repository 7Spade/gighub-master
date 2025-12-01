/**
 * Blueprint Container Types
 *
 * Base type definitions for Blueprint Container system (邏輯容器)
 * Following vertical slice architecture and enterprise guidelines
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/types/blueprint.types
 */

/**
 * Blueprint status (matches account_status in database)
 */
export type BlueprintStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

/**
 * Blueprint role for members
 */
export type BlueprintRole = 'viewer' | 'contributor' | 'maintainer';

/**
 * Blueprint team access level
 */
export type BlueprintTeamAccess = 'read' | 'write' | 'admin';

/**
 * Module types available for blueprints
 */
export type ModuleType = 'tasks' | 'diary' | 'dashboard' | 'bot_workflow' | 'files' | 'todos' | 'checklists' | 'issues';

/**
 * Owner type - account types that can own blueprints
 * Note: Teams cannot own blueprints, only users and organizations
 */
export type OwnerType = 'user' | 'org';

/**
 * Base blueprint interface (matches database schema)
 */
export interface Blueprint {
  // Identity
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;

  // Visibility and status
  isPublic: boolean;
  status: BlueprintStatus;

  // Modules configuration
  enabledModules: ModuleType[];

  // Metadata (JSONB)
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Blueprint insert type (for creation)
 */
export interface BlueprintInsert {
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  status?: BlueprintStatus;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
}

/**
 * Blueprint update type (for modifications)
 */
export interface BlueprintUpdate {
  name?: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  status?: BlueprintStatus;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
}

/**
 * Blueprint member interface
 */
export interface BlueprintMember {
  id: string;
  blueprintId: string;
  accountId: string;
  role: BlueprintRole;
  isExternal: boolean;
  invitedBy?: string;
  invitedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Blueprint team role interface
 */
export interface BlueprintTeamRole {
  id: string;
  blueprintId: string;
  teamId: string;
  accessLevel: BlueprintTeamAccess;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type guards
 */
export function isBlueprintStatus(value: unknown): value is BlueprintStatus {
  return typeof value === 'string' && ['active', 'inactive', 'suspended', 'deleted'].includes(value);
}

export function isBlueprintRole(value: unknown): value is BlueprintRole {
  return typeof value === 'string' && ['viewer', 'contributor', 'maintainer'].includes(value);
}

export function isOwnerType(value: unknown): value is OwnerType {
  return typeof value === 'string' && ['user', 'org'].includes(value);
}

export function isModuleType(value: unknown): value is ModuleType {
  return (
    typeof value === 'string' && ['tasks', 'diary', 'dashboard', 'bot_workflow', 'files', 'todos', 'checklists', 'issues'].includes(value)
  );
}
