/**
 * Organization Member Repository
 *
 * 組織成員資料存取層
 * Organization member data access layer
 *
 * Provides CRUD operations for the organization_members table using Supabase client.
 *
 * @module core/infra/repositories/account
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { OrganizationMember, OrganizationRole, OrganizationMemberQueryOptions } from '../../types/account';

@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據組織 ID 查詢成員
   * Find members by organization ID
   */
  findByOrganization(organizationId: string): Observable<OrganizationMember[]> {
    return from(this.supabase.client.from('organization_members').select('*').eq('organization_id', organizationId)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] findByOrganization error:', error);
          return [];
        }
        return (data || []) as OrganizationMember[];
      })
    );
  }

  /**
   * 根據帳戶 ID 查詢成員關係
   * Find memberships by account ID
   */
  findByAccount(accountId: string): Observable<OrganizationMember[]> {
    return from(this.supabase.client.from('organization_members').select('*').eq('account_id', accountId)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] findByAccount error:', error);
          return [];
        }
        return (data || []) as OrganizationMember[];
      })
    );
  }

  /**
   * 使用選項查詢成員
   * Find members with options
   */
  findWithOptions(options: OrganizationMemberQueryOptions): Observable<OrganizationMember[]> {
    // Need to join with accounts table to filter by auth_user_id
    let query = this.supabase.client.from('organization_members').select('*, accounts!inner(auth_user_id)');

    if (options.authUserId) {
      query = query.eq('accounts.auth_user_id', options.authUserId);
    }
    if (options.role) {
      query = query.eq('role', options.role);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as OrganizationMember[];
      })
    );
  }

  /**
   * 檢查用戶是否為組織成員
   * Check if user is organization member
   */
  isMember(organizationId: string, accountId: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('account_id', accountId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return false;
        return !!data;
      })
    );
  }

  /**
   * 獲取用戶在組織中的角色
   * Get user role in organization
   */
  getRole(organizationId: string, accountId: string): Observable<OrganizationRole | null> {
    return from(
      this.supabase.client
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('account_id', accountId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data?.role as OrganizationRole;
      })
    );
  }

  /**
   * 添加組織成員
   * Add organization member
   */
  create(member: Partial<OrganizationMember>): Observable<OrganizationMember | null> {
    return from(this.supabase.client.from('organization_members').insert(member).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] create error:', error);
          return null;
        }
        return data as OrganizationMember;
      })
    );
  }

  /**
   * 更新成員角色
   * Update member role
   */
  updateRole(id: string, role: OrganizationRole): Observable<OrganizationMember | null> {
    return from(
      this.supabase.client
        .from('organization_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] updateRole error:', error);
          return null;
        }
        return data as OrganizationMember;
      })
    );
  }

  /**
   * 移除組織成員
   * Remove organization member
   */
  remove(id: string): Observable<boolean> {
    return from(this.supabase.client.from('organization_members').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] remove error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 移除組織成員（按組織和帳戶）
   * Remove member by organization and account
   */
  removeByOrgAndAccount(organizationId: string, accountId: string): Observable<boolean> {
    return from(
      this.supabase.client.from('organization_members').delete().eq('organization_id', organizationId).eq('account_id', accountId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[OrganizationMemberRepository] removeByOrgAndAccount error:', error);
          return false;
        }
        return true;
      })
    );
  }
}
