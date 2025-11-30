/**
 * User Business Models
 *
 * 用戶業務模型定義（業務層）
 * User business model definitions (Business Layer)
 *
 * @module shared/models/account
 */

import { Database, AccountType, AccountStatus, UserAccount } from '@core';

/**
 * User entity type (camelCase)
 * Note: BaseRepository automatically converts snake_case → camelCase
 */
export type UserAccountEntity = UserAccount;

/**
 * 用戶帳戶模型（業務層）
 * User account model (Business layer)
 *
 * User accounts are accounts with type='User'
 */
export interface UserAccountModel extends UserAccount {
  type: AccountType.USER;
}

/**
 * 創建用戶帳戶請求
 * Create user account request
 */
export interface CreateUserAccountRequest {
  name: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}

/**
 * 更新用戶帳戶請求
 * Update user account request
 */
export interface UpdateUserAccountRequest {
  name?: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}
