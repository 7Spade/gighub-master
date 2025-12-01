/**
 * Team Service
 *
 * 團隊管理服務（Shared 層）
 * Team management service (Shared layer)
 *
 * Provides business logic for team operations.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  TeamRepository,
  Team,
  TeamMember,
  TeamRole,
  SupabaseService
} from '@core';

/**
 * Create team request
 */
export interface CreateTeamRequest {
  organizationId: string;
  name: string;
  description?: string;
}

/**
 * Update team request
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly teamRepo = inject(TeamRepository);
  private readonly supabaseService = inject(SupabaseService);

  // State
  private teamsState = signal<Team[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly teams = this.teamsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 根據 ID 查詢團隊
   * Find team by ID
   */
  async findById(id: string): Promise<Team | null> {
    return firstValueFrom(this.teamRepo.findById(id));
  }

  /**
   * 根據組織 ID 查詢團隊
   * Find teams by organization ID
   */
  async findByOrganization(organizationId: string): Promise<Team[]> {
    return firstValueFrom(this.teamRepo.findByOrganization(organizationId));
  }

  /**
   * 根據帳戶 ID 查詢所屬團隊
   * Find teams by account ID
   */
  async findByAccountId(accountId: string): Promise<Team[]> {
    return firstValueFrom(this.teamRepo.findByAccountId(accountId));
  }

  /**
   * 創建團隊
   * Create team
   *
   * Uses RPC function create_team for proper handling
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    const client = this.supabaseService.client;

    // Use SECURITY DEFINER function to create team
    const { data, error } = await (client as any).rpc('create_team', {
      p_organization_id: request.organizationId,
      p_name: request.name,
      p_description: request.description || null
    });

    if (error) {
      console.error('[TeamService] Failed to create team:', error);
      throw error;
    }

    if (!data || !data[0]) {
      throw new Error('Failed to create team');
    }

    const { out_team_id } = data[0];

    // Fetch the created team
    const team = await this.findById(out_team_id);
    if (!team) {
      throw new Error('Failed to fetch created team');
    }

    return team;
  }

  /**
   * 更新團隊
   * Update team
   */
  async updateTeam(id: string, request: UpdateTeamRequest): Promise<Team> {
    const team = await firstValueFrom(this.teamRepo.update(id, request as any));
    if (!team) {
      throw new Error('Failed to update team');
    }
    return team;
  }

  /**
   * 軟刪除團隊
   * Soft delete team
   */
  async softDeleteTeam(id: string): Promise<Team> {
    const team = await firstValueFrom(this.teamRepo.softDelete(id));
    if (!team) {
      throw new Error('Failed to delete team');
    }
    return team;
  }

  /**
   * 查詢團隊成員
   * Find team members
   */
  async findMembers(teamId: string): Promise<TeamMember[]> {
    return firstValueFrom(this.teamRepo.findMembers(teamId));
  }

  /**
   * 添加團隊成員
   * Add team member
   */
  async addMember(teamId: string, accountId: string, role: TeamRole = TeamRole.MEMBER): Promise<TeamMember | null> {
    return firstValueFrom(this.teamRepo.addMember({
      team_id: teamId,
      account_id: accountId,
      role
    }));
  }

  /**
   * 移除團隊成員
   * Remove team member
   */
  async removeMember(memberId: string): Promise<boolean> {
    return firstValueFrom(this.teamRepo.removeMember(memberId));
  }
}
