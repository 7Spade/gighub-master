/**
 * Quality Control (QC) Types
 *
 * 品質控制模組類型定義
 * Quality Control module type definitions
 *
 * Design Principles:
 * - Standards-based: 基於檢查標準的評估
 * - Evidence-driven: 證據驅動的品質追蹤
 * - Traceability: 可追溯的檢查記錄
 * - Integration: 與任務、日誌、驗收模組整合
 *
 * @module core/infra/types/qc
 */

// ============================================================================
// Enums (aligned with database schema)
// ============================================================================

/**
 * 品管檢查狀態
 * QC inspection status
 */
export type QcInspectionStatus =
  | 'pending' // 待檢查
  | 'in_progress' // 檢查中
  | 'passed' // 通過
  | 'failed' // 未通過
  | 'conditionally_passed' // 有條件通過
  | 'cancelled'; // 已取消

/**
 * 品管檢查類型
 * QC inspection type
 */
export type QcInspectionType =
  | 'self_check' // 自主檢查
  | 'supervisor_check' // 主管檢查
  | 'third_party' // 第三方檢查
  | 'random_check' // 隨機抽查
  | 'final_check'; // 最終檢查

/**
 * 品管檢查項目狀態
 * QC item status
 */
export type QcItemStatus =
  | 'pending' // 待檢查
  | 'passed' // 合格
  | 'failed' // 不合格
  | 'na'; // 不適用

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 品管檢查記錄
 * QC inspection record
 */
export interface QcInspection {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID */
  readonly blueprint_id: string;
  /** 關聯任務 ID */
  readonly task_id: string | null;
  /** 關聯日誌 ID */
  readonly diary_id: string | null;
  /** 檢查編號 */
  readonly inspection_code: string;
  /** 檢查標題 */
  readonly title: string;
  /** 檢查說明 */
  readonly description: string | null;
  /** 檢查類型 */
  readonly inspection_type: QcInspectionType;
  /** 狀態 */
  readonly status: QcInspectionStatus;
  /** 通過項目數 */
  readonly passed_count: number;
  /** 未通過項目數 */
  readonly failed_count: number;
  /** 總項目數 */
  readonly total_count: number;
  /** 通過率 */
  readonly pass_rate: number;
  /** 檢查員 ID */
  readonly inspector_id: string | null;
  /** 審核人 ID */
  readonly reviewer_id: string | null;
  /** 預定檢查日期 */
  readonly scheduled_date: string | null;
  /** 實際檢查時間 */
  readonly inspection_date: string | null;
  /** 審核時間 */
  readonly reviewed_at: string | null;
  /** 備註 */
  readonly notes: string | null;
  /** 發現問題 */
  readonly findings: string | null;
  /** 建議事項 */
  readonly recommendations: string | null;
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
 * 品管檢查項目
 * QC inspection item
 */
export interface QcInspectionItem {
  /** 唯一識別碼 */
  readonly id: string;
  /** 檢查 ID */
  readonly inspection_id: string;
  /** 項目編號 */
  readonly item_code: string;
  /** 項目標題 */
  readonly title: string;
  /** 項目說明 */
  readonly description: string | null;
  /** 檢查標準 */
  readonly standard: string | null;
  /** 狀態 */
  readonly status: QcItemStatus;
  /** 實測值 */
  readonly actual_value: string | null;
  /** 標準值 */
  readonly expected_value: string | null;
  /** 偏差說明 */
  readonly deviation: string | null;
  /** 評分 */
  readonly score: number | null;
  /** 權重 */
  readonly weight: number;
  /** 備註 */
  readonly notes: string | null;
  /** 排序 */
  readonly sort_order: number;
  /** 檢查時間 */
  readonly checked_at: string | null;
  /** 檢查人 */
  readonly checked_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
  /** 更新時間 */
  readonly updated_at: string;
}

/**
 * 品管檢查附件
 * QC inspection attachment
 */
export interface QcInspectionAttachment {
  /** 唯一識別碼 */
  readonly id: string;
  /** 檢查 ID */
  readonly inspection_id: string | null;
  /** 項目 ID */
  readonly item_id: string | null;
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
  /** 上傳者 */
  readonly uploaded_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 擴展檢查記錄 (包含關聯資料)
 * Extended inspection with related data
 */
export interface QcInspectionWithDetails extends QcInspection {
  /** 檢查項目列表 */
  items?: QcInspectionItem[];
  /** 附件列表 */
  attachments?: QcInspectionAttachment[];
  /** 檢查員資訊 */
  inspector?: {
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
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 建立品管檢查請求
 * Create QC inspection request
 */
export interface CreateQcInspectionRequest {
  blueprint_id: string;
  task_id?: string | null;
  diary_id?: string | null;
  inspection_code?: string;
  title: string;
  description?: string | null;
  inspection_type?: QcInspectionType;
  inspector_id?: string | null;
  reviewer_id?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 更新品管檢查請求
 * Update QC inspection request
 */
export interface UpdateQcInspectionRequest {
  title?: string;
  description?: string | null;
  inspection_type?: QcInspectionType;
  status?: QcInspectionStatus;
  inspector_id?: string | null;
  reviewer_id?: string | null;
  scheduled_date?: string | null;
  inspection_date?: string | null;
  notes?: string | null;
  findings?: string | null;
  recommendations?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 建立品管檢查項目請求
 * Create QC inspection item request
 */
export interface CreateQcInspectionItemRequest {
  inspection_id: string;
  item_code?: string;
  title: string;
  description?: string | null;
  standard?: string | null;
  expected_value?: string | null;
  weight?: number;
  sort_order?: number;
}

/**
 * 更新品管檢查項目請求
 * Update QC inspection item request
 */
export interface UpdateQcInspectionItemRequest {
  title?: string;
  description?: string | null;
  standard?: string | null;
  status?: QcItemStatus;
  actual_value?: string | null;
  expected_value?: string | null;
  deviation?: string | null;
  score?: number | null;
  weight?: number;
  notes?: string | null;
  sort_order?: number;
}

/**
 * 品管檢查查詢選項
 * QC inspection query options
 */
export interface QcInspectionQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 任務 ID */
  taskId?: string;
  /** 日誌 ID */
  diaryId?: string;
  /** 狀態 */
  status?: QcInspectionStatus | QcInspectionStatus[];
  /** 檢查類型 */
  inspectionType?: QcInspectionType | QcInspectionType[];
  /** 檢查員 ID */
  inspectorId?: string;
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 是否包含已刪除 */
  includeDeleted?: boolean;
  /** 是否包含項目 */
  includeItems?: boolean;
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
 * 品管檢查分頁結果
 * QC inspection paginated result
 */
export interface QcInspectionPageResult {
  /** 資料列表 */
  data: QcInspection[];
  /** 總數量 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 檢查狀態配置
 * Inspection status configuration
 */
export const QC_INSPECTION_STATUS_CONFIG: Record<
  QcInspectionStatus,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  pending: { label: '待檢查', color: 'default', icon: 'clock-circle' },
  in_progress: { label: '檢查中', color: 'processing', icon: 'sync' },
  passed: { label: '通過', color: 'success', icon: 'check-circle' },
  failed: { label: '未通過', color: 'error', icon: 'close-circle' },
  conditionally_passed: { label: '有條件通過', color: 'warning', icon: 'warning' },
  cancelled: { label: '已取消', color: 'default', icon: 'stop' }
};

/**
 * 檢查類型配置
 * Inspection type configuration
 */
export const QC_INSPECTION_TYPE_CONFIG: Record<
  QcInspectionType,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  self_check: { label: '自主檢查', description: '施工團隊自行檢查', icon: 'user' },
  supervisor_check: { label: '主管檢查', description: '主管監督檢查', icon: 'team' },
  third_party: { label: '第三方檢查', description: '獨立第三方機構檢查', icon: 'bank' },
  random_check: { label: '隨機抽查', description: '不定期隨機抽查', icon: 'thunderbolt' },
  final_check: { label: '最終檢查', description: '完工前最終檢查', icon: 'flag' }
};

/**
 * 項目狀態配置
 * Item status configuration
 */
export const QC_ITEM_STATUS_CONFIG: Record<
  QcItemStatus,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  pending: { label: '待檢查', color: 'default', icon: 'clock-circle' },
  passed: { label: '合格', color: 'success', icon: 'check-circle' },
  failed: { label: '不合格', color: 'error', icon: 'close-circle' },
  na: { label: '不適用', color: 'default', icon: 'minus-circle' }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 計算檢查通過率
 * Calculate inspection pass rate
 */
export function calculatePassRate(passedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((passedCount / totalCount) * 100 * 100) / 100;
}

/**
 * 根據通過率決定檢查狀態
 * Determine inspection status based on pass rate
 */
export function determineInspectionStatus(passRate: number, hasFailedItems: boolean): QcInspectionStatus {
  if (passRate === 100) return 'passed';
  if (passRate >= 80 && hasFailedItems) return 'conditionally_passed';
  if (hasFailedItems) return 'failed';
  return 'in_progress';
}

/**
 * 產生檢查編號
 * Generate inspection code
 */
export function generateInspectionCode(prefix = 'QC'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
}
