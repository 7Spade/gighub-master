/**
 * Blueprint Feature Routes
 *
 * 藍圖功能路由配置
 *
 * @module features/blueprint
 */

import { Routes } from '@angular/router';

export const blueprintFeatureRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/blueprint-shell.component').then(m => m.BlueprintShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./ui/dashboard/blueprint-dashboard.component').then(m => m.BlueprintDashboardComponent),
        data: { title: '儀表板' }
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./ui/task/task-list.component').then(m => m.TaskListComponent),
        data: { title: '任務管理' }
      },
      {
        path: 'diary',
        loadComponent: () =>
          import('./ui/diary/diary-list.component').then(m => m.DiaryListComponent),
        data: { title: '施工日誌' }
      },
      {
        path: 'todo',
        loadComponent: () =>
          import('./ui/todo/todo-list.component').then(m => m.TodoListComponent),
        data: { title: '待辦事項' }
      },
      {
        path: 'files',
        loadComponent: () =>
          import('./ui/dashboard/blueprint-dashboard.component').then(m => m.BlueprintDashboardComponent),
        data: { title: '檔案管理' }
      },
      {
        path: 'members',
        loadComponent: () =>
          import('../../routes/blueprint/members/members.component').then(m => m.BlueprintMembersComponent),
        data: { title: '成員管理' }
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./ui/dashboard/blueprint-dashboard.component').then(m => m.BlueprintDashboardComponent),
        data: { title: '藍圖設定' }
      }
    ]
  }
];
