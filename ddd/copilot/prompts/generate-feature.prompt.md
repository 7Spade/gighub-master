# 垂直切片 Feature 生成 Prompt

> 生成符合專案結構的完整 Feature 模組

---

## 🎯 用途

快速生成一個完整的垂直切片 Feature，包含：

- Shell (邏輯容器)
- Data Access (Store, Repository, Service)
- Domain (Models, Interfaces, Enums)
- UI (Components)
- Utils (工具函數)

---

## 📋 Prompt 模板

```
請根據以下需求生成一個完整的 Feature 模組：

## 功能名稱
[功能名稱]

## 功能描述
[功能的簡短描述]

## 所屬層級
[ ] 基礎層 (Foundation)
[ ] 容器層 (Container)
[ ] 業務層 (Business)

## 父模組
[如果是子功能，指定父模組路徑]

## 資料模型
[描述主要的資料結構]

## 主要功能
- [ ] 功能 1
- [ ] 功能 2
- [ ] 功能 3

## 權限需求
- SELECT: [誰可以查看]
- INSERT: [誰可以新增]
- UPDATE: [誰可以更新]
- DELETE: [誰可以刪除]

---

請生成以下結構：

src/app/features/{feature-name}/
├── {feature-name}.routes.ts
├── shell/
│   └── {feature}-shell/
├── data-access/
│   ├── stores/
│   ├── services/
│   └── repositories/
├── domain/
│   ├── enums/
│   ├── interfaces/
│   └── models/
├── ui/
│   └── [子元件]
└── utils/
```

---

## 📝 範例

### 輸入

```
## 功能名稱
task-comment (任務評論)

## 功能描述
讓用戶可以在任務下方新增、編輯、刪除評論，支援 @提及功能

## 所屬層級
[x] 業務層 (Business)

## 父模組
src/app/features/blueprint/

## 資料模型
- id: UUID
- task_id: UUID (關聯到 tasks)
- author_id: UUID (關聯到 accounts)
- content: string
- mentioned_users: UUID[]
- parent_comment_id: UUID? (回覆用)
- created_at: timestamp
- updated_at: timestamp

## 主要功能
- [x] 查看任務評論列表
- [x] 新增評論
- [x] 編輯自己的評論
- [x] 刪除自己的評論
- [x] 回覆評論
- [x] @提及用戶

## 權限需求
- SELECT: 藍圖成員
- INSERT: 藍圖成員
- UPDATE: 評論作者
- DELETE: 評論作者或藍圖管理員
```

### 輸出

#### 1. Routes 配置

```typescript
// src/app/features/blueprint/ui/task/task-comment/task-comment.routes.ts
import { Routes } from '@angular/router';

export const TASK_COMMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-comment-list/task-comment-list.component').then(
        m => m.TaskCommentListComponent
      ),
  },
];
```

#### 2. Domain 層

```typescript
// domain/interfaces/task-comment.interface.ts
export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentionedUsers: string[];
  parentCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskCommentDto {
  taskId: string;
  content: string;
  mentionedUsers?: string[];
  parentCommentId?: string;
}

export interface UpdateTaskCommentDto {
  content: string;
  mentionedUsers?: string[];
}
```

#### 3. Repository

```typescript
// data-access/repositories/task-comment.repository.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { TaskComment, CreateTaskCommentDto, UpdateTaskCommentDto } from '../../domain/interfaces/task-comment.interface';

@Injectable({ providedIn: 'root' })
export class TaskCommentRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'task_comments';

  async findByTask(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async create(dto: CreateTaskCommentDto): Promise<TaskComment> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        task_id: dto.taskId,
        author_id: await this.supabase.getUserAccountId(),
        content: dto.content,
        mentioned_users: dto.mentionedUsers ?? [],
        parent_comment_id: dto.parentCommentId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateTaskCommentDto): Promise<TaskComment> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        content: dto.content,
        mentioned_users: dto.mentionedUsers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

#### 4. Store

```typescript
// data-access/stores/task-comment.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { TaskCommentRepository } from '../repositories/task-comment.repository';
import { TaskComment, CreateTaskCommentDto, UpdateTaskCommentDto } from '../../domain/interfaces/task-comment.interface';

@Injectable({ providedIn: 'root' })
export class TaskCommentStore {
  private readonly repository = inject(TaskCommentRepository);

  // 狀態
  private readonly _comments = signal<TaskComment[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly comments = this._comments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly commentCount = computed(() => this._comments().length);
  readonly rootComments = computed(() =>
    this._comments().filter(c => !c.parentCommentId)
  );

  async loadComments(taskId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const comments = await this.repository.findByTask(taskId);
      this._comments.set(comments);
    } catch (error) {
      this._error.set('載入評論失敗');
      console.error('[TaskCommentStore] loadComments error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createComment(dto: CreateTaskCommentDto): Promise<TaskComment | null> {
    try {
      const comment = await this.repository.create(dto);
      this._comments.update(comments => [...comments, comment]);
      return comment;
    } catch (error) {
      this._error.set('新增評論失敗');
      return null;
    }
  }

  async updateComment(id: string, dto: UpdateTaskCommentDto): Promise<boolean> {
    try {
      const updated = await this.repository.update(id, dto);
      this._comments.update(comments =>
        comments.map(c => (c.id === id ? updated : c))
      );
      return true;
    } catch (error) {
      this._error.set('更新評論失敗');
      return false;
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    try {
      await this.repository.delete(id);
      this._comments.update(comments => comments.filter(c => c.id !== id));
      return true;
    } catch (error) {
      this._error.set('刪除評論失敗');
      return false;
    }
  }

  reset(): void {
    this._comments.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

#### 5. UI Component

```typescript
// ui/task-comment/task-comment-list/task-comment-list.component.ts
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { TaskCommentStore } from '../../../data-access/stores/task-comment.store';

@Component({
  selector: 'app-task-comment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzListModule,
    NzInputModule,
    NzButtonModule,
    NzAvatarModule,
  ],
  templateUrl: './task-comment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentListComponent implements OnInit {
  taskId = input.required<string>();

  private readonly store = inject(TaskCommentStore);

  protected readonly comments = this.store.comments;
  protected readonly loading = this.store.loading;

  protected newComment = '';

  ngOnInit(): void {
    this.store.loadComments(this.taskId());
  }

  protected async onSubmit(): Promise<void> {
    if (!this.newComment.trim()) return;

    await this.store.createComment({
      taskId: this.taskId(),
      content: this.newComment,
    });

    this.newComment = '';
  }
}
```

---

## 📚 參考資源

- [程式風格指南](../styleguide.md)
- [Feature 標準結構](../blueprints/angular-feature.blueprint.md)

---

**最後更新**: 2025-11-27
