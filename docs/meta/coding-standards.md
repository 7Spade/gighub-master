# 編碼標準

> GigHub 專案的編碼規範與最佳實踐

---

## 📋 總體原則

1. **可讀性優先**: 程式碼是寫給人看的
2. **一致性**: 遵循專案既有風格
3. **簡潔**: 避免過度工程化
4. **可測試**: 程式碼應易於測試

---

## 🎨 TypeScript

### 命名規範

| 類型 | 命名方式 | 範例 |
|------|---------|------|
| 類別 | PascalCase | `BlueprintService` |
| 介面 | PascalCase | `Blueprint`, `Task` |
| 函數 | camelCase | `getBlueprint()` |
| 變數 | camelCase | `blueprintId` |
| 常數 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 檔案 | kebab-case | `blueprint.service.ts` |

### 型別

- 啟用 `strict` 模式
- 避免使用 `any`
- 使用 `unknown` 替代 `any`
- 明確定義介面

```typescript
// ✅ Good
interface Blueprint {
  id: string;
  name: string;
  ownerId: string;
}

// ❌ Bad
const blueprint: any = {};
```

---

## 🅰️ Angular

### 元件

- 使用 Standalone Components
- 使用 OnPush 變更檢測策略
- 使用 Signals 管理狀態

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class TaskComponent {
  readonly task = input.required<Task>();
  readonly onClick = output<void>();
}
```

### 服務

- 使用 `inject()` 函數
- Repository 模式封裝資料存取

```typescript
export class TaskService {
  private readonly supabase = inject(SupabaseService);
  
  async getTask(id: string): Promise<Task> {
    // ...
  }
}
```

---

## 🗄️ SQL

詳見 [SQL 標準](../../.github/instructions/backend/sql-sp-generation.instructions.md)

---

## 🔗 相關資源

- [Angular Instructions](../../.github/instructions/frontend/angular.instructions.md)
- [TypeScript Instructions](../../.github/instructions/frontend/typescript-5-es2022.instructions.md)
- [程式碼審查指南](../contributing/code-review-guidelines.md)

---

**最後更新**: 2025-12-02
