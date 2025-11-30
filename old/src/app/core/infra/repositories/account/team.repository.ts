/**
 * Team Repository
 *
 * 團隊資料存取層
 * Team data access layer
 *
 * Provides CRUD operations for teams.
 *
 * @module core/infra/repositories/account
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Database, TeamQueryOptions } from '../../types';
import { BaseRepository } from '../base.repository';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type TeamUpdate = Database['public']['Tables']['teams']['Update'];

@Injectable({
  providedIn: 'root'
})
export class TeamRepository extends BaseRepository<Team, TeamInsert, TeamUpdate> {
  protected tableName = 'teams';

  /**
   * 根據組織 ID 查詢團隊
   * Find teams by organization ID
   *
   * @param {string} organizationId - Organization ID
   * @returns {Observable<Team[]>} Teams in organization
   */
  findByOrganization(organizationId: string): Observable<Team[]> {
    return this.findAll({
      filters: { organizationId: organizationId as any }
    });
  }

  /**
   * 進階查詢（使用 TeamQueryOptions）
   * Advanced query with TeamQueryOptions
   *
   * @param {TeamQueryOptions} options - Query options
   * @returns {Observable<Team[]>} Filtered teams
   */
  findWithOptions(options: TeamQueryOptions): Observable<Team[]> {
    const filters: Record<string, any> = {};

    if (options.organizationId) {
      filters['organizationId'] = options.organizationId;
    }

    // Note: memberId filtering requires join with team_members table
    // This would be handled by a separate query or RPC function

    return this.findAll({ filters });
  }
}
