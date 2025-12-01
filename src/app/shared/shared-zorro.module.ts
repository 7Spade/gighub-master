// ============================================
// NG-ZORRO-ANTD - 所有可用组件（All Available Components）
// 组件按功能分类枚举：通用/布局/导航/数据录入/数据展示/反馈
// ============================================
// Preference: Use `ng-zorro-antd` components as the primary UI library.
// When creating or refactoring components, prefer ng-zorro equivalents
// before introducing other UI libraries. This file exposes shared
// ng-zorro modules for application-wide use.
//
// 注意: NzMessageService 和 NzNotificationService 是服务，不是模块
// 它们通过 providedIn: 'root' 自动提供，无需在模块中导入
// Note: NzMessageService and NzNotificationService are services, not modules
// They are automatically provided via providedIn: 'root'
//
// 注意: 以下模块需要额外的依赖包，如果需要请先安装：
// - NzCronExpressionModule: 需要 cron-parser
// - NzGraphModule: 需要 d3-drag, d3-selection, d3-zoom, d3-transition, dagre-compound
// Note: The following modules require additional dependencies:
// - NzCronExpressionModule: requires cron-parser
// - NzGraphModule: requires d3-drag, d3-selection, d3-zoom, d3-transition, dagre-compound
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzHashCodeModule } from 'ng-zorro-antd/hash-code';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMentionModule } from 'ng-zorro-antd/mention';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPipesModule } from 'ng-zorro-antd/pipes';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTransferModule } from 'ng-zorro-antd/transfer';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzWaterMarkModule } from 'ng-zorro-antd/water-mark';

// ============================================
// 导出共享模块数组（按功能分类排序）
// ============================================
export const SHARED_ZORRO_MODULES = [
  // 通用组件 (General)
  NzButtonModule,
  NzFloatButtonModule,
  NzIconModule,
  NzTypographyModule,

  // 布局组件 (Layout)
  NzAffixModule,
  NzBreadCrumbModule,
  NzDividerModule,
  NzFlexModule,
  NzGridModule,
  NzLayoutModule,
  NzSpaceModule,
  NzSplitterModule,

  // 导航组件 (Navigation)
  NzAnchorModule,
  NzBackTopModule,
  NzDropDownModule,
  NzMenuModule,
  NzPageHeaderModule,
  NzPaginationModule,
  NzStepsModule,

  // 数据录入组件 (Data Entry)
  NzAutocompleteModule,
  NzCascaderModule,
  NzCheckboxModule,
  NzColorPickerModule,
  NzDatePickerModule,
  NzFormModule,
  NzInputModule,
  NzInputNumberModule,
  NzMentionModule,
  NzRadioModule,
  NzRateModule,
  NzSelectModule,
  NzSegmentedModule,
  NzSliderModule,
  NzSwitchModule,
  NzTimePickerModule,
  NzTransferModule,
  NzTreeSelectModule,
  NzUploadModule,

  // 数据展示组件 (Data Display)
  NzAvatarModule,
  NzBadgeModule,
  NzCalendarModule,
  NzCardModule,
  NzCarouselModule,
  NzCollapseModule,
  NzCommentModule,
  NzDescriptionsModule,
  NzEmptyModule,
  NzHashCodeModule,
  NzImageModule,
  NzListModule,
  NzPopoverModule,
  NzStatisticModule,
  NzTableModule,
  NzTabsModule,
  NzTagModule,
  NzTimelineModule,
  NzToolTipModule,
  NzTreeModule,

  // 其他顯示/工具: QR / Tree View / WaterMark / Resizable / Pipes
  NzTreeViewModule,
  NzQRCodeModule,
  NzWaterMarkModule,
  NzResizableModule,
  NzPipesModule,

  // 反馈组件 (Feedback)
  // 注意: NzMessageService 和 NzNotificationService 是服务（providedIn: 'root'），直接注入使用即可
  NzAlertModule,
  NzDrawerModule,
  NzModalModule,
  NzPopconfirmModule,
  NzProgressModule,
  NzResultModule,
  NzSkeletonModule,
  NzSpinModule
];
