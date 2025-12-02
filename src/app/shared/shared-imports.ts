// ============================================
// Angular 核心模块（Angular Core Modules）
// ============================================
import { AsyncPipe, JsonPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
// ============================================
// Delon 主题工具（Delon Theme Utilities）
// ============================================
import { DatePipe, I18nPipe } from '@delon/theme';

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

  // Delon 主题
  DatePipe,
  I18nPipe,

  // 權限指令
  HasPermissionDirective,
  HasRoleDirective,
  IsOwnerDirective,

  // Delon 业务组件
  ...SHARED_DELON_MODULES,

  // NG-ZORRO 组件
  ...SHARED_ZORRO_MODULES
];

// 注意：下列 providers 列表僅為參考，方便在 AppModule 或 bootstrap 時優先註冊
// 建議在應用啟動階段（bootstrap）先註冊 SupabaseAuthService / 授權相關服務
// 目前所有核心服務都使用 providedIn: 'root'，不需要手動註冊
export const SHARED_PROVIDERS: any[] = [];
