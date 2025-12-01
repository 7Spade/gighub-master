/**
 * User Repository
 *
 * 用戶資料存取層（type='User' 專用）
 * User data access layer (dedicated for type='User')
 *
 * This repository enforces type='User' filtering at the repository level,
 * eliminating the need for runtime type checks in the service layer.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AccountType, AccountStatus, UserAccount, UserAccountInsert, UserAccountUpdate } from '../../types';
import { QueryOptions } from '../../types/supabase.types';
import { BaseRepository } from '../base.repository';

/**
 * User Repository
 *
 * Provides CRUD operations for User accounts (type='User').
 * All queries automatically filter by type='User'.
 * Extends BaseRepository with user-specific query methods.
 */
@Injectable({
  providedIn: 'root'
})
export class UserRepository extends BaseRepository<UserAccount, UserAccountInsert, UserAccountUpdate> {
  protected tableName = 'accounts';

  /**
   * 查詢所有用戶（強制過濾 type='User'）
   * Find all users (enforces type='User' filter)
   *
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<UserAccount[]>} Array of user accounts
   */
  override findAll(options?: QueryOptions): Observable<UserAccount[]> {
    const filters = {
      ...(options?.filters || {}),
      type: AccountType.USER
    };

    return super.findAll({
      ...options,
      filters
    });
  }

  /**
   * 根據 auth_user_id 查詢用戶帳戶
   * Find user account by auth_user_id
   *
   * @param {string} authUserId - Auth user ID from Supabase Auth
   * @returns {Observable<UserAccount | null>} User account or null
   */
  findByAuthUserId(authUserId: string): Observable<UserAccount | null> {
    return this.findOne({
      authUserId,
      type: AccountType.USER
    });
  }

  /**
   * 根據 email 查詢用戶帳戶
   * Find user account by email
   *
   * @param {string} email - Email address
   * @returns {Observable<UserAccount | null>} User account or null
   */
  findByEmail(email: string): Observable<UserAccount | null> {
    return this.findOne({
      email,
      type: AccountType.USER
    });
  }

  /**
   * 根據狀態查詢用戶
   * Find users by status
   *
   * @param {AccountStatus} status - Account status
   * @returns {Observable<UserAccount[]>} Users with specified status
   */
  findByStatus(status: AccountStatus): Observable<UserAccount[]> {
    return this.findAll({
      filters: { status: status as any }
    });
  }

  /**
   * 檢查用戶名稱是否已存在
   * Check if user name exists
   *
   * @param {string} name - User name
   * @returns {Observable<boolean>} True if name exists
   */
  checkNameExists(name: string): Observable<boolean> {
    return this.count({
      name,
      type: AccountType.USER
    }).pipe(map(count => count > 0));
  }

  /**
   * 檢查 email 是否已存在
   * Check if email exists
   *
   * @param {string} email - Email address
   * @returns {Observable<boolean>} True if email exists
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.count({
      email,
      type: AccountType.USER
    }).pipe(map(count => count > 0));
  }

  /**
   * 軟刪除用戶（設定狀態為 DELETED）
   * Soft delete user (set status to DELETED)
   *
   * @param {string} id - User ID
   * @returns {Observable<UserAccount>} Updated user account
   */
  softDelete(id: string): Observable<UserAccount> {
    return this.update(id, { status: AccountStatus.DELETED } as any);
  }

  /**
   * 恢復已刪除的用戶
   * Restore deleted user
   *
   * @param {string} id - User ID
   * @returns {Observable<UserAccount>} Updated user account
   */
  restore(id: string): Observable<UserAccount> {
    return this.update(id, { status: AccountStatus.ACTIVE } as any);
  }
}
