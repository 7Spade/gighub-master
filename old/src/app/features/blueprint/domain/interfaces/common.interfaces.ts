/**
 * Common Interfaces
 *
 * Shared interface definitions used across Blueprint feature
 * Following enterprise development guidelines
 *
 * @module features/blueprint/domain/interfaces/common.interfaces
 */

/**
 * Generic paginated response interface
 */
export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

/**
 * Pagination meta information interface
 */
export interface IPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic API response interface
 */
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: IApiError;
  timestamp: Date;
}

/**
 * API error interface
 */
export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Generic entity metadata interface
 */
export interface IEntityMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

/**
 * Audit log entry interface
 */
export interface IAuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete';
  userId: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Feature toggle interface
 */
export interface IFeatureToggle {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: IFeatureCondition[];
}

/**
 * Feature condition interface
 */
export interface IFeatureCondition {
  type: 'user' | 'organization' | 'team' | 'percentage' | 'date';
  value: string | number | Date;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
}

/**
 * Notification interface
 */
export interface INotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  createdAt: Date;
}

/**
 * Search result interface
 */
export interface ISearchResult<T> {
  item: T;
  score: number;
  highlights?: ISearchHighlight[];
}

/**
 * Search highlight interface
 */
export interface ISearchHighlight {
  field: string;
  snippet: string;
  positions: number[][];
}

/**
 * Batch operation result interface
 */
export interface IBatchOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: IBatchOperationError[];
}

/**
 * Batch operation error interface
 */
export interface IBatchOperationError {
  index: number;
  entityId?: string;
  error: string;
}

/**
 * Permission check result interface
 */
export interface IPermissionCheckResult {
  allowed: boolean;
  reason?: string;
  missingPermissions?: string[];
}

/**
 * Date range interface
 */
export interface IDateRange {
  from: Date;
  to: Date;
}

/**
 * Key-value pair interface
 */
export interface IKeyValuePair<T = unknown> {
  key: string;
  value: T;
}

/**
 * Select option interface for dropdowns
 */
export interface ISelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: string;
  description?: string;
  group?: string;
}

/**
 * Tree node interface
 */
export interface ITreeNode<T = unknown> {
  id: string;
  label: string;
  data?: T;
  children?: Array<ITreeNode<T>>;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
}
