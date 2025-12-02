/**
 * Account Service
 *
 * 帳戶管理服務（Shared 層）
 * Account management service (Shared layer)
 *
 * 簡化版本，用於支持上下文切換器組件
 *
 * @module shared/services
 */

import { Injectable, signal } from '@angular/core';

/**
 * Account entity type
 */
export interface Account {
  id: string;
  name?: string;
  email?: string;
  type?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  // State
  private userAccountsState = signal<Account[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly userAccounts = this.userAccountsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 載入用戶帳戶列表
   * Load user accounts
   *
   * @param {string} authUserId - Auth user ID
   */
  async loadUserAccounts(authUserId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      // TODO: 實現實際的資料載入邏輯
      // 目前返回空陣列，實際應該從 API 或資料庫載入
      console.debug(`[AccountService] Loading accounts for user: ${authUserId}`);
      this.userAccountsState.set([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user accounts';
      this.errorState.set(errorMessage);
      console.error('[AccountService] Failed to load user accounts:', error);
    } finally {
      this.loadingState.set(false);
    }
  }
}
