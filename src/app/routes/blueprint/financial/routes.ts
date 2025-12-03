/**
 * Financial Module Routes
 *
 * 財務模組路由配置
 * Financial module routing configuration
 *
 * Enterprise-grade financial management routes with:
 * - Contract management
 * - Expense tracking
 * - Payment requests
 * - Payment records
 *
 * @module routes/blueprint/financial
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview'
      },
      {
        path: 'overview',
        loadComponent: () => import('./financial-overview.component').then(m => m.FinancialOverviewComponent),
        data: { title: '財務概覽' }
      },
      {
        path: 'contracts',
        loadComponent: () => import('./contract-list.component').then(m => m.ContractListComponent),
        data: { title: '合約管理' }
      },
      {
        path: 'expenses',
        loadComponent: () => import('./expense-list.component').then(m => m.ExpenseListComponent),
        data: { title: '費用管理' }
      },
      {
        path: 'payment-requests',
        loadComponent: () => import('./payment-request-list.component').then(m => m.PaymentRequestListComponent),
        data: { title: '請款管理' }
      },
      {
        path: 'payments',
        loadComponent: () => import('./payment-list.component').then(m => m.PaymentListComponent),
        data: { title: '付款紀錄' }
      }
    ]
  }
];
