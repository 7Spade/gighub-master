/**
 * API Constants
 *
 * Constants for Blueprint feature API configuration
 * Following enterprise development guidelines
 *
 * @module features/blueprint/constants/api.constants
 */

/**
 * API endpoint paths (relative to Supabase base URL)
 */
export const API_ENDPOINTS = {
  /** Blueprint table */
  BLUEPRINTS: 'blueprints',
  /** Task table */
  TASKS: 'tasks',
  /** Workspace table */
  WORKSPACES: 'workspaces',
  /** Workspace members table */
  WORKSPACE_MEMBERS: 'workspace_members',
  /** Blueprint tags table */
  BLUEPRINT_TAGS: 'blueprint_tags',
  /** Task tags table */
  TASK_TAGS: 'task_tags',
  /** Task dependencies table */
  TASK_DEPENDENCIES: 'task_dependencies',
  /** Activity logs table */
  ACTIVITY_LOGS: 'activity_logs'
} as const;

/**
 * API query defaults
 */
export const API_QUERY_DEFAULTS = {
  /** Default page size */
  PAGE_SIZE: 20,
  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
  /** Default sort field */
  SORT_FIELD: 'created_at',
  /** Default sort direction */
  SORT_DIRECTION: 'desc' as const,
  /** Select all columns */
  SELECT_ALL: '*'
} as const;

/**
 * API timeout configuration (ms)
 */
export const API_TIMEOUTS = {
  /** Default request timeout */
  DEFAULT: 30000,
  /** Long running request timeout */
  LONG: 60000,
  /** File upload timeout */
  UPLOAD: 120000,
  /** Realtime subscription timeout */
  REALTIME: 0 // No timeout for realtime
} as const;

/**
 * API retry configuration
 */
export const API_RETRY_CONFIG = {
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
  /** Initial retry delay (ms) */
  INITIAL_DELAY: 1000,
  /** Maximum retry delay (ms) */
  MAX_DELAY: 10000,
  /** Backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
  /** Retryable HTTP status codes */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504]
} as const;

/**
 * API cache configuration
 */
export const API_CACHE_CONFIG = {
  /** Default cache TTL (ms) */
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  /** Short cache TTL (ms) */
  SHORT_TTL: 1 * 60 * 1000, // 1 minute
  /** Long cache TTL (ms) */
  LONG_TTL: 30 * 60 * 1000, // 30 minutes
  /** Cache key prefix */
  KEY_PREFIX: 'blueprint_',
  /** Enable cache by default */
  ENABLED: true
} as const;

/**
 * Supabase RLS policy names (for reference)
 */
export const RLS_POLICIES = {
  BLUEPRINTS: {
    SELECT_OWN: 'blueprints_select_own',
    SELECT_PUBLIC: 'blueprints_select_public',
    INSERT: 'blueprints_insert',
    UPDATE_OWN: 'blueprints_update_own',
    DELETE_OWN: 'blueprints_delete_own'
  },
  TASKS: {
    SELECT: 'tasks_select',
    INSERT: 'tasks_insert',
    UPDATE: 'tasks_update',
    DELETE: 'tasks_delete'
  },
  WORKSPACES: {
    SELECT_TENANT: 'workspaces_select_tenant',
    INSERT: 'workspaces_insert',
    UPDATE_MEMBER: 'workspaces_update_member',
    DELETE_OWNER: 'workspaces_delete_owner'
  }
} as const;

/**
 * API error codes
 */
export const API_ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',

  // Authorization errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_INSUFFICIENT: 'ROLE_INSUFFICIENT',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT'
} as const;

/**
 * API error messages (localized)
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  [API_ERROR_CODES.AUTH_REQUIRED]: '請先登入',
  [API_ERROR_CODES.AUTH_EXPIRED]: '登入已過期，請重新登入',
  [API_ERROR_CODES.AUTH_INVALID]: '認證無效',
  [API_ERROR_CODES.PERMISSION_DENIED]: '權限不足',
  [API_ERROR_CODES.ROLE_INSUFFICIENT]: '角色權限不足',
  [API_ERROR_CODES.VALIDATION_FAILED]: '資料驗證失敗',
  [API_ERROR_CODES.INVALID_INPUT]: '輸入資料無效',
  [API_ERROR_CODES.NOT_FOUND]: '資源不存在',
  [API_ERROR_CODES.ALREADY_EXISTS]: '資源已存在',
  [API_ERROR_CODES.CONFLICT]: '資源衝突',
  [API_ERROR_CODES.INTERNAL_ERROR]: '伺服器內部錯誤',
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: '服務暫時無法使用',
  [API_ERROR_CODES.RATE_LIMITED]: '請求過於頻繁，請稍後再試',
  [API_ERROR_CODES.NETWORK_ERROR]: '網路連線錯誤',
  [API_ERROR_CODES.TIMEOUT]: '請求逾時'
} as const;

/**
 * Realtime channel names
 */
export const REALTIME_CHANNELS = {
  BLUEPRINTS: 'blueprints_changes',
  TASKS: 'tasks_changes',
  WORKSPACES: 'workspaces_changes',
  ACTIVITIES: 'activities_changes'
} as const;

/**
 * Realtime event types
 */
export const REALTIME_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ALL: '*'
} as const;
