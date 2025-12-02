# 權限系統 (RBAC) 實現文檔
# Permission System (RBAC) Implementation Documentation

## 📋 概述 / Overview

本文檔描述 GigHub 工地施工進度追蹤管理系統的 RBAC 權限系統實現。

This document describes the RBAC permission system implementation for the GigHub Construction Progress Tracking Management System.

## 🏗️ 架構 / Architecture

### 三層架構整合 / Three-Layer Architecture Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Core Layer (核心層)                         │
├─────────────────────────────────────────────────────────────────┤
│  Permission Types     │  Permission Guards    │  Permission    │
│  (types/permission)   │  (guards/)            │  Facade        │
├─────────────────────────────────────────────────────────────────┤
│                     Shared Layer (共享層)                       │
├─────────────────────────────────────────────────────────────────┤
│  Permission Service   │  Permission           │                 │
│  (services/permission)│  Directives           │                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📂 文件結構 / File Structure

```
src/app/
├── core/
│   ├── facades/
│   │   └── permission/
│   │       ├── index.ts
│   │       └── permission.facade.ts      # 權限門面
│   ├── guards/
│   │   ├── index.ts
│   │   └── permission.guard.ts           # 路由守衛
│   └── infra/
│       └── types/
│           └── permission/
│               └── index.ts               # 權限類型定義
└── shared/
    ├── directives/
    │   ├── index.ts
    │   └── permission.directive.ts       # 權限指令
    └── services/
        └── permission/
            ├── index.ts
            └── permission.service.ts      # 權限服務

supabase/seeds/
└── init.sql                              # 資料庫架構（包含 RBAC）
```

## 🎭 業務角色 / Business Roles

| 角色 | Role | 說明 | Description |
|------|------|------|-------------|
| 專案經理 | project_manager | 最高藍圖級權限，可管理所有設定和成員 | Full blueprint-level authority |
| 工地主任 | site_director | 現場管理權限，可管理任務和日誌 | On-site management |
| 現場監督 | site_supervisor | 現場監督權限，可監督任務執行和審核日誌 | On-site supervision |
| 施工人員 | worker | 任務執行權限，可創建和更新任務 | Task execution |
| 品管人員 | qa_staff | 品質驗收權限，可執行品質檢查和驗收 | Quality assurance |
| 公共安全衛生 | safety_health | 安全衛生管理權限，可管理安全相關事項 | Safety and health management |
| 財務 | finance | 財務管理權限，可查看財務相關資料 | Financial management |
| 觀察者 | observer | 僅檢視權限，只能查看內容 | View only |

## 🔐 權限定義 / Permission Definitions

### 藍圖權限 / Blueprint Permissions
- `blueprint:read` - 讀取藍圖
- `blueprint:write` - 寫入藍圖
- `blueprint:delete` - 刪除藍圖
- `blueprint:manage_members` - 管理成員
- `blueprint:manage_settings` - 管理設定

### 任務權限 / Task Permissions
- `task:read` - 讀取任務
- `task:create` - 創建任務
- `task:update` - 更新任務
- `task:delete` - 刪除任務
- `task:assign` - 分配任務
- `task:review` - 審核任務

### 日誌權限 / Diary Permissions
- `diary:read` - 讀取日誌
- `diary:create` - 創建日誌
- `diary:update` - 更新日誌
- `diary:delete` - 刪除日誌
- `diary:approve` - 審批日誌

### 驗收權限 / Acceptance Permissions
- `checklist:read` - 讀取檢查清單
- `checklist:manage` - 管理檢查清單
- `acceptance:perform` - 執行驗收
- `acceptance:approve` - 審批驗收

## 🚀 使用方式 / Usage

### 1. 路由守衛 / Route Guards

```typescript
import { 
  permissionGuard, 
  canCreateTask,
  isProjectManager 
} from '@core';
import { Permission, BlueprintBusinessRole } from '@core';

// 使用預設守衛
const routes: Routes = [
  {
    path: 'tasks/create',
    component: TaskCreateComponent,
    canActivate: [canCreateTask]
  }
];

// 自訂守衛
const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [permissionGuard({
      permissions: [Permission.BLUEPRINT_MANAGE_SETTINGS],
      redirectTo: '/exception/403'
    })]
  }
];

// 角色守衛
const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [permissionGuard({
      roles: [BlueprintBusinessRole.PROJECT_MANAGER]
    })]
  }
];
```

### 2. 權限指令 / Permission Directives

```html
<!-- 單一權限 -->
<button *hasPermission="'task:create'">創建任務</button>

<!-- 多個權限（任一） -->
<button *hasPermission="['task:update', 'task:delete']">編輯/刪除</button>

<!-- 帶 else 模板 -->
<button *hasPermission="'task:delete'; else noAccess">刪除</button>
<ng-template #noAccess>
  <span>無權限</span>
</ng-template>

<!-- 角色檢查 -->
<div *hasRole="'project_manager'">
  管理員專區
</div>

<!-- 擁有者檢查 -->
<button *isOwner="true">只有擁有者可見</button>
```

### 3. 服務/門面 / Service/Facade

```typescript
import { PermissionFacade } from '@core';
import { PermissionService } from '@shared';
import { Permission, BlueprintBusinessRole } from '@core';

@Component({...})
export class MyComponent {
  private permissionFacade = inject(PermissionFacade);

  // 使用計算信號
  canCreate = this.permissionFacade.canCreateTask;
  isManager = this.permissionFacade.isProjectManager;

  // 程式化檢查
  checkPermission() {
    if (this.permissionFacade.hasPermission(Permission.TASK_DELETE)) {
      // 有權限
    }
  }

  // 載入權限上下文
  async loadPermissions(blueprintId: string, accountId: string) {
    await this.permissionFacade.loadContext(blueprintId, accountId);
  }
}
```

### 4. 模板中使用信號 / Using Signals in Templates

```typescript
@Component({
  template: `
    @if (permissionFacade.canCreateTask()) {
      <button>創建任務</button>
    }
    
    @if (permissionFacade.isManagement()) {
      <div>管理區域</div>
    }
  `
})
export class MyComponent {
  readonly permissionFacade = inject(PermissionFacade);
}
```

## 📊 資料庫表結構 / Database Schema

### blueprint_roles 表

```sql
CREATE TABLE blueprint_roles (
  id UUID PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  business_role blueprint_business_role NOT NULL,
  permissions JSONB DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### blueprint_members 更新

```sql
ALTER TABLE blueprint_members 
  ADD COLUMN business_role blueprint_business_role,
  ADD COLUMN custom_role_id UUID REFERENCES blueprint_roles(id);
```

## 🔄 自動角色創建 / Automatic Role Creation

當創建新藍圖時，系統會自動創建八個預設角色：

1. 專案經理 (project_manager)
2. 工地主任 (site_director)
3. 現場監督 (site_supervisor)
4. 施工人員 (worker)
5. 品管人員 (qa_staff)
6. 公共安全衛生 (safety_health)
7. 財務 (finance)
8. 觀察者 (observer)

## 📝 注意事項 / Notes

1. **權限上下文載入**：在訪問藍圖相關頁面前，需先載入權限上下文
2. **擁有者優先**：藍圖擁有者始終擁有所有權限
3. **角色映射**：現有的 `blueprint_role` 會自動映射到業務角色
4. **RLS 整合**：權限系統與 Supabase RLS 政策整合使用
