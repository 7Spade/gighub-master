# Angular Feature 標準結構 Blueprint

> Feature 垂直切片的標準目錄結構與檔案模板

---

## 📁 目錄結構

```
src/app/features/{feature-name}/
├── {feature-name}.routes.ts         # 路由配置
├── index.ts                         # 公開 API (選用)
│
├── shell/                           # 邏輯容器層
│   ├── {feature}-shell/
│   │   ├── {feature}-shell.component.ts
│   │   ├── {feature}-shell.component.html
│   │   └── {feature}-shell.component.less
│   └── dialogs/                     # 對話框
│       └── {dialog-name}/
│           ├── {dialog-name}.component.ts
│           ├── {dialog-name}.component.html
│           └── {dialog-name}.component.less
│
├── data-access/                     # 資料存取層
│   ├── stores/                      # Signals Store
│   │   └── {feature}.store.ts
│   ├── services/                    # 業務服務
│   │   └── {feature}.service.ts
│   └── repositories/                # Supabase Repository
│       └── {feature}.repository.ts
│
├── domain/                          # 領域層
│   ├── enums/                       # 枚舉定義
│   │   └── {feature}-status.enum.ts
│   ├── interfaces/                  # 介面定義
│   │   └── {feature}.interface.ts
│   ├── models/                      # 領域模型
│   │   └── {feature}.model.ts
│   └── types/                       # 類型定義
│       └── {feature}.types.ts
│
├── ui/                              # 展示層
│   ├── {sub-feature}/
│   │   ├── {component}.component.ts
│   │   ├── {component}.component.html
│   │   └── {component}.component.less
│   └── shared/                      # Feature 內共用元件
│       └── {shared-component}/
│
└── utils/                           # 工具函數
    └── {feature}.utils.ts
```

---

## 📋 檔案模板

### Routes 配置

```typescript
// {feature-name}.routes.ts
import { Routes } from '@angular/router';

export const FEATURE_NAME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/{feature}-shell/{feature}-shell.component').then(
        m => m.FeatureShellComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./ui/{feature}-list/{feature}-list.component').then(
            m => m.FeatureListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./ui/{feature}-detail/{feature}-detail.component').then(
            m => m.FeatureDetailComponent
          ),
      },
    ],
  },
];
```

### Shell Component

```typescript
// shell/{feature}-shell/{feature}-shell.component.ts
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { FeatureStore } from '../../data-access/stores/{feature}.store';

@Component({
  selector: 'app-{feature}-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './{feature}-shell.component.html',
  styleUrl: './{feature}-shell.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureShellComponent implements OnInit {
  private readonly store = inject(FeatureStore);

  ngOnInit(): void {
    // 初始化邏輯
  }
}
```

### Store

```typescript
// data-access/stores/{feature}.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { FeatureRepository } from '../repositories/{feature}.repository';
import { Feature } from '../../domain/models/{feature}.model';

@Injectable({ providedIn: 'root' })
export class FeatureStore {
  private readonly repository = inject(FeatureRepository);

  // 私有狀態
  private readonly _items = signal<Feature[]>([]);
  private readonly _selectedItem = signal<Feature | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly items = this._items.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly itemCount = computed(() => this._items().length);

  // 載入資料
  async loadItems(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const items = await this.repository.findAll();
      this._items.set(items);
    } catch (error) {
      this._error.set('載入資料失敗');
      console.error('[FeatureStore] loadItems error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  // 選擇項目
  selectItem(item: Feature | null): void {
    this._selectedItem.set(item);
  }

  // 重置狀態
  reset(): void {
    this._items.set([]);
    this._selectedItem.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

### Repository

```typescript
// data-access/repositories/{feature}.repository.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Feature } from '../../domain/models/{feature}.model';

@Injectable({ providedIn: 'root' })
export class FeatureRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = '{table_name}';

  async findAll(): Promise<Feature[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async findById(id: string): Promise<Feature | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async create(dto: CreateFeatureDto): Promise<Feature> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateFeatureDto): Promise<Feature> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}
```

### Interface

```typescript
// domain/interfaces/{feature}.interface.ts
export interface Feature {
  id: string;
  name: string;
  description?: string;
  status: FeatureStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureDto {
  name: string;
  description?: string;
  status?: FeatureStatus;
}

export interface UpdateFeatureDto {
  name?: string;
  description?: string;
  status?: FeatureStatus;
}
```

### Enum

```typescript
// domain/enums/{feature}-status.enum.ts
export enum FeatureStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}
```

### UI Component

```typescript
// ui/{feature}-list/{feature}-list.component.ts
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';

import { FeatureStore } from '../../data-access/stores/{feature}.store';

@Component({
  selector: 'app-{feature}-list',
  standalone: true,
  imports: [CommonModule, NzTableModule],
  templateUrl: './{feature}-list.component.html',
  styleUrl: './{feature}-list.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureListComponent implements OnInit {
  private readonly store = inject(FeatureStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;

  ngOnInit(): void {
    this.store.loadItems();
  }

  protected onSelect(item: Feature): void {
    this.store.selectItem(item);
  }
}
```

---

## 📚 命名規範

| 類型 | 格式 | 範例 |
|------|------|------|
| 資料夾 | kebab-case | `task-management/` |
| 元件檔案 | kebab-case | `task-list.component.ts` |
| Store | PascalCase | `TaskStore` |
| Repository | PascalCase | `TaskRepository` |
| Interface | PascalCase | `Task`, `CreateTaskDto` |
| Enum | PascalCase | `TaskStatus` |

---

**最後更新**: 2025-11-27
