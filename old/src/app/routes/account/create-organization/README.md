# 建立組織組件 (Create Organization Component)

## 概述

建立組織組件允許用戶創建新的組織帳戶。組件使用模態框形式，整合了 `AccountService` 和 `WorkspaceContextFacade` 來處理組織創建和狀態更新。

## 功能特性

- ✅ 表單驗證（組織名稱必填，2-50個字符）
- ✅ 可選的電子郵件和頭像 URL
- ✅ 創建成功後自動重新載入工作區數據
- ✅ 錯誤處理和用戶提示
- ✅ 響應式設計

## 使用方法

### 在組件中打開模態框

```typescript
import { Component, inject } from '@angular/core';
import { ModalHelper } from '@delon/theme';
import { CreateOrganizationComponent } from '@routes/account/create-organization/create-organization.component';

@Component({
  // ...
})
export class YourComponent {
  private readonly modal = inject(ModalHelper);

  openCreateOrganization(): void {
    this.modal.create(CreateOrganizationComponent, {}, { size: 'md' }).subscribe(result => {
      if (result) {
        console.log('組織創建成功:', result);
        // 處理創建成功後的邏輯
      }
    });
  }
}
```

### 在模板中添加按鈕

```html
<button nz-button nzType="primary" (click)="openCreateOrganization()">
  <i nz-icon nzType="plus"></i>
  建立組織
</button>
```

## 組件結構

```
create-organization/
├── create-organization.component.ts    # 組件邏輯
├── create-organization.component.html  # 模板
├── create-organization.component.less  # 樣式
└── README.md                           # 文檔
```

## 依賴服務

- `AccountService`: 創建組織帳戶
- `SupabaseAuthService`: 獲取當前用戶信息
- `WorkspaceContextFacade`: 重新載入工作區數據
- `NzModalRef`: 模態框引用
- `NzMessageService`: 顯示消息提示

## 表單字段

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| name | string | 是 | 組織名稱（2-50個字符） |
| email | string | 否 | 組織電子郵件 |
| avatar | string | 否 | 組織頭像 URL |

## 工作流程

1. 用戶填寫表單並提交
2. 驗證表單數據
3. 調用 `AccountService.createAccount()` 創建組織
4. 創建成功後重新載入工作區數據
5. 關閉模態框並返回創建的組織對象

## 錯誤處理

組件會捕獲創建過程中的錯誤並顯示錯誤消息。常見錯誤包括：
- 網絡錯誤
- 驗證錯誤
- 權限錯誤

