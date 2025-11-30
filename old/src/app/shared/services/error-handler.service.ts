/**
 * Error Handler Service
 *
 * 錯誤處理服務（Shared 層）
 * Error handler service (Shared layer)
 *
 * Provides unified error handling and user-friendly error messages.
 * Converts technical errors (e.g., Supabase error codes) to readable messages.
 *
 * @module shared/services
 */

import { Injectable } from '@angular/core';

/**
 * Supabase 錯誤代碼映射
 * Supabase error code mapping
 */
export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  /**
   * 將 Supabase 錯誤轉換為用戶友好的訊息
   * Convert Supabase error to user-friendly message
   *
   * @param {unknown} error - Error object
   * @param {string} operation - Operation type (create, update, delete)
   * @param {string} entityType - Entity type (organization, team, etc.)
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error: unknown, operation: string, entityType: string): string {
    // 默認錯誤訊息
    const defaultMessages: Record<string, string> = {
      create: `創建${entityType}失敗`,
      update: `更新${entityType}失敗`,
      delete: `刪除${entityType}失敗`,
      load: `載入${entityType}失敗`
    };

    const defaultMessage = defaultMessages[operation] || `操作${entityType}失敗`;

    // 處理基本錯誤類型
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return this.parseSupabaseError(error, defaultMessage);
    }

    // 處理包含 error 屬性的對象
    const errorObj = error as any;
    if (errorObj?.error?.message) {
      return errorObj.error.message;
    }

    if (errorObj?.message) {
      return this.parseSupabaseError(errorObj, defaultMessage);
    }

    return defaultMessage;
  }

  /**
   * 解析 Supabase 錯誤
   * Parse Supabase error
   *
   * @param {any} error - Error object with Supabase error code
   * @param {string} defaultMessage - Default error message
   * @returns {string} Parsed error message
   */
  private parseSupabaseError(error: any, defaultMessage: string): string {
    if (!error.code) {
      return error.message || defaultMessage;
    }

    // Supabase 錯誤代碼映射
    const errorCodeMap: Record<string, string> = {
      // PostgreSQL 錯誤代碼
      '23505': '資料已存在（唯一性約束違反）',
      '23503': '相關資料不存在（外鍵約束違反）',
      '23502': '必填欄位不能為空',
      '42501': '沒有權限執行此操作，請檢查您的登錄狀態',
      '42P01': '資料表不存在',

      // PostgREST 錯誤代碼
      PGRST116: '資源不存在或已被刪除',
      PGRST301: '請求參數錯誤',

      // 認證錯誤
      'auth/invalid-user': '用戶不存在或未登錄',
      'auth/unauthorized': '未授權訪問'
    };

    const mappedMessage = errorCodeMap[error.code];
    if (mappedMessage) {
      return mappedMessage;
    }

    // 如果沒有映射，返回原始訊息或默認訊息
    return error.message || `${defaultMessage} (錯誤代碼: ${error.code})`;
  }

  /**
   * 記錄錯誤到控制台
   * Log error to console
   *
   * @param {string} component - Component name
   * @param {string} operation - Operation type
   * @param {unknown} error - Error object
   */
  logError(component: string, operation: string, error: unknown): void {
    const errorObj = error as any;
    console.error(`[${component}] Failed to ${operation}:`, {
      error,
      message: errorObj?.message,
      code: errorObj?.code,
      details: errorObj?.details,
      hint: errorObj?.hint
    });
  }
}
