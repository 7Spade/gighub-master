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
          }
        ]
      }
    ]
  }
];
