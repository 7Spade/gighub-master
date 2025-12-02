/**
 * Task Service
 *
 * 任務管理服務（Shared 層）
 * Task management service (Shared layer)
 *
 * Provides business logic for task operations including:
 * - CRUD operations for tasks
 * - Tree structure management (parent-child relationships)
 * - Progress calculation (bottom-up from leaf tasks)
 * - Status flow management
 *
 * @module shared/services/task
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '@core';
import {
  Task,
  TaskNode,
  FlatTaskNode,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  KanbanColumn,
  TASK_STATUS_CONFIG
} from '@core';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly supabaseService = inject(SupabaseService);

  // State signals
  private tasksState = signal<Task[]>([]);
  private taskTreeState = signal<TaskNode[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly tasks = this.tasksState.asReadonly();
  readonly taskTree = this.taskTreeState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals for kanban view
  readonly kanbanColumns = computed<KanbanColumn[]>(() => {
    const tasks = this.tasksState();
    return [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.COMPLETED, TaskStatus.BLOCKED].map(status => ({
      status,
      title: TASK_STATUS_CONFIG[status].label,
      color: TASK_STATUS_CONFIG[status].color,
      tasks: tasks.filter(t => t.status === status)
    }));
  });

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * 載入藍圖的所有任務
   * Load all tasks for a blueprint
   */
  async loadTasksByBlueprint(blueprintId: string): Promise<Task[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const tasks = (data || []) as Task[];
      this.tasksState.set(tasks);

      // Build tree structure
      const tree = this.buildTaskTree(tasks);
      this.taskTreeState.set(tree);

      return tasks;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入任務失敗';
      this.errorState.set(message);
      throw err;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 根據 ID 查詢任務
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabaseService.client.from('tasks').select('*').eq('id', id).is('deleted_at', null).single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Task;
  }

  /**
   * 查詢子任務
   * Find child tasks
   */
  async findChildren(parentId: string): Promise<Task[]> {
    const { data, error } = await this.supabaseService.client
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as Task[];
  }

  // ============================================================================
  // CRUD Methods
  // ============================================================================

  /**
   * 建立任務
   * Create a new task
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    const currentUser = this.supabaseService.currentUser;
    if (!currentUser) throw new Error('未登入');

    // Get max sort_order for positioning
    const { data: maxOrderData } = await this.supabaseService.client
      .from('tasks')
      .select('sort_order')
      .eq('blueprint_id', request.blueprint_id)
      .eq('parent_id', request.parent_id ?? null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.sort_order ?? 0) + 1;

    const { data, error } = await this.supabaseService.client
      .from('tasks')
      .insert({
        blueprint_id: request.blueprint_id,
        parent_id: request.parent_id || null,
        title: request.title,
        description: request.description || null,
        status: request.status || TaskStatus.PENDING,
        priority: request.priority || TaskPriority.MEDIUM,
        assignee_id: request.assignee_id || null,
        reviewer_id: request.reviewer_id || null,
        due_date: request.due_date || null,
        start_date: request.start_date || null,
        sort_order: nextOrder,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (error) throw error;

    const newTask = data as Task;

    // Update local state
    this.tasksState.update(tasks => [...tasks, newTask]);
    this.taskTreeState.set(this.buildTaskTree(this.tasksState()));

    return newTask;
  }

  /**
   * 更新任務
   * Update a task
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    const { data, error } = await this.supabaseService.client
      .from('tasks')
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedTask = data as Task;

    // Update local state
    this.tasksState.update(tasks => tasks.map(t => (t.id === id ? updatedTask : t)));
    this.taskTreeState.set(this.buildTaskTree(this.tasksState()));

    // If status changed to completed, recalculate parent progress
    if (request.status === TaskStatus.COMPLETED && updatedTask.parent_id) {
      await this.recalculateParentProgress(updatedTask.parent_id);
    }

    return updatedTask;
  }

  /**
   * 更新任務狀態
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status });
  }

  /**
   * 軟刪除任務
   * Soft delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabaseService.client.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);

    if (error) throw error;

    // Update local state
    this.tasksState.update(tasks => tasks.filter(t => t.id !== id));
    this.taskTreeState.set(this.buildTaskTree(this.tasksState()));
  }

  // ============================================================================
  // Tree Structure Methods
  // ============================================================================

  /**
   * 建立任務樹狀結構
   * Build task tree structure from flat list
   */
  buildTaskTree(tasks: Task[]): TaskNode[] {
    const taskMap = new Map<string, TaskNode>();
    const roots: TaskNode[] = [];

    // First pass: create TaskNode for each task
    tasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        level: 0,
        isLeaf: true,
        childCount: 0
      });
    });

    // Second pass: build parent-child relationships
    tasks.forEach(task => {
      const node = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(node);
        parent.isLeaf = false;
        parent.childCount = (parent.childCount || 0) + 1;
      } else {
        roots.push(node);
      }
    });

    // Third pass: calculate levels
    const setLevels = (nodes: TaskNode[], level: number): void => {
      nodes.forEach(node => {
        node.level = level;
        if (node.children && node.children.length > 0) {
          setLevels(node.children, level + 1);
        }
      });
    };
    setLevels(roots, 0);

    // Sort by sort_order
    const sortNodes = (nodes: TaskNode[]): void => {
      nodes.sort((a, b) => a.sort_order - b.sort_order);
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };
    sortNodes(roots);

    return roots;
  }

  /**
   * 將樹狀結構扁平化（用於 tree-view 顯示）
   * Flatten tree structure for tree-view display
   */
  flattenTaskTree(nodes: TaskNode[]): FlatTaskNode[] {
    const result: FlatTaskNode[] = [];

    const flatten = (node: TaskNode, level: number): void => {
      result.push({
        id: node.id,
        blueprint_id: node.blueprint_id,
        parent_id: node.parent_id,
        title: node.title,
        description: node.description,
        status: node.status,
        priority: node.priority,
        assignee_id: node.assignee_id,
        due_date: node.due_date,
        start_date: node.start_date,
        completion_rate: node.completion_rate,
        sort_order: node.sort_order,
        level,
        expandable: !!(node.children && node.children.length > 0),
        origin: node
      });

      if (node.children) {
        node.children.forEach((child: TaskNode) => flatten(child, level + 1));
      }
    };

    nodes.forEach(node => flatten(node, 0));
    return result;
  }

  // ============================================================================
  // Progress Calculation Methods
  // ============================================================================

  /**
   * 重新計算父任務進度（從葉節點往上）
   * Recalculate parent task progress (bottom-up from leaf)
   */
  async recalculateParentProgress(parentId: string): Promise<void> {
    const parent = await this.findById(parentId);
    if (!parent) return;

    const children = await this.findChildren(parentId);
    if (children.length === 0) return;

    // Calculate average completion rate from children
    const totalCompletion = children.reduce((sum, child) => {
      // For completed tasks, count as 100%
      if (child.status === TaskStatus.COMPLETED) return sum + 100;
      // For cancelled tasks, exclude from calculation
      if (child.status === TaskStatus.CANCELLED) return sum;
      return sum + child.completion_rate;
    }, 0);

    const activeChildren = children.filter(c => c.status !== TaskStatus.CANCELLED);
    const avgCompletion = activeChildren.length > 0 ? Math.round(totalCompletion / activeChildren.length) : 0;

    // Update parent's completion rate
    await this.updateTask(parentId, { completion_rate: avgCompletion });

    // Recursively update grandparent if exists
    if (parent.parent_id) {
      await this.recalculateParentProgress(parent.parent_id);
    }
  }

  /**
   * 計算任務樹的進度
   * Calculate progress for entire task tree
   */
  calculateTreeProgress(nodes: TaskNode[]): number {
    if (nodes.length === 0) return 0;

    const calculateNodeProgress = (node: TaskNode): number => {
      if (!node.children || node.children.length === 0) {
        // Leaf node: use its own completion_rate or status
        if (node.status === TaskStatus.COMPLETED) return 100;
        if (node.status === TaskStatus.CANCELLED) return -1; // Mark as excluded
        return node.completion_rate;
      }

      // Parent node: calculate from children
      const childProgresses = node.children.map(calculateNodeProgress).filter((p: number) => p >= 0);
      if (childProgresses.length === 0) return 0;
      return Math.round(childProgresses.reduce((a: number, b: number) => a + b, 0) / childProgresses.length);
    };

    const progresses = nodes.map(calculateNodeProgress).filter((p: number) => p >= 0);
    if (progresses.length === 0) return 0;
    return Math.round(progresses.reduce((a: number, b: number) => a + b, 0) / progresses.length);
  }

  // ============================================================================
  // Status Flow Methods
  // ============================================================================

  /**
   * 獲取允許的狀態轉換
   * Get allowed status transitions
   */
  getAllowedTransitions(currentStatus: TaskStatus): TaskStatus[] {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
      [TaskStatus.IN_REVIEW]: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS],
      [TaskStatus.COMPLETED]: [], // Terminal state
      [TaskStatus.CANCELLED]: [], // Terminal state
      [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]
    };
    return transitions[currentStatus] || [];
  }

  /**
   * 檢查狀態轉換是否有效
   * Check if status transition is valid
   */
  isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    return this.getAllowedTransitions(from).includes(to);
  }

  // ============================================================================
  // Mock Data for Development
  // ============================================================================

  /**
   * 產生模擬任務資料（用於開發測試）
   * Generate mock task data for development testing
   */
  generateMockTasks(blueprintId: string): Task[] {
    const now = new Date().toISOString();
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        blueprint_id: blueprintId,
        parent_id: null,
        title: '基礎工程',
        description: '地基及結構工程',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        completion_rate: 60,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-1-1',
        blueprint_id: blueprintId,
        parent_id: 'task-1',
        title: '地基開挖',
        description: '進行地基開挖作業',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        completion_rate: 100,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-1-2',
        blueprint_id: blueprintId,
        parent_id: 'task-1',
        title: '混凝土澆置',
        description: '基礎混凝土澆置',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        completion_rate: 50,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-1-2-1',
        blueprint_id: blueprintId,
        parent_id: 'task-1-2',
        title: '模板組立',
        description: '安裝混凝土模板',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.MEDIUM,
        completion_rate: 100,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-1-2-2',
        blueprint_id: blueprintId,
        parent_id: 'task-1-2',
        title: '鋼筋綁紮',
        description: '綁紮鋼筋籠',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        completion_rate: 30,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-1-3',
        blueprint_id: blueprintId,
        parent_id: 'task-1',
        title: '鋼結構安裝',
        description: '主結構鋼骨安裝',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        completion_rate: 0,
        sort_order: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-2',
        blueprint_id: blueprintId,
        parent_id: null,
        title: '機電工程',
        description: '機電系統安裝',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        completion_rate: 0,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-2-1',
        blueprint_id: blueprintId,
        parent_id: 'task-2',
        title: '配電系統',
        description: '電力配置與佈線',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        completion_rate: 0,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-2-2',
        blueprint_id: blueprintId,
        parent_id: 'task-2',
        title: '空調系統',
        description: 'HVAC 系統安裝',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        completion_rate: 0,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 'task-3',
        blueprint_id: blueprintId,
        parent_id: null,
        title: '裝修工程',
        description: '內部裝修作業',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        completion_rate: 0,
        sort_order: 3,
        created_at: now,
        updated_at: now
      }
    ];

    return mockTasks;
  }

  /**
   * 載入模擬資料
   * Load mock data
   */
  loadMockData(blueprintId: string): void {
    const tasks = this.generateMockTasks(blueprintId);
    this.tasksState.set(tasks);
    this.taskTreeState.set(this.buildTaskTree(tasks));
  }
}
