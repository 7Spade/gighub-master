/**
 * Bot Business Models
 *
 * 機器人業務模型定義（業務層）
 * Bot business model definitions (Business Layer)
 *
 * @module shared/models/account
 */

import { Database, AccountType, AccountStatus, Bot } from '@core';

/**
 * Bot entity type (camelCase)
 */
export type BotModel = Bot;

/**
 * 機器人帳戶模型（業務層）
 * Bot account model (Business layer)
 *
 * Bot accounts are accounts with type='Bot'
 */
export interface BotAccountModel extends Bot {
  type: AccountType.BOT;
  /** API Token（敏感資訊，通常不包含在一般查詢中） | API Token (sensitive, usually not included) */
  apiToken?: string;
}

/**
 * 創建機器人請求
 * Create bot request
 */
export interface CreateBotRequest {
  name: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}

/**
 * 更新機器人請求
 * Update bot request
 */
export interface UpdateBotRequest {
  name?: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}
