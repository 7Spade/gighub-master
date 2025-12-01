/**
 * Form Utilities
 *
 * 表單工具類（Shared 層）
 * Form utilities (Shared layer)
 *
 * Provides common form validation and manipulation utilities.
 * Reduces code duplication in route components.
 *
 * @module shared/utils
 */

import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * 標記表單組中所有控件為已觸碰
 * Mark all controls in a form group as touched
 *
 * This is useful for triggering validation display when the form is submitted
 * but contains invalid fields.
 *
 * @param {FormGroup} formGroup - The form group to mark
 *
 * @example
 * ```typescript
 * if (this.form.invalid) {
 *   markFormGroupTouched(this.form);
 *   return;
 * }
 * ```
 */
export function markFormGroupTouched(formGroup: FormGroup): void {
  Object.values(formGroup.controls).forEach(control => {
    control.markAsDirty();
    control.updateValueAndValidity({ onlySelf: true });

    // Handle nested form groups
    if (control instanceof FormGroup) {
      markFormGroupTouched(control);
    }
  });
}

/**
 * 建構表單配置
 * Build form configuration
 *
 * Helper for creating form control configurations with common patterns.
 *
 * @template T - The type of the form value
 * @param {Partial<T>} initialValues - Initial form values
 * @param {Record<keyof T, any[]>} validators - Validators for each field
 * @returns {Record<keyof T, any>} Form configuration object
 *
 * @example
 * ```typescript
 * const form = this.fb.group(buildFormConfig<CreateOrganizationRequest>({
 *   name: '',
 *   email: ''
 * }, {
 *   name: [Validators.required, Validators.minLength(2)],
 *   email: [Validators.email]
 * }));
 * ```
 */
export function buildFormConfig<T>(initialValues: Partial<T>, validators: Partial<Record<keyof T, unknown[]>>): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  for (const key in initialValues) {
    if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
      const value = initialValues[key];
      const fieldValidators = validators[key] || [];
      config[key as string] = [value, fieldValidators];
    }
  }

  return config;
}

/**
 * 取得表單值並修剪字串
 * Get form values with trimmed strings
 *
 * Extracts form values and automatically trims all string fields.
 * Converts empty strings to undefined.
 *
 * @template T - The type of the form value
 * @param {FormGroup} formGroup - The form group
 * @returns {Partial<T>} Trimmed form values
 *
 * @example
 * ```typescript
 * const request = getTrimmedFormValue<CreateOrganizationRequest>(this.form);
 * // All string values are automatically trimmed
 * // Empty strings become undefined
 * ```
 */
export function getTrimmedFormValue<T>(formGroup: FormGroup): Partial<T> {
  const formValue = formGroup.value;
  const result: Record<string, unknown> = {};

  for (const key in formValue) {
    if (Object.prototype.hasOwnProperty.call(formValue, key)) {
      const value = formValue[key];

      if (typeof value === 'string') {
        const trimmed = value.trim();
        result[key] = trimmed === '' ? undefined : trimmed;
      } else {
        result[key] = value;
      }
    }
  }

  return result as Partial<T>;
}

/**
 * 驗證表單是否有效並顯示錯誤
 * Validate form and show errors
 *
 * Combines validation check with marking touched.
 * Returns true if form is valid, false otherwise.
 *
 * @param {FormGroup} formGroup - The form group to validate
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * ```typescript
 * async submit(): Promise<void> {
 *   if (!validateForm(this.form)) {
 *     return;
 *   }
 *   // Proceed with submission
 * }
 * ```
 */
export function validateForm(formGroup: FormGroup): boolean {
  if (formGroup.invalid) {
    markFormGroupTouched(formGroup);
    return false;
  }
  return true;
}

/**
 * 檢查表單控件是否有錯誤且已觸碰
 * Check if form control has error and is touched
 *
 * Useful for conditional error message display.
 *
 * @param {AbstractControl} control - The form control
 * @param {string} [errorKey] - Specific error key to check (optional)
 * @returns {boolean} True if has error and is touched
 *
 * @example
 * ```typescript
 * <span *ngIf="hasError(form.controls['name'], 'required')">
 *   Name is required
 * </span>
 * ```
 */
export function hasError(control: AbstractControl, errorKey?: string): boolean {
  if (!control.dirty && !control.touched) {
    return false;
  }

  if (errorKey) {
    return control.hasError(errorKey);
  }

  return control.invalid;
}
