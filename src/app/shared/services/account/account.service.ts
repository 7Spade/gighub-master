/**
 * Account Service
 *
 * 帳戶管理服務（Shared 層）
 * Account management service (Shared layer)
 *
 * Provides business logic for account operations.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';
import { Account, AccountRepository, TeamRepository, Team } from '@core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly accountRepo = inject(AccountRepository);
  private readonly teamRepo = inject(TeamRepository);

  // State
  private userAccountsState = signal<Account[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly userAccounts = this.userAccountsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 根據 Auth User ID 查詢帳戶
   * Find account by auth user ID
   */
  async findByAuthUserId(authUserId: string): Promise<Account | null> {
    return firstValueFrom(this.accountRepo.findByAuthUserId(authUserId));
  }

  /**
   * 根據 ID 查詢帳戶
   * Find account by ID
   */
  async findById(id: string): Promise<Account | null> {
    return firstValueFrom(this.accountRepo.findById(id));
  }

  /**
   * 查詢用戶所屬的團隊
   * Get teams for user account
   */
  async getUserTeams(accountId: string): Promise<Team[]> {
    return firstValueFrom(this.teamRepo.findByAccountId(accountId));
  }

  /**
   * 創建帳戶
   * Create account
   */
  async createAccount(account: Partial<Account>): Promise<Account | null> {
    return firstValueFrom(this.accountRepo.create(account));
  }

  /**
   * 更新帳戶
   * Update account
   */
  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    return firstValueFrom(this.accountRepo.update(id, updates));
  }
}
