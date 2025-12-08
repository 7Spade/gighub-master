# 資料模型定義

本目錄存放系統資料模型（DTO / Interface）定義文件。

## 文件結構

```
models/
  ├── account.models.md      # 帳戶相關模型
  ├── blueprint.models.md    # 藍圖相關模型
  ├── task.models.md         # 任務相關模型
  ├── daily-log.models.md    # 日誌相關模型
  └── shared.models.md       # 共享模型
```

## 文件格式

每個模型文件應包含：
1. 模型概述
2. TypeScript Interface 定義
3. 欄位說明
4. 使用範例
5. 關聯模型

## 範例格式

\`\`\`typescript
/**
 * 藍圖基本資訊
 */
export interface Blueprint {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}
\`\`\`
