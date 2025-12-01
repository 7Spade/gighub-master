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
        // 藍圖詳情頁面 - 使用 features/blueprint 的 Shell
        path: ':id',
        loadChildren: () =>
          import('../../features/blueprint/blueprint.routes').then(m => m.blueprintFeatureRoutes)
      }
    ]
  }
];
