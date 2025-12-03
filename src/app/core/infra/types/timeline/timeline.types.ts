/**
 * Timeline Types
 *
 * 時間軸服務類型定義 - 跨模組活動追蹤
 * Cross-module activity tracking timeline type definitions
 *
 * Design Principles:
 * - Temporal Ordering: 事件時間序，確保因果一致性
 * - Cross-module Sync: 跨模組事件對齊
 * - Projection Model: 視圖投影，支援多種時間軸視圖
 * - Causal Consistency: 因果一致性，確保事件順序正確
 *
 * @module core/infra/types/timeline
 */

// ============================================================================
// Enums (aligned with database schema)
// ============================================================================

/**
 * 活動類型 (aligned with database activity_type enum)
 */
export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'comment'
  | 'assign'
  | 'status_change'
  | 'attachment'
  | 'approval'
  | 'mention'
  | 'share'
  | 'move'
  | 'archive'
  | 'restore';

/**
 * 實體類型 (aligned with database entity_type enum)
 */
export type TimelineEntityType =
  | 'blueprint'
  | 'task'
  | 'diary'
  | 'checklist'
  | 'checklist_item'
  | 'issue'
  | 'todo'
  | 'file'
  | 'acceptance'
  | 'comment';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 活動記錄 (aligned with database activities table)
 * Activity record for timeline display
 */
export interface Activity {
  /** 唯一識別碼 */
  readonly id: string;
  /** 藍圖 ID */
  readonly blueprint_id: string;
  /** 實體類型 */
  readonly entity_type: TimelineEntityType;
  /** 實體 ID */
  readonly entity_id: string;
  /** 活動類型 */
  readonly activity_type: ActivityType;
  /** 操作者 ID */
  readonly actor_id: string | null;
  /** 元數據 */
  readonly metadata: ActivityMetadata;
  /** 舊值 */
  readonly old_value: Record<string, unknown> | null;
  /** 新值 */
  readonly new_value: Record<string, unknown> | null;
  /** IP 地址 */
  readonly ip_address: string | null;
  /** 用戶代理 */
  readonly user_agent: string | null;
  /** 建立時間 */
  readonly created_at: string;
}

/**
 * 活動元數據
 * Additional metadata for activity context
 */
export interface ActivityMetadata {
  /** 實體名稱 */
  entity_name?: string;
  /** 操作者名稱 */
  actor_name?: string;
  /** 操作描述 */
  description?: string;
  /** 相關實體 */
  related_entities?: Array<{
    type: TimelineEntityType;
    id: string;
    name?: string;
  }>;
  /** 變更摘要 */
  changes_summary?: string[];
  /** 自訂標籤 */
  tags?: string[];
  /** 額外資訊 */
  extra?: Record<string, unknown>;
}

/**
 * 擴展活動記錄 (包含關聯資料)
 * Extended activity with related data for display
 */
export interface ActivityWithActor extends Activity {
  /** 操作者資訊 */
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
}

/**
 * 時間軸項目 (UI 顯示用)
 * Timeline item for UI rendering
 */
export interface TimelineItem {
  /** 活動 ID */
  id: string;
  /** 時間戳 */
  timestamp: string;
  /** 格式化時間 */
  formatted_time?: string;
  /** 相對時間 */
  relative_time?: string;
  /** 類型 */
  type: ActivityType;
  /** 實體類型 */
  entity_type: TimelineEntityType;
  /** 實體 ID */
  entity_id: string;
  /** 標題 */
  title: string;
  /** 描述 */
  description?: string;
  /** 操作者 */
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  /** 圖示 */
  icon?: string;
  /** 顏色 */
  color?: string;
  /** 變更詳情 */
  changes?: Array<{
    field: string;
    old_value: unknown;
    new_value: unknown;
  }>;
  /** 是否可點擊 */
  clickable?: boolean;
  /** 元數據 */
  metadata?: ActivityMetadata;
}

/**
 * 時間軸分組 (按日期)
 * Timeline group by date
 */
export interface TimelineGroup {
  /** 日期 */
  date: string;
  /** 格式化日期 */
  formatted_date: string;
  /** 項目列表 */
  items: TimelineItem[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 記錄活動請求
 * Request payload for logging activity
 */
export interface LogActivityRequest {
  blueprint_id: string;
  entity_type: TimelineEntityType;
  entity_id: string;
  activity_type: ActivityType;
  metadata?: ActivityMetadata;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
}

/**
 * 活動查詢選項
 * Query options for filtering activities
 */
export interface ActivityQueryOptions {
  /** 藍圖 ID */
  blueprintId?: string;
  /** 實體類型 */
  entityType?: TimelineEntityType | TimelineEntityType[];
  /** 實體 ID */
  entityId?: string;
  /** 活動類型 */
  activityType?: ActivityType | ActivityType[];
  /** 操作者 ID */
  actorId?: string;
  /** 開始時間 */
  startDate?: string;
  /** 結束時間 */
  endDate?: string;
  /** 包含操作者資訊 */
  includeActor?: boolean;
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 活動分頁結果
 * Paginated result for activity queries
 */
export interface ActivityPageResult {
  /** 資料列表 */
  data: Activity[] | ActivityWithActor[];
  /** 總數量 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * 活動類型配置
 * Configuration for activity types
 */
export const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  {
    label: string;
    pastTense: string;
    icon: string;
    color: string;
  }
> = {
  create: { label: '建立', pastTense: '已建立', icon: 'plus-circle', color: 'green' },
  update: { label: '更新', pastTense: '已更新', icon: 'edit', color: 'blue' },
  delete: { label: '刪除', pastTense: '已刪除', icon: 'delete', color: 'red' },
  comment: { label: '評論', pastTense: '已評論', icon: 'message', color: 'default' },
  assign: { label: '指派', pastTense: '已指派', icon: 'user-add', color: 'blue' },
  status_change: { label: '狀態變更', pastTense: '狀態已變更', icon: 'swap', color: 'orange' },
  attachment: { label: '附件', pastTense: '已新增附件', icon: 'paper-clip', color: 'cyan' },
  approval: { label: '審核', pastTense: '已審核', icon: 'audit', color: 'green' },
  mention: { label: '提及', pastTense: '已提及', icon: 'at', color: 'purple' },
  share: { label: '分享', pastTense: '已分享', icon: 'share-alt', color: 'cyan' },
  move: { label: '移動', pastTense: '已移動', icon: 'drag', color: 'default' },
  archive: { label: '封存', pastTense: '已封存', icon: 'container', color: 'default' },
  restore: { label: '還原', pastTense: '已還原', icon: 'redo', color: 'green' }
};

/**
 * 時間軸實體類型配置
 * Configuration for timeline entity types
 */
export const TIMELINE_ENTITY_TYPE_CONFIG: Record<
  TimelineEntityType,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  blueprint: { label: '藍圖', icon: 'project', color: 'blue' },
  task: { label: '任務', icon: 'carry-out', color: 'orange' },
  diary: { label: '日誌', icon: 'file-text', color: 'green' },
  checklist: { label: '清單', icon: 'check-square', color: 'cyan' },
  checklist_item: { label: '清單項目', icon: 'check', color: 'cyan' },
  issue: { label: '問題', icon: 'warning', color: 'red' },
  todo: { label: '待辦', icon: 'unordered-list', color: 'purple' },
  file: { label: '檔案', icon: 'file', color: 'default' },
  acceptance: { label: '驗收', icon: 'audit', color: 'gold' },
  comment: { label: '評論', icon: 'message', color: 'default' }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 產生活動描述
 * Generate activity description
 */
export function generateActivityDescription(
  activityType: ActivityType,
  entityType: TimelineEntityType,
  actorName?: string,
  entityName?: string
): string {
  const actorPart = actorName || '使用者';
  const entityPart = entityName || TIMELINE_ENTITY_TYPE_CONFIG[entityType].label;
  const actionPart = ACTIVITY_TYPE_CONFIG[activityType].pastTense;

  return `${actorPart} ${actionPart} ${entityPart}`;
}

/**
 * 將活動轉換為時間軸項目
 * Convert activity to timeline item
 */
export function activityToTimelineItem(activity: Activity | ActivityWithActor, formatTime?: (timestamp: string) => string): TimelineItem {
  const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
  const entityConfig = TIMELINE_ENTITY_TYPE_CONFIG[activity.entity_type];
  const actorData = 'actor' in activity ? activity.actor : null;

  return {
    id: activity.id,
    timestamp: activity.created_at,
    formatted_time: formatTime ? formatTime(activity.created_at) : undefined,
    type: activity.activity_type,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id,
    title: generateActivityDescription(
      activity.activity_type,
      activity.entity_type,
      activity.metadata?.actor_name || actorData?.name,
      activity.metadata?.entity_name
    ),
    description: activity.metadata?.description,
    actor: actorData
      ? {
          id: actorData.id,
          name: actorData.name,
          avatar_url: actorData.avatar_url
        }
      : undefined,
    icon: config.icon,
    color: config.color,
    changes:
      activity.old_value && activity.new_value
        ? Object.keys(activity.new_value)
            .filter(key => activity.old_value?.[key] !== activity.new_value?.[key])
            .map(key => ({
              field: key,
              old_value: activity.old_value?.[key],
              new_value: activity.new_value?.[key]
            }))
        : undefined,
    clickable: true,
    metadata: activity.metadata
  };
}

/**
 * 按日期分組時間軸項目
 * Group timeline items by date
 */
export function groupTimelineByDate(items: TimelineItem[], formatDate?: (date: string) => string): TimelineGroup[] {
  const groups = new Map<string, TimelineItem[]>();

  for (const item of items) {
    const date = item.timestamp.split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(item);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groupItems]) => ({
      date,
      formatted_date: formatDate ? formatDate(date) : date,
      items: groupItems
    }));
}
