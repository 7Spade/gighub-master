// ============================================
// @delon/abc - 业务组件集（Business Components）
// ============================================
// IMPORTANT: Ensure the following integration/order is respected everywhere:
// 1) Supabase Auth integration (SupabaseAuthService)
// 2) @delon/auth (TokenService / DA_SERVICE_TOKEN)
// 3) Then @delon/* modules (acl, abc, form, cache, mock, theme, util, etc.)
// This ordering is important for authentication flow and token propagation.

import { AutoFocusModule } from '@delon/abc/auto-focus';
import { CellModule } from '@delon/abc/cell';
import { CountDownModule } from '@delon/abc/count-down';
import { DatePickerModule as DelonDatePickerModule } from '@delon/abc/date-picker';
import { DownFileModule } from '@delon/abc/down-file';
import { EllipsisModule } from '@delon/abc/ellipsis';
import { ErrorCollectModule } from '@delon/abc/error-collect';
import { ExceptionModule } from '@delon/abc/exception';
import { FooterToolbarModule } from '@delon/abc/footer-toolbar';
import { FullContentModule } from '@delon/abc/full-content';
import { GlobalFooterModule } from '@delon/abc/global-footer';
import { HotkeyModule } from '@delon/abc/hotkey';
import { LoadingModule } from '@delon/abc/loading';
import { LodopModule } from '@delon/abc/lodop';
import { MediaModule } from '@delon/abc/media';
import { NoticeIconModule } from '@delon/abc/notice-icon';
import { OnboardingModule } from '@delon/abc/onboarding';
import { PageHeaderModule } from '@delon/abc/page-header';
import { PdfModule } from '@delon/abc/pdf';
import { QuickMenuModule } from '@delon/abc/quick-menu';
import { ReuseTabModule } from '@delon/abc/reuse-tab';
import { SEModule } from '@delon/abc/se';
import { SGModule } from '@delon/abc/sg';
import { STModule } from '@delon/abc/st';
import { SVModule } from '@delon/abc/sv';
import { TagSelectModule } from '@delon/abc/tag-select';
import { XlsxModule } from '@delon/abc/xlsx';
import { ACLDirective, ACLIfDirective } from '@delon/acl';
import { G2BarModule } from '@delon/chart/bar';
import { G2CardModule } from '@delon/chart/card';
import { G2GaugeModule } from '@delon/chart/gauge';
import { G2MiniAreaModule } from '@delon/chart/mini-area';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2MiniProgressModule } from '@delon/chart/mini-progress';
import { NumberInfoModule } from '@delon/chart/number-info';
import { G2PieModule } from '@delon/chart/pie';
import { G2RadarModule } from '@delon/chart/radar';
import { G2TagCloudModule } from '@delon/chart/tag-cloud';
import { G2TimelineModule } from '@delon/chart/timeline';
import { TrendModule } from '@delon/chart/trend';
import { G2WaterWaveModule } from '@delon/chart/water-wave';
import { DelonFormModule } from '@delon/form';
import { LayoutDefaultModule } from '@delon/theme/layout-default';
import { SettingDrawerModule } from '@delon/theme/setting-drawer';
// Note: ZipService is a service and doesn't require module import
// ============================================
// @delon/acl - 权限控制（ACL - Access Control List）
// ============================================
// ============================================
// @delon/form - 基于 JSON-Schema 的表单模块
// ============================================
// ============================================
// @delon/util - 工具函数/通用库（Utilities）
// ============================================
import { CurrencyPricePipe } from '@delon/util';

// ============================================
// 导出共享模块数组
// ============================================
export const SHARED_DELON_MODULES = [
  // @delon/abc - 业务组件
  AutoFocusModule,
  CellModule,
  CountDownModule,
  DelonDatePickerModule,
  DownFileModule,
  EllipsisModule,
  ErrorCollectModule,
  ExceptionModule,
  FooterToolbarModule,
  FullContentModule,
  GlobalFooterModule,
  HotkeyModule,
  LoadingModule,
  LodopModule,
  MediaModule,
  NoticeIconModule,
  OnboardingModule,
  PageHeaderModule,
  PdfModule,
  QuickMenuModule,
  ReuseTabModule,
  SEModule,
  SGModule,
  STModule,
  SVModule,
  TagSelectModule,
  XlsxModule,

  // @delon/theme - layout & settings
  LayoutDefaultModule,
  SettingDrawerModule,

  // @delon/chart - charts
  G2BarModule,
  G2CardModule,
  G2MiniAreaModule,
  G2MiniBarModule,
  G2MiniProgressModule,
  NumberInfoModule,
  G2PieModule,
  G2TimelineModule,
  TrendModule,
  G2GaugeModule,
  G2TagCloudModule,
  G2WaterWaveModule,
  G2RadarModule,

  // @delon/acl - 权限控制
  ACLDirective,
  ACLIfDirective,

  // @delon/form - 表单模块
  DelonFormModule,

  // @delon/util - 工具
  CurrencyPricePipe
];
