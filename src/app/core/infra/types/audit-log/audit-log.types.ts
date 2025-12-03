/**
 * Audit Log Types
 *
 * 審計日誌類型定義 - 企業級操作審計系統
 * Enterprise-grade audit log type definitions
 *
 * Design Principles:
 * - Immutable Records: 不可變記錄，確保審計完整性
 * - Evidence Chain: 行為證據鏈，支援法規合規
 * - Structured Logging: 結構化日誌，便於分析查詢
 * - Context-aware: 上下文感知，記錄完整操作環境
 *
 * @module core/infra/types/audit-log
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * 審計動作類型
 * Audit action types for categorizing operations
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'unassign'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'permission_change'
  | 'role_change'
  | 'status_change'
  | 'archive'
  | 'restore'
  | 'share'
  | 'comment'
  | 'upload'
  | 'download';

/**
 * 審計嚴重程度
 * Severity levels for audit events
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 審計實體類型
 * Entity types that can be audited
 */
export type AuditEntityType =
  | 'account'
  | 'organization'
  | 'blueprint'
  | 'task'
  | 'diary'
  | 'file'
  | 'issue'
  | 'checklist'
  | 'acceptance'
  | 'contract'
  | 'payment'
  | 'notification'
  | 'comment'
  | 'team'
  | 'role'
  | 'permission';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 審計日誌記錄
 * Immutable audit log entry
 */
export interface AuditLog {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID (資料隔離) */
  readonly blueprint_id: string | null;
  /** 組織 ID */
  readonly organization_id: string | null;
  /** 實體類型 */
  readonly entity_type: AuditEntityType;
  /** 實體 ID */
  readonly entity_id: string;
  /** 實體名稱 (快照) */
  readonly entity_name: string | null;
  /** 操作動作 */
  readonly action: AuditAction;
  /** 操作者 ID */
  readonly actor_id: string;
  /** 操作者名稱 (快照) */
  readonly actor_name: string | null;
  /** 操作者類型 */
  readonly actor_type: 'user' | 'system' | 'bot';
  /** 嚴重程度 */
  readonly severity: AuditSeverity;
  /** 舊值 (變更前狀態) */
  readonly old_value: Record<string, unknown> | null;
  /** 新值 (變更後狀態) */
  readonly new_value: Record<string, unknown> | null;
  /** 變更差異 */
  readonly changes: AuditChange[] | null;
  /** 操作元數據 */
  readonly metadata: AuditMetadata | null;
  /** 執行上下文 */
  readonly context: AuditContext | null;
  /** IP 地址 */
  readonly ip_address: string | null;
  /** 用戶代理 */
  readonly user_agent: string | null;
  /** 請求 ID (用於追蹤) */
  readonly request_id: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 審計變更記錄
 * Individual field change within an audit entry
 */
export interface AuditChange {
  /** 欄位名稱 */
  field: string;
  /** 欄位標籤 (顯示用) */
  label?: string;
  /** 舊值 */
  old_value: unknown;
  /** 新值 */
  new_value: unknown;
  /** 欄位類型 */
  field_type?: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
}

/**
 * 審計元數據
 * Additional metadata for audit context
 */
export interface AuditMetadata {
  /** 觸發來源 */
  source?: 'ui' | 'api' | 'trigger' | 'scheduler' | 'webhook';
  /** 模組名稱 */
  module?: string;
  /** 功能名稱 */
  feature?: string;
  /** 相關實體 */
  related_entities?: Array<{
    type: AuditEntityType;
    id: string;
    name?: string;
  }>;
  /** 批次操作 ID */
  batch_id?: string;
  /** 自訂標籤 */
  tags?: string[];
  /** 變更摘要 */
  changes_summary?: string[];
  /** 額外資訊 */
  extra?: Record<string, unknown>;
}

/**
 * 審計執行上下文
 * Execution context for the audit event
 */
export interface AuditContext {
  /** 會話 ID */
  session_id?: string;
  /** 工作區 ID */
  workspace_id?: string;
  /** 路由路徑 */
  route?: string;
  /** HTTP 方法 */
  method?: string;
  /** API 端點 */
  endpoint?: string;
  /** 執行時間 (ms) */
  duration_ms?: number;
  /** 是否成功 */
  success?: boolean;
  /** 錯誤訊息 */
  error_message?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 建立審計日誌請求
 * Request payload for creating audit log entries
 */
export interface CreateAuditLogRequest {
  blueprint_id?: string | null;
  organization_id?: string | null;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name?: string | null;
  action: AuditAction;
  actor_id: string;
  actor_name?: string | null;
  actor_type?: 'user' | 'system' | 'bot';
  severity?: AuditSeverity;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  changes?: AuditChange[] | null;
  metadata?: AuditMetadata | null;
  context?: AuditContext | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
}

/**
 * 審計日誌查詢選項
 * Query options for filtering audit logs
 */
export interface AuditLogQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 組織 ID */
  organizationId?: string;
  /** 實體類型 */
  entityType?: AuditEntityType | AuditEntityType[];
  /** 實體 ID */
  entityId?: string;
  /** 操作動作 */
  action?: AuditAction | AuditAction[];
  /** 操作者 ID */
  actorId?: string;
  /** 嚴重程度 */
  severity?: AuditSeverity | AuditSeverity[];
  /** 開始時間 */
  startDate?: string;
  /** 結束時間 */
  endDate?: string;
  /** 搜尋關鍵字 */
  search?: string;
  /** 排序欄位 */
  orderBy?: 'created_at' | 'entity_type' | 'action' | 'severity';
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 分頁 - 頁碼 */
  page?: number;
  /** 分頁 - 每頁數量 */
  pageSize?: number;
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 審計日誌分頁結果
 * Paginated result for audit log queries
 */
export interface AuditLogPageResult {
  /** 資料列表 */
  data: AuditLog[];
  /** 總數量 */
  total: number;
  /** 當前頁碼 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總頁數 */
  totalPages: number;
}

// ============================================================================
// Aggregation Types
// ============================================================================

/**
 * 審計日誌統計
 * Aggregated statistics for audit logs
 */
export interface AuditLogStats {
  /** 總記錄數 */
  total_count: number;
  /** 按動作分組統計 */
  by_action: Record<AuditAction, number>;
  /** 按實體類型分組統計 */
  by_entity_type: Record<AuditEntityType, number>;
  /** 按嚴重程度分組統計 */
  by_severity: Record<AuditSeverity, number>;
  /** 按日期分組統計 */
  by_date: Array<{ date: string; count: number }>;
  /** 最活躍操作者 */
  top_actors: Array<{ actor_id: string; actor_name: string; count: number }>;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 審計動作配置
 * Configuration for audit actions
 */
export const AUDIT_ACTION_CONFIG: Record<
  AuditAction,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  create: { label: '建立', icon: 'plus-circle', color: 'green' },
  update: { label: '更新', icon: 'edit', color: 'blue' },
  delete: { label: '刪除', icon: 'delete', color: 'red' },
  view: { label: '查看', icon: 'eye', color: 'default' },
  export: { label: '匯出', icon: 'export', color: 'cyan' },
  import: { label: '匯入', icon: 'import', color: 'purple' },
  approve: { label: '核准', icon: 'check-circle', color: 'green' },
  reject: { label: '駁回', icon: 'close-circle', color: 'red' },
  assign: { label: '指派', icon: 'user-add', color: 'blue' },
  unassign: { label: '取消指派', icon: 'user-delete', color: 'orange' },
  login: { label: '登入', icon: 'login', color: 'green' },
  logout: { label: '登出', icon: 'logout', color: 'default' },
  password_change: { label: '密碼變更', icon: 'lock', color: 'orange' },
  permission_change: { label: '權限變更', icon: 'safety', color: 'orange' },
  role_change: { label: '角色變更', icon: 'team', color: 'purple' },
  status_change: { label: '狀態變更', icon: 'swap', color: 'blue' },
  archive: { label: '封存', icon: 'container', color: 'default' },
  restore: { label: '還原', icon: 'redo', color: 'green' },
  share: { label: '分享', icon: 'share-alt', color: 'cyan' },
  comment: { label: '評論', icon: 'message', color: 'default' },
  upload: { label: '上傳', icon: 'upload', color: 'blue' },
  download: { label: '下載', icon: 'download', color: 'cyan' }
};

/**
 * 審計嚴重程度配置
 * Configuration for audit severity levels
 */
export const AUDIT_SEVERITY_CONFIG: Record<
  AuditSeverity,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  info: { label: '資訊', color: 'blue', icon: 'info-circle' },
  warning: { label: '警告', color: 'orange', icon: 'warning' },
  error: { label: '錯誤', color: 'red', icon: 'close-circle' },
  critical: { label: '嚴重', color: 'red', icon: 'exclamation-circle' }
};

/**
 * 審計實體類型配置
 * Configuration for audit entity types
 */
export const AUDIT_ENTITY_TYPE_CONFIG: Record<
  AuditEntityType,
  {
    label: string;
    icon: string;
  }
> = {
  account: { label: '帳戶', icon: 'user' },
  organization: { label: '組織', icon: 'bank' },
  blueprint: { label: '藍圖', icon: 'project' },
  task: { label: '任務', icon: 'carry-out' },
  diary: { label: '日誌', icon: 'file-text' },
  file: { label: '檔案', icon: 'file' },
  issue: { label: '問題', icon: 'warning' },
  checklist: { label: '清單', icon: 'check-square' },
  acceptance: { label: '驗收', icon: 'audit' },
  contract: { label: '合約', icon: 'file-done' },
  payment: { label: '付款', icon: 'dollar' },
  notification: { label: '通知', icon: 'bell' },
  comment: { label: '評論', icon: 'message' },
  team: { label: '團隊', icon: 'team' },
  role: { label: '角色', icon: 'idcard' },
  permission: { label: '權限', icon: 'safety' }
};
