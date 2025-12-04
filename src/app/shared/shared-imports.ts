// ============================================
// Angular 核心模块（Angular Core Modules）
// ============================================
import { AsyncPipe, CurrencyPipe, DatePipe as NgDatePipe, DecimalPipe, JsonPipe, NgTemplateOutlet, PercentPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
// ============================================
// Delon 主题工具（Delon Theme Utilities）
// ============================================
import { DatePipe, I18nPipe } from '@delon/theme';

// ============================================
// 共用 UI 元件（Shared UI Components）
// ============================================
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { NavCardComponent } from './components/nav-card/nav-card.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
// ============================================
// 共享模块（Shared Modules）
// ============================================
import { HasPermissionDirective, HasRoleDirective, IsOwnerDirective } from './directives/permission.directive';
import { SHARED_DELON_MODULES } from './shared-delon.module';
import { SHARED_ZORRO_MODULES } from './shared-zorro.module';

// ============================================
// 權限指令（Permission Directives）
// ============================================

// ============================================
// 导出所有共享导入（Export All Shared Imports）
// ============================================
export const SHARED_IMPORTS = [
  // Angular 核心
  FormsModule,
  ReactiveFormsModule,
  RouterLink,
  RouterOutlet,
  NgTemplateOutlet,
  AsyncPipe,
  JsonPipe,
  CurrencyPipe,
  DecimalPipe,
  PercentPipe,
  NgDatePipe,

  // Delon 主题
  DatePipe,
  I18nPipe,

  // 權限指令
  HasPermissionDirective,
  HasRoleDirective,
  IsOwnerDirective,

  // 共用 UI 元件
  PageHeaderComponent,
  StatCardComponent,
  NavCardComponent,
  EmptyStateComponent,

  // Delon 业务组件
  ...SHARED_DELON_MODULES,

  // NG-ZORRO 组件
  ...SHARED_ZORRO_MODULES
];

// 注意：下列 providers 列表僅為參考，方便在 AppModule 或 bootstrap 時優先註冊
// 建議在應用啟動階段（bootstrap）先註冊 SupabaseAuthService / 授權相關服務
// 目前所有核心服務都使用 providedIn: 'root'，不需要手動註冊
export const SHARED_PROVIDERS: any[] = [];
