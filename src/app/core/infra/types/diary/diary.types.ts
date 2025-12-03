/**
 * Diary Types
 *
 * 施工日誌類型定義 - 現場證據紀錄系統
 * Construction diary type definitions - Field evidence recording system
 *
 * Design Principles:
 * - Field Evidence Records: 現場證據紀錄，確保施工透明度
 * - Construction Context: 施工上下文，記錄完整環境資訊
 * - Workflow-bound Notes: 工作流連結，支援審核流程
 * - Human-in-the-loop: 人機協作註記，保留人工審核能力
 *
 * @module core/infra/types/diary
 */

// ============================================================================
// Enums (aligned with database schema)
// ============================================================================

/**
 * 天氣類型 (aligned with database weather_type enum)
 */
export type WeatherType =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'light_rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'foggy'
  | 'windy'
  | 'snow'
  | 'other';

/**
 * 日誌狀態
 */
export type DiaryStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';

/**
 * 工項類型
 */
export type WorkItemType = 'construction' | 'inspection' | 'material' | 'equipment' | 'safety' | 'quality' | 'meeting' | 'other';

// ============================================================================
// Core Interfaces (aligned with database diaries table)
// ============================================================================

/**
 * 施工日誌
 * Construction diary record
 */
export interface Diary {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID */
  readonly blueprint_id: string;
  /** 工作日期 */
  readonly work_date: string;
  /** 天氣 */
  readonly weather: WeatherType | null;
  /** 最低溫度 (°C) */
  readonly temperature_min: number | null;
  /** 最高溫度 (°C) */
  readonly temperature_max: number | null;
  /** 工時 (小時) */
  readonly work_hours: number | null;
  /** 出工人數 */
  readonly worker_count: number | null;
  /** 摘要 */
  readonly summary: string | null;
  /** 備註 */
  readonly notes: string | null;
  /** 狀態 */
  readonly status: DiaryStatus;
  /** 建立者 ID */
  readonly created_by: string | null;
  /** 核准者 ID */
  readonly approved_by: string | null;
  /** 核准時間 */
  readonly approved_at: string | null;
  /** 建立時間 */
  readonly created_at: string;
  /** 更新時間 */
  readonly updated_at: string;
  /** 刪除時間 */
  readonly deleted_at: string | null;
}

/**
 * 日誌附件 (aligned with database diary_attachments table)
 * Diary attachment record
 */
export interface DiaryAttachment {
  /** 唯一識別碼 */
  readonly id: string;
  /** 日誌 ID */
  readonly diary_id: string;
  /** 檔案名稱 */
  readonly file_name: string;
  /** 檔案路徑 */
  readonly file_path: string;
  /** 檔案大小 (bytes) */
  readonly file_size: number | null;
  /** MIME 類型 */
  readonly mime_type: string | null;
  /** 圖說 */
  readonly caption: string | null;
  /** 上傳者 ID */
  readonly uploaded_by: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 日誌工項記錄
 * Diary work item entry
 */
export interface DiaryEntry {
  /** 唯一識別碼 */
  id: string;
  /** 日誌 ID */
  diary_id: string;
  /** 工項類型 */
  type: WorkItemType;
  /** 工項名稱 */
  title: string;
  /** 工項描述 */
  description: string | null;
  /** 數量 */
  quantity: number | null;
  /** 單位 */
  unit: string | null;
  /** 關聯任務 ID */
  task_id: string | null;
  /** 排序順序 */
  sort_order: number;
  /** 備註 */
  notes: string | null;
  /** 建立時間 */
  created_at: string;
  /** 更新時間 */
  updated_at: string;
}

/**
 * 擴展日誌 (包含關聯資料)
 * Extended diary with related data
 */
export interface DiaryWithDetails extends Diary {
  /** 建立者資訊 */
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 核准者資訊 */
  approver?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  /** 附件列表 */
  attachments?: DiaryAttachment[];
  /** 工項列表 */
  entries?: DiaryEntry[];
  /** 附件數量 */
  attachment_count?: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 建立日誌請求
 * Request payload for creating diary
 */
export interface CreateDiaryRequest {
  blueprint_id: string;
  work_date: string;
  weather?: WeatherType | null;
  temperature_min?: number | null;
  temperature_max?: number | null;
  work_hours?: number | null;
  worker_count?: number | null;
  summary?: string | null;
  notes?: string | null;
}

/**
 * 更新日誌請求
 * Request payload for updating diary
 */
export interface UpdateDiaryRequest {
  weather?: WeatherType | null;
  temperature_min?: number | null;
  temperature_max?: number | null;
  work_hours?: number | null;
  worker_count?: number | null;
  summary?: string | null;
  notes?: string | null;
  status?: DiaryStatus;
}

/**
 * 提交日誌請求
 * Request for submitting diary for approval
 */
export interface SubmitDiaryRequest {
  diary_id: string;
  summary?: string;
}

/**
 * 核准日誌請求
 * Request for approving diary
 */
export interface ApproveDiaryRequest {
  diary_id: string;
  comments?: string;
}

/**
 * 駁回日誌請求
 * Request for rejecting diary
 */
export interface RejectDiaryRequest {
  diary_id: string;
  reason: string;
}

/**
 * 新增附件請求
 * Request for adding attachment
 */
export interface AddDiaryAttachmentRequest {
  diary_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
}

/**
 * 新增工項請求
 * Request for adding diary entry
 */
export interface AddDiaryEntryRequest {
  diary_id: string;
  type: WorkItemType;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  task_id?: string | null;
  notes?: string | null;
}

/**
 * 日誌查詢選項
 * Query options for filtering diaries
 */
export interface DiaryQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 狀態 */
  status?: DiaryStatus | DiaryStatus[];
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 建立者 ID */
  createdBy?: string;
  /** 天氣類型 */
  weather?: WeatherType | WeatherType[];
  /** 搜尋關鍵字 */
  search?: string;
  /** 是否包含詳情 */
  includeDetails?: boolean;
  /** 排序欄位 */
  orderBy?: 'work_date' | 'created_at' | 'status';
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 日誌分頁結果
 * Paginated result for diary queries
 */
export interface DiaryPageResult {
  /** 資料列表 */
  data: Diary[] | DiaryWithDetails[];
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
// Statistics Types
// ============================================================================

/**
 * 日誌統計
 * Diary statistics
 */
export interface DiaryStats {
  /** 總日誌數 */
  total_count: number;
  /** 草稿數 */
  draft_count: number;
  /** 已提交數 */
  submitted_count: number;
  /** 已核准數 */
  approved_count: number;
  /** 已駁回數 */
  rejected_count: number;
  /** 總工時 */
  total_work_hours: number;
  /** 總出工人數 */
  total_worker_count: number;
  /** 平均每日工時 */
  avg_daily_hours: number;
  /** 平均每日人數 */
  avg_daily_workers: number;
}

/**
 * 月度日誌摘要
 * Monthly diary summary
 */
export interface MonthlyDiarySummary {
  /** 年月 */
  month: string;
  /** 工作天數 */
  working_days: number;
  /** 總工時 */
  total_hours: number;
  /** 總人力 */
  total_workers: number;
  /** 天氣分布 */
  weather_distribution: Record<WeatherType, number>;
  /** 已核准數 */
  approved_count: number;
  /** 待核准數 */
  pending_count: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 天氣類型配置
 * Configuration for weather types
 */
export const WEATHER_TYPE_CONFIG: Record<
  WeatherType,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  sunny: { label: '晴天', icon: 'sun', color: 'orange' },
  cloudy: { label: '多雲', icon: 'cloud', color: 'default' },
  overcast: { label: '陰天', icon: 'cloud', color: 'default' },
  light_rain: { label: '小雨', icon: 'cloud-rain', color: 'blue' },
  heavy_rain: { label: '大雨', icon: 'cloud-showers-heavy', color: 'blue' },
  thunderstorm: { label: '雷雨', icon: 'bolt', color: 'purple' },
  foggy: { label: '起霧', icon: 'smog', color: 'default' },
  windy: { label: '強風', icon: 'wind', color: 'cyan' },
  snow: { label: '下雪', icon: 'snowflake', color: 'cyan' },
  other: { label: '其他', icon: 'question-circle', color: 'default' }
};

/**
 * 日誌狀態配置
 * Configuration for diary status
 */
export const DIARY_STATUS_CONFIG: Record<
  DiaryStatus,
  {
    label: string;
    color: string;
    icon: string;
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
  }
> = {
  draft: {
    label: '草稿',
    color: 'default',
    icon: 'edit',
    canEdit: true,
    canSubmit: true,
    canApprove: false
  },
  submitted: {
    label: '已提交',
    color: 'processing',
    icon: 'clock-circle',
    canEdit: false,
    canSubmit: false,
    canApprove: true
  },
  approved: {
    label: '已核准',
    color: 'success',
    icon: 'check-circle',
    canEdit: false,
    canSubmit: false,
    canApprove: false
  },
  rejected: {
    label: '已駁回',
    color: 'error',
    icon: 'close-circle',
    canEdit: true,
    canSubmit: true,
    canApprove: false
  },
  archived: {
    label: '已封存',
    color: 'default',
    icon: 'container',
    canEdit: false,
    canSubmit: false,
    canApprove: false
  }
};

/**
 * 工項類型配置
 * Configuration for work item types
 */
export const WORK_ITEM_TYPE_CONFIG: Record<
  WorkItemType,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  construction: { label: '施工', icon: 'build', color: 'orange' },
  inspection: { label: '檢查', icon: 'eye', color: 'blue' },
  material: { label: '材料', icon: 'inbox', color: 'green' },
  equipment: { label: '設備', icon: 'tool', color: 'purple' },
  safety: { label: '安全', icon: 'safety', color: 'red' },
  quality: { label: '品質', icon: 'audit', color: 'gold' },
  meeting: { label: '會議', icon: 'team', color: 'cyan' },
  other: { label: '其他', icon: 'more', color: 'default' }
};
