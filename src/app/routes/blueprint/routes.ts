/**
 * Blueprint Routes
 *
 * 藍圖路由配置
 * Blueprint routing configuration
 *
 * @module routes/blueprint
 */

import { Routes } from '@angular/router';

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
        path: ':id',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'overview'
          },
          {
            path: 'overview',
            loadComponent: () => import('./overview/overview.component').then(m => m.BlueprintOverviewComponent),
            data: { title: '藍圖概覽' }
          },
          {
            path: 'members',
            loadComponent: () => import('./members/members.component').then(m => m.BlueprintMembersComponent),
            data: { title: '成員管理' }
          },
          {
            path: 'tasks',
            loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
            data: { title: '任務管理' }
          },
          {
            path: 'financial',
            loadChildren: () => import('./financial/routes').then(m => m.routes),
            data: { title: '財務管理' }
          },
          {
            path: 'diaries',
            loadComponent: () => import('./diaries/diaries.component').then(m => m.BlueprintDiariesComponent),
            data: { title: '施工日誌' }
          },
          {
            path: 'qc-inspections',
            loadComponent: () => import('./qc-inspections/qc-inspections.component').then(m => m.BlueprintQcInspectionsComponent),
            data: { title: '品質管控' }
          },
          {
            path: 'files',
            loadComponent: () => import('./files/files.component').then(m => m.BlueprintFilesComponent),
            data: { title: '檔案管理' }
          }
        ]
      }
    ]
  }
];
