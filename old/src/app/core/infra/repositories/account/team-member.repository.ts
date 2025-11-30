/**
 * Team Member Repository
 *
 * 團隊成員資料存取層
 * Team member data access layer
 *
 * Provides CRUD operations for team members.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Database, TeamMemberRole, TeamMemberQueryOptions } from '../../types';
import { BaseRepository } from '../base.repository';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

@Injectable({
  providedIn: 'root'
})
export class TeamMemberRepository extends BaseRepository<TeamMember, TeamMemberInsert, TeamMemberUpdate> {
  protected tableName = 'team_members';

  /**
   * 根據團隊 ID 查詢成員
   * Find members by team ID
   *
   * @param {string} teamId - Team ID
   * @returns {Observable<TeamMember[]>} Team members
   */
  findByTeam(teamId: string): Observable<TeamMember[]> {
    return this.findAll({
      filters: { teamId: teamId as any }
    });
  }

  /**
   * 根據帳戶 ID 查詢其所屬團隊
   * Find teams where account is a member
   *
   * @param {string} accountId - Account ID
   * @returns {Observable<TeamMember[]>} Team memberships
   */
  findByAccount(accountId: string): Observable<TeamMember[]> {
    return this.findAll({
      filters: { accountId: accountId as any }
    });
  }

  /**
   * 查詢特定角色的團隊成員
   * Find team members by role
   *
   * @param {string} teamId - Team ID
   * @param {TeamMemberRole} role - Member role
   * @returns {Observable<TeamMember[]>} Team members with specified role
   */
  findByRole(teamId: string, role: TeamMemberRole): Observable<TeamMember[]> {
    return this.findAll({
      filters: { teamId: teamId as any, role: role as any }
    });
  }

  /**
   * 進階查詢（使用 TeamMemberQueryOptions）
   * Advanced query with TeamMemberQueryOptions
   *
   * @param {TeamMemberQueryOptions} options - Query options
   * @returns {Observable<TeamMember[]>} Filtered team members
   */
  findWithOptions(options: TeamMemberQueryOptions): Observable<TeamMember[]> {
    const filters: Record<string, any> = {};

    if (options.teamId) {
      filters['teamId'] = options.teamId;
    }

    if (options.accountId) {
      filters['accountId'] = options.accountId;
    }

    if (options.role) {
      filters['role'] = options.role;
    }

    return this.findAll({ filters });
  }

  /**
   * 檢查帳戶是否為團隊成員
   * Check if account is a team member
   *
   * @param {string} teamId - Team ID
   * @param {string} accountId - Account ID
   * @returns {Observable<boolean>} True if account is a member
   */
  isMember(teamId: string, accountId: string): Observable<boolean> {
    return this.findOne({ teamId, accountId }).pipe(map(member => member !== null));
  }

  /**
   * 檢查帳戶是否為團隊負責人
   * Check if account is a team leader
   *
   * @param {string} teamId - Team ID
   * @param {string} accountId - Account ID
   * @returns {Observable<boolean>} True if account is a leader
   */
  isLeader(teamId: string, accountId: string): Observable<boolean> {
    return this.findOne({ teamId, accountId, role: TeamMemberRole.LEADER }).pipe(map(member => member !== null));
  }
}
