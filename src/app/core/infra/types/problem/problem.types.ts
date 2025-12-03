/**
 * Problem Management Types
 *
 * 問題管理模組類型定義
 * Problem management module type definitions
 *
 * Design Principles:
 * - Lifecycle-driven: 完整的問題生命週期管理
 * - Traceability: 可追溯的問題處置記錄
 * - Knowledge-base: 支援知識庫累積
 * - Risk-aware: 風險意識的優先級管理
 *
 * Problem Lifecycle:
 * Open → Assessing → Assigned → In Progress → Resolved → Verifying → Closed
 *
 * @module core/infra/types/problem
 */

// ============================================================================
// Enums (aligned with database schema)
// ============================================================================

/**
 * 問題類型
 * Problem type
 */
export type ProblemType =
  | 'defect' // 缺陷
  | 'risk' // 風險
  | 'gap' // 差距
  | 'improvement' // 改善建議
  | 'change_request' // 變更請求
  | 'non_conformance' // 不符合
  | 'safety' // 安全問題
  | 'quality' // 品質問題
  | 'other'; // 其他

/**
 * 問題狀態 (生命週期)
 * Problem status (lifecycle)
 */
export type ProblemStatus =
  | 'open' // 開立
  | 'assessing' // 評估中
  | 'assigned' // 已分派
  | 'in_progress' // 處理中
  | 'resolved' // 已解決
  | 'verifying' // 驗證中
  | 'closed' // 已關閉
  | 'cancelled' // 已取消
  | 'deferred'; // 已延期

/**
 * 問題優先級
 * Problem priority
 */
export type ProblemPriority =
  | 'critical' // 嚴重
  | 'high' // 高
  | 'medium' // 中
  | 'low'; // 低

/**
 * 問題嚴重程度
 * Problem severity
 */
export type ProblemSeverity =
  | 'critical' // 嚴重
  | 'major' // 主要
  | 'minor' // 次要
  | 'cosmetic'; // 外觀

/**
 * 問題來源
 * Problem source
 */
export type ProblemSource =
  | 'qc_inspection' // 品管檢查
  | 'acceptance' // 驗收
  | 'self_report' // 自我回報
  | 'customer' // 客戶反映
  | 'audit' // 稽核
  | 'other'; // 其他

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 問題記錄
 * Problem record
 */
export interface Problem {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID */
  readonly blueprint_id: string;
  /** 關聯任務 ID */
  readonly task_id: string | null;
  /** 關聯品管檢查 ID */
  readonly qc_inspection_id: string | null;
  /** 關聯驗收 ID */
  readonly acceptance_id: string | null;
  /** 關聯品管項目 ID */
  readonly qc_item_id: string | null;
  /** 問題編號 */
  readonly problem_code: string;
  /** 問題標題 */
  readonly title: string;
  /** 問題描述 */
  readonly description: string | null;
  /** 問題類型 */
  readonly problem_type: ProblemType;
  /** 問題來源 */
  readonly source: ProblemSource;
  /** 狀態 */
  readonly status: ProblemStatus;
  /** 優先級 */
  readonly priority: ProblemPriority;
  /** 嚴重程度 */
  readonly severity: ProblemSeverity;
  /** 影響說明 */
  readonly impact_description: string | null;
  /** 影響成本 */
  readonly impact_cost: number | null;
  /** 影響工期 (天) */
  readonly impact_schedule: number | null;
  /** 高風險標記 */
  readonly risk_flag: boolean;
  /** 問題位置 */
  readonly location: string | null;
  /** 區域 */
  readonly area: string | null;
  /** 回報人 ID */
  readonly reporter_id: string | null;
  /** 負責人 ID */
  readonly assignee_id: string | null;
  /** 驗證人 ID */
  readonly verifier_id: string | null;
  /** 回報時間 */
  readonly reported_at: string;
  /** 目標完成日 */
  readonly target_date: string | null;
  /** 解決時間 */
  readonly resolved_at: string | null;
  /** 驗證時間 */
  readonly verified_at: string | null;
  /** 關閉時間 */
  readonly closed_at: string | null;
  /** 根本原因 */
  readonly root_cause: string | null;
  /** 解決方案 */
  readonly resolution: string | null;
  /** 預防措施 */
  readonly prevention: string | null;
  /** 備註 */
  readonly notes: string | null;
  /** 元數據 */
  readonly metadata: Record<string, unknown> | null;
  /** 是否納入知識庫 */
  readonly knowledge_base: boolean;
  /** 知識標籤 */
  readonly knowledge_tags: string[] | null;
  /** 建立者 */
  readonly created_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
  /** 更新時間 */
  readonly updated_at: string;
  /** 刪除時間 */
  readonly deleted_at: string | null;
}

/**
 * 問題處置記錄
 * Problem action record
 */
export interface ProblemAction {
  /** 唯一識別碼 */
  readonly id: string;
  /** 問題 ID */
  readonly problem_id: string;
  /** 處置類型 */
  readonly action_type: string;
  /** 處置說明 */
  readonly action_description: string;
  /** 原狀態 */
  readonly from_status: ProblemStatus | null;
  /** 新狀態 */
  readonly to_status: ProblemStatus | null;
  /** 操作者 ID */
  readonly actor_id: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 問題評論
 * Problem comment
 */
export interface ProblemComment {
  /** 唯一識別碼 */
  readonly id: string;
  /** 問題 ID */
  readonly problem_id: string;
  /** 父評論 ID */
  readonly parent_id: string | null;
  /** 評論內容 */
  readonly content: string;
  /** 作者 ID */
  readonly author_id: string;
  /** 建立時間 */
  readonly created_at: string;
  /** 更新時間 */
  readonly updated_at: string;
  /** 刪除時間 */
  readonly deleted_at: string | null;
}

/**
 * 問題附件
 * Problem attachment
 */
export interface ProblemAttachment {
  /** 唯一識別碼 */
  readonly id: string;
  /** 問題 ID */
  readonly problem_id: string;
  /** 檔案名稱 */
  readonly file_name: string;
  /** 檔案路徑 */
  readonly file_path: string;
  /** 檔案大小 */
  readonly file_size: number | null;
  /** MIME 類型 */
  readonly mime_type: string | null;
  /** 說明 */
  readonly caption: string | null;
  /** 附件類型 */
  readonly attachment_type: string | null;
  /** 上傳者 */
  readonly uploaded_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 擴展問題記錄 (包含關聯資料)
 * Extended problem with related data
 */
export interface ProblemWithDetails extends Problem {
  /** 處置記錄列表 */
  actions?: ProblemAction[];
  /** 評論列表 */
  comments?: ProblemComment[];
  /** 附件列表 */
  attachments?: ProblemAttachment[];
  /** 回報人資訊 */
  reporter?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 負責人資訊 */
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 驗證人資訊 */
  verifier?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 建立問題請求
 * Create problem request
 */
export interface CreateProblemRequest {
  blueprint_id: string;
  task_id?: string | null;
  qc_inspection_id?: string | null;
  acceptance_id?: string | null;
  qc_item_id?: string | null;
  problem_code?: string;
  title: string;
  description?: string | null;
  problem_type?: ProblemType;
  source?: ProblemSource;
  priority?: ProblemPriority;
  severity?: ProblemSeverity;
  impact_description?: string | null;
  impact_cost?: number | null;
  impact_schedule?: number | null;
  risk_flag?: boolean;
  location?: string | null;
  area?: string | null;
  assignee_id?: string | null;
  target_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 更新問題請求
 * Update problem request
 */
export interface UpdateProblemRequest {
  title?: string;
  description?: string | null;
  problem_type?: ProblemType;
  source?: ProblemSource;
  status?: ProblemStatus;
  priority?: ProblemPriority;
  severity?: ProblemSeverity;
  impact_description?: string | null;
  impact_cost?: number | null;
  impact_schedule?: number | null;
  risk_flag?: boolean;
  location?: string | null;
  area?: string | null;
  assignee_id?: string | null;
  verifier_id?: string | null;
  target_date?: string | null;
  root_cause?: string | null;
  resolution?: string | null;
  prevention?: string | null;
  notes?: string | null;
  knowledge_base?: boolean;
  knowledge_tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 問題狀態變更請求
 * Problem status change request
 */
export interface ProblemStatusChangeRequest {
  status: ProblemStatus;
  action_description: string;
  assignee_id?: string | null;
  verifier_id?: string | null;
  root_cause?: string | null;
  resolution?: string | null;
  prevention?: string | null;
}

/**
 * 問題查詢選項
 * Problem query options
 */
export interface ProblemQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 任務 ID */
  taskId?: string;
  /** 品管檢查 ID */
  qcInspectionId?: string;
  /** 驗收 ID */
  acceptanceId?: string;
  /** 狀態 */
  status?: ProblemStatus | ProblemStatus[];
  /** 問題類型 */
  problemType?: ProblemType | ProblemType[];
  /** 問題來源 */
  source?: ProblemSource | ProblemSource[];
  /** 優先級 */
  priority?: ProblemPriority | ProblemPriority[];
  /** 嚴重程度 */
  severity?: ProblemSeverity | ProblemSeverity[];
  /** 高風險標記 */
  riskFlag?: boolean;
  /** 負責人 ID */
  assigneeId?: string;
  /** 回報人 ID */
  reporterId?: string;
  /** 知識庫標記 */
  knowledgeBase?: boolean;
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 是否包含已刪除 */
  includeDeleted?: boolean;
  /** 是否包含處置記錄 */
  includeActions?: boolean;
  /** 是否包含評論 */
  includeComments?: boolean;
  /** 是否包含附件 */
  includeAttachments?: boolean;
  /** 搜尋關鍵字 */
  searchKeyword?: string;
  /** 排序欄位 */
  orderBy?: 'created_at' | 'updated_at' | 'priority' | 'severity' | 'target_date';
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 問題分頁結果
 * Problem paginated result
 */
export interface ProblemPageResult {
  /** 資料列表 */
  data: Problem[];
  /** 總數量 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 問題統計
 * Problem statistics
 */
export interface ProblemStats {
  /** 總數量 */
  total: number;
  /** 按狀態統計 */
  byStatus: Record<ProblemStatus, number>;
  /** 按類型統計 */
  byType: Record<ProblemType, number>;
  /** 按優先級統計 */
  byPriority: Record<ProblemPriority, number>;
  /** 按嚴重程度統計 */
  bySeverity: Record<ProblemSeverity, number>;
  /** 高風險數量 */
  highRiskCount: number;
  /** 開放中數量 */
  openCount: number;
  /** 已解決數量 */
  resolvedCount: number;
  /** 已關閉數量 */
  closedCount: number;
  /** 平均解決時間 (天) */
  avgResolutionTime: number | null;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 問題類型配置
 * Problem type configuration
 */
export const PROBLEM_TYPE_CONFIG: Record<
  ProblemType,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  defect: { label: '缺陷', description: '施工或產品缺陷', icon: 'bug', color: 'red' },
  risk: { label: '風險', description: '潛在風險項目', icon: 'warning', color: 'orange' },
  gap: { label: '差距', description: '與標準的差距', icon: 'disconnect', color: 'blue' },
  improvement: { label: '改善建議', description: '改善提案', icon: 'bulb', color: 'green' },
  change_request: { label: '變更請求', description: '設計或規格變更', icon: 'swap', color: 'purple' },
  non_conformance: { label: '不符合', description: '不符合規範', icon: 'close-circle', color: 'red' },
  safety: { label: '安全問題', description: '安全相關問題', icon: 'safety', color: 'red' },
  quality: { label: '品質問題', description: '品質相關問題', icon: 'safety-certificate', color: 'orange' },
  other: { label: '其他', description: '其他類型問題', icon: 'question-circle', color: 'default' }
};

/**
 * 問題狀態配置
 * Problem status configuration
 */
export const PROBLEM_STATUS_CONFIG: Record<
  ProblemStatus,
  {
    label: string;
    color: string;
    icon: string;
    description: string;
  }
> = {
  open: { label: '開立', color: 'default', icon: 'folder-open', description: '問題已開立，等待評估' },
  assessing: { label: '評估中', color: 'processing', icon: 'search', description: '正在評估問題影響和處理方式' },
  assigned: { label: '已分派', color: 'cyan', icon: 'user-add', description: '已分派負責人處理' },
  in_progress: { label: '處理中', color: 'blue', icon: 'sync', description: '正在處理中' },
  resolved: { label: '已解決', color: 'green', icon: 'check', description: '問題已解決，等待驗證' },
  verifying: { label: '驗證中', color: 'warning', icon: 'audit', description: '正在驗證解決方案' },
  closed: { label: '已關閉', color: 'success', icon: 'check-circle', description: '問題已關閉' },
  cancelled: { label: '已取消', color: 'default', icon: 'stop', description: '問題已取消' },
  deferred: { label: '已延期', color: 'default', icon: 'pause', description: '問題已延期處理' }
};

/**
 * 問題優先級配置
 * Problem priority configuration
 */
export const PROBLEM_PRIORITY_CONFIG: Record<
  ProblemPriority,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  critical: { label: '嚴重', color: 'red', icon: 'thunderbolt' },
  high: { label: '高', color: 'orange', icon: 'arrow-up' },
  medium: { label: '中', color: 'blue', icon: 'minus' },
  low: { label: '低', color: 'default', icon: 'arrow-down' }
};

/**
 * 問題嚴重程度配置
 * Problem severity configuration
 */
export const PROBLEM_SEVERITY_CONFIG: Record<
  ProblemSeverity,
  {
    label: string;
    color: string;
    description: string;
  }
> = {
  critical: { label: '嚴重', color: 'red', description: '嚴重影響功能或安全' },
  major: { label: '主要', color: 'orange', description: '明顯影響功能或品質' },
  minor: { label: '次要', color: 'blue', description: '輕微影響，可接受' },
  cosmetic: { label: '外觀', color: 'default', description: '僅影響外觀' }
};

/**
 * 問題來源配置
 * Problem source configuration
 */
export const PROBLEM_SOURCE_CONFIG: Record<
  ProblemSource,
  {
    label: string;
    icon: string;
  }
> = {
  qc_inspection: { label: '品管檢查', icon: 'safety-certificate' },
  acceptance: { label: '驗收', icon: 'audit' },
  self_report: { label: '自我回報', icon: 'user' },
  customer: { label: '客戶反映', icon: 'team' },
  audit: { label: '稽核', icon: 'file-search' },
  other: { label: '其他', icon: 'question-circle' }
};

// ============================================================================
// Status Transition Rules
// ============================================================================

/**
 * 有效的狀態轉換
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<ProblemStatus, ProblemStatus[]> = {
  open: ['assessing', 'assigned', 'cancelled', 'deferred'],
  assessing: ['assigned', 'open', 'cancelled', 'deferred'],
  assigned: ['in_progress', 'assessing', 'cancelled', 'deferred'],
  in_progress: ['resolved', 'assigned', 'cancelled', 'deferred'],
  resolved: ['verifying', 'in_progress'],
  verifying: ['closed', 'in_progress'],
  closed: [], // 已關閉的問題不可變更狀態
  cancelled: [], // 已取消的問題不可變更狀態
  deferred: ['open', 'assessing', 'assigned', 'cancelled']
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 產生問題編號
 * Generate problem code
 */
export function generateProblemCode(type: ProblemType = 'defect'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  const prefix = {
    defect: 'DEF',
    risk: 'RSK',
    gap: 'GAP',
    improvement: 'IMP',
    change_request: 'CHG',
    non_conformance: 'NCR',
    safety: 'SAF',
    quality: 'QUA',
    other: 'OTH'
  }[type];

  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * 檢查狀態轉換是否有效
 * Check if status transition is valid
 */
export function isValidStatusTransition(fromStatus: ProblemStatus, toStatus: ProblemStatus): boolean {
  return VALID_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * 判斷問題是否已關閉
 * Check if problem is closed
 */
export function isProblemClosed(problem: Problem): boolean {
  return ['closed', 'cancelled'].includes(problem.status);
}

/**
 * 判斷問題是否需要處理
 * Check if problem needs action
 */
export function needsAction(problem: Problem): boolean {
  return ['open', 'assessing', 'assigned', 'in_progress'].includes(problem.status);
}

/**
 * 計算問題處理時間 (天)
 * Calculate problem resolution time in days
 */
export function calculateResolutionTime(problem: Problem): number | null {
  if (!problem.resolved_at) return null;

  const reportedAt = new Date(problem.reported_at);
  const resolvedAt = new Date(problem.resolved_at);
  const diffTime = resolvedAt.getTime() - reportedAt.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 判斷問題是否逾期
 * Check if problem is overdue
 */
export function isOverdue(problem: Problem): boolean {
  if (!problem.target_date || isProblemClosed(problem)) return false;

  const targetDate = new Date(problem.target_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return targetDate < today;
}
