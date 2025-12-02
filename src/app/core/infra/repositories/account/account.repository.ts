/**
 * Account Repository
 *
 * 帳戶資料存取層
 * Account data access layer
 *
 * Provides CRUD operations for the accounts table using Supabase client.
 *
 * @module core/infra/repositories/account
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { Account, AccountType, AccountStatus, AccountQueryOptions } from '../../types/account';

@Injectable({
  providedIn: 'root'
})
export class AccountRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據 ID 查詢帳戶
   * Find account by ID
   */
  findById(id: string): Observable<Account | null> {
    return from(this.supabase.client.from('accounts').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] findById error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }

  /**
   * 根據 Auth User ID 查詢帳戶
   * Find account by auth user ID
   */
  findByAuthUserId(authUserId: string): Observable<Account | null> {
    return from(
      this.supabase.client.from('accounts').select('*').eq('auth_user_id', authUserId).eq('type', AccountType.USER).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] findByAuthUserId error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }

  /**
   * 根據 Email 查詢帳戶
   * Find account by email
   */
  findByEmail(email: string): Observable<Account | null> {
    return from(
      this.supabase.client.from('accounts').select('*').eq('email', email).eq('type', AccountType.USER).is('deleted_at', null).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] findByEmail error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }

  /**
   * 查詢多個帳戶
   * Find accounts with options
   */
  findWithOptions(options: AccountQueryOptions = {}): Observable<Account[]> {
    let query = this.supabase.client.from('accounts').select('*');

    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as Account[];
      })
    );
  }

  /**
   * 根據多個 ID 查詢帳戶
   * Find accounts by IDs
   */
  findByIds(ids: string[]): Observable<Account[]> {
    if (ids.length === 0) {
      return from(Promise.resolve([]));
    }

    return from(this.supabase.client.from('accounts').select('*').in('id', ids)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] findByIds error:', error);
          return [];
        }
        return (data || []) as Account[];
      })
    );
  }

  /**
   * 創建帳戶
   * Create account
   */
  create(account: Partial<Account>): Observable<Account | null> {
    return from(this.supabase.client.from('accounts').insert(account).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] create error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }

  /**
   * 更新帳戶
   * Update account
   */
  update(id: string, updates: Partial<Account>): Observable<Account | null> {
    return from(
      this.supabase.client
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] update error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }

  /**
   * 軟刪除帳戶
   * Soft delete account
   */
  softDelete(id: string): Observable<Account | null> {
    return this.update(id, {
      status: AccountStatus.DELETED,
      deleted_at: new Date().toISOString()
    } as Partial<Account>);
  }

  /**
   * 恢復已刪除的帳戶
   * Restore deleted account
   */
  restore(id: string): Observable<Account | null> {
    return from(
      this.supabase.client
        .from('accounts')
        .update({
          status: AccountStatus.ACTIVE,
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AccountRepository] restore error:', error);
          return null;
        }
        return data as Account;
      })
    );
  }
}
