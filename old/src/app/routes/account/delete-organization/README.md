# Delete Organization Component

刪除組織組件，允許用戶軟刪除現有組織。

## 使用方式

```typescript
this.modal.create(DeleteOrganizationComponent, {
  organization: organizationData
}, { size: 'md' }).subscribe(result => {
  if (result?.deleted) {
    console.log('組織已刪除:', result.organization);
  }
});
```

## 功能

- 顯示刪除確認對話框
- 軟刪除組織（設定狀態為 DELETED）
- 錯誤處理
- 刪除後自動重新載入工作區數據

