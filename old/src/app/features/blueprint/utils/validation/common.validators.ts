/**
 * Common Validators
 *
 * Common validation utilities
 * Reusable validation functions across blueprint feature
 *
 * @module features/blueprint/utils/validation/common.validators
 */

import { ValidationResult, ValidationError } from './blueprint.validators';

/**
 * Validate required field
 *
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    errors.push({
      field: fieldName,
      code: 'REQUIRED',
      message: `${fieldName} 為必填項目`
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate string length
 *
 * @param value - String value
 * @param fieldName - Field name
 * @param options - Length options
 * @returns Validation result
 */
export function validateStringLength(
  value: string | undefined | null,
  fieldName: string,
  options: { min?: number; max?: number }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value) {
    return { valid: true, errors };
  }

  if (options.min !== undefined && value.length < options.min) {
    errors.push({
      field: fieldName,
      code: 'MIN_LENGTH',
      message: `${fieldName} 至少需要 ${options.min} 個字元`,
      value: value.length
    });
  }

  if (options.max !== undefined && value.length > options.max) {
    errors.push({
      field: fieldName,
      code: 'MAX_LENGTH',
      message: `${fieldName} 不能超過 ${options.max} 個字元`,
      value: value.length
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate number range
 *
 * @param value - Number value
 * @param fieldName - Field name
 * @param options - Range options
 * @returns Validation result
 */
export function validateNumberRange(
  value: number | undefined | null,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null) {
    return { valid: true, errors };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} 必須是有效的數字`
    });
    return { valid: false, errors };
  }

  if (options.integer && !Number.isInteger(value)) {
    errors.push({
      field: fieldName,
      code: 'NOT_INTEGER',
      message: `${fieldName} 必須是整數`,
      value
    });
  }

  if (options.min !== undefined && value < options.min) {
    errors.push({
      field: fieldName,
      code: 'MIN_VALUE',
      message: `${fieldName} 不能小於 ${options.min}`,
      value
    });
  }

  if (options.max !== undefined && value > options.max) {
    errors.push({
      field: fieldName,
      code: 'MAX_VALUE',
      message: `${fieldName} 不能超過 ${options.max}`,
      value
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate email format
 *
 * @param email - Email address
 * @param fieldName - Field name
 * @returns Validation result
 */
export function validateEmail(email: string | undefined | null, fieldName = 'email'): ValidationResult {
  const errors: ValidationError[] = [];

  if (!email) {
    return { valid: true, errors };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_EMAIL',
      message: '請輸入有效的電子郵件地址'
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate URL format
 *
 * @param url - URL string
 * @param fieldName - Field name
 * @returns Validation result
 */
export function validateUrl(url: string | undefined | null, fieldName = 'url'): ValidationResult {
  const errors: ValidationError[] = [];

  if (!url) {
    return { valid: true, errors };
  }

  try {
    new URL(url);
  } catch {
    errors.push({
      field: fieldName,
      code: 'INVALID_URL',
      message: '請輸入有效的網址'
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UUID format
 *
 * @param uuid - UUID string
 * @param fieldName - Field name
 * @returns Validation result
 */
export function validateUuid(uuid: string | undefined | null, fieldName = 'id'): ValidationResult {
  const errors: ValidationError[] = [];

  if (!uuid) {
    return { valid: true, errors };
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(uuid)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_UUID',
      message: '無效的識別碼格式'
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate date
 *
 * @param date - Date value
 * @param fieldName - Field name
 * @param options - Date validation options
 * @returns Validation result
 */
export function validateDate(
  date: Date | string | undefined | null,
  fieldName: string,
  options: { minDate?: Date; maxDate?: Date; allowPast?: boolean; allowFuture?: boolean } = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!date) {
    return { valid: true, errors };
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    errors.push({
      field: fieldName,
      code: 'INVALID_DATE',
      message: '無效的日期格式'
    });
    return { valid: false, errors };
  }

  const now = new Date();

  if (options.allowPast === false && dateObj < now) {
    errors.push({
      field: fieldName,
      code: 'PAST_DATE',
      message: `${fieldName} 不能是過去的日期`
    });
  }

  if (options.allowFuture === false && dateObj > now) {
    errors.push({
      field: fieldName,
      code: 'FUTURE_DATE',
      message: `${fieldName} 不能是未來的日期`
    });
  }

  if (options.minDate && dateObj < options.minDate) {
    errors.push({
      field: fieldName,
      code: 'DATE_TOO_EARLY',
      message: `${fieldName} 不能早於 ${options.minDate.toLocaleDateString()}`
    });
  }

  if (options.maxDate && dateObj > options.maxDate) {
    errors.push({
      field: fieldName,
      code: 'DATE_TOO_LATE',
      message: `${fieldName} 不能晚於 ${options.maxDate.toLocaleDateString()}`
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate enum value
 *
 * @param value - Value to validate
 * @param allowedValues - Allowed enum values
 * @param fieldName - Field name
 * @returns Validation result
 */
export function validateEnum<T>(value: T | undefined | null, allowedValues: readonly T[], fieldName: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null) {
    return { valid: true, errors };
  }

  if (!allowedValues.includes(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_ENUM',
      message: `${fieldName} 必須是以下值之一: ${allowedValues.join(', ')}`,
      value
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate array
 *
 * @param arr - Array value
 * @param fieldName - Field name
 * @param options - Array validation options
 * @returns Validation result
 */
export function validateArray(
  arr: unknown[] | undefined | null,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; unique?: boolean } = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!arr) {
    return { valid: true, errors };
  }

  if (!Array.isArray(arr)) {
    errors.push({
      field: fieldName,
      code: 'NOT_ARRAY',
      message: `${fieldName} 必須是陣列`
    });
    return { valid: false, errors };
  }

  if (options.minLength !== undefined && arr.length < options.minLength) {
    errors.push({
      field: fieldName,
      code: 'ARRAY_MIN_LENGTH',
      message: `${fieldName} 至少需要 ${options.minLength} 個項目`,
      value: arr.length
    });
  }

  if (options.maxLength !== undefined && arr.length > options.maxLength) {
    errors.push({
      field: fieldName,
      code: 'ARRAY_MAX_LENGTH',
      message: `${fieldName} 不能超過 ${options.maxLength} 個項目`,
      value: arr.length
    });
  }

  if (options.unique) {
    const uniqueItems = new Set(arr.map(item => JSON.stringify(item)));
    if (uniqueItems.size !== arr.length) {
      errors.push({
        field: fieldName,
        code: 'ARRAY_NOT_UNIQUE',
        message: `${fieldName} 中的項目不能重複`
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results
 *
 * @param results - Validation results to combine
 * @returns Combined validation result
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const result of results) {
    allErrors.push(...result.errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
