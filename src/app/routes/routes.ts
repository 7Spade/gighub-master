import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent } from '../layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      { path: '', redirectTo: 'blueprint', pathMatch: 'full' },
      // Blueprint routes (藍圖路由)
      {
        path: 'blueprint',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes)
      },
      // Account routes (帳戶路由)
      {
        path: 'account',
        loadChildren: () => import('./account/routes').then(m => m.routes)
      }
    ]
  },
  // passport
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'blueprint' }
];
