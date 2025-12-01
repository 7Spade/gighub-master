/**
 * Todo Interface
 *
 * 待辦事項領域介面
 *
 * @module features/blueprint/domain/interfaces
 */

/**
 * Todo - 待辦事項實體
 */
export interface Todo {
  id: string;
  blueprint_id: string;
  account_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  sort_order: number;
  related_task_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * CreateTodoRequest - 建立待辦請求
 */
export interface CreateTodoRequest {
  blueprint_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  related_task_id?: string | null;
}

/**
 * UpdateTodoRequest - 更新待辦請求
 */
export interface UpdateTodoRequest {
  title?: string;
  description?: string | null;
  is_completed?: boolean;
  due_date?: string | null;
  sort_order?: number;
}
