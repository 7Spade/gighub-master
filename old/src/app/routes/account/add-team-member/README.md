# Add Team Member Component

## 功能
添加團隊成員組件，允許團隊領導將組織成員添加到團隊中。

## 使用方式
```typescript
this.modal.create(AddTeamMemberComponent, { 
  teamId: 'xxx',
  organizationId: 'yyy'
}, { size: 'md' });
```

## 參數
- `teamId`: 團隊 ID（必須）
- `organizationId`: 組織 ID（必須）

## 功能
- 顯示組織所有成員列表
- 選擇成員並設定角色（隊長/成員）
- 添加成員到團隊

