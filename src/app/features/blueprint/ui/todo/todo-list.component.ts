/**
 * Todo List Component
 *
 * 待辦事項列表組件
 *
 * @module features/blueprint/ui/todo
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { TodoStore } from '../../data-access';
import { Todo } from '../../domain';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzTabsModule,
    NzProgressModule
  ],
  template: `
    <div class="todo-list-container">
      <!-- 進度概覽 -->
      <div class="progress-overview">
        <div class="progress-info">
          <span class="completed">{{ todoStore.completedTodos().length }}</span>
          <span class="separator">/</span>
          <span class="total">{{ todoStore.todoCount() }}</span>
          <span class="label">已完成</span>
        </div>
        <nz-progress
          [nzPercent]="todoStore.completionRate()"
          nzSize="small"
          [nzShowInfo]="false"
        ></nz-progress>
      </div>

      <!-- 新增待辦 -->
      <div class="add-todo">
        <nz-input-group nzCompact>
          <input
            nz-input
            placeholder="輸入待辦事項..."
            [(ngModel)]="newTodoTitle"
            (keyup.enter)="addTodo()"
            style="width: calc(100% - 80px)"
          />
          <button
            nz-button
            nzType="primary"
            [disabled]="!newTodoTitle.trim()"
            (click)="addTodo()"
          >
            <span nz-icon nzType="plus"></span>
            新增
          </button>
        </nz-input-group>
      </div>

      <!-- 待辦列表 -->
      <nz-spin [nzSpinning]="todoStore.loading()">
        <nz-tabset>
          <nz-tab nzTitle="全部">
            <ng-container *ngTemplateOutlet="todoList; context: { todos: todoStore.todos() }"></ng-container>
          </nz-tab>
          <nz-tab [nzTitle]="pendingTitle">
            <ng-template #pendingTitle>
              待完成
              @if (todoStore.pendingTodos().length > 0) {
                <nz-tag nzColor="processing">{{ todoStore.pendingTodos().length }}</nz-tag>
              }
            </ng-template>
            <ng-container *ngTemplateOutlet="todoList; context: { todos: todoStore.pendingTodos() }"></ng-container>
          </nz-tab>
          <nz-tab nzTitle="已完成">
            <ng-container *ngTemplateOutlet="todoList; context: { todos: todoStore.completedTodos() }"></ng-container>
          </nz-tab>
        </nz-tabset>
      </nz-spin>

      <!-- 待辦列表模板 -->
      <ng-template #todoList let-todos="todos">
        @if (todos.length === 0) {
          <nz-empty nzNotFoundContent="暫無待辦事項"></nz-empty>
        } @else {
          <nz-list nzSize="small">
            @for (todo of todos; track todo.id) {
              <nz-list-item class="todo-item" [class.completed]="todo.is_completed">
                <label
                  nz-checkbox
                  [nzChecked]="todo.is_completed"
                  (nzCheckedChange)="toggleTodo(todo)"
                ></label>

                <div class="todo-content">
                  <span class="todo-title" [class.done]="todo.is_completed">
                    {{ todo.title }}
                  </span>
                  @if (todo.due_date) {
                    <nz-tag
                      [nzColor]="isOverdue(todo) ? 'red' : 'default'"
                      nzSize="small"
                    >
                      {{ todo.due_date }}
                    </nz-tag>
                  }
                </div>

                <div class="todo-actions">
                  <button nz-button nzType="text" nzSize="small" (click)="editTodo(todo)">
                    <span nz-icon nzType="edit"></span>
                  </button>
                  <button nz-button nzType="text" nzSize="small" nzDanger (click)="deleteTodo(todo)">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </div>
              </nz-list-item>
            }
          </nz-list>
        }
      </ng-template>
    </div>
  `,
  styles: [`
    .todo-list-container {
      background: #fff;
      padding: 24px;
      border-radius: 4px;
      max-width: 800px;
    }

    .progress-overview {
      margin-bottom: 24px;

      .progress-info {
        display: flex;
        align-items: baseline;
        gap: 4px;
        margin-bottom: 8px;

        .completed {
          font-size: 24px;
          font-weight: 600;
          color: #52c41a;
        }

        .separator {
          color: #999;
        }

        .total {
          font-size: 16px;
          color: #666;
        }

        .label {
          margin-left: 8px;
          color: #999;
          font-size: 14px;
        }
      }
    }

    .add-todo {
      margin-bottom: 24px;
    }

    .todo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;

      &.completed {
        opacity: 0.6;
      }
    }

    .todo-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .todo-title {
        &.done {
          text-decoration: line-through;
          color: #999;
        }
      }
    }

    .todo-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .todo-item:hover .todo-actions {
      opacity: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent {
  readonly todoStore = inject(TodoStore);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  newTodoTitle = '';

  isOverdue(todo: Todo): boolean {
    if (!todo.due_date || todo.is_completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return todo.due_date < today;
  }

  async addTodo(): Promise<void> {
    if (!this.newTodoTitle.trim()) return;

    this.msg.info('新增待辦功能開發中');
    this.newTodoTitle = '';
  }

  async toggleTodo(todo: Todo): Promise<void> {
    try {
      await this.todoStore.toggleComplete(todo.id);
      this.msg.success(todo.is_completed ? '已標記為待完成' : '已完成');
    } catch {
      this.msg.error('更新失敗');
    }
  }

  editTodo(todo: Todo): void {
    this.msg.info(`編輯待辦: ${todo.title}`);
  }

  async deleteTodo(todo: Todo): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除待辦「${todo.title}」嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.todoStore.deleteTodo(todo.id);
          this.msg.success('待辦已刪除');
        } catch {
          this.msg.error('刪除失敗');
        }
      }
    });
  }
}
