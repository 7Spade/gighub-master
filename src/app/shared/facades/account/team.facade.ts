/**
 * Team Facade
 *
 * 團隊業務域門面（Shared 層）
 * Team business domain facade (Shared layer)
 *
 * Provides unified interface for team operations.
 *
 * @module shared/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { TeamService, CreateTeamRequest, UpdateTeamRequest } from '../services';

import { BaseAccountCrudFacade } from './base-account-crud.facade';
import { Team } from '../../../core/infra/types/account';

@Injectable({
  providedIn: 'root'
})
export class TeamFacade extends BaseAccountCrudFacade<Team, CreateTeamRequest, UpdateTeamRequest> {
  private readonly teamService = inject(TeamService);

  protected readonly entityTypeName = '團隊';
  protected readonly facadeName = 'TeamFacade';

  // Proxy team service signals
  readonly teams = this.teamService.teams;
  readonly loading = this.teamService.loading;
  readonly error = this.teamService.error;

  /**
   * 執行創建操作
   */
  protected executeCreate(request: CreateTeamRequest): Promise<Team> {
    return this.teamService.createTeam(request);
  }

  /**
   * 執行更新操作
   */
  protected executeUpdate(id: string, request: UpdateTeamRequest): Promise<Team> {
    return this.teamService.updateTeam(id, request);
  }

  /**
   * 執行刪除操作
   */
  protected async executeDelete(id: string): Promise<Team> {
    const team = await this.teamService.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }
    await this.teamService.softDeleteTeam(id);
    return team;
  }

  /**
   * 創建團隊
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    return this.create(request);
  }

  /**
   * 更新團隊
   */
  async updateTeam(id: string, request: UpdateTeamRequest): Promise<Team> {
    return this.update(id, request);
  }

  /**
   * 刪除團隊
   */
  async deleteTeam(id: string): Promise<Team> {
    return this.delete(id);
  }

  /**
   * 根據 ID 查詢團隊
   */
  async findById(id: string): Promise<Team | null> {
    return this.teamService.findById(id);
  }

  /**
   * 查詢組織下的團隊
   */
  async findByOrganization(organizationId: string): Promise<Team[]> {
    return this.teamService.findByOrganization(organizationId);
  }
}
