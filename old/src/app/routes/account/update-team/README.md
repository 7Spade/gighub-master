# Update Team Component

更新團隊組件，允許用戶更新現有團隊的資訊。

## 使用方式

```typescript
this.modal.create(UpdateTeamComponent, {
  team: teamData
}, { size: 'md' }).subscribe(result => {
  if (result) {
    console.log('團隊更新成功:', result);
  }
});
```

## 功能

- 更新團隊名稱
- 更新團隊描述
- 更新團隊頭像 URL
- 表單驗證
- 錯誤處理

