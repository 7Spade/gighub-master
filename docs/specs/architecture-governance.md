---
title: 架構治理規範
status: draft
created: 2025-11-27
owners: []
progress: 0
due: null
---

# 架構治理規範

> **目的**: 定義 ng-alain-gighub 專案的架構治理規範，確保開發團隊遵循統一標準

---

## 📋 目標讀者

- 前端開發者
- 後端開發者
- 技術主管
- AI Agents

---

## 🏗️ 核心架構原則

### 1. Standalone Components

**規則**: 採用 Standalone Components，禁止建立 NgModule

```typescript
// ✅ 正確
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, NzTableModule],
  template: `...`
})
export class TaskListComponent {}

// ❌ 錯誤
@NgModule({
  declarations: [TaskListComponent],
  imports: [CommonModule]
})
export class TaskModule {}
```

### 2. 分層架構

**規則**: routes → shared → core（嚴禁循環依賴）

```
src/app/
├── routes/       # 頁面路由（可依賴 shared、core）
├── features/     # 垂直功能切片（可依賴 shared、core）
├── shared/       # 共用組件（僅依賴 core）
└── core/         # 核心服務（不依賴其他）
```

### 3. 跨層通訊

**規則**: 任何跨層通訊需透過明確的 public API（barrel file）

```typescript
// shared/index.ts (barrel file)
export { SharedComponent } from './components/shared.component';
export { SharedService } from './services/shared.service';

// routes/some-route/some.component.ts
import { SharedComponent, SharedService } from '@shared';
```

### 4. 循環依賴檢測

**規則**: 禁止循環依賴（使用 ESLint 規則檢測）

```json
// eslint.config.mjs
{
  "rules": {
    "import/no-cycle": "error"
  }
}
```

---

## 🧩 組件規範

### UI Component 必須為 Presentational

**規則**: 所有 UI component 必須為 Presentational（不含業務邏輯）

```typescript
// ✅ 正確 - Presentational Component
@Component({
  selector: 'app-task-card',
  standalone: true,
  template: `
    <nz-card [nzTitle]="task().name">
      <p>{{ task().description }}</p>
      <button (click)="onEdit.emit(task())">編輯</button>
    </nz-card>
  `
})
export class TaskCardComponent {
  task = input.required<Task>();
  onEdit = output<Task>();
}


  **完成判準（Definition of Done）**

  - `status` 更新為 `done` 並由架構負責人或 reviewer 核准。
  - 重要架構決策（Decision Records）已建立或連結於本文件。
  - 與實作團隊確認可執行性，且有至少一個範例或代碼片段驗證原則。

  **Acceptance Checklist 範本（Architecture）**

  - [ ] System Context Diagram 已完成並審查
  - [ ] Component Diagram 與資料流已詳細列出
  - [ ] Integration points 與契約（Auth/Storage/API）已確認
  - [ ] NFR 指標與驗證方法已列出（可用性、延遲、可擴展）

// ❌ 錯誤 - 包含業務邏輯
@Component({...})
export class TaskCardComponent {
  private taskService = inject(TaskService);
  
  updateTask() {
    this.taskService.update(...); // 業務邏輯應在 Store/Service
  }
}
```

### 組件大小限制

**規則**: 
- Component > 500 行必須拆分
- Template < 300 行
- TypeScript < 300 行

---

## 🔌 服務規範

### Service 必須純粹邏輯

**規則**: 服務必須純粹邏輯，不能綁定 UI 或路徑

```typescript
// ✅ 正確
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks');
  }
}

// ❌ 錯誤 - 綁定 UI
@Injectable()
export class TaskService {
  private router = inject(Router);
  
  createTask() {
    // 不應在 Service 中導航
    this.router.navigate(['/tasks']);
  }
}
```

### API 封裝

**規則**: 嚴禁在 Component 直接呼叫 HttpClient，所有 API Call 必須被 Repository 層封裝

```typescript
// ✅ 正確 - Repository 封裝
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly http = inject(HttpClient);
  
  findAll(): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks');
  }
}

// ❌ 錯誤 - Component 直接呼叫
@Component({...})
export class TaskListComponent {
  private http = inject(HttpClient);
  
  ngOnInit() {
    this.http.get('/api/tasks').subscribe();
  }
}
```

### 儲存抽象

**規則**: 禁止在 service 使用 localStorage，改用 StorageService abstraction

```typescript
// ✅ 正確
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ❌ 錯誤 - 直接使用 localStorage
@Injectable()
export class SomeService {
  save() {
    localStorage.setItem('key', 'value'); // 禁止
  }
}
```

---

## 📊 狀態管理規範

### Signal 優先

**規則**: Signals 取代 RxJS state（除非必須多 event stream）

```typescript
// ✅ 正確 - 使用 Signal
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();
  readonly taskCount = computed(() => this._tasks().length);
  
  setTasks(tasks: Task[]) {
    this._tasks.set(tasks);
  }
}

// ⚠️ 有條件使用 RxJS - 多 event stream
@Injectable()
export class RealtimeService {
  // WebSocket 等需要 Observable 的場景
  readonly messages$ = webSocket<Message>('ws://...');
}
```

### 依賴注入

**規則**: 使用 inject() 取代 constructor DI（除非需要 mock）

```typescript
// ✅ 正確
@Component({...})
export class TaskListComponent {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);
}

// ⚠️ 測試需要時可使用 constructor
@Component({...})
export class TaskListComponent {
  constructor(private taskStore: TaskStore) {}
}
```

---

## 📁 模組組織規範

### 全域設定

**規則**: 全域設定與狀態統一放在 AppConfig / AppState

```typescript
// core/config/app.config.ts
export const APP_CONFIG = {
  apiUrl: environment.apiUrl,
  pageSize: 20,
  maxUploadSize: 10 * 1024 * 1024,
};

// core/state/app.state.ts
@Injectable({ providedIn: 'root' })
export class AppState {
  readonly isLoading = signal(false);
  readonly currentUser = signal<User | null>(null);
}
```

### Feature 間互動

**規則**: Feature 間的互動必須透過 Application Facade

```typescript
// core/facades/application.facade.ts
@Injectable({ providedIn: 'root' })
export class ApplicationFacade {
  private readonly taskStore = inject(TaskStore);
  private readonly diaryStore = inject(DiaryStore);
  
  // 跨 Feature 的操作
  completeTaskWithDiary(taskId: string, diary: Diary) {
    this.taskStore.complete(taskId);
    this.diaryStore.add(diary);
  }
}
```

### Shared 組件限制

**規則**: 
- 禁止把共用元件放在公共 root（避免無限增大 shared）
- Feature 模組不可依賴 shared 的 business service

```
// ✅ 正確結構
shared/
├── components/
│   ├── button/
│   ├── card/
│   └── table/
├── directives/
├── pipes/
└── utils/

// ❌ 錯誤 - 把所有東西放在 shared
shared/
├── task-card/          # 應該在 features/task
├── diary-form/         # 應該在 features/diary
└── business-service/   # 應該在 core
```

---

## 🔄 路由規範

**規則**: Routing 使用 feature-based lazy loading

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'tasks',
    loadChildren: () => import('./features/task/task.routes').then(m => m.TASK_ROUTES)
  },
  {
    path: 'diaries',
    loadChildren: () => import('./features/diary/diary.routes').then(m => m.DIARY_ROUTES)
  }
];
```

---

## ✅ 檢查清單

開發時確認以下項目：

- [ ] 使用 Standalone Component
- [ ] 使用 inject() 依賴注入
- [ ] 使用 Signal 狀態管理
- [ ] API 呼叫經過 Repository 封裝
- [ ] 無循環依賴
- [ ] Component < 500 行
- [ ] Template < 300 行
- [ ] 遵循分層架構
- [ ] 跨層通訊透過 barrel file
- [ ] 儲存透過 StorageService

---

**最後更新**: 2025-11-27  
**維護者**: 開發團隊
