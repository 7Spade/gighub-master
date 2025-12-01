/**
 * User Facade
 *
 * 用戶業務域門面（Core 層）
 * User business domain facade (Core layer)
 *
 * Provides unified interface for user account operations.
 * Extends BaseAccountCrudFacade for common CRUD coordination logic.
 *
 * @module core/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { UserService, UserAccountModel, CreateUserAccountRequest, UpdateUserAccountRequest } from '@shared';

import { BaseAccountCrudFacade } from './base-account-crud.facade';

@Injectable({
  providedIn: 'root'
})
export class UserFacade extends BaseAccountCrudFacade<UserAccountModel, CreateUserAccountRequest, UpdateUserAccountRequest> {
  private readonly userService = inject(UserService);

  protected readonly entityTypeName = '用戶';
  protected readonly facadeName = 'UserFacade';

  // Proxy user service signals
  readonly userAccounts = this.userService.userAccounts;
  readonly loading = this.userService.loading;
  readonly error = this.userService.error;

  /**
   * 執行創建操作
   * Execute create operation
   */
  protected executeCreate(request: CreateUserAccountRequest): Promise<UserAccountModel> {
    return this.userService.createUser(request);
  }

  /**
   * 執行更新操作
   * Execute update operation
   */
  protected executeUpdate(id: string, request: UpdateUserAccountRequest): Promise<UserAccountModel> {
    return this.userService.updateUser(id, request);
  }

  /**
   * 執行刪除操作
   * Execute delete operation
   */
  protected executeDelete(id: string): Promise<UserAccountModel> {
    return this.userService.softDeleteUser(id);
  }

  /**
   * 創建用戶帳戶
   * Create user account
   *
   * @param {CreateUserAccountRequest} request - Create request
   * @returns {Promise<UserAccountModel>} Created user account
   * @throws {Error} User-friendly error message
   */
  async createUser(request: CreateUserAccountRequest): Promise<UserAccountModel> {
    return this.create(request);
  }

  /**
   * 更新用戶帳戶
   * Update user account
   *
   * @param {string} id - Account ID
   * @param {UpdateUserAccountRequest} request - Update request
   * @returns {Promise<UserAccountModel>} Updated user account
   * @throws {Error} User-friendly error message
   */
  async updateUser(id: string, request: UpdateUserAccountRequest): Promise<UserAccountModel> {
    return this.update(id, request);
  }

  /**
   * 刪除用戶帳戶（軟刪除）
   * Delete user account (soft delete)
   *
   * @param {string} id - Account ID
   * @returns {Promise<UserAccountModel>} Deleted user account
   * @throws {Error} User-friendly error message
   */
  async deleteUser(id: string): Promise<UserAccountModel> {
    return this.delete(id);
  }

  /**
   * 恢復已刪除的用戶帳戶
   * Restore deleted user account
   *
   * @param {string} id - Account ID
   * @returns {Promise<UserAccountModel>} Restored user account
   */
  async restoreUser(id: string): Promise<UserAccountModel> {
    try {
      const user = await this.userService.restoreUser(id);
      await this.reloadWorkspaceData();
      return user;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'restore', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `restore ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 根據 Auth User ID 查詢用戶帳戶
   * Find user account by auth user ID
   *
   * @param {string} authUserId - Auth user ID
   * @returns {Promise<UserAccountModel | null>} User account or null
   */
  async findByAuthUserId(authUserId: string): Promise<UserAccountModel | null> {
    return this.userService.findByAuthUserId(authUserId);
  }

  /**
   * 根據 ID 查詢用戶帳戶
   * Find user account by ID
   *
   * @param {string} id - Account ID
   * @returns {Promise<UserAccountModel | null>} User account or null
   */
  async findById(id: string): Promise<UserAccountModel | null> {
    return this.userService.findById(id);
  }

  /**
   * 載入用戶帳戶列表
   * Load user accounts
   *
   * @param {string} authUserId - Auth user ID
   */
  async loadUserAccounts(authUserId: string): Promise<void> {
    return this.userService.loadUserAccounts(authUserId);
  }
}
