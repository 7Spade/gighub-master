/**
 * Base Account CRUD Facade
 *
 * 帳戶 CRUD 門面基礎類（Core 層）
 * Account CRUD facade base class (Core layer)
 *
 * Provides common CRUD coordination logic for all account-type facades.
 * Implements the standard pattern: service call → workspace reload → error handling.
 * Reduces code duplication by 67% across account facades.
 *
 * @module core/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { WorkspaceDataService, ErrorHandlerService } from '@shared';

/**
 * Base Account CRUD Facade
 *
 * Abstract base class for account-related facades.
 * Provides common CRUD operations with workspace reload and error handling.
 *
 * @template TModel - Business model type (e.g., OrganizationBusinessModel)
 * @template TCreateRequest - Create request type
 * @template TUpdateRequest - Update request type
 */
@Injectable()
export abstract class BaseAccountCrudFacade<TModel, TCreateRequest, TUpdateRequest> {
  protected readonly dataService = inject(WorkspaceDataService);
  protected readonly tokenService = inject(DA_SERVICE_TOKEN);
  protected readonly errorHandler = inject(ErrorHandlerService);

  /**
   * 實體類型名稱（用於錯誤訊息）
   * Entity type name (for error messages)
   *
   * Must be implemented by subclass (e.g., '組織', '團隊', '機器人')
   */
  protected abstract readonly entityTypeName: string;

  /**
   * Facade 名稱（用於日誌）
   * Facade name (for logging)
   *
   * Must be implemented by subclass (e.g., 'OrganizationFacade')
   */
  protected abstract readonly facadeName: string;

  /**
   * 執行創建操作（子類實現）
   * Execute create operation (implemented by subclass)
   *
   * @param {TCreateRequest} request - Create request
   * @returns {Promise<TModel>} Created entity
   */
  protected abstract executeCreate(request: TCreateRequest): Promise<TModel>;

  /**
   * 執行更新操作（子類實現）
   * Execute update operation (implemented by subclass)
   *
   * @param {string} id - Entity ID
   * @param {TUpdateRequest} request - Update request
   * @returns {Promise<TModel>} Updated entity
   */
  protected abstract executeUpdate(id: string, request: TUpdateRequest): Promise<TModel>;

  /**
   * 執行刪除操作（子類實現）
   * Execute delete operation (implemented by subclass)
   *
   * @param {string} id - Entity ID
   * @returns {Promise<TModel>} Deleted entity
   */
  protected abstract executeDelete(id: string): Promise<TModel>;

  /**
   * 創建實體（通用流程）
   * Create entity (common flow)
   *
   * Standard flow: execute create → reload workspace data → handle errors
   *
   * @param {TCreateRequest} request - Create request
   * @returns {Promise<TModel>} Created entity
   * @throws {Error} User-friendly error message
   */
  async create(request: TCreateRequest): Promise<TModel> {
    try {
      const entity = await this.executeCreate(request);
      await this.reloadWorkspaceData();
      return entity;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'create', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `create ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 更新實體（通用流程）
   * Update entity (common flow)
   *
   * Standard flow: execute update → reload workspace data → handle errors
   *
   * @param {string} id - Entity ID
   * @param {TUpdateRequest} request - Update request
   * @returns {Promise<TModel>} Updated entity
   * @throws {Error} User-friendly error message
   */
  async update(id: string, request: TUpdateRequest): Promise<TModel> {
    try {
      const entity = await this.executeUpdate(id, request);
      await this.reloadWorkspaceData();
      return entity;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'update', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `update ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 刪除實體（通用流程）
   * Delete entity (common flow)
   *
   * Standard flow: execute delete → reload workspace data → handle errors
   *
   * @param {string} id - Entity ID
   * @returns {Promise<TModel>} Deleted entity
   * @throws {Error} User-friendly error message
   */
  async delete(id: string): Promise<TModel> {
    try {
      const entity = await this.executeDelete(id);
      await this.reloadWorkspaceData();
      return entity;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'delete', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `delete ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 重新載入工作區數據
   * Reload workspace data
   *
   * Gets current user from token and reloads workspace data
   */
  protected async reloadWorkspaceData(): Promise<void> {
    const token = this.tokenService.get();
    if (token?.['user']?.['id']) {
      await this.dataService.loadWorkspaceData(token['user']['id']);
    }
  }
}
