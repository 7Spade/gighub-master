import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'widgets',
    loadChildren: () => import('./widgets/routes').then(m => m.routes)
  },
  {
    path: 'style',
    loadChildren: () => import('./style/routes').then(m => m.routes)
  },
  {
    path: 'delon',
    loadChildren: () => import('./delon/routes').then(m => m.routes)
  }
];
