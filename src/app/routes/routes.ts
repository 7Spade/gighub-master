import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent, LayoutBlankComponent } from '../layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Blueprint routes (藍圖路由)
      {
        path: 'blueprint',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes)
      },
      // Account routes (帳戶路由)
      {
        path: 'account',
        loadChildren: () => import('./account/routes').then(m => m.routes)
      },
      // Demo routes (moved from root)
      {
        path: 'dashboard',
        loadChildren: () => import('./demo/dashboard/routes').then(m => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./demo/widgets/routes').then(m => m.routes)
      },
      { path: 'style', loadChildren: () => import('./demo/style/routes').then(m => m.routes) },
      { path: 'delon', loadChildren: () => import('./demo/delon/routes').then(m => m.routes) },
      { path: 'extras', loadChildren: () => import('./demo/extras/routes').then(m => m.routes) },
      { path: 'pro', loadChildren: () => import('./demo/pro/routes').then(m => m.routes) }
    ]
  },
  // Blank Layout 空白布局
  {
    path: 'data-v',
    component: LayoutBlankComponent,
    children: [{ path: '', loadChildren: () => import('./demo/data-v/routes').then(m => m.routes) }]
  },
  // passport
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes) },
  { path: 'exception', loadChildren: () => import('./demo/exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
