# 建立團隊組件 (Create Team Component)

## 概述

建立團隊組件允許用戶在組織下創建新的團隊。組件使用模態框形式，整合了 `TeamRepository` 和 `WorkspaceContextFacade` 來處理團隊創建和狀態更新。

## 功能特性

- ✅ 組織選擇（從用戶的組織列表中選擇）
- ✅ 表單驗證（團隊名稱必填，2-50個字符）
- ✅ 可選的團隊描述和頭像 URL
- ✅ 創建成功後自動重新載入工作區數據
- ✅ 錯誤處理和用戶提示
- ✅ 響應式設計
- ✅ 無組織時的友好提示

## 使用方法

### 在組件中打開模態框

```typescript
import { Component, inject } from '@angular/core';
import { ModalHelper } from '@delon/theme';
import { CreateTeamComponent } from '@routes/account/create-team/create-team.component';

@Component({
  // ...
})
export class YourComponent {
  private readonly modal = inject(ModalHelper);

  openCreateTeam(): void {
    this.modal.create(CreateTeamComponent, {}, { size: 'md' }).subscribe(result => {
      if (result) {
        console.log('團隊創建成功:', result);
        // 處理創建成功後的邏輯
      }
    });
  }
}
```

### 在模板中添加按鈕

```html
<button nz-button nzType="primary" (click)="openCreateTeam()">
  <i nz-icon nzType="plus"></i>
  建立團隊
</button>
```

## 組件結構

```
create-team/
├── create-team.component.ts    # 組件邏輯
├── create-team.component.html  # 模板
├── create-team.component.less  # 樣式
└── README.md                   # 文檔
```

## 依賴服務

- `TeamRepository`: 創建團隊
- `SupabaseAuthService`: 獲取當前用戶信息
- `WorkspaceContextFacade`: 獲取組織列表和重新載入工作區數據
- `NzModalRef`: 模態框引用
- `NzMessageService`: 顯示消息提示

## 表單字段

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| organizationId | string | 是 | 所屬組織 ID |
| name | string | 是 | 團隊名稱（2-50個字符） |
| description | string | 否 | 團隊描述（最多500個字符） |
| avatar | string | 否 | 團隊頭像 URL |

## 工作流程

1. 組件載入時獲取用戶的組織列表
2. 用戶選擇組織並填寫表單
3. 驗證表單數據
4. 調用 `TeamRepository.create()` 創建團隊
5. 創建成功後重新載入工作區數據
6. 關閉模態框並返回創建的團隊對象

## 特殊情況處理

### 無組織時
如果用戶還沒有任何組織，組件會顯示警告提示，建議用戶先創建組織。

### 載入狀態
在載入組織列表時，組件會顯示載入動畫。

## 錯誤處理

組件會捕獲創建過程中的錯誤並顯示錯誤消息。常見錯誤包括：
- 網絡錯誤
- 驗證錯誤
- 權限錯誤
- 組織不存在

