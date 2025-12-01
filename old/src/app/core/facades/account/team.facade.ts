/**
 * Team Facade
 *
 * 團隊業務域門面（Core 層）
 * Team business domain facade (Core layer)
 *
 * Provides unified interface for team operations.
 * Extends BaseAccountCrudFacade for common CRUD coordination logic.
 *
 * @module core/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { TeamService, TeamBusinessModel, CreateTeamRequest, UpdateTeamRequest } from '@shared';

import { BaseAccountCrudFacade } from './base-account-crud.facade';

@Injectable({
  providedIn: 'root'
})
export class TeamFacade extends BaseAccountCrudFacade<TeamBusinessModel, CreateTeamRequest, UpdateTeamRequest> {
  private readonly teamService = inject(TeamService);

  protected readonly entityTypeName = '團隊';
  protected readonly facadeName = 'TeamFacade';

  // Proxy team service signals
  readonly teams = this.teamService.teams;
  readonly loading = this.teamService.loading;
  readonly error = this.teamService.error;

  /**
   * 執行創建操作
   * Execute create operation
   */
  protected executeCreate(request: CreateTeamRequest): Promise<TeamBusinessModel> {
    return this.teamService.createTeam(request);
  }

  /**
   * 執行更新操作
   * Execute update operation
   */
  protected executeUpdate(id: string, request: UpdateTeamRequest): Promise<TeamBusinessModel> {
    return this.teamService.updateTeam(id, request);
  }

  /**
   * 執行刪除操作
   * Execute delete operation
   * Note: deleteTeam returns void, so we need to handle this specially
   */
  protected async executeDelete(id: string): Promise<TeamBusinessModel> {
    // First get the team to return it
    const team = await this.teamService.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }

    // Then delete it
    await this.teamService.deleteTeam(id);

    return team;
  }

  /**
   * 創建團隊
   * Create team
   *
   * @param {CreateTeamRequest} request - Create request
   * @returns {Promise<TeamBusinessModel>} Created team
   * @throws {Error} User-friendly error message
   */
  async createTeam(request: CreateTeamRequest): Promise<TeamBusinessModel> {
    return this.create(request);
  }

  /**
   * 更新團隊
   * Update team
   *
   * @param {string} id - Team ID
   * @param {UpdateTeamRequest} request - Update request
   * @returns {Promise<TeamBusinessModel>} Updated team
   * @throws {Error} User-friendly error message
   */
  async updateTeam(id: string, request: UpdateTeamRequest): Promise<TeamBusinessModel> {
    return this.update(id, request);
  }

  /**
   * 刪除團隊
   * Delete team
   *
   * @param {string} id - Team ID
   * @returns {Promise<TeamBusinessModel>} Deleted team
   * @throws {Error} User-friendly error message
   */
  async deleteTeam(id: string): Promise<TeamBusinessModel> {
    return this.delete(id);
  }

  /**
   * 根據 ID 查詢團隊
   * Find team by ID
   *
   * @param {string} id - Team ID
   * @returns {Promise<TeamBusinessModel | null>} Team or null
   */
  async findById(id: string): Promise<TeamBusinessModel | null> {
    return this.teamService.findById(id);
  }

  /**
   * 查詢組織下的團隊
   * Find teams by organization ID
   *
   * @param {string} organizationId - Organization ID
   * @returns {Promise<TeamBusinessModel[]>} Teams in organization
   */
  async findByOrganization(organizationId: string): Promise<TeamBusinessModel[]> {
    return this.teamService.findByOrganization(organizationId);
  }
}
