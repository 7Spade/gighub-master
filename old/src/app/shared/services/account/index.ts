/**
 * Account Services Module
 *
 * Exports all account-related services (unified identity abstraction and business domains).
 * This includes user, organization, team, bot services for flat access.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';
import { AccountRepository, TeamMemberRepository } from '@core';
import { firstValueFrom } from 'rxjs';

import { TeamService } from './team.service';
import { Account, TeamBusinessModel } from '../../models/account';

// ============================================================================
// Account Unified Identity Abstraction Service (統一身份抽象 Service)
// ============================================================================

/**
 * Account Service
 *
 * 帳戶管理服務（Shared 層）
 * Account management service (Shared layer)
 *
 * Provides business logic for account operations using Signals-based state management.
 * This service handles unified identity abstraction operations (not domain-specific).
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly accountRepo = inject(AccountRepository);
  private readonly teamMemberRepo = inject(TeamMemberRepository);
  private readonly teamService = inject(TeamService);

  // State
  private userAccountsState = signal<Account[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly userAccounts = this.userAccountsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 根據 Auth User ID 查詢帳戶（統一身份抽象）
   * Find account by auth user ID (unified identity abstraction)
   *
   * @param {string} authUserId - Auth user ID
   * @returns {Promise<Account | null>} Account or null
   */
  async findByAuthUserId(authUserId: string): Promise<Account | null> {
    try {
      const account = await firstValueFrom(this.accountRepo.findByAuthUserId(authUserId));
      console.log('[AccountService] ✅ 查詢用戶帳戶成功:', account);
      return account;
    } catch (error) {
      console.error('[AccountService] ❌ 查詢用戶帳戶失敗:', error);
      console.error('[AccountService] 錯誤詳情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        authUserId: authUserId,
        stack: error instanceof Error ? error.stack : null
      });
      throw error;
    }
  }

  /**
   * 根據 ID 查詢帳戶（統一身份抽象）
   * Find account by ID (unified identity abstraction)
   *
   * @param {string} id - Account ID
   * @returns {Promise<Account | null>} Account or null
   */
  async findById(id: string): Promise<Account | null> {
    return firstValueFrom(this.accountRepo.findById(id));
  }

  /**
   * 獲取用戶所屬團隊
   * Get user teams
   *
   * @param {string} accountId - Account ID
   * @returns {Promise<TeamBusinessModel[]>} User teams
   */
  async getUserTeams(accountId: string): Promise<TeamBusinessModel[]> {
    const memberships = await firstValueFrom(this.teamMemberRepo.findByAccount(accountId));
    // Note: Supabase returns snake_case field names (team_id)
    const teamIds = memberships.map(m => (m as any).team_id);

    if (teamIds.length === 0) {
      return [];
    }

    // 使用 TeamService 查詢團隊
    const teamsPromises = teamIds.map(teamId => this.teamService.findById(teamId));
    const teams = await Promise.all(teamsPromises);

    return teams.filter(t => t !== null) as TeamBusinessModel[];
  }

  /**
   * 載入用戶帳戶列表（統一身份抽象）
   * Load user accounts (unified identity abstraction)
   *
   * @param {string} authUserId - Auth user ID
   */
  async loadUserAccounts(authUserId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const accounts = await firstValueFrom(
        this.accountRepo.findAll({
          filters: { authUserId: authUserId as any, type: 'User' as any }
        })
      );

      this.userAccountsState.set(accounts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user accounts';
      this.errorState.set(errorMessage);
      console.error('[AccountService] Failed to load user accounts:', error);
    } finally {
      this.loadingState.set(false);
    }
  }
}

// ============================================================================
// Workspace Services (工作區服務)
// ============================================================================

export * from './workspace-context.service';
export * from './workspace-data.service';

// ============================================================================
// Business Domain Services (業務域服務 - 扁平化導出)
// ============================================================================

export * from './user.service';
export * from './bot.service';
export * from './organization.service';
export * from './team.service';
