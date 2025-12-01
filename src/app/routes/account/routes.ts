import { Routes } from '@angular/router';

export const routes: Routes = [
  // Unified dashboard (context-aware)
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { title: '儀表板' }
  },
  // Unified settings (context-aware)
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    data: { title: '設定' }
  },
  // Unified todos (context-aware)
  {
    path: 'todos',
    loadComponent: () => import('./todos/todos.component').then(m => m.TodosComponent),
    data: { title: '待辦事項' }
  },
  // Unified teams (context-aware, organization only)
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.component').then(m => m.TeamsComponent),
    data: { title: '團隊管理' }
  },
  // Unified members (context-aware)
  {
    path: 'members',
    loadComponent: () => import('./members/members.component').then(m => m.MembersComponent),
    data: { title: '成員管理' }
  },
  // Default redirect to dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
