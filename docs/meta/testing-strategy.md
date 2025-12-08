# 測試策略

> GigHub 專案的測試方法與指南

---

## 🧪 測試層級

```
           ┌─────────────────────┐
           │     E2E Tests       │  ← 少量，驗證關鍵流程
           │   (Playwright)      │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │ Integration Tests   │  ← 中量，驗證模組整合
           │  (Jasmine/Karma)    │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │    Unit Tests       │  ← 大量，驗證單元邏輯
           │  (Jasmine/Karma)    │
           └─────────────────────┘
```

---

## 📋 測試原則

### 1. 測試金字塔
- 70% 單元測試
- 20% 整合測試
- 10% E2E 測試

### 2. AAA 模式
- **Arrange**: 準備測試資料
- **Act**: 執行測試動作
- **Assert**: 驗證結果

### 3. 測試隔離
- 每個測試獨立
- 不依賴執行順序

---

## 🔧 單元測試

### 範例

```typescript
describe('TaskService', () => {
  let service: TaskService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
  });
  
  it('should create task', async () => {
    // Arrange
    const taskData = { title: 'Test Task' };
    
    // Act
    const result = await service.createTask(taskData);
    
    // Assert
    expect(result.title).toBe('Test Task');
  });
});
```

### 執行

```bash
yarn test
yarn test-coverage
```

---

## 🌐 E2E 測試

### 範例

```typescript
import { test, expect } from '@playwright/test';

test('create blueprint', async ({ page }) => {
  await page.goto('/blueprints');
  await page.click('button:text("Create")');
  await page.fill('input[name="name"]', 'Test Blueprint');
  await page.click('button:text("Save")');
  
  await expect(page.locator('.blueprint-card')).toContainText('Test Blueprint');
});
```

### 執行

```bash
yarn e2e
```

---

## �� 相關資源

- [單元測試指南](../../.github/copilot/tests/unit-test-guidelines.md)
- [E2E 測試指南](../../.github/copilot/tests/e2e-guidelines.md)
- [Playwright Agent](../../.github/copilot/agents/playwright-tester.agent.md)

---

**最後更新**: 2025-12-02
