/**
 * Base Account CRUD Facade
 *
 * 基礎帳戶 CRUD 門面抽象類
 * Base account CRUD facade abstract class
 *
 * Provides common CRUD operations coordination for account-related entities.
 *
 * @module core/facades/account
 */

import { inject } from '@angular/core';

import { SupabaseAuthService } from '../../supabase/supabase-auth.service';

/**
 * 基礎 CRUD 門面
 */
export abstract class BaseAccountCrudFacade<TModel, TCreateRequest, TUpdateRequest> {
  protected readonly authService = inject(SupabaseAuthService);

  protected abstract readonly entityTypeName: string;
  protected abstract readonly facadeName: string;

  /**
   * 執行創建操作（子類實現）
   */
  protected abstract executeCreate(request: TCreateRequest): Promise<TModel>;

  /**
   * 執行更新操作（子類實現）
   */
  protected abstract executeUpdate(id: string, request: TUpdateRequest): Promise<TModel>;

  /**
   * 執行刪除操作（子類實現）
   */
  protected abstract executeDelete(id: string): Promise<TModel>;

  /**
   * 創建實體
   * Create entity
   *
   * @param request Create request
   * @returns Created entity
   */
  async create(request: TCreateRequest): Promise<TModel> {
    try {
      const result = await this.executeCreate(request);
      return result;
    } catch (error) {
      throw this.formatError(error, `創建${this.entityTypeName}失敗`);
    }
  }

  /**
   * 更新實體
   * Update entity
   *
   * @param id Entity ID
   * @param request Update request
   * @returns Updated entity
   */
  async update(id: string, request: TUpdateRequest): Promise<TModel> {
    try {
      const result = await this.executeUpdate(id, request);
      return result;
    } catch (error) {
      throw this.formatError(error, `更新${this.entityTypeName}失敗`);
    }
  }

  /**
   * 刪除實體
   * Delete entity
   *
   * @param id Entity ID
   * @returns Deleted entity
   */
  async delete(id: string): Promise<TModel> {
    try {
      const result = await this.executeDelete(id);
      return result;
    } catch (error) {
      throw this.formatError(error, `刪除${this.entityTypeName}失敗`);
    }
  }

  /**
   * 格式化錯誤信息
   */
  protected formatError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return new Error(`${defaultMessage}: ${error.message}`);
    }
    return new Error(defaultMessage);
  }
}
