/**
 * Bot Repository
 *
 * 機器人資料存取層（type='Bot' 專用）
 * Bot data access layer (dedicated for type='Bot')
 *
 * This repository enforces type='Bot' filtering at the repository level,
 * eliminating the need for runtime type checks in the service layer.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AccountType, AccountStatus, Bot, BotInsert, BotUpdate } from '../../types';
import { QueryOptions } from '../../types/supabase.types';
import { BaseRepository } from '../base.repository';

/**
 * Bot Repository
 *
 * Provides CRUD operations for Bot accounts (type='Bot').
 * All queries automatically filter by type='Bot'.
 * Extends BaseRepository with bot-specific query methods.
 */
@Injectable({
  providedIn: 'root'
})
export class BotRepository extends BaseRepository<Bot, BotInsert, BotUpdate> {
  protected tableName = 'accounts';

  /**
   * 查詢所有機器人（強制過濾 type='Bot'）
   * Find all bots (enforces type='Bot' filter)
   *
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Bot[]>} Array of bot accounts
   */
  override findAll(options?: QueryOptions): Observable<Bot[]> {
    const filters = {
      ...(options?.filters || {}),
      type: AccountType.BOT
    };

    return super.findAll({
      ...options,
      filters
    });
  }

  /**
   * 根據狀態查詢機器人
   * Find bots by status
   *
   * @param {AccountStatus} status - Account status
   * @returns {Observable<Bot[]>} Bots with specified status
   */
  findByStatus(status: AccountStatus): Observable<Bot[]> {
    return this.findAll({
      filters: { status: status as any }
    });
  }

  /**
   * 檢查機器人名稱是否已存在
   * Check if bot name exists
   *
   * @param {string} name - Bot name
   * @returns {Observable<boolean>} True if name exists
   */
  checkNameExists(name: string): Observable<boolean> {
    return this.count({
      name,
      type: AccountType.BOT
    }).pipe(map(count => count > 0));
  }

  /**
   * 查詢活躍的機器人
   * Find active bots
   *
   * @returns {Observable<Bot[]>} Active bots
   */
  findActiveBots(): Observable<Bot[]> {
    return this.findByStatus(AccountStatus.ACTIVE);
  }

  /**
   * 軟刪除機器人（設定狀態為 DELETED）
   * Soft delete bot (set status to DELETED)
   *
   * @param {string} id - Bot ID
   * @returns {Observable<Bot>} Updated bot account
   */
  softDelete(id: string): Observable<Bot> {
    return this.update(id, { status: AccountStatus.DELETED } as any);
  }

  /**
   * 恢復已刪除的機器人
   * Restore deleted bot
   *
   * @param {string} id - Bot ID
   * @returns {Observable<Bot>} Updated bot account
   */
  restore(id: string): Observable<Bot> {
    return this.update(id, { status: AccountStatus.ACTIVE } as any);
  }

  /**
   * 啟用機器人
   * Activate bot
   *
   * @param {string} id - Bot ID
   * @returns {Observable<Bot>} Updated bot account
   */
  activate(id: string): Observable<Bot> {
    return this.update(id, { status: AccountStatus.ACTIVE } as any);
  }

  /**
   * 停用機器人
   * Deactivate bot
   *
   * @param {string} id - Bot ID
   * @returns {Observable<Bot>} Updated bot account
   */
  deactivate(id: string): Observable<Bot> {
    return this.update(id, { status: AccountStatus.INACTIVE } as any);
  }
}
