import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':organizationId/dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.OrgDashboardComponent),
    data: { title: '組織儀表板' }
  },
  {
    path: ':organizationId/blueprints',
    redirectTo: '/blueprint/list',
    pathMatch: 'full'
  },
  {
    path: ':organizationId/teams',
    loadComponent: () => import('./teams/teams.component').then(m => m.OrgTeamsComponent),
    data: { title: '團隊管理' }
  },
  {
    path: ':organizationId/members',
    loadComponent: () => import('./members/members.component').then(m => m.OrgMembersComponent),
    data: { title: '成員管理' }
  },
  {
    path: ':organizationId/settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.OrgSettingsComponent),
    data: { title: '組織設定' }
  }
];
