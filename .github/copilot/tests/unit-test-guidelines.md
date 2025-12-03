# 單元測試規範指南

> Store / Service / Component 測試覆蓋標準與最佳實踐

📖 **詳細測試策略請參考**: [docs/reference/testing-strategy.md](../../docs/reference/testing-strategy.md)

---

## 🎯 測試覆蓋率目標

| 層級 | 覆蓋率目標 | 測試重點 |
|------|-----------|----------|
| Store 層 | 100% | 狀態變更、computed signals |
| Service 層 | 80%+ | API 呼叫、錯誤處理 |
| Component 層 | 60%+ | 關鍵交互、表單提交 |
| Utils | 100% | 純函數、邊界條件 |

---

## 📋 測試命名規範

### 格式

```
MethodName_Condition_ExpectedResult
```

### 範例

```typescript
// ✅ 正確的命名
it('loadTasks_whenBlueprintIdValid_shouldReturnTasks', () => { ... });
it('updateStatus_whenNoPermission_shouldThrowError', () => { ... });
it('createTask_whenTitleEmpty_shouldReturnValidationError', () => { ... });

// ❌ 錯誤的命名
it('should load tasks', () => { ... });
it('test updateStatus', () => { ... });
it('createTask works', () => { ... });
```

---

## 🧩 Store 測試範本

### 測試結構

```typescript
// data-access/stores/task.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { TaskRepository } from '../repositories/task.repository';

describe('TaskStore', () => {
  let store: TaskStore;
  let repositoryMock: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    // 建立 Mock
    repositoryMock = {
      findByBlueprint: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TaskRepository>;

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskRepository, useValue: repositoryMock },
      ],
    });

    store = TestBed.inject(TaskStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTasks', () => {
    it('loadTasks_whenBlueprintIdValid_shouldSetTasks', async () => {
      // Arrange
      const mockTasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];
      repositoryMock.findByBlueprint.mockResolvedValue(mockTasks);

      // Act
      await store.loadTasks('blueprint-1');

      // Assert
      expect(store.tasks()).toEqual(mockTasks);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('loadTasks_whenApiFails_shouldSetError', async () => {
      // Arrange
      repositoryMock.findByBlueprint.mockRejectedValue(new Error('API Error'));

      // Act
      await store.loadTasks('blueprint-1');

      // Assert
      expect(store.tasks()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('載入任務失敗');
    });

    it('loadTasks_whenLoading_shouldSetLoadingTrue', async () => {
      // Arrange
      repositoryMock.findByBlueprint.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // Act
      const loadPromise = store.loadTasks('blueprint-1');

      // Assert - 載入中狀態
      expect(store.loading()).toBe(true);

      await loadPromise;

      // Assert - 載入完成
      expect(store.loading()).toBe(false);
    });
  });

  describe('createTask', () => {
    it('createTask_whenValid_shouldAddToTasks', async () => {
      // Arrange
      const newTask = { id: '3', title: 'New Task' };
      repositoryMock.create.mockResolvedValue(newTask);

      // Act
      const result = await store.createTask({ 
        blueprintId: 'bp-1', 
        title: 'New Task' 
      });

      // Assert
      expect(result).toEqual(newTask);
      expect(store.tasks()).toContainEqual(newTask);
    });

    it('createTask_whenApiFails_shouldReturnNullAndSetError', async () => {
      // Arrange
      repositoryMock.create.mockRejectedValue(new Error('Create failed'));

      // Act
      const result = await store.createTask({ 
        blueprintId: 'bp-1', 
        title: 'New Task' 
      });

      // Assert
      expect(result).toBeNull();
      expect(store.error()).toBe('建立任務失敗');
    });
  });

  describe('computed signals', () => {
    it('taskCount_whenTasksExist_shouldReturnCount', () => {
      // Arrange
      store['_tasks'].set([
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ]);

      // Assert
      expect(store.taskCount()).toBe(2);
    });

    it('pendingTasks_whenMixedStatus_shouldFilterPending', () => {
      // Arrange
      store['_tasks'].set([
        { id: '1', status: 'pending' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'pending' },
      ]);

      // Assert
      expect(store.pendingTasks().length).toBe(2);
    });
  });
});
```

---

## 📡 Repository 測試範本

```typescript
// data-access/repositories/task.repository.spec.ts
import { TestBed } from '@angular/core/testing';
import { TaskRepository } from './task.repository';
import { SupabaseService } from '@core/services/supabase.service';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let supabaseMock: any;

  beforeEach(() => {
    // Mock Supabase 客戶端
    supabaseMock = {
      client: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
      },
      getUserAccountId: jest.fn().mockResolvedValue('account-1'),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskRepository,
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    });

    repository = TestBed.inject(TaskRepository);
  });

  describe('findByBlueprint', () => {
    it('findByBlueprint_whenValid_shouldReturnTasks', async () => {
      // Arrange
      const mockData = [
        { id: '1', title: 'Task 1', blueprint_id: 'bp-1' },
      ];
      supabaseMock.client.order.mockResolvedValue({ 
        data: mockData, 
        error: null 
      });

      // Act
      const result = await repository.findByBlueprint('bp-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(supabaseMock.client.from).toHaveBeenCalledWith('tasks');
    });

    it('findByBlueprint_whenError_shouldThrow', async () => {
      // Arrange
      supabaseMock.client.order.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      // Act & Assert
      await expect(repository.findByBlueprint('bp-1'))
        .rejects.toThrow();
    });
  });

  describe('create', () => {
    it('create_whenValid_shouldReturnNewTask', async () => {
      // Arrange
      const newTask = { id: '1', title: 'New Task' };
      supabaseMock.client.single.mockResolvedValue({ 
        data: newTask, 
        error: null 
      });

      // Act
      const result = await repository.create({
        blueprintId: 'bp-1',
        title: 'New Task',
      });

      // Assert
      expect(result.id).toBe('1');
      expect(supabaseMock.client.insert).toHaveBeenCalled();
    });
  });
});
```

---

## 🖼️ Component 測試範本

```typescript
// ui/task-list/task-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TaskListComponent } from './task-list.component';
import { TaskStore } from '../../data-access/stores/task.store';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let storeMock: Partial<TaskStore>;

  beforeEach(async () => {
    // 建立 Store Mock
    storeMock = {
      tasks: signal([]),
      loading: signal(false),
      error: signal(null),
      loadTasks: jest.fn(),
      createTask: jest.fn(),
      deleteTask: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        { provide: TaskStore, useValue: storeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('ngOnInit_shouldLoadTasks', () => {
      // Arrange
      fixture.componentRef.setInput('blueprintId', 'bp-1');

      // Act
      fixture.detectChanges();

      // Assert
      expect(storeMock.loadTasks).toHaveBeenCalledWith('bp-1');
    });
  });

  describe('rendering', () => {
    it('render_whenTasksExist_shouldShowTaskList', () => {
      // Arrange
      (storeMock.tasks as any).set([
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ]);
      fixture.detectChanges();

      // Act
      const taskElements = fixture.nativeElement.querySelectorAll('.task-item');

      // Assert
      expect(taskElements.length).toBe(2);
    });

    it('render_whenLoading_shouldShowSpinner', () => {
      // Arrange
      (storeMock.loading as any).set(true);
      fixture.detectChanges();

      // Act
      const spinner = fixture.nativeElement.querySelector('nz-spin');

      // Assert
      expect(spinner).toBeTruthy();
    });

    it('render_whenError_shouldShowErrorMessage', () => {
      // Arrange
      (storeMock.error as any).set('載入失敗');
      fixture.detectChanges();

      // Act
      const errorResult = fixture.nativeElement.querySelector('nz-result');

      // Assert
      expect(errorResult).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('onTaskClick_shouldEmitTaskSelected', () => {
      // Arrange
      const task = { id: '1', title: 'Task 1' };
      const spy = jest.spyOn(component.taskSelected, 'emit');

      // Act
      component.onTaskClick(task);

      // Assert
      expect(spy).toHaveBeenCalledWith(task);
    });

    it('onDelete_shouldCallStoreDelete', async () => {
      // Arrange
      (storeMock.deleteTask as jest.Mock).mockResolvedValue(true);

      // Act
      await component.onDelete('task-1');

      // Assert
      expect(storeMock.deleteTask).toHaveBeenCalledWith('task-1');
    });
  });
});
```

---

## 🛠️ 測試工具函數

### 建立測試資料

```typescript
// test-utils/factories/task.factory.ts
import { Task } from '../domain/models/task.model';
import { TaskStatus } from '../domain/enums/task-status.enum';

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-' + Math.random().toString(36).substr(2, 9),
    blueprintId: 'bp-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: 'medium',
    taskType: 'task',
    progress: 0,
    depth: 0,
    sortOrder: 0,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({ title: `Task ${i + 1}` })
  );
}
```

---

## 📚 執行測試

```bash
# 執行所有測試
yarn test

# 執行特定測試
yarn test --include='**/task.store.spec.ts'

# 執行測試並產生覆蓋率報告
yarn test --code-coverage

# 監聽模式
yarn test --watch
```

---

## 📚 參考文件

- [測試策略](../../docs/reference/testing-strategy.md)
- [編碼標準](../../docs/reference/coding-standards.md)

---

**最後更新**: 2025-12-03
