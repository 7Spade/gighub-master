/**
 * Account Routes
 *
 * 帳戶路由配置
 * Account routing configuration
 *
 * @module routes/account
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AccountDashboardComponent),
    data: { title: '儀表板' }
  },
  {
    path: 'todos',
    loadComponent: () => import('./todos/todos.component').then(m => m.AccountTodosComponent),
    data: { title: '待辦事項' }
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.component').then(m => m.AccountTeamsComponent),
    data: { title: '團隊管理' }
  },
  {
    path: 'members',
    loadComponent: () => import('./members/members.component').then(m => m.AccountMembersComponent),
    data: { title: '成員管理' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.AccountSettingsComponent),
    data: { title: '設定' }
  }
];
