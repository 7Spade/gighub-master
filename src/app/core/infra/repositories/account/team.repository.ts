/**
 * Team Repository
 *
 * 團隊資料存取層
 * Team data access layer
 *
 * Provides CRUD operations for the teams table using Supabase client.
 *
 * @module core/infra/repositories/account
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import { Team, TeamMember, TeamRole } from '../../types/account';

@Injectable({
  providedIn: 'root'
})
export class TeamRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * 根據 ID 查詢團隊
   * Find team by ID
   */
  findById(id: string): Observable<Team | null> {
    return from(this.supabase.client.from('teams').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] findById error:', error);
          return null;
        }
        return data as Team;
      })
    );
  }

  /**
   * 根據組織 ID 查詢團隊
   * Find teams by organization ID
   */
  findByOrganization(organizationId: string): Observable<Team[]> {
    return from(
      this.supabase.client.from('teams').select('*').eq('organization_id', organizationId).is('deleted_at', null).order('name')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] findByOrganization error:', error);
          return [];
        }
        return (data || []) as Team[];
      })
    );
  }

  /**
   * 根據多個 ID 查詢團隊
   * Find teams by IDs
   */
  findByIds(ids: string[]): Observable<Team[]> {
    if (ids.length === 0) {
      return from(Promise.resolve([]));
    }

    return from(this.supabase.client.from('teams').select('*').in('id', ids).is('deleted_at', null)).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] findByIds error:', error);
          return [];
        }
        return (data || []) as Team[];
      })
    );
  }

  /**
   * 創建團隊
   * Create team
   */
  create(team: Partial<Team>): Observable<Team | null> {
    return from(this.supabase.client.from('teams').insert(team).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] create error:', error);
          return null;
        }
        return data as Team;
      })
    );
  }

  /**
   * 更新團隊
   * Update team
   */
  update(id: string, updates: Partial<Team>): Observable<Team | null> {
    return from(
      this.supabase.client
        .from('teams')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] update error:', error);
          return null;
        }
        return data as Team;
      })
    );
  }

  /**
   * 軟刪除團隊
   * Soft delete team
   */
  softDelete(id: string): Observable<Team | null> {
    return from(
      this.supabase.client
        .from('teams')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] softDelete error:', error);
          return null;
        }
        return data as Team;
      })
    );
  }

  // ============================================================================
  // Team Members
  // ============================================================================

  /**
   * 根據團隊 ID 查詢成員
   * Find members by team ID
   */
  findMembers(teamId: string): Observable<TeamMember[]> {
    return from(this.supabase.client.from('team_members').select('*').eq('team_id', teamId)).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] findMembers error:', error);
          return [];
        }
        return (data || []) as TeamMember[];
      })
    );
  }

  /**
   * 根據帳戶 ID 查詢所屬團隊
   * Find teams by account ID (through team_members)
   */
  findByAccountId(accountId: string): Observable<Team[]> {
    return from(this.supabase.client.from('team_members').select('team_id, teams(*)').eq('account_id', accountId)).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] findByAccountId error:', error);
          return [];
        }
        return (data || []).map((item: any) => item.teams).filter((team: Team | null) => team && !team.deleted_at) as Team[];
      })
    );
  }

  /**
   * 添加團隊成員
   * Add team member
   */
  addMember(member: Partial<TeamMember>): Observable<TeamMember | null> {
    return from(this.supabase.client.from('team_members').insert(member).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] addMember error:', error);
          return null;
        }
        return data as TeamMember;
      })
    );
  }

  /**
   * 更新成員角色
   * Update member role
   */
  updateMemberRole(id: string, role: TeamRole): Observable<TeamMember | null> {
    return from(
      this.supabase.client.from('team_members').update({ role, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TeamRepository] updateMemberRole error:', error);
          return null;
        }
        return data as TeamMember;
      })
    );
  }

  /**
   * 移除團隊成員
   * Remove team member
   */
  removeMember(id: string): Observable<boolean> {
    return from(this.supabase.client.from('team_members').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[TeamRepository] removeMember error:', error);
          return false;
        }
        return true;
      })
    );
  }
}
