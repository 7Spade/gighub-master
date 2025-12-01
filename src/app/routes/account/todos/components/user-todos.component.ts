/**
 * User Todos Content Component
 *
 * 用戶待辦內容組件
 * User todos content component
 *
 * @module routes/account/todos/components
 */

import { Component, ChangeDetectionStrategy, input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-user-todos-content',
  standalone: true,
  imports: [CommonModule, FormsModule, NzEmptyModule, NzSpinModule, NzListModule, NzCheckboxModule],
  template: `
    <nz-spin [nzSpinning]="loading()">
      @if (todos().length === 0 && !loading()) {
        <nz-empty nzNotFoundContent="暫無待辦事項"></nz-empty>
      } @else {
        <nz-list [nzDataSource]="todos()" [nzRenderItem]="item">
          <ng-template #item let-todo>
            <nz-list-item>
              <label nz-checkbox [(ngModel)]="todo.completed">
                {{ todo.title }}
              </label>
            </nz-list-item>
          </ng-template>
        </nz-list>
      }
    </nz-spin>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTodosContentComponent implements OnInit {
  private readonly msg = inject(NzMessageService);

  readonly userId = input.required<string>();
  loading = signal(false);
  todos = signal<Array<{ id: string; title: string; completed: boolean }>>([]);

  ngOnInit(): void {
    this.loadTodos();
  }

  private async loadTodos(): Promise<void> {
    this.loading.set(true);
    try {
      // Placeholder - would fetch from service
      this.todos.set([]);
    } catch (error) {
      console.error('[UserTodosContentComponent] Failed to load todos:', error);
      this.msg.error('載入待辦事項失敗');
    } finally {
      this.loading.set(false);
    }
  }
}
