/**
 * Task Validators
 *
 * Task-specific validation utilities
 * For validating task data and forms
 *
 * @module features/blueprint/utils/validation/task.validators
 */

import { ValidationResult, ValidationError } from './blueprint.validators';
import { TASK_VALIDATION_RULES } from '../../constants';

/**
 * Task data interface for validation
 */
export interface TaskData {
  name?: string;
  description?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: Date | string;
  [key: string]: unknown;
}

/**
 * Validate task name
 *
 * @param name - Task name
 * @returns Validation result
 */
export function validateTaskName(name: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = TASK_VALIDATION_RULES.name;

  if (!name || name.trim().length === 0) {
    if (rules.required) {
      errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: '任務名稱為必填項目'
      });
    }
    return { valid: errors.length === 0, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < rules.minLength) {
    errors.push({
      field: 'name',
      code: 'MIN_LENGTH',
      message: `任務名稱至少需要 ${rules.minLength} 個字元`,
      value: trimmedName.length
    });
  }

  if (trimmedName.length > rules.maxLength) {
    errors.push({
      field: 'name',
      code: 'MAX_LENGTH',
      message: `任務名稱不能超過 ${rules.maxLength} 個字元`,
      value: trimmedName.length
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate task description
 *
 * @param description - Task description
 * @returns Validation result
 */
export function validateTaskDescription(description: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = TASK_VALIDATION_RULES.description;

  if (!description) {
    return { valid: true, errors }; // Description is optional
  }

  if (description.length > rules.maxLength) {
    errors.push({
      field: 'description',
      code: 'MAX_LENGTH',
      message: `任務描述不能超過 ${rules.maxLength} 個字元`,
      value: description.length
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate task tags
 *
 * @param tags - Task tags
 * @returns Validation result
 */
export function validateTaskTags(tags: string[] | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = TASK_VALIDATION_RULES.tags;

  if (!tags || tags.length === 0) {
    return { valid: true, errors }; // Tags are optional
  }

  if (tags.length > rules.maxCount) {
    errors.push({
      field: 'tags',
      code: 'MAX_COUNT',
      message: `標籤數量不能超過 ${rules.maxCount} 個`,
      value: tags.length
    });
  }

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    if (tag.length > rules.maxLength) {
      errors.push({
        field: `tags[${i}]`,
        code: 'TAG_MAX_LENGTH',
        message: `標籤 "${tag}" 長度不能超過 ${rules.maxLength} 個字元`,
        value: tag.length
      });
    }

    if (tag.trim().length === 0) {
      errors.push({
        field: `tags[${i}]`,
        code: 'TAG_EMPTY',
        message: '標籤不能為空白'
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate task estimated hours
 *
 * @param hours - Estimated hours
 * @returns Validation result
 */
export function validateTaskEstimatedHours(hours: number | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = TASK_VALIDATION_RULES.estimatedHours;

  if (hours === undefined || hours === null) {
    return { valid: true, errors }; // Optional field
  }

  if (typeof hours !== 'number' || isNaN(hours)) {
    errors.push({
      field: 'estimatedHours',
      code: 'INVALID_TYPE',
      message: '預估時數必須是數字'
    });
    return { valid: false, errors };
  }

  if (hours < rules.min) {
    errors.push({
      field: 'estimatedHours',
      code: 'MIN_VALUE',
      message: `預估時數不能小於 ${rules.min}`,
      value: hours
    });
  }

  if (hours > rules.max) {
    errors.push({
      field: 'estimatedHours',
      code: 'MAX_VALUE',
      message: `預估時數不能超過 ${rules.max}`,
      value: hours
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate task due date
 *
 * @param dueDate - Due date
 * @param allowPast - Allow past dates
 * @returns Validation result
 */
export function validateTaskDueDate(dueDate: Date | string | undefined | null, allowPast = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!dueDate) {
    return { valid: true, errors }; // Optional field
  }

  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);

  if (isNaN(date.getTime())) {
    errors.push({
      field: 'dueDate',
      code: 'INVALID_DATE',
      message: '無效的日期格式'
    });
    return { valid: false, errors };
  }

  if (!allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      errors.push({
        field: 'dueDate',
        code: 'PAST_DATE',
        message: '到期日不能是過去的日期'
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete task data
 *
 * @param data - Task data
 * @param options - Validation options
 * @returns Validation result
 */
export function validateTask(data: TaskData, options: { allowPastDueDate?: boolean } = {}): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate name
  const nameResult = validateTaskName(data.name);
  allErrors.push(...nameResult.errors);

  // Validate description
  const descResult = validateTaskDescription(data.description);
  allErrors.push(...descResult.errors);

  // Validate tags
  const tagsResult = validateTaskTags(data.tags);
  allErrors.push(...tagsResult.errors);

  // Validate estimated hours
  const hoursResult = validateTaskEstimatedHours(data.estimatedHours);
  allErrors.push(...hoursResult.errors);

  // Validate due date
  const dueDateResult = validateTaskDueDate(data.dueDate, options.allowPastDueDate);
  allErrors.push(...dueDateResult.errors);

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Validate task order (for reordering)
 *
 * @param order - Task order value
 * @param minOrder - Minimum allowed order
 * @param maxOrder - Maximum allowed order
 * @returns Validation result
 */
export function validateTaskOrder(order: number, minOrder = 0, maxOrder = Number.MAX_SAFE_INTEGER): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof order !== 'number' || isNaN(order)) {
    errors.push({
      field: 'order',
      code: 'INVALID_TYPE',
      message: '順序必須是數字'
    });
    return { valid: false, errors };
  }

  if (!Number.isInteger(order)) {
    errors.push({
      field: 'order',
      code: 'INVALID_INTEGER',
      message: '順序必須是整數'
    });
  }

  if (order < minOrder || order > maxOrder) {
    errors.push({
      field: 'order',
      code: 'OUT_OF_RANGE',
      message: `順序必須在 ${minOrder} 到 ${maxOrder} 之間`,
      value: order
    });
  }

  return { valid: errors.length === 0, errors };
}
