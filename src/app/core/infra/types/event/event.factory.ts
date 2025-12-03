/**
 * 事件總線系統 - 工廠函數
 *
 * 提供便利的事件建立函數
 *
 * @packageDocumentation
 * @module Event
 */

import {
  BaseEvent,
  EventCategory,
  EventAction,
  EventActor,
  EventResource,
  TaskCreatedPayload,
  TaskAssignedPayload,
  TaskStatusChangedPayload,
  TaskCompletedPayload
} from './event.types';

// ============================================================
// 通用事件工廠
// ============================================================

/**
 * 建立事件物件的參數
 */
export interface CreateEventParams<T> {
  /** 事件類別 */
  category: EventCategory;
  /** 事件動作 */
  action: EventAction;
  /** 事件資料 */
  payload: T;
  /** 相關資源 */
  resource: EventResource;
  /** 觸發者 */
  actor: Partial<EventActor> & { id: string; name: string };
  /** 藍圖 ID */
  blueprintId?: string;
  /** 組織 ID */
  organizationId?: string;
  /** 元數據 */
  metadata?: Record<string, unknown>;
}

/**
 * 建立事件物件
 *
 * @param params 事件參數
 * @returns 不含 id 和 timestamp 的事件物件
 *
 * @example
 * ```typescript
 * const event = createEvent({
 *   category: 'task',
 *   action: 'assigned',
 *   payload: { taskId: '123', newAssignee: { id: 'u1', name: 'John' } },
 *   resource: { type: 'task', id: '123', name: 'Task Name' },
 *   actor: { id: 'u2', name: 'Admin' },
 *   blueprintId: 'bp1'
 * });
 * ```
 */
export function createEvent<T>(params: CreateEventParams<T>): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return {
    category: params.category,
    action: params.action,
    type: `${params.category}.${params.action}`,
    payload: params.payload,
    resource: params.resource,
    actor: {
      id: params.actor.id,
      name: params.actor.name,
      type: params.actor.type || 'user'
    },
    blueprintId: params.blueprintId,
    organizationId: params.organizationId,
    metadata: params.metadata
  };
}

// ============================================================
// 任務事件工廠
// ============================================================

/**
 * 任務事件參數
 */
export interface TaskEventParams<T> {
  /** 事件動作 */
  action: EventAction;
  /** 事件資料 */
  payload: T;
  /** 任務 ID */
  taskId: string;
  /** 任務名稱 */
  taskName: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 觸發者 ID */
  actorId: string;
  /** 觸發者名稱 */
  actorName: string;
  /** 元數據 */
  metadata?: Record<string, unknown>;
}

/**
 * 建立任務事件
 *
 * @param params 任務事件參數
 * @returns 任務事件物件
 *
 * @example
 * ```typescript
 * const event = createTaskEvent({
 *   action: 'assigned',
 *   payload: { taskId: '123', newAssignee: { id: 'u1', name: 'John' } },
 *   taskId: '123',
 *   taskName: 'Build Feature X',
 *   blueprintId: 'bp1',
 *   actorId: 'u2',
 *   actorName: 'Admin'
 * });
 * ```
 */
export function createTaskEvent<T>(params: TaskEventParams<T>): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'task',
    action: params.action,
    payload: params.payload,
    resource: {
      type: 'task',
      id: params.taskId,
      name: params.taskName
    },
    actor: {
      id: params.actorId,
      name: params.actorName,
      type: 'user'
    },
    blueprintId: params.blueprintId,
    metadata: params.metadata
  });
}

/**
 * 建立任務建立事件
 */
export function createTaskCreatedEvent(params: {
  taskId: string;
  taskName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
  parentId?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assigneeName?: string;
}): Omit<BaseEvent<TaskCreatedPayload>, 'id' | 'timestamp'> {
  return createTaskEvent({
    action: 'created',
    payload: {
      taskId: params.taskId,
      taskName: params.taskName,
      parentId: params.parentId,
      status: params.status,
      priority: params.priority,
      assigneeId: params.assigneeId,
      assigneeName: params.assigneeName
    },
    taskId: params.taskId,
    taskName: params.taskName,
    blueprintId: params.blueprintId,
    actorId: params.actorId,
    actorName: params.actorName
  });
}

/**
 * 建立任務指派事件
 */
export function createTaskAssignedEvent(params: {
  taskId: string;
  taskName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
  previousAssignee?: { id: string; name: string };
  newAssignee: { id: string; name: string };
}): Omit<BaseEvent<TaskAssignedPayload>, 'id' | 'timestamp'> {
  return createTaskEvent({
    action: 'assigned',
    payload: {
      taskId: params.taskId,
      taskName: params.taskName,
      previousAssignee: params.previousAssignee,
      newAssignee: params.newAssignee
    },
    taskId: params.taskId,
    taskName: params.taskName,
    blueprintId: params.blueprintId,
    actorId: params.actorId,
    actorName: params.actorName
  });
}

/**
 * 建立任務狀態變更事件
 */
export function createTaskStatusChangedEvent(params: {
  taskId: string;
  taskName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
  previousStatus: string;
  newStatus: string;
}): Omit<BaseEvent<TaskStatusChangedPayload>, 'id' | 'timestamp'> {
  return createTaskEvent({
    action: 'status_changed',
    payload: {
      taskId: params.taskId,
      taskName: params.taskName,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus
    },
    taskId: params.taskId,
    taskName: params.taskName,
    blueprintId: params.blueprintId,
    actorId: params.actorId,
    actorName: params.actorName
  });
}

/**
 * 建立任務完成事件
 */
export function createTaskCompletedEvent(params: {
  taskId: string;
  taskName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
}): Omit<BaseEvent<TaskCompletedPayload>, 'id' | 'timestamp'> {
  return createTaskEvent({
    action: 'completed',
    payload: {
      taskId: params.taskId,
      taskName: params.taskName,
      completedAt: new Date().toISOString(),
      completedBy: {
        id: params.actorId,
        name: params.actorName
      }
    },
    taskId: params.taskId,
    taskName: params.taskName,
    blueprintId: params.blueprintId,
    actorId: params.actorId,
    actorName: params.actorName
  });
}

// ============================================================
// 系統事件工廠
// ============================================================

/**
 * 建立系統事件
 *
 * @param params 系統事件參數
 * @returns 系統事件物件
 */
export function createSystemEvent<T>(params: {
  action: EventAction;
  payload: T;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'system',
    action: params.action,
    payload: params.payload,
    resource: {
      type: params.resourceType,
      id: params.resourceId,
      name: params.resourceName
    },
    actor: {
      id: 'system',
      name: 'GigHub System',
      type: 'system'
    },
    metadata: params.metadata
  });
}

// ============================================================
// 成員事件工廠
// ============================================================

/**
 * 建立成員事件
 */
export function createMemberEvent<T>(params: {
  action: EventAction;
  payload: T;
  userId: string;
  userName: string;
  blueprintId: string;
  blueprintName: string;
  actorId: string;
  actorName: string;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'member',
    action: params.action,
    payload: params.payload,
    resource: {
      type: 'member',
      id: params.userId,
      name: params.userName
    },
    actor: {
      id: params.actorId,
      name: params.actorName,
      type: 'user'
    },
    blueprintId: params.blueprintId
  });
}

// ============================================================
// 檔案事件工廠
// ============================================================

/**
 * 建立檔案事件
 */
export function createFileEvent<T>(params: {
  action: EventAction;
  payload: T;
  fileId: string;
  fileName: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'file',
    action: params.action,
    payload: params.payload,
    resource: {
      type: 'file',
      id: params.fileId,
      name: params.fileName
    },
    actor: {
      id: params.actorId,
      name: params.actorName,
      type: 'user'
    },
    blueprintId: params.blueprintId
  });
}

// ============================================================
// 日誌事件工廠
// ============================================================

/**
 * 建立日誌事件
 */
export function createDiaryEvent<T>(params: {
  action: EventAction;
  payload: T;
  diaryId: string;
  workDate: string;
  blueprintId: string;
  actorId: string;
  actorName: string;
}): Omit<BaseEvent<T>, 'id' | 'timestamp'> {
  return createEvent({
    category: 'diary',
    action: params.action,
    payload: params.payload,
    resource: {
      type: 'diary',
      id: params.diaryId,
      name: `日誌 ${params.workDate}`
    },
    actor: {
      id: params.actorId,
      name: params.actorName,
      type: 'user'
    },
    blueprintId: params.blueprintId
  });
}
