/**
 * Blueprint Member Repository
 *
 * 藍圖成員資料存取層
 * Blueprint member data access layer
 *
 * Provides CRUD operations for the blueprint_members table using Supabase client.
 *
 * @module core/infra/repositories/blueprint
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import { BlueprintMember, BlueprintMemberQueryOptions } from '../../types/blueprint';

@Injectable({
  providedIn: 'root'
})
export class BlueprintMemberRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * 根據 ID 查詢藍圖成員
   * Find blueprint member by ID
   */
  findById(id: string): Observable<BlueprintMember | null> {
    return from(this.supabase.client.from('blueprint_members').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] findById error:', error);
          return null;
        }
        return data as BlueprintMember;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢成員列表
   * Find members by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<BlueprintMember[]> {
    return from(this.supabase.client.from('blueprint_members').select('*').eq('blueprint_id', blueprintId).order('created_at')).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as BlueprintMember[];
      })
    );
  }

  /**
   * 根據帳戶 ID 查詢其加入的藍圖
   * Find blueprints by account ID
   */
  findByAccount(accountId: string): Observable<BlueprintMember[]> {
    return from(this.supabase.client.from('blueprint_members').select('*').eq('account_id', accountId).order('created_at')).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] findByAccount error:', error);
          return [];
        }
        return (data || []) as BlueprintMember[];
      })
    );
  }

  /**
   * 根據查詢選項查詢藍圖成員
   * Find blueprint members with options
   */
  findWithOptions(options: BlueprintMemberQueryOptions): Observable<BlueprintMember[]> {
    let query = this.supabase.client.from('blueprint_members').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.accountId) {
      query = query.eq('account_id', options.accountId);
    }

    if (options.role) {
      query = query.eq('role', options.role);
    }

    if (options.isExternal !== undefined) {
      query = query.eq('is_external', options.isExternal);
    }

    query = query.order('created_at');

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as BlueprintMember[];
      })
    );
  }

  /**
   * 查詢特定藍圖和帳戶的成員記錄
   * Find member by blueprint and account
   */
  findByBlueprintAndAccount(blueprintId: string, accountId: string): Observable<BlueprintMember | null> {
    return from(
      this.supabase.client.from('blueprint_members').select('*').eq('blueprint_id', blueprintId).eq('account_id', accountId).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] findByBlueprintAndAccount error:', error);
          return null;
        }
        return data as BlueprintMember;
      })
    );
  }

  /**
   * 創建藍圖成員
   * Create blueprint member
   */
  create(member: Partial<BlueprintMember>): Observable<BlueprintMember | null> {
    return from(this.supabase.client.from('blueprint_members').insert(member).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] create error:', error);
          return null;
        }
        return data as BlueprintMember;
      })
    );
  }

  /**
   * 更新藍圖成員
   * Update blueprint member
   */
  update(id: string, updates: Partial<BlueprintMember>): Observable<BlueprintMember | null> {
    return from(
      this.supabase.client
        .from('blueprint_members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] update error:', error);
          return null;
        }
        return data as BlueprintMember;
      })
    );
  }

  /**
   * 刪除藍圖成員
   * Delete blueprint member
   */
  delete(id: string): Observable<boolean> {
    return from(this.supabase.client.from('blueprint_members').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] delete error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 根據藍圖和帳戶刪除成員
   * Delete member by blueprint and account
   */
  deleteByBlueprintAndAccount(blueprintId: string, accountId: string): Observable<boolean> {
    return from(this.supabase.client.from('blueprint_members').delete().eq('blueprint_id', blueprintId).eq('account_id', accountId)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[BlueprintMemberRepository] deleteByBlueprintAndAccount error:', error);
          return false;
        }
        return true;
      })
    );
  }
}
