/**
 * 事件總線系統 - 類型定義
 *
 * @packageDocumentation
 * @module Event
 */

// ============================================================
// 基礎類型
// ============================================================

/**
 * 事件類別
 */
export type EventCategory =
  | 'system' // 系統事件（認證、權限）
  | 'task' // 任務事件
  | 'diary' // 日誌事件
  | 'issue' // 問題事件
  | 'financial' // 財務事件
  | 'file' // 檔案事件
  | 'member' // 成員事件
  | 'notification'; // 通知事件

/**
 * 事件動作類型
 */
export type EventAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'assigned'
  | 'unassigned'
  | 'completed'
  | 'started'
  | 'paused'
  | 'resumed'
  | 'approved'
  | 'rejected'
  | 'commented'
  | 'mentioned'
  | 'uploaded'
  | 'downloaded'
  | 'shared'
  | 'joined'
  | 'left'
  | 'invited'
  | 'role_changed'
  | 'status_changed'
  | 'priority_changed';

/**
 * 事件來源類型
 */
export type EventActorType = 'user' | 'system' | 'bot';

/**
 * 事件觸發者資訊
 */
export interface EventActor {
  /** 觸發者 ID */
  id: string;
  /** 觸發者名稱 */
  name: string;
  /** 觸發者類型 */
  type: EventActorType;
}

/**
 * 事件相關資源
 */
export interface EventResource {
  /** 資源類型 */
  type: string;
  /** 資源 ID */
  id: string;
  /** 資源名稱 (可選) */
  name?: string;
}

/**
 * 基礎事件介面
 */
export interface BaseEvent<T = unknown> {
  /** 事件唯一 ID */
  id: string;
  /** 事件類別 */
  category: EventCategory;
  /** 事件動作 */
  action: EventAction;
  /** 事件類型 (category.action 格式) */
  type: string;
  /** 事件資料 */
  payload: T;
  /** 相關資源 */
  resource: EventResource;
  /** 觸發者 */
  actor: EventActor;
  /** 藍圖 ID (資料隔離) */
  blueprintId?: string;
  /** 組織 ID */
  organizationId?: string;
  /** 時間戳 */
  timestamp: string;
  /** 元數據 */
  metadata?: Record<string, unknown>;
}

/**
 * 事件過濾選項
 */
export interface EventFilterOptions {
  /** 按類別過濾 */
  category?: EventCategory | EventCategory[];
  /** 按動作過濾 */
  action?: EventAction | EventAction[];
  /** 按事件類型過濾 (e.g., 'task.assigned') */
  type?: string | string[];
  /** 按藍圖過濾 */
  blueprintId?: string;
  /** 按組織過濾 */
  organizationId?: string;
  /** 按資源類型過濾 */
  resourceType?: string;
  /** 按資源 ID 過濾 */
  resourceId?: string;
  /** 按觸發者過濾 */
  actorId?: string;
  /** 按觸發者類型過濾 */
  actorType?: EventActorType;
}

// ============================================================
// 配置
// ============================================================

/**
 * 事件類型配置
 */
export const EVENT_CATEGORY_CONFIG: Record<
  EventCategory,
  {
    label: string;
    color: string;
    icon: string;
    description: string;
  }
> = {
  system: {
    label: '系統',
    color: 'blue',
    icon: 'setting',
    description: '系統級別事件，如認證、權限變更等'
  },
  task: {
    label: '任務',
    color: 'orange',
    icon: 'carry-out',
    description: '任務相關事件，如建立、指派、完成等'
  },
  diary: {
    label: '日誌',
    color: 'green',
    icon: 'file-text',
    description: '施工日誌相關事件'
  },
  issue: {
    label: '問題',
    color: 'red',
    icon: 'warning',
    description: '問題追蹤相關事件'
  },
  financial: {
    label: '財務',
    color: 'gold',
    icon: 'dollar',
    description: '財務管理相關事件'
  },
  file: {
    label: '檔案',
    color: 'cyan',
    icon: 'file',
    description: '檔案管理相關事件'
  },
  member: {
    label: '成員',
    color: 'purple',
    icon: 'team',
    description: '成員管理相關事件'
  },
  notification: {
    label: '通知',
    color: 'magenta',
    icon: 'bell',
    description: '通知系統事件'
  }
};

/**
 * 事件動作配置
 */
export const EVENT_ACTION_CONFIG: Record<
  EventAction,
  {
    label: string;
    pastTense: string;
  }
> = {
  created: { label: '建立', pastTense: '已建立' },
  updated: { label: '更新', pastTense: '已更新' },
  deleted: { label: '刪除', pastTense: '已刪除' },
  assigned: { label: '指派', pastTense: '已指派' },
  unassigned: { label: '取消指派', pastTense: '已取消指派' },
  completed: { label: '完成', pastTense: '已完成' },
  started: { label: '開始', pastTense: '已開始' },
  paused: { label: '暫停', pastTense: '已暫停' },
  resumed: { label: '繼續', pastTense: '已繼續' },
  approved: { label: '核准', pastTense: '已核准' },
  rejected: { label: '駁回', pastTense: '已駁回' },
  commented: { label: '評論', pastTense: '已評論' },
  mentioned: { label: '提及', pastTense: '已提及' },
  uploaded: { label: '上傳', pastTense: '已上傳' },
  downloaded: { label: '下載', pastTense: '已下載' },
  shared: { label: '分享', pastTense: '已分享' },
  joined: { label: '加入', pastTense: '已加入' },
  left: { label: '離開', pastTense: '已離開' },
  invited: { label: '邀請', pastTense: '已邀請' },
  role_changed: { label: '角色變更', pastTense: '角色已變更' },
  status_changed: { label: '狀態變更', pastTense: '狀態已變更' },
  priority_changed: { label: '優先級變更', pastTense: '優先級已變更' }
};

// ============================================================
// 任務事件 Payload
// ============================================================

/**
 * 任務建立事件 Payload
 */
export interface TaskCreatedPayload {
  taskId: string;
  taskName: string;
  parentId?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assigneeName?: string;
}

/**
 * 任務更新事件 Payload
 */
export interface TaskUpdatedPayload {
  taskId: string;
  taskName: string;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

/**
 * 任務指派事件 Payload
 */
export interface TaskAssignedPayload {
  taskId: string;
  taskName: string;
  previousAssignee?: {
    id: string;
    name: string;
  };
  newAssignee: {
    id: string;
    name: string;
  };
}

/**
 * 任務狀態變更事件 Payload
 */
export interface TaskStatusChangedPayload {
  taskId: string;
  taskName: string;
  previousStatus: string;
  newStatus: string;
}

/**
 * 任務完成事件 Payload
 */
export interface TaskCompletedPayload {
  taskId: string;
  taskName: string;
  completedAt: string;
  completedBy: {
    id: string;
    name: string;
  };
}

// ============================================================
// 系統事件 Payload
// ============================================================

/**
 * 使用者登入事件 Payload
 */
export interface UserLoginPayload {
  userId: string;
  userName: string;
  loginAt: string;
  ip?: string;
  userAgent?: string;
}

/**
 * 權限變更事件 Payload
 */
export interface PermissionChangedPayload {
  userId: string;
  userName: string;
  blueprintId: string;
  blueprintName: string;
  previousRole?: string;
  newRole: string;
}

/**
 * 成員加入事件 Payload
 */
export interface MemberJoinedPayload {
  userId: string;
  userName: string;
  blueprintId: string;
  blueprintName: string;
  role: string;
  invitedBy?: {
    id: string;
    name: string;
  };
}

/**
 * 成員離開事件 Payload
 */
export interface MemberLeftPayload {
  userId: string;
  userName: string;
  blueprintId: string;
  blueprintName: string;
  reason?: string;
}

// ============================================================
// 日誌事件 Payload
// ============================================================

/**
 * 日誌建立事件 Payload
 */
export interface DiaryCreatedPayload {
  diaryId: string;
  workDate: string;
  summary?: string;
}

/**
 * 日誌核准事件 Payload
 */
export interface DiaryApprovedPayload {
  diaryId: string;
  workDate: string;
  approvedBy: {
    id: string;
    name: string;
  };
  approvedAt: string;
}

// ============================================================
// 檔案事件 Payload
// ============================================================

/**
 * 檔案上傳事件 Payload
 */
export interface FileUploadedPayload {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  path: string;
}

/**
 * 檔案分享事件 Payload
 */
export interface FileSharedPayload {
  fileId: string;
  fileName: string;
  sharedWith: {
    id: string;
    name: string;
    type: 'user' | 'team';
  };
  permission: 'view' | 'edit' | 'admin';
}

// ============================================================
// 類型別名
// ============================================================

export type TaskCreatedEvent = BaseEvent<TaskCreatedPayload>;
export type TaskUpdatedEvent = BaseEvent<TaskUpdatedPayload>;
export type TaskAssignedEvent = BaseEvent<TaskAssignedPayload>;
export type TaskStatusChangedEvent = BaseEvent<TaskStatusChangedPayload>;
export type TaskCompletedEvent = BaseEvent<TaskCompletedPayload>;

export type UserLoginEvent = BaseEvent<UserLoginPayload>;
export type PermissionChangedEvent = BaseEvent<PermissionChangedPayload>;
export type MemberJoinedEvent = BaseEvent<MemberJoinedPayload>;
export type MemberLeftEvent = BaseEvent<MemberLeftPayload>;

export type DiaryCreatedEvent = BaseEvent<DiaryCreatedPayload>;
export type DiaryApprovedEvent = BaseEvent<DiaryApprovedPayload>;

export type FileUploadedEvent = BaseEvent<FileUploadedPayload>;
export type FileSharedEvent = BaseEvent<FileSharedPayload>;

/**
 * 所有事件類型聯合
 */
export type GigHubEvent =
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskAssignedEvent
  | TaskStatusChangedEvent
  | TaskCompletedEvent
  | UserLoginEvent
  | PermissionChangedEvent
  | MemberJoinedEvent
  | MemberLeftEvent
  | DiaryCreatedEvent
  | DiaryApprovedEvent
  | FileUploadedEvent
  | FileSharedEvent;
