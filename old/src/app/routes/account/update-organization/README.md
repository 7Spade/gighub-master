# Update Organization Component

更新組織組件，允許用戶更新現有組織的資訊。

## 使用方式

```typescript
this.modal.create(UpdateOrganizationComponent, {
  organization: organizationData
}, { size: 'md' }).subscribe(result => {
  if (result) {
    console.log('組織更新成功:', result);
  }
});
```

## 功能

- 更新組織名稱
- 更新組織電子郵件
- 更新組織頭像 URL
- 表單驗證
- 錯誤處理

