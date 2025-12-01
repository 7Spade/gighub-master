# E2E 測試指南

> 使用 Playwright 進行端到端測試的策略與最佳實踐

---

## 🎯 測試策略

### 測試金字塔

```
        /\
       /  \      E2E 測試 (少量，關鍵路徑)
      /----\
     /      \    整合測試 (中等數量)
    /--------\
   /          \  單元測試 (大量，快速)
  /------------\
```

### E2E 測試範圍

| 類型 | 範圍 | 優先級 |
|------|------|--------|
| 關鍵路徑 | 登入、核心功能流程 | 🔴 最高 |
| 使用者旅程 | 完整業務流程 | 🟡 高 |
| 跨模組整合 | 模組間互動 | 🟢 中 |
| 邊界條件 | 錯誤處理、極端情況 | 🔵 低 |

---

## 📁 專案結構

```
e2e/
├── playwright.config.ts         # Playwright 配置
├── fixtures/
│   ├── auth.fixture.ts         # 認證 fixture
│   └── test-data.fixture.ts    # 測試資料 fixture
├── pages/
│   ├── login.page.ts           # 登入頁面物件
│   ├── dashboard.page.ts       # 儀表板頁面物件
│   ├── blueprint.page.ts       # 藍圖頁面物件
│   └── task.page.ts            # 任務頁面物件
├── specs/
│   ├── auth/
│   │   ├── login.spec.ts       # 登入測試
│   │   └── logout.spec.ts      # 登出測試
│   ├── blueprint/
│   │   └── blueprint-crud.spec.ts
│   └── task/
│       ├── task-crud.spec.ts
│       └── task-tree.spec.ts
└── utils/
    ├── helpers.ts              # 輔助函數
    └── selectors.ts            # 選擇器常數
```

---

## 📋 Page Object 模式

### 基本結構

```typescript
// e2e/pages/base.page.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForLoading(): Promise<void> {
    await this.page.waitForSelector('[data-loading="false"]', {
      state: 'attached',
      timeout: 10000,
    });
  }

  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}
```

### 頁面物件範例

```typescript
// e2e/pages/task.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class TaskPage extends BasePage {
  // 選擇器
  private readonly taskTree: Locator;
  private readonly taskTable: Locator;
  private readonly createButton: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.taskTree = this.getByTestId('task-tree');
    this.taskTable = this.getByTestId('task-table');
    this.createButton = this.getByTestId('create-task-btn');
    this.searchInput = this.getByTestId('task-search');
  }

  async goto(blueprintId: string): Promise<void> {
    await this.navigate(`/blueprint/${blueprintId}/tasks`);
    await this.waitForLoading();
  }

  async createTask(title: string, description?: string): Promise<void> {
    await this.createButton.click();
    await this.page.getByLabel('任務名稱').fill(title);
    if (description) {
      await this.page.getByLabel('描述').fill(description);
    }
    await this.page.getByRole('button', { name: '確定' }).click();
    await this.waitForLoading();
  }

  async searchTasks(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(500); // debounce
    await this.waitForLoading();
  }

  async getTaskCount(): Promise<number> {
    const rows = this.page.locator('[data-testid^="task-row-"]');
    return rows.count();
  }

  async clickTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-row-${taskId}`).click();
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-delete-${taskId}`).click();
    await this.page.getByRole('button', { name: '確定' }).click();
    await this.waitForLoading();
  }

  async expectTaskVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectTaskNotVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title)).not.toBeVisible();
  }

  async switchView(view: 'tree' | 'table' | 'board'): Promise<void> {
    await this.page.getByTestId(`view-${view}`).click();
    await this.waitForLoading();
  }
}
```

---

## 🧪 測試範例

### 關鍵路徑測試

```typescript
// e2e/specs/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test.describe('登入流程', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('login_withValidCredentials_shouldRedirectToDashboard', async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('user-avatar')).toBeVisible();
  });

  test('login_withInvalidPassword_shouldShowError', async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = 'wrongpassword';

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(page.getByText('密碼錯誤')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login_withEmptyFields_shouldShowValidationErrors', async ({ page }) => {
    // Act
    await loginPage.submitEmpty();

    // Assert
    await expect(page.getByText('請輸入電子郵件')).toBeVisible();
    await expect(page.getByText('請輸入密碼')).toBeVisible();
  });
});
```

### 業務流程測試

```typescript
// e2e/specs/task/task-crud.spec.ts
import { test, expect } from '@playwright/test';
import { TaskPage } from '../../pages/task.page';
import { authFixture } from '../../fixtures/auth.fixture';

test.describe('任務 CRUD 操作', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    // 使用已登入的狀態
    await authFixture.loginAsUser(page);
    
    taskPage = new TaskPage(page);
    await taskPage.goto('test-blueprint-id');
  });

  test('createTask_withValidData_shouldAppearInList', async () => {
    // Arrange
    const taskTitle = '測試任務 ' + Date.now();

    // Act
    await taskPage.createTask(taskTitle, '測試描述');

    // Assert
    await taskPage.expectTaskVisible(taskTitle);
  });

  test('updateTask_whenEdited_shouldReflectChanges', async () => {
    // Arrange
    const originalTitle = '原始任務';
    const newTitle = '更新後任務';
    await taskPage.createTask(originalTitle);

    // Act
    await taskPage.clickTask('new-task-id');
    await taskPage.editTask({ title: newTitle });

    // Assert
    await taskPage.expectTaskVisible(newTitle);
    await taskPage.expectTaskNotVisible(originalTitle);
  });

  test('deleteTask_whenConfirmed_shouldRemoveFromList', async () => {
    // Arrange
    const taskTitle = '待刪除任務';
    await taskPage.createTask(taskTitle);

    // Act
    await taskPage.deleteTask('task-id');

    // Assert
    await taskPage.expectTaskNotVisible(taskTitle);
  });

  test('searchTasks_withKeyword_shouldFilterResults', async () => {
    // Arrange
    await taskPage.createTask('任務 A');
    await taskPage.createTask('任務 B');
    await taskPage.createTask('其他項目');

    // Act
    await taskPage.searchTasks('任務');

    // Assert
    const count = await taskPage.getTaskCount();
    expect(count).toBe(2);
  });
});
```

### 視覺回歸測試

```typescript
// e2e/specs/visual/task-tree.visual.spec.ts
import { test, expect } from '@playwright/test';
import { TaskPage } from '../../pages/task.page';

test.describe('任務樹視覺測試', () => {
  test('taskTree_withTasks_shouldMatchSnapshot', async ({ page }) => {
    // Arrange
    const taskPage = new TaskPage(page);
    await taskPage.goto('test-blueprint');

    // Act
    await taskPage.switchView('tree');

    // Assert
    await expect(page.getByTestId('task-tree')).toHaveScreenshot('task-tree.png');
  });

  test('taskTable_withTasks_shouldMatchSnapshot', async ({ page }) => {
    // Arrange
    const taskPage = new TaskPage(page);
    await taskPage.goto('test-blueprint');

    // Act
    await taskPage.switchView('table');

    // Assert
    await expect(page.getByTestId('task-table')).toHaveScreenshot('task-table.png');
  });
});
```

---

## ⚙️ Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'yarn start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🔧 測試 Fixture

### 認證 Fixture

```typescript
// e2e/fixtures/auth.fixture.ts
import { Page } from '@playwright/test';

export const authFixture = {
  async loginAsUser(page: Page): Promise<void> {
    // 設置已認證的 storage state
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: process.env.TEST_USER_TOKEN!,
        domain: 'localhost',
        path: '/',
      },
    ]);
  },

  async loginAsAdmin(page: Page): Promise<void> {
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: process.env.TEST_ADMIN_TOKEN!,
        domain: 'localhost',
        path: '/',
      },
    ]);
  },

  async logout(page: Page): Promise<void> {
    await page.context().clearCookies();
  },
};
```

---

## 📚 執行測試

```bash
# 執行所有 E2E 測試
yarn e2e

# 執行特定測試檔案
yarn e2e e2e/specs/task/task-crud.spec.ts

# 使用 UI 模式
yarn e2e --ui

# 產生報告
yarn e2e --reporter=html

# Debug 模式
yarn e2e --debug
```

---

## ✅ 最佳實踐

### Do

```
✅ 使用 Page Object 模式
✅ 使用 data-testid 選擇器
✅ 測試關鍵使用者旅程
✅ 使用有意義的測試名稱
✅ 清理測試資料
✅ 使用環境變數管理敏感資料
```

### Don't

```
❌ 測試實作細節
❌ 使用不穩定的選擇器（如 CSS class）
❌ 硬編碼等待時間
❌ 測試所有可能情況（交給單元測試）
❌ 在測試中修改生產資料
```

---

**最後更新**: 2025-11-27
