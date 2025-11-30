# Delete Team Component

刪除團隊組件，允許用戶永久刪除現有團隊。

## 使用方式

```typescript
this.modal.create(DeleteTeamComponent, {
  team: teamData
}, { size: 'md' }).subscribe(result => {
  if (result?.deleted) {
    console.log('團隊已刪除:', result.team);
  }
});
```

## 功能

- 顯示刪除確認對話框
- 永久刪除團隊
- 錯誤處理
- 刪除後自動重新載入工作區數據

