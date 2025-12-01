# 教學式註解生成 Prompt

> 為程式碼添加教學式註解，幫助初學者理解程式碼邏輯

---

## 🎯 用途

為現有程式碼添加：

- 類別級別說明
- 方法級別說明
- 複雜邏輯解釋
- 設計模式說明
- 常見陷阱提醒

---

## 📋 Prompt 模板

```
請為以下程式碼添加教學式註解：

## 程式碼
[貼上程式碼]

## 註解重點
- [ ] 類別職責說明
- [ ] 方法用途說明
- [ ] 複雜邏輯解釋
- [ ] 設計模式說明
- [ ] 常見陷阱提醒
- [ ] 使用範例

## 目標讀者
[ ] 初學者
[ ] 中級開發者
[ ] 熟悉 Angular 但不熟悉本專案架構
```

---

## 📝 註解風格指南

### 類別級別

```typescript
/**
 * 任務狀態管理 Store
 *
 * 職責：
 * - 管理任務列表的狀態（載入、快取、更新）
 * - 提供響應式的任務資料給 UI 元件
 * - 封裝與後端 API 的互動邏輯
 *
 * 使用方式：
 * ```typescript
 * @Component({ ... })
 * export class TaskListComponent {
 *   private store = inject(TaskStore);
 *   tasks = this.store.tasks;
 * }
 * ```
 *
 * 設計模式：
 * - 採用 Signals 進行響應式狀態管理
 * - Repository 模式隔離資料存取
 * - Facade 模式簡化 API 呼叫
 */
@Injectable({ providedIn: 'root' })
export class TaskStore { ... }
```

### 方法級別

```typescript
/**
 * 載入指定藍圖的所有任務
 *
 * 流程說明：
 * 1. 設置 loading 狀態為 true
 * 2. 清除之前的錯誤訊息
 * 3. 呼叫 Repository 取得資料
 * 4. 更新 _tasks signal
 * 5. 無論成功或失敗，重置 loading 狀態
 *
 * @param blueprintId - 藍圖的唯一識別碼
 *
 * @example
 * // 在元件中使用
 * ngOnInit() {
 *   this.store.loadTasks(this.blueprintId);
 * }
 *
 * @throws 如果 API 呼叫失敗，會設置 _error signal
 */
async loadTasks(blueprintId: string): Promise<void> { ... }
```

### 複雜邏輯

```typescript
/**
 * 計算任務的子任務進度
 *
 * 演算法說明：
 * 1. 過濾出所有子任務
 * 2. 計算已完成的子任務數量
 * 3. 回傳完成百分比
 *
 * 注意事項：
 * - 如果沒有子任務，回傳 0 而非 NaN
 * - 百分比四捨五入到整數
 */
readonly childProgress = computed(() => {
  const children = this.childTasks();
  // 防止除以零的錯誤
  if (children.length === 0) return 0;

  const completed = children.filter(t => t.status === TaskStatus.COMPLETED);
  // 計算百分比並四捨五入
  return Math.round((completed.length / children.length) * 100);
});
```

### Signal 使用說明

```typescript
// 私有狀態 Signal
// - 使用 private 確保外部無法直接修改
// - Signal 會追蹤變更並通知訂閱者
private readonly _tasks = signal<Task[]>([]);

// 公開唯讀 Signal
// - asReadonly() 防止外部修改
// - 元件可以訂閱此 signal 取得最新值
readonly tasks = this._tasks.asReadonly();

// 計算屬性 (Computed Signal)
// - 自動追蹤依賴的 signal 變更
// - 當 _tasks 變更時，pendingTasks 會自動重新計算
readonly pendingTasks = computed(() =>
  this._tasks().filter(t => t.status === TaskStatus.PENDING)
);
```

### 常見陷阱提醒

```typescript
/**
 * 更新任務狀態
 *
 * ⚠️ 常見陷阱：
 * - 不要直接修改 signal 內部的物件，例如：
 *   this._tasks()[0].status = 'completed'; // ❌ 錯誤
 *   這不會觸發 signal 更新！
 *
 * - 正確做法是使用 update 方法回傳新陣列：
 *   this._tasks.update(tasks =>
 *     tasks.map(t => t.id === id ? { ...t, status } : t)
 *   ); // ✅ 正確
 *
 * @param id - 任務 ID
 * @param status - 新狀態
 */
async updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  try {
    const updated = await this.repository.updateStatus(id, status);

    // 使用 update 方法建立新陣列，確保 signal 能偵測到變更
    this._tasks.update(tasks =>
      tasks.map(t => (t.id === id ? updated : t))
    );

    return true;
  } catch (error) {
    this._error.set('更新任務狀態失敗');
    return false;
  }
}
```

---

## 💡 使用方式

### Prompt 範例

```
請為以下程式碼添加教學式註解：

## 程式碼
```typescript
@Injectable({ providedIn: 'root' })
export class TaskCommentStore {
  private readonly repository = inject(TaskCommentRepository);

  private readonly _comments = signal<TaskComment[]>([]);
  private readonly _loading = signal(false);

  readonly comments = this._comments.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly rootComments = computed(() =>
    this._comments().filter(c => !c.parentCommentId)
  );

  async loadComments(taskId: string): Promise<void> {
    this._loading.set(true);
    try {
      const comments = await this.repository.findByTask(taskId);
      this._comments.set(comments);
    } finally {
      this._loading.set(false);
    }
  }
}
```

## 註解重點
- [x] 類別職責說明
- [x] 方法用途說明
- [x] 複雜邏輯解釋
- [x] Signal 使用說明

## 目標讀者
[x] 熟悉 Angular 但不熟悉本專案架構
```

---

## 📚 註解規範

### 語言

- 使用**繁體中文**撰寫註解
- 技術術語保持英文（如 Signal, Computed, Repository）
- 變數名、方法名保持程式碼中的英文

### 格式

- 類別/方法：使用 JSDoc 格式 `/** ... */`
- 行內註解：使用 `//`
- 區塊說明：使用 `/* ... */`

### 內容

- **簡潔**：避免冗長的說明
- **實用**：著重於「為什麼」而非「是什麼」
- **範例**：提供具體的使用範例
- **陷阱**：標注常見錯誤

---

**最後更新**: 2025-11-27
