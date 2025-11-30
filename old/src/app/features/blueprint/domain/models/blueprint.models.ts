/**
 * Blueprint Models
 *
 * Business models for Blueprint Container
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/models/blueprint.models
 */

import { Blueprint, BlueprintStatus, BlueprintRole, ModuleType } from '../types';

/**
 * Blueprint Model (re-export from types with business context)
 */
export type BlueprintModel = Blueprint;

/**
 * Blueprint summary for list display
 */
export interface BlueprintSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  status: BlueprintStatus;
  enabledModules: ModuleType[];
  createdAt: Date;
}

/**
 * Blueprint creation request
 */
export interface CreateBlueprintRequest {
  name: string;
  slug?: string; // Optional: auto-generate from name if not provided
  description?: string;
  ownerId: string;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
}

/**
 * Blueprint update request
 */
export interface UpdateBlueprintRequest {
  name?: string;
  slug?: string;
  description?: string;
  isPublic?: boolean;
  status?: BlueprintStatus;
  enabledModules?: ModuleType[];
}

/**
 * Blueprint statistics
 */
export interface BlueprintStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

/**
 * Blueprint filter options
 */
export interface BlueprintFilterOptions {
  isPublic?: boolean;
  status?: BlueprintStatus;
  ownerId?: string;
  searchTerm?: string;
}

/**
 * Blueprint member request
 */
export interface AddBlueprintMemberRequest {
  blueprintId: string;
  accountId: string;
  role: BlueprintRole;
  isExternal?: boolean;
}
