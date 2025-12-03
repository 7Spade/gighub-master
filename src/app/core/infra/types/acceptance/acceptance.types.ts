/**
 * Acceptance Types
 *
 * 驗收模組類型定義
 * Acceptance module type definitions
 *
 * Design Principles:
 * - Workflow-driven: 流程驅動的驗收管理
 * - Approval-based: 審批機制支援
 * - Evidence-chain: 完整的證據鏈
 * - Auditability: 可審計的驗收記錄
 *
 * @module core/infra/types/acceptance
 */

// ============================================================================
// Enums (aligned with database schema)
// ============================================================================

/**
 * 驗收狀態
 * Acceptance status
 */
export type AcceptanceStatus =
  | 'pending' // 待驗收
  | 'in_progress' // 驗收中
  | 'passed' // 驗收通過
  | 'failed' // 驗收失敗
  | 'conditionally_passed' // 有條件通過
  | 'cancelled'; // 已取消

/**
 * 驗收類型
 * Acceptance type
 */
export type AcceptanceType =
  | 'interim' // 期中驗收
  | 'final' // 最終驗收
  | 'partial' // 部分驗收
  | 'stage' // 階段驗收
  | 'completion'; // 完工驗收

/**
 * 驗收決定類型
 * Acceptance decision type
 */
export type AcceptanceDecision =
  | 'approve' // 核准
  | 'reject' // 駁回
  | 'conditional' // 有條件核准
  | 'defer'; // 延後

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 驗收記錄
 * Acceptance record
 */
export interface Acceptance {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID */
  readonly blueprint_id: string;
  /** 關聯任務 ID */
  readonly task_id: string | null;
  /** 關聯品管檢查 ID */
  readonly qc_inspection_id: string | null;
  /** 驗收編號 */
  readonly acceptance_code: string;
  /** 驗收標題 */
  readonly title: string;
  /** 驗收說明 */
  readonly description: string | null;
  /** 驗收類型 */
  readonly acceptance_type: AcceptanceType;
  /** 狀態 */
  readonly status: AcceptanceStatus;
  /** 驗收範圍說明 */
  readonly scope: string | null;
  /** 驗收標準 */
  readonly criteria: string | null;
  /** 驗收決定 */
  readonly decision: AcceptanceDecision | null;
  /** 決定理由 */
  readonly decision_reason: string | null;
  /** 條件說明 */
  readonly conditions: string | null;
  /** 申請人 ID */
  readonly applicant_id: string | null;
  /** 審核人 ID */
  readonly reviewer_id: string | null;
  /** 核准人 ID */
  readonly approver_id: string | null;
  /** 申請時間 */
  readonly applied_at: string | null;
  /** 預定驗收日期 */
  readonly scheduled_date: string | null;
  /** 實際驗收時間 */
  readonly acceptance_date: string | null;
  /** 決定時間 */
  readonly decided_at: string | null;
  /** 備註 */
  readonly notes: string | null;
  /** 元數據 */
  readonly metadata: Record<string, unknown> | null;
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
 * 驗收審批記錄
 * Acceptance approval record
 */
export interface AcceptanceApproval {
  /** 唯一識別碼 */
  readonly id: string;
  /** 驗收 ID */
  readonly acceptance_id: string;
  /** 審批人 ID */
  readonly approver_id: string;
  /** 決定 */
  readonly decision: AcceptanceDecision;
  /** 評論 */
  readonly comments: string | null;
  /** 審批順序 */
  readonly approval_order: number;
  /** 審批時間 */
  readonly approved_at: string;
}

/**
 * 驗收附件
 * Acceptance attachment
 */
export interface AcceptanceAttachment {
  /** 唯一識別碼 */
  readonly id: string;
  /** 驗收 ID */
  readonly acceptance_id: string;
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
  /** 文件類型 */
  readonly document_type: string | null;
  /** 上傳者 */
  readonly uploaded_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 擴展驗收記錄 (包含關聯資料)
 * Extended acceptance with related data
 */
export interface AcceptanceWithDetails extends Acceptance {
  /** 審批記錄列表 */
  approvals?: AcceptanceApproval[];
  /** 附件列表 */
  attachments?: AcceptanceAttachment[];
  /** 申請人資訊 */
  applicant?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 審核人資訊 */
  reviewer?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 核准人資訊 */
  approver?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 關聯品管檢查 */
  qc_inspection?: {
    id: string;
    inspection_code: string;
    title: string;
    status: string;
    pass_rate: number;
  } | null;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 建立驗收請求
 * Create acceptance request
 */
export interface CreateAcceptanceRequest {
  blueprint_id: string;
  task_id?: string | null;
  qc_inspection_id?: string | null;
  acceptance_code?: string;
  title: string;
  description?: string | null;
  acceptance_type?: AcceptanceType;
  scope?: string | null;
  criteria?: string | null;
  applicant_id?: string | null;
  reviewer_id?: string | null;
  approver_id?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 更新驗收請求
 * Update acceptance request
 */
export interface UpdateAcceptanceRequest {
  title?: string;
  description?: string | null;
  acceptance_type?: AcceptanceType;
  status?: AcceptanceStatus;
  scope?: string | null;
  criteria?: string | null;
  decision?: AcceptanceDecision | null;
  decision_reason?: string | null;
  conditions?: string | null;
  reviewer_id?: string | null;
  approver_id?: string | null;
  scheduled_date?: string | null;
  acceptance_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 驗收決定請求
 * Acceptance decision request
 */
export interface AcceptanceDecisionRequest {
  decision: AcceptanceDecision;
  decision_reason?: string | null;
  conditions?: string | null;
  comments?: string | null;
}

/**
 * 驗收查詢選項
 * Acceptance query options
 */
export interface AcceptanceQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 任務 ID */
  taskId?: string;
  /** 品管檢查 ID */
  qcInspectionId?: string;
  /** 狀態 */
  status?: AcceptanceStatus | AcceptanceStatus[];
  /** 驗收類型 */
  acceptanceType?: AcceptanceType | AcceptanceType[];
  /** 申請人 ID */
  applicantId?: string;
  /** 審核人 ID */
  reviewerId?: string;
  /** 核准人 ID */
  approverId?: string;
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 是否包含已刪除 */
  includeDeleted?: boolean;
  /** 是否包含審批記錄 */
  includeApprovals?: boolean;
  /** 是否包含附件 */
  includeAttachments?: boolean;
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 驗收分頁結果
 * Acceptance paginated result
 */
export interface AcceptancePageResult {
  /** 資料列表 */
  data: Acceptance[];
  /** 總數量 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 驗收狀態配置
 * Acceptance status configuration
 */
export const ACCEPTANCE_STATUS_CONFIG: Record<
  AcceptanceStatus,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  pending: { label: '待驗收', color: 'default', icon: 'clock-circle' },
  in_progress: { label: '驗收中', color: 'processing', icon: 'sync' },
  passed: { label: '驗收通過', color: 'success', icon: 'check-circle' },
  failed: { label: '驗收失敗', color: 'error', icon: 'close-circle' },
  conditionally_passed: { label: '有條件通過', color: 'warning', icon: 'warning' },
  cancelled: { label: '已取消', color: 'default', icon: 'stop' }
};

/**
 * 驗收類型配置
 * Acceptance type configuration
 */
export const ACCEPTANCE_TYPE_CONFIG: Record<
  AcceptanceType,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  interim: { label: '期中驗收', description: '施工過程中的階段性驗收', icon: 'partition' },
  final: { label: '最終驗收', description: '全部工程完成後的最終驗收', icon: 'crown' },
  partial: { label: '部分驗收', description: '部分區域或項目的驗收', icon: 'block' },
  stage: { label: '階段驗收', description: '特定施工階段的驗收', icon: 'node-index' },
  completion: { label: '完工驗收', description: '工程完工驗收', icon: 'flag' }
};

/**
 * 驗收決定配置
 * Acceptance decision configuration
 */
export const ACCEPTANCE_DECISION_CONFIG: Record<
  AcceptanceDecision,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  approve: { label: '核准', color: 'success', icon: 'check' },
  reject: { label: '駁回', color: 'error', icon: 'close' },
  conditional: { label: '有條件核准', color: 'warning', icon: 'warning' },
  defer: { label: '延後', color: 'default', icon: 'pause' }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 產生驗收編號
 * Generate acceptance code
 */
export function generateAcceptanceCode(type: AcceptanceType = 'interim'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  const prefix = {
    interim: 'IA',
    final: 'FA',
    partial: 'PA',
    stage: 'SA',
    completion: 'CA'
  }[type];

  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * 判斷驗收是否可以進行決定
 * Check if acceptance can be decided
 */
export function canMakeDecision(acceptance: Acceptance): boolean {
  return acceptance.status === 'in_progress' && acceptance.decision === null;
}

/**
 * 判斷驗收是否已完成
 * Check if acceptance is completed
 */
export function isAcceptanceCompleted(acceptance: Acceptance): boolean {
  return ['passed', 'failed', 'conditionally_passed', 'cancelled'].includes(acceptance.status);
}

/**
 * 從驗收決定取得對應狀態
 * Get status from acceptance decision
 */
export function getStatusFromDecision(decision: AcceptanceDecision): AcceptanceStatus {
  switch (decision) {
    case 'approve':
      return 'passed';
    case 'reject':
      return 'failed';
    case 'conditional':
      return 'conditionally_passed';
    case 'defer':
      return 'pending';
  }
}
