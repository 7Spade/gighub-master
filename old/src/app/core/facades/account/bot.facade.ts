/**
 * Bot Facade
 *
 * 機器人業務域門面（Core 層）
 * Bot business domain facade (Core layer)
 *
 * Provides unified interface for bot operations.
 * Extends BaseAccountCrudFacade for common CRUD coordination logic.
 *
 * @module core/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { BotService, BotAccountModel, CreateBotRequest, UpdateBotRequest } from '@shared';

import { BaseAccountCrudFacade } from './base-account-crud.facade';

@Injectable({
  providedIn: 'root'
})
export class BotFacade extends BaseAccountCrudFacade<BotAccountModel, CreateBotRequest, UpdateBotRequest> {
  private readonly botService = inject(BotService);

  protected readonly entityTypeName = '機器人';
  protected readonly facadeName = 'BotFacade';

  // Proxy bot service signals
  readonly bots = this.botService.bots;
  readonly loading = this.botService.loading;
  readonly error = this.botService.error;

  /**
   * 執行創建操作
   * Execute create operation
   */
  protected executeCreate(request: CreateBotRequest): Promise<BotAccountModel> {
    return this.botService.createBot(request);
  }

  /**
   * 執行更新操作
   * Execute update operation
   */
  protected executeUpdate(id: string, request: UpdateBotRequest): Promise<BotAccountModel> {
    return this.botService.updateBot(id, request);
  }

  /**
   * 執行刪除操作
   * Execute delete operation
   */
  protected executeDelete(id: string): Promise<BotAccountModel> {
    return this.botService.softDeleteBot(id);
  }

  /**
   * 創建機器人
   * Create bot
   *
   * @param {CreateBotRequest} request - Create request
   * @returns {Promise<BotAccountModel>} Created bot
   * @throws {Error} User-friendly error message
   */
  async createBot(request: CreateBotRequest): Promise<BotAccountModel> {
    return this.create(request);
  }

  /**
   * 更新機器人
   * Update bot
   *
   * @param {string} id - Bot ID
   * @param {UpdateBotRequest} request - Update request
   * @returns {Promise<BotAccountModel>} Updated bot
   * @throws {Error} User-friendly error message
   */
  async updateBot(id: string, request: UpdateBotRequest): Promise<BotAccountModel> {
    return this.update(id, request);
  }

  /**
   * 刪除機器人（軟刪除）
   * Delete bot (soft delete)
   *
   * @param {string} id - Bot ID
   * @returns {Promise<BotAccountModel>} Deleted bot
   * @throws {Error} User-friendly error message
   */
  async deleteBot(id: string): Promise<BotAccountModel> {
    return this.delete(id);
  }

  /**
   * 啟用機器人
   * Activate bot
   *
   * @param {string} id - Bot ID
   * @returns {Promise<BotAccountModel>} Updated bot
   */
  async activateBot(id: string): Promise<BotAccountModel> {
    try {
      const bot = await this.botService.activateBot(id);
      await this.reloadWorkspaceData();
      return bot;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'activate', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `activate ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 停用機器人
   * Deactivate bot
   *
   * @param {string} id - Bot ID
   * @returns {Promise<BotAccountModel>} Updated bot
   */
  async deactivateBot(id: string): Promise<BotAccountModel> {
    try {
      const bot = await this.botService.deactivateBot(id);
      await this.reloadWorkspaceData();
      return bot;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'deactivate', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `deactivate ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 恢復已刪除的機器人
   * Restore deleted bot
   *
   * @param {string} id - Bot ID
   * @returns {Promise<BotAccountModel>} Restored bot
   */
  async restoreBot(id: string): Promise<BotAccountModel> {
    try {
      const bot = await this.botService.restoreBot(id);
      await this.reloadWorkspaceData();
      return bot;
    } catch (error) {
      const errorMessage = this.errorHandler.getErrorMessage(error, 'restore', this.entityTypeName);
      this.errorHandler.logError(this.facadeName, `restore ${this.entityTypeName}`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 根據 ID 查詢機器人
   * Find bot by ID
   *
   * @param {string} id - Bot ID
   * @returns {Promise<BotAccountModel | null>} Bot or null
   */
  async findById(id: string): Promise<BotAccountModel | null> {
    return this.botService.findById(id);
  }

  /**
   * 查詢活躍的機器人
   * Find active bots
   *
   * @returns {Promise<BotAccountModel[]>} Active bots
   */
  async findActiveBots(): Promise<BotAccountModel[]> {
    return this.botService.findActiveBots();
  }

  /**
   * 載入機器人列表
   * Load bots
   */
  async loadBots(): Promise<void> {
    return this.botService.loadBots();
  }
}
