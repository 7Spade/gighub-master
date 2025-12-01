import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':teamId/dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.TeamDashboardComponent),
    data: { title: '團隊儀表板' }
  },
  {
    path: ':teamId/todos',
    loadComponent: () => import('./todos/todos.component').then(m => m.TeamTodosComponent),
    data: { title: '團隊待辦' }
  },
  {
    path: ':teamId/blueprints',
    redirectTo: '/blueprint/list',
    pathMatch: 'full'
  },
  {
    path: ':teamId/members',
    loadComponent: () => import('./members/members.component').then(m => m.TeamMembersComponent),
    data: { title: '團隊成員' }
  }
];
