/**
 * UI Constants
 *
 * Constants for Blueprint feature UI configuration
 * Following enterprise development guidelines
 *
 * @module features/blueprint/constants/ui.constants
 */

/**
 * Page layout configuration
 */
export const PAGE_LAYOUT = {
  /** Default gutter for grid layout */
  GUTTER: 16,
  /** Default column span for full width */
  FULL_SPAN: 24,
  /** Half column span */
  HALF_SPAN: 12,
  /** Third column span */
  THIRD_SPAN: 8,
  /** Quarter column span */
  QUARTER_SPAN: 6
} as const;

/**
 * Table configuration
 */
export const TABLE_CONFIG = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,
  /** Page size options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  /** Show size changer */
  SHOW_SIZE_CHANGER: true,
  /** Show quick jumper */
  SHOW_QUICK_JUMPER: true,
  /** Default scroll x */
  SCROLL_X: '100%',
  /** Default scroll y */
  SCROLL_Y: '400px'
} as const;

/**
 * Modal configuration
 */
export const MODAL_CONFIG = {
  /** Small modal width */
  SMALL_WIDTH: 400,
  /** Medium modal width */
  MEDIUM_WIDTH: 600,
  /** Large modal width */
  LARGE_WIDTH: 800,
  /** Extra large modal width */
  XL_WIDTH: 1000,
  /** Full modal width */
  FULL_WIDTH: '90vw',
  /** Default mask closable */
  MASK_CLOSABLE: false,
  /** Default keyboard closable */
  KEYBOARD: true
} as const;

/**
 * Form configuration
 */
export const FORM_CONFIG = {
  /** Default label column span */
  LABEL_COL: 6,
  /** Default wrapper column span */
  WRAPPER_COL: 18,
  /** Horizontal layout label column */
  HORIZONTAL_LABEL_COL: { span: 6 },
  /** Horizontal layout wrapper column */
  HORIZONTAL_WRAPPER_COL: { span: 18 },
  /** Vertical layout label column */
  VERTICAL_LABEL_COL: { span: 24 },
  /** Vertical layout wrapper column */
  VERTICAL_WRAPPER_COL: { span: 24 }
} as const;

/**
 * Drawer configuration
 */
export const DRAWER_CONFIG = {
  /** Small drawer width */
  SMALL_WIDTH: 378,
  /** Medium drawer width */
  MEDIUM_WIDTH: 520,
  /** Large drawer width */
  LARGE_WIDTH: 736,
  /** Extra large drawer width */
  XL_WIDTH: 1000,
  /** Default placement */
  PLACEMENT: 'right' as const,
  /** Default closable */
  CLOSABLE: true,
  /** Default mask closable */
  MASK_CLOSABLE: true
} as const;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  /** Fast animation duration (ms) */
  FAST: 150,
  /** Normal animation duration (ms) */
  NORMAL: 300,
  /** Slow animation duration (ms) */
  SLOW: 500,
  /** Easing function */
  EASING: 'ease-in-out'
} as const;

/**
 * Debounce/Throttle configuration
 */
export const DEBOUNCE_CONFIG = {
  /** Search input debounce (ms) */
  SEARCH: 300,
  /** Resize debounce (ms) */
  RESIZE: 150,
  /** Scroll throttle (ms) */
  SCROLL: 100,
  /** Auto save debounce (ms) */
  AUTO_SAVE: 1000
} as const;

/**
 * Empty state configuration
 */
export const EMPTY_STATE_CONFIG = {
  /** Default empty image */
  IMAGE: 'https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg',
  /** Simple empty image */
  SIMPLE_IMAGE: 'https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original'
} as const;

/**
 * Loading state configuration
 */
export const LOADING_CONFIG = {
  /** Default spinner size */
  SPINNER_SIZE: 'default' as const,
  /** Large spinner size */
  LARGE_SPINNER_SIZE: 'large' as const,
  /** Small spinner size */
  SMALL_SPINNER_SIZE: 'small' as const,
  /** Default delay (ms) */
  DELAY: 200
} as const;

/**
 * Notification configuration
 */
export const NOTIFICATION_CONFIG = {
  /** Default duration (ms) */
  DURATION: 4500,
  /** Short duration (ms) */
  SHORT_DURATION: 2000,
  /** Long duration (ms) */
  LONG_DURATION: 8000,
  /** Default placement */
  PLACEMENT: 'topRight' as const,
  /** Maximum notifications stack */
  MAX_STACK: 3
} as const;

/**
 * Breakpoint configuration (matching Ant Design)
 */
export const BREAKPOINTS = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600
} as const;

/**
 * Color palette for charts and visualizations
 */
export const CHART_COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#f5222d',
  INFO: '#13c2c2',
  PURPLE: '#722ed1',
  PALETTE: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1', '#eb2f96', '#fa8c16']
} as const;

/**
 * Z-index configuration
 */
export const Z_INDEX = {
  DROPDOWN: 1050,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
} as const;
