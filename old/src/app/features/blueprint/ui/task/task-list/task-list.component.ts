/**
 * Task List Component
 *
 * Container component for task module
 * Provides view toggle between tree and table views
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/ui/task/task-list
 */

import { Component, inject, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';

import { TaskStore } from '../../../data-access';
import { TaskModel, TaskViewMode } from '../../../domain';
import { TaskTableComponent } from '../task-table';
import { TaskTreeComponent } from '../task-tree';

/**
 * Task List Component
 *
 * Container managing view toggle and statistics display
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS, NzTreeViewModule, TaskTreeComponent, TaskTableComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.less'
})
export class TaskListComponent {
  private readonly taskStore = inject(TaskStore);

  /** Store state */
  readonly tasks = this.taskStore.tasks;
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;
  readonly statistics = this.taskStore.statistics;

  /** Local state */
  readonly viewMode = signal<TaskViewMode>('tree');
  readonly searchTerm = signal<string>('');

  /** Filtered tasks based on search */
  readonly filteredTasks = computed(() => {
    const allTasks = this.tasks();
    const term = this.searchTerm().toLowerCase();

    if (!term) return allTasks;

    return allTasks.filter(task => task.title.toLowerCase().includes(term) || task.description?.toLowerCase().includes(term));
  });

  /** Set view mode to tree */
  setTreeView(): void {
    this.viewMode.set('tree');
  }

  /** Set view mode to table */
  setTableView(): void {
    this.viewMode.set('table');
  }

  /** Handle search input */
  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  /** Handle task selection */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTaskSelect(_task: TaskModel): void {
    // TODO: Implement task detail view or selection handling
  }

  /** Handle create task */
  onCreateTask(): void {
    // TODO: Open task creation dialog
  }

  /** Handle task edit */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEditTask(_task: TaskModel): void {
    // TODO: Open task edit dialog
  }

  /** Handle task delete */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleteTask(_task: TaskModel): void {
    // TODO: Show delete confirmation dialog
  }
}
