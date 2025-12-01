import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':userId/dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.UserDashboardComponent),
    data: { title: '個人儀表板' }
  },
  {
    path: ':userId/todos',
    loadComponent: () => import('./todos/todos.component').then(m => m.UserTodosComponent),
    data: { title: '我的待辦' }
  },
  {
    path: ':userId/blueprints',
    redirectTo: '/blueprint/list',
    pathMatch: 'full'
  },
  {
    path: ':userId/settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent),
    data: { title: '個人設定' }
  }
];
