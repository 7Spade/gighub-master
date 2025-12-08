/**
 * Team Todos Content Component
 *
 * 團隊待辦內容組件
 * Team todos content component
 *
 * @module routes/account/todos/components
 */

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, signal, OnInit, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { SupabaseService } from '../../../../core/supabase/supabase.service';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  priority?: string;
  assignee_name?: string;
}

@Component({
  selector: 'app-team-todos-content',
  standalone: true,
  imports: [CommonModule, FormsModule, NzEmptyModule, NzSpinModule, NzListModule, NzCheckboxModule],
  template: `
    <nz-spin [nzSpinning]="loading()">
      @if (todos().length === 0 && !loading()) {
        <nz-empty nzNotFoundContent="暫無團隊待辦事項"></nz-empty>
      } @else {
        <nz-list [nzDataSource]="todos()" [nzRenderItem]="item">
          <ng-template #item let-todo>
            <nz-list-item>
              <label nz-checkbox [ngModel]="todo.completed" (ngModelChange)="toggleComplete(todo, $event)">
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
export class TeamTodosContentComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly supabase = inject(SupabaseService);

  readonly teamId = input.required<string>();
  loading = signal(false);
  todos = signal<Todo[]>([]);

  constructor() {
    effect(() => {
      const id = this.teamId();
      if (id) {
        this.loadTodos();
      }
    });
  }

  ngOnInit(): void {
    this.loadTodos();
  }

  private async loadTodos(): Promise<void> {
    const teamId = this.teamId();
    if (!teamId) return;

    this.loading.set(true);
    try {
      // Get team members first
      const { data: members, error: membersError } = await this.supabase.client
        .from('team_members')
        .select('account_id')
        .eq('team_id', teamId);

      if (membersError) {
        throw new Error(membersError.message);
      }

      if (!members || members.length === 0) {
        this.todos.set([]);
        return;
      }

      const accountIds = members.map(m => m.account_id);

      // Fetch todos for all team members
      const { data, error } = await this.supabase.client
        .from('todos')
        .select('id, title, is_completed, due_date, priority, account_id')
        .in('account_id', accountIds)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      this.todos.set(
        (data || []).map(item => ({
          id: item.id,
          title: item.title,
          completed: item.is_completed ?? false,
          due_date: item.due_date,
          priority: item.priority
        }))
      );
    } catch (error) {
      this.msg.error('載入團隊待辦事項失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleComplete(todo: Todo, completed: boolean): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('todos')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', todo.id);

      if (error) {
        throw new Error(error.message);
      }

      this.todos.update(items =>
        items.map(t => (t.id === todo.id ? { ...t, completed } : t))
      );
    } catch (error) {
      this.msg.error('更新待辦狀態失敗');
    }
  }
}
