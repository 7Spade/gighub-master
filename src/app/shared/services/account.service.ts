/**
 * Account Service (Legacy)
 *
 * 帳戶管理服務（簡化版，用於上下文切換器）
 * Account management service (Simplified, for context switcher)
 *
 * Note: For full functionality, use `@shared/services/account/account.service.ts`
 *
 * @module shared/services
 */

import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from '../../core/supabase/supabase.service';

/**
 * Account entity type (Legacy interface)
 */
export interface Account {
  id: string;
  name?: string;
  email?: string;
  type?: string;
  avatar_url?: string | null;
  status?: string;
  auth_user_id?: string | null;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly supabase = inject(SupabaseService);

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
   * Load user accounts linked to auth user
   *
   * @param {string} authUserId - Auth user ID
   */
  async loadUserAccounts(authUserId: string): Promise<void> {
    if (!authUserId) {
      this.userAccountsState.set([]);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('accounts')
        .select('id, name, email, type, avatar_url, status, auth_user_id')
        .eq('auth_user_id', authUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      this.userAccountsState.set((data || []) as Account[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入帳戶失敗';
      this.errorState.set(errorMessage);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 清除帳戶狀態
   * Clear account state
   */
  clear(): void {
    this.userAccountsState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
