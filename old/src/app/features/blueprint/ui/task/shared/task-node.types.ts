/**
 * Task Node Types
 *
 * Tree node types for NzTreeView integration
 * Supports unlimited depth hierarchy
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/ui/task/shared/task-node.types
 */

import { Task, TaskStatus } from '../../../domain';

/**
 * Flat tree node for NzTreeFlatDataSource
 */
export interface TaskFlatNode {
  /** Task ID */
  id: string;

  /** Task title for display */
  title: string;

  /** Tree depth level (0 = L0, 1 = L1, etc.) */
  level: number;

  /** Whether node is expandable (has children) */
  expandable: boolean;

  /** Direct child count */
  childCount: number;

  /** Task status */
  status: TaskStatus;

  /** Completion rate (0-100) */
  completionRate: number;

  /** Assignee ID */
  assigneeId?: string;

  /** Priority */
  priority: string;

  /** Original task data */
  task: Task;
}

/**
 * Tree node for nested structure
 */
export interface TaskTreeNode {
  /** Task data */
  task: Task;

  /** Children nodes */
  children: TaskTreeNode[];

  /** Whether node is expanded */
  expanded: boolean;
}

/**
 * Children map for O(1) lookup
 */
export type TaskChildrenMap = Map<string | null, Task[]>;

/**
 * Build children map from flat task list
 * Pre-computed for O(1) child lookup
 */
export function buildChildrenMap(tasks: Task[]): TaskChildrenMap {
  const map = new Map<string | null, Task[]>();

  // Initialize with empty arrays
  map.set(null, []); // Root tasks

  // Group tasks by parentId
  for (const task of tasks) {
    const parentId = task.parentId;
    if (!map.has(parentId)) {
      map.set(parentId, []);
    }
    map.get(parentId)!.push(task);
  }

  // Sort children by sortOrder
  for (const children of map.values()) {
    children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return map;
}

/**
 * Get children for a parent from pre-built map
 */
export function getChildren(map: TaskChildrenMap, parentId: string | null): Task[] {
  return map.get(parentId) ?? [];
}

/**
 * Build nested tree structure from flat list
 */
export function buildTreeNodes(tasks: Task[], childrenMap: TaskChildrenMap, parentId: string | null = null): TaskTreeNode[] {
  const children = getChildren(childrenMap, parentId);

  return children.map(task => ({
    task,
    children: buildTreeNodes(tasks, childrenMap, task.id),
    expanded: false
  }));
}

/**
 * Calculate depth of a task (count parent levels)
 */
function calculateDepth(task: Task, taskMap: Map<string, Task>): number {
  let depth = 0;
  let currentParentId = task.parentId;
  while (currentParentId) {
    depth++;
    const parent = taskMap.get(currentParentId);
    currentParentId = parent?.parentId ?? null;
  }
  return depth;
}

/**
 * Convert Task to TaskFlatNode
 */
export function taskToFlatNode(task: Task, childrenMap: TaskChildrenMap, taskMap: Map<string, Task>): TaskFlatNode {
  const children = getChildren(childrenMap, task.id);
  const level = calculateDepth(task, taskMap);

  return {
    id: task.id,
    title: task.title,
    level,
    expandable: children.length > 0,
    childCount: children.length,
    status: task.status,
    completionRate: task.completionRate,
    assigneeId: task.assigneeId,
    priority: task.priority,
    task
  };
}

/**
 * Convert all tasks to flat nodes for tree
 */
export function tasksToFlatNodes(tasks: Task[], childrenMap: TaskChildrenMap): TaskFlatNode[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  return tasks.map(task => taskToFlatNode(task, childrenMap, taskMap));
}
