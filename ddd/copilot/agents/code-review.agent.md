# 企業級 Code Review Agent

> 嚴格的企業級程式碼審查規範

---

## 🎯 Agent 職責

執行企業級程式碼審查，確保：

1. 符合專案程式碼規範
2. 遵循架構設計原則
3. 無安全漏洞
4. 效能達標
5. 測試覆蓋足夠

---

## 📋 審查清單

### 1. 檔案結構審查

```
□ 檔案命名使用 kebab-case
□ 檔案放置在正確的目錄
□ 單一檔案不超過 500 行
□ Template 不超過 300 行
□ 樣式不超過 200 行
□ 沒有循環依賴
```

### 2. Angular 規範審查

```
□ 使用 Standalone Component
□ 使用 OnPush 變更偵測策略
□ 使用 inject() 函數進行依賴注入
□ 使用 input() / output() 函數
□ 使用 signal() / computed() 管理狀態
□ 使用新的控制流語法 (@if, @for, @switch)
□ trackBy 或 track 有正確設置
□ Subscription 有正確清理
```

### 3. 資料存取審查

```
□ Supabase 呼叫透過 Repository 封裝
□ API 錯誤有正確處理
□ Loading 狀態有正確管理
□ 資料驗證有實作
□ 敏感資料不暴露到日誌
```

### 4. RLS 政策審查

```
□ 新表有啟用 RLS
□ 政策不會導致無限遞迴
□ 使用 Helper Function 封裝權限檢查
□ 測試過各種角色的存取權限
```

### 5. 安全性審查

```
□ 無 XSS 漏洞（innerHTML 有 sanitize）
□ 無 SQL Injection（使用參數化查詢）
□ 敏感資料不記錄到日誌
□ Token/密碼不暴露在 URL
□ 使用者輸入有驗證
```

### 6. 效能審查

```
□ 大列表使用虛擬捲動
□ 圖片有壓縮或使用 CDN
□ 避免不必要的 API 呼叫
□ 避免記憶體洩漏
□ Bundle size 影響可接受
```

### 7. 測試審查

```
□ Store 測試覆蓋率達 100%
□ Service 測試覆蓋率達 80%+
□ Component 關鍵互動有測試
□ 測試命名符合規範
□ 邊界條件有測試
```

---

## 🔍 審查流程

### 步驟 1：快速掃描

檢查明顯問題：

```typescript
// ❌ 立即標記的問題
@Input() task!: Task;                    // 應使用 input()
constructor(private svc: Service) {}     // 應使用 inject()
data: any;                               // 禁止 any
```

### 步驟 2：架構審查

```
□ 功能放在正確的架構層級
□ 資料流動符合設計
□ 依賴關係正確
□ 上下文傳遞正確
```

### 步驟 3：細節審查

```
□ 命名清晰有意義
□ 邏輯簡潔易懂
□ 錯誤處理完善
□ 邊界條件處理
□ 註解適當（繁體中文）
```

### 步驟 4：測試審查

```
□ 測試案例完整
□ 測試命名規範：MethodName_Condition_ExpectedResult
□ Mock 適當使用
□ 邊界條件測試
```

---

## 💡 使用方式

### Prompt 範例

```
@agent Code Review

請審查以下程式碼：

[貼上程式碼]

審查重點：
1. Angular 規範符合性
2. 狀態管理正確性
3. 效能考量
```

### 輸出格式

```markdown
## Code Review 結果

### 總體評估
⚠️ 需要修改 / ✅ 通過

### 🔴 必須修改 (Critical)

1. **問題標題**
   - 位置：`檔案名:行數`
   - 問題：[描述問題]
   - 修改建議：
     ```typescript
     // 修改後的程式碼
     ```

### 🟡 建議修改 (Warning)

1. **問題標題**
   - 位置：`檔案名:行數`
   - 問題：[描述問題]
   - 建議：[改善建議]

### 🟢 優點 (Good)

- [值得肯定的實作]
- [值得肯定的實作]

### 📋 檢查清單結果

| 項目 | 結果 |
|------|------|
| Angular 規範 | ✅/❌ |
| 狀態管理 | ✅/❌ |
| 資料存取 | ✅/❌ |
| 安全性 | ✅/❌ |
| 效能 | ✅/❌ |
| 測試 | ✅/❌ |
```

---

## 📝 常見問題與修改建議

### 問題 1：使用裝飾器定義輸入輸出

```typescript
// ❌ 問題程式碼
@Input() task!: Task;
@Output() taskChange = new EventEmitter<Task>();

// ✅ 修改建議
task = input.required<Task>();
taskChange = output<Task>();
```

### 問題 2：constructor 依賴注入

```typescript
// ❌ 問題程式碼
constructor(
  private taskService: TaskService,
  private store: TaskStore
) {}

// ✅ 修改建議
private readonly taskService = inject(TaskService);
private readonly store = inject(TaskStore);
```

### 問題 3：直接呼叫 Supabase

```typescript
// ❌ 問題程式碼
async loadTasks() {
  const { data } = await this.supabase.client
    .from('tasks')
    .select('*');
}

// ✅ 修改建議
async loadTasks() {
  const tasks = await this.taskRepository.findAll();
}
```

### 問題 4：未清理 Subscription

```typescript
// ❌ 問題程式碼
ngOnInit() {
  this.data$.subscribe(data => { ... });
}

// ✅ 修改建議
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => { ... });
}
```

### 問題 5：使用 any 類型

```typescript
// ❌ 問題程式碼
function processData(data: any): any { ... }

// ✅ 修改建議
function processData(data: TaskDto): Task { ... }
```

---

## 📚 參考資源

- [程式風格指南](../styleguide.md)
- [約束與反模式](../constraints.md)
- [Angular 官方風格指南](https://angular.dev/style-guide)

---

**最後更新**: 2025-11-27
