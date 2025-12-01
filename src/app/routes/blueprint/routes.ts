/**
 * Blueprint Routes
 *
 * 藍圖路由配置
 * Blueprint routing configuration
 *
 * @module routes/blueprint
 */

import { Routes } from '@angular/router';
import { blueprintResolver, blueprintTitleResolver } from './resolvers/blueprint.resolver';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
      },
      {
        path: 'list',
        loadComponent: () => import('./list/list.component').then(m => m.BlueprintListComponent),
        data: { title: '藍圖列表' }
      },
      {
        // 藍圖詳情頁面 - 使用 features/blueprint 的 Shell
        path: ':id',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'workspace'
          },
          {
            path: 'overview',
            loadComponent: () => import('./list/list.component').then(m => m.BlueprintListComponent),
            data: { title: '藍圖概覽' }
          },
          {
            path: 'members',
            loadComponent: () => import('./members/members.component').then(m => m.BlueprintMembersComponent),
            data: { title: '成員管理' }
          },
          {
            path: 'workspace',
            loadComponent: () => import('./workspace/workspace.component').then(m => m.BlueprintWorkspaceComponent),
            resolve: {
              blueprint: blueprintResolver
            },
            title: blueprintTitleResolver,
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'overview'
              },
              {
                path: 'overview',
                loadComponent: () => import('./workspace/modules/overview/overview.component').then(m => m.BlueprintOverviewComponent),
                data: { title: '藍圖概覽' }
              },
              {
                path: 'tasks',
                loadComponent: () => import('./workspace/modules/tasks/task-list.component').then(m => m.TaskListComponent),
                data: { title: '任務管理', module: 'tasks' }
              },
              {
                path: 'diary',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '施工日誌', module: 'diary' }
              },
              {
                path: 'dashboard',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '儀表板', module: 'dashboard' }
              },
              {
                path: 'files',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '檔案管理', module: 'files' }
              },
              {
                path: 'todos',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '待辦事項', module: 'todos' }
              },
              {
                path: 'checklists',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '檢查清單', module: 'checklists' }
              },
              {
                path: 'issues',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '問題追蹤', module: 'issues' }
              },
              {
                path: 'workflows',
                loadComponent: () => import('./workspace/modules/placeholder/placeholder.component').then(m => m.ModulePlaceholderComponent),
                data: { title: '自動化流程', module: 'bot_workflow' }
              }
            ]
          }
        ]
      }
    ]
  }
];
