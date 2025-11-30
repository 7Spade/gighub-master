/**
 * Blueprint Constants
 *
 * Constants for Blueprint business logic
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/constants/blueprint.constants
 */

import { BlueprintStatusEnum, BlueprintRoleEnum, ModuleTypeEnum } from '../domain';

/**
 * Blueprint default values
 */
export const BLUEPRINT_DEFAULTS = {
  /** Default status for new blueprints */
  STATUS: BlueprintStatusEnum.ACTIVE,
  /** Default is_public for new blueprints */
  IS_PUBLIC: false,
  /** Default enabled modules */
  ENABLED_MODULES: [ModuleTypeEnum.TASKS],
  /** Default page size for pagination */
  PAGE_SIZE: 20,
  /** Maximum name length */
  MAX_NAME_LENGTH: 255,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 1000,
  /** Maximum slug length */
  MAX_SLUG_LENGTH: 100
} as const;

/**
 * Blueprint status display configuration
 */
export const BLUEPRINT_STATUS_CONFIG = {
  [BlueprintStatusEnum.ACTIVE]: {
    label: '活躍',
    color: 'success',
    icon: 'check-circle',
    description: '藍圖正在使用中'
  },
  [BlueprintStatusEnum.INACTIVE]: {
    label: '非活躍',
    color: 'default',
    icon: 'pause-circle',
    description: '藍圖已暫停'
  },
  [BlueprintStatusEnum.SUSPENDED]: {
    label: '已暫停',
    color: 'warning',
    icon: 'exclamation-circle',
    description: '藍圖已被暫停'
  },
  [BlueprintStatusEnum.DELETED]: {
    label: '已刪除',
    color: 'error',
    icon: 'delete',
    description: '藍圖已被刪除'
  }
} as const;

/**
 * Blueprint role display configuration
 */
export const BLUEPRINT_ROLE_CONFIG = {
  [BlueprintRoleEnum.VIEWER]: {
    label: '檢視者',
    color: 'default',
    icon: 'eye',
    description: '只能檢視藍圖內容'
  },
  [BlueprintRoleEnum.CONTRIBUTOR]: {
    label: '貢獻者',
    color: 'blue',
    icon: 'edit',
    description: '可以編輯藍圖內容'
  },
  [BlueprintRoleEnum.MAINTAINER]: {
    label: '維護者',
    color: 'green',
    icon: 'setting',
    description: '可以管理藍圖設定'
  }
} as const;

/**
 * Module type display configuration
 */
export const MODULE_TYPE_CONFIG = {
  [ModuleTypeEnum.TASKS]: {
    label: '任務',
    color: 'blue',
    icon: 'project',
    description: '任務管理模組'
  },
  [ModuleTypeEnum.DIARY]: {
    label: '日誌',
    color: 'orange',
    icon: 'book',
    description: '施工日誌模組'
  },
  [ModuleTypeEnum.DASHBOARD]: {
    label: '儀表板',
    color: 'green',
    icon: 'dashboard',
    description: '數據儀表板模組'
  },
  [ModuleTypeEnum.BOT_WORKFLOW]: {
    label: '自動化',
    color: 'purple',
    icon: 'robot',
    description: '自動化工作流程模組'
  },
  [ModuleTypeEnum.FILES]: {
    label: '檔案',
    color: 'cyan',
    icon: 'folder',
    description: '檔案管理模組'
  },
  [ModuleTypeEnum.TODOS]: {
    label: '待辦',
    color: 'lime',
    icon: 'check-square',
    description: '待辦事項模組'
  },
  [ModuleTypeEnum.CHECKLISTS]: {
    label: '檢查清單',
    color: 'gold',
    icon: 'ordered-list',
    description: '品質檢查清單模組'
  },
  [ModuleTypeEnum.ISSUES]: {
    label: '問題',
    color: 'red',
    icon: 'bug',
    description: '問題追蹤模組'
  }
} as const;

/**
 * Blueprint form validation rules
 */
export const BLUEPRINT_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: BLUEPRINT_DEFAULTS.MAX_NAME_LENGTH,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/
  },
  slug: {
    required: true,
    minLength: 1,
    maxLength: BLUEPRINT_DEFAULTS.MAX_SLUG_LENGTH,
    pattern: /^[a-z0-9\-]+$/
  },
  description: {
    required: false,
    maxLength: BLUEPRINT_DEFAULTS.MAX_DESCRIPTION_LENGTH
  }
} as const;

/**
 * Blueprint sort options for UI
 */
export const BLUEPRINT_SORT_OPTIONS = [
  { label: '名稱', value: 'name' },
  { label: '建立時間', value: 'created_at' },
  { label: '更新時間', value: 'updated_at' }
] as const;
