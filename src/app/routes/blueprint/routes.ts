/**
 * Blueprint Routes
 *
 * 藍圖路由配置
 * Blueprint routing configuration
 *
 * Following Occam's Razor: Add module guards only to routes that require them
 *
 * @module routes/blueprint
 */

import { Routes } from '@angular/router';
import { moduleEnabledGuard, ModuleType } from '@core';

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
            // No guard needed - overview is always accessible
          },
          {
            path: 'members',
            loadComponent: () => import('./members/members.component').then(m => m.BlueprintMembersComponent),
            data: { title: '成員管理' }
            // No guard needed - core management function
          },
          {
            path: 'tasks',
            loadComponent: () => import('./tasks/tasks.component').then(m => m.BlueprintTasksComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '任務管理',
              requiredModule: ModuleType.TASKS
            }
          },
          {
            path: 'financial',
            loadChildren: () => import('./financial/routes').then(m => m.routes),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '財務管理',
              requiredModule: ModuleType.FINANCIAL
            }
          },
          {
            path: 'diaries',
            loadComponent: () => import('./diaries/diaries.component').then(m => m.BlueprintDiariesComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '施工日誌',
              requiredModule: ModuleType.DIARY
            }
          },
          {
            path: 'qc-inspections',
            loadComponent: () => import('./qc-inspections/qc-inspections.component').then(m => m.BlueprintQcInspectionsComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '品質管控',
              requiredModule: ModuleType.CHECKLISTS
            }
          },
          {
            path: 'files',
            loadComponent: () => import('./files/files.component').then(m => m.BlueprintFilesComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '檔案管理',
              requiredModule: ModuleType.FILES
            }
          },
          {
            path: 'settings',
            loadComponent: () => import('./settings/settings.component').then(m => m.BlueprintSettingsComponent),
            data: { title: '藍圖設定' }
            // No guard needed - core management function
          },
          {
            path: 'problems',
            loadComponent: () => import('./problems/problems.component').then(m => m.BlueprintProblemsComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '問題追蹤',
              requiredModule: ModuleType.ISSUES
            }
          },
          {
            path: 'activities',
            loadComponent: () => import('./activities/activities.component').then(m => m.BlueprintActivitiesComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '活動歷史',
              requiredModule: ModuleType.AUDIT_LOG
            }
          },
          {
            path: 'notifications',
            loadComponent: () => import('./notifications/notifications.component').then(m => m.BlueprintNotificationSettingsComponent),
            data: { title: '通知設定' }
            // No guard needed - core settings function
          },
          {
            path: 'search',
            loadComponent: () => import('./search/search.component').then(m => m.BlueprintAdvancedSearchComponent),
            data: { title: '進階搜尋' }
            // No guard needed - core search function
          },
          {
            path: 'permissions',
            loadComponent: () => import('./permissions/permissions.component').then(m => m.BlueprintPermissionsComponent),
            data: { title: '權限管理' }
            // No guard needed - core management function
          },
          {
            path: 'acceptances',
            loadComponent: () => import('./acceptances/acceptances.component').then(m => m.BlueprintAcceptancesComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '驗收管理',
              requiredModule: ModuleType.ACCEPTANCE
            }
          },
          {
            path: 'reports',
            loadComponent: () => import('./reports/reports.component').then(m => m.BlueprintReportsComponent),
            data: { title: '報表分析' }
            // No guard needed - core reporting function
          },
          {
            path: 'gantt',
            loadComponent: () => import('./gantt/gantt.component').then(m => m.BlueprintGanttComponent),
            canActivate: [moduleEnabledGuard],
            data: {
              title: '甘特圖',
              requiredModule: ModuleType.TASKS // Gantt depends on tasks module
            }
          },
          {
            path: 'api-gateway',
            loadComponent: () => import('./api-gateway/api-gateway.component').then(m => m.BlueprintApiGatewayComponent),
            data: { title: 'API 閘道' }
            // No guard needed - core integration function
          }
        ]
      }
    ]
  }
];
