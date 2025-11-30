/**
 * Organization Repository
 *
 * 組織資料存取層（type='org' 專用）
 * Organization data access layer (dedicated for type='org')
 *
 * This repository enforces type='org' filtering at the repository level,
 * eliminating the need for runtime type checks in the service layer.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AccountType, AccountStatus, Organization, OrganizationInsert, OrganizationUpdate, OrganizationQueryOptions } from '../../types';
import { QueryOptions } from '../../types/supabase.types';
import { BaseRepository } from '../base.repository';

/**
 * Organization Repository
 *
 * Provides CRUD operations for Organization accounts (type='org').
 * All queries automatically filter by type='org'.
 * Extends BaseRepository with organization-specific query methods.
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationRepository extends BaseRepository<Organization, OrganizationInsert, OrganizationUpdate> {
  protected tableName = 'accounts';

  /**
   * 查詢所有組織（強制過濾 type='org'）
   * Find all organizations (enforces type='org' filter)
   *
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Organization[]>} Array of organizations
   */
  override findAll(options?: QueryOptions): Observable<Organization[]> {
    const filters = {
      ...(options?.filters || {}),
      type: AccountType.ORG
    };

    return super.findAll({
      ...options,
      filters
    });
  }

  /**
   * 根據 ID 查詢組織
   * Find organization by ID
   *
   * @param {string} id - Organization ID
   * @returns {Observable<Organization | null>} Organization or null
   */
  override findById(id: string): Observable<Organization | null> {
    return super.findById(id);
  }

  /**
   * 根據組織 ID 列表查詢組織
   * Find organizations by IDs
   *
   * @param {string[]} ids - Organization IDs
   * @returns {Observable<Organization[]>} Organizations
   */
  findByIds(ids: string[]): Observable<Organization[]> {
    return this.findAll({
      filters: {
        id: ids as any
      }
    });
  }

  /**
   * 進階查詢（使用 OrganizationQueryOptions）
   * Advanced query with OrganizationQueryOptions
   *
   * @param {OrganizationQueryOptions} options - Query options
   * @returns {Observable<Organization[]>} Filtered organizations
   */
  findWithOptions(options: OrganizationQueryOptions): Observable<Organization[]> {
    const filters: Record<string, any> = {};

    if (options.status) {
      filters['status'] = options.status;
    } else if (!options.includeDeleted) {
      // 預設不包含已刪除的組織
      // By default, exclude deleted organizations
      filters['status'] = [AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED];
    }

    return this.findAll({ filters });
  }

  /**
   * 根據狀態查詢組織
   * Find organizations by status
   *
   * @param {AccountStatus} status - Account status
   * @returns {Observable<Organization[]>} Organizations with specified status
   */
  findByStatus(status: AccountStatus): Observable<Organization[]> {
    return this.findAll({
      filters: { status: status as any }
    });
  }

  /**
   * 檢查組織名稱是否已存在
   * Check if organization name exists
   *
   * @param {string} name - Organization name
   * @returns {Observable<boolean>} True if name exists
   */
  checkNameExists(name: string): Observable<boolean> {
    return this.count({
      name,
      type: AccountType.ORG
    }).pipe(map(count => count > 0));
  }

  /**
   * 創建組織
   * Create organization
   *
   * @param {OrganizationInsert} data - Organization data
   * @returns {Observable<Organization>} Created organization
   */
  override create(data: OrganizationInsert): Observable<Organization> {
    const insertData = {
      ...data,
      type: AccountType.ORG
    } as any;
    return super.create(insertData);
  }

  /**
   * 軟刪除組織（設定狀態為 DELETED）
   * Soft delete organization (set status to DELETED)
   *
   * @param {string} id - Organization ID
   * @returns {Observable<Organization>} Updated organization
   */
  softDelete(id: string): Observable<Organization> {
    return this.update(id, { status: AccountStatus.DELETED } as any);
  }

  /**
   * 恢復已刪除的組織
   * Restore deleted organization
   *
   * @param {string} id - Organization ID
   * @returns {Observable<Organization>} Updated organization
   */
  restore(id: string): Observable<Organization> {
    return this.update(id, { status: AccountStatus.ACTIVE } as any);
  }
}
