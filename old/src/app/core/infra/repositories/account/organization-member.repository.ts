/**
 * Organization Member Repository
 *
 * 組織成員資料存取層
 * Organization member data access layer
 *
 * Provides CRUD operations for organization members.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Database, OrganizationMemberRole, OrganizationMemberQueryOptions } from '../../types';
import { BaseRepository } from '../base.repository';

type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert'];
type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update'];

@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberRepository extends BaseRepository<OrganizationMember, OrganizationMemberInsert, OrganizationMemberUpdate> {
  protected tableName = 'organization_members';

  /**
   * 根據組織 ID 查詢成員
   * Find members by organization ID
   *
   * @param {string} organizationId - Organization ID
   * @returns {Observable<OrganizationMember[]>} Organization members
   */
  findByOrganization(organizationId: string): Observable<OrganizationMember[]> {
    return this.findAll({
      filters: { organizationId: organizationId as any }
    });
  }

  /**
   * 根據帳戶 ID 查詢其所屬組織
   * Find organizations where account is a member
   *
   * @param {string} accountId - Account ID
   * @returns {Observable<OrganizationMember[]>} Organization memberships
   */
  findByAccount(accountId: string): Observable<OrganizationMember[]> {
    return this.findAll({
      filters: { accountId: accountId as any }
    });
  }

  /**
   * 查詢特定角色的組織成員
   * Find organization members by role
   *
   * @param {string} organizationId - Organization ID
   * @param {OrganizationMemberRole} role - Member role
   * @returns {Observable<OrganizationMember[]>} Organization members with specified role
   */
  findByRole(organizationId: string, role: OrganizationMemberRole): Observable<OrganizationMember[]> {
    return this.findAll({
      filters: { organizationId: organizationId as any, role: role as any }
    });
  }

  /**
   * 進階查詢（使用 OrganizationMemberQueryOptions）
   * Advanced query with OrganizationMemberQueryOptions
   *
   * @param {OrganizationMemberQueryOptions} options - Query options
   * @returns {Observable<OrganizationMember[]>} Filtered organization members
   */
  findWithOptions(options: OrganizationMemberQueryOptions): Observable<OrganizationMember[]> {
    const filters: Record<string, any> = {};

    if (options.organizationId) {
      filters['organizationId'] = options.organizationId;
    }

    if (options.accountId) {
      filters['accountId'] = options.accountId;
    }

    if (options.authUserId) {
      filters['authUserId'] = options.authUserId;
    }

    if (options.role) {
      filters['role'] = options.role;
    }

    return this.findAll({ filters });
  }

  /**
   * 檢查帳戶是否為組織成員
   * Check if account is an organization member
   *
   * @param {string} organizationId - Organization ID
   * @param {string} accountId - Account ID
   * @returns {Observable<boolean>} True if account is a member
   */
  isMember(organizationId: string, accountId: string): Observable<boolean> {
    return this.findOne({ organizationId, accountId }).pipe(map(member => member !== null));
  }

  /**
   * 檢查帳戶是否為組織擁有者
   * Check if account is an organization owner
   *
   * @param {string} organizationId - Organization ID
   * @param {string} accountId - Account ID
   * @returns {Observable<boolean>} True if account is an owner
   */
  isOwner(organizationId: string, accountId: string): Observable<boolean> {
    return this.findOne({ organizationId, accountId, role: OrganizationMemberRole.OWNER }).pipe(map(member => member !== null));
  }

  /**
   * 檢查帳戶是否為組織管理員
   * Check if account is an organization admin
   *
   * @param {string} organizationId - Organization ID
   * @param {string} accountId - Account ID
   * @returns {Observable<boolean>} True if account is an admin
   */
  isAdmin(organizationId: string, accountId: string): Observable<boolean> {
    return this.findOne({ organizationId, accountId, role: OrganizationMemberRole.ADMIN }).pipe(map(member => member !== null));
  }
}
