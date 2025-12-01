/**
 * Blueprint Validators
 *
 * Blueprint-specific validation utilities
 * For validating blueprint data and forms
 *
 * @module features/blueprint/utils/validation/blueprint.validators
 */

import { BLUEPRINT_VALIDATION_RULES } from '../../constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

/**
 * Blueprint data interface for validation
 */
export interface BlueprintData {
  name?: string;
  description?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Validate blueprint name
 *
 * @param name - Blueprint name
 * @returns Validation result
 */
export function validateBlueprintName(name: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = BLUEPRINT_VALIDATION_RULES.name;

  if (!name || name.trim().length === 0) {
    if (rules.required) {
      errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: '藍圖名稱為必填項目'
      });
    }
    return { valid: errors.length === 0, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < rules.minLength) {
    errors.push({
      field: 'name',
      code: 'MIN_LENGTH',
      message: `藍圖名稱至少需要 ${rules.minLength} 個字元`,
      value: trimmedName.length
    });
  }

  if (trimmedName.length > rules.maxLength) {
    errors.push({
      field: 'name',
      code: 'MAX_LENGTH',
      message: `藍圖名稱不能超過 ${rules.maxLength} 個字元`,
      value: trimmedName.length
    });
  }

  if (!rules.pattern.test(trimmedName)) {
    errors.push({
      field: 'name',
      code: 'INVALID_FORMAT',
      message: '藍圖名稱只能包含字母、數字、中文、空格、連字符和底線'
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate blueprint description
 *
 * @param description - Blueprint description
 * @returns Validation result
 */
export function validateBlueprintDescription(description: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = BLUEPRINT_VALIDATION_RULES.description;

  if (!description) {
    return { valid: true, errors }; // Description is optional
  }

  if (description.length > rules.maxLength) {
    errors.push({
      field: 'description',
      code: 'MAX_LENGTH',
      message: `藍圖描述不能超過 ${rules.maxLength} 個字元`,
      value: description.length
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate blueprint tags
 *
 * @param tags - Blueprint tags
 * @returns Validation result
 */
export function validateBlueprintTags(tags: string[] | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const rules = BLUEPRINT_VALIDATION_RULES.tags;

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

  // Check for duplicate tags
  const uniqueTags = new Set(tags.map(t => t.toLowerCase().trim()));
  if (uniqueTags.size !== tags.length) {
    errors.push({
      field: 'tags',
      code: 'DUPLICATE_TAGS',
      message: '標籤不能重複'
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete blueprint data
 *
 * @param data - Blueprint data
 * @returns Validation result
 */
export function validateBlueprint(data: BlueprintData): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate name
  const nameResult = validateBlueprintName(data.name);
  allErrors.push(...nameResult.errors);

  // Validate description
  const descResult = validateBlueprintDescription(data.description);
  allErrors.push(...descResult.errors);

  // Validate tags
  const tagsResult = validateBlueprintTags(data.tags);
  allErrors.push(...tagsResult.errors);

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Check if blueprint name is available (placeholder)
 * Actual implementation would check against server
 *
 * @param _name - Blueprint name to check
 * @param _excludeId - Exclude this blueprint ID from check
 * @returns Promise resolving to availability
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isBlueprintNameAvailable(_name: string, _excludeId?: string): Promise<boolean> {
  // TODO: Implement server-side check
  return true;
}
