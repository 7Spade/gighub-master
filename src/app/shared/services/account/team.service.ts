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
import { TeamRepository, Team, TeamMember, TeamRole, SupabaseService } from '@core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/logger';
import { AuditLogService } from '../audit-log';

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
  private readonly logger = inject(LoggerService);
  private readonly auditLog = inject(AuditLogService);

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
    try {
      this.logger.info('Creating team', {
        name: request.name,
        organizationId: request.organizationId
      });

      const client = this.supabaseService.client;

      // Use SECURITY DEFINER function to create team
      const { data, error } = await (client as any).rpc('create_team', {
        p_organization_id: request.organizationId,
        p_name: request.name,
        p_description: request.description || null
      });

      if (error) {
        this.logger.error('Failed to create team via RPC', error);
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

      // Record audit log
      this.auditLog.quickLog(
        'team',
        team.id,
        'create',
        {
          entityName: team.name,
          organizationId: request.organizationId,
          newValue: team,
          severity: 'info',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'team-management',
            organization_id: request.organizationId
          }
        }
      ).subscribe();

      this.logger.info('Team created successfully', {
        teamId: team.id,
        name: team.name
      });

      return team;
    } catch (error) {
      this.logger.error('Failed to create team', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'team',
        'N/A',
        'create',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'team-management',
            organization_id: request.organizationId
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 更新團隊
   * Update team
   */
  async updateTeam(id: string, request: UpdateTeamRequest): Promise<Team> {
    try {
      this.logger.info('Updating team', {
        teamId: id,
        changes: Object.keys(request)
      });

      // Get old value for change tracking
      const oldTeam = await this.findById(id);
      if (!oldTeam) {
        throw new Error('Team not found');
      }

      // Perform update
      const newTeam = await firstValueFrom(this.teamRepo.update(id, request as any));
      if (!newTeam) {
        throw new Error('Failed to update team');
      }

      // Record changes in audit log (automatically tracks differences)
      this.auditLog.logChanges(
        'team',
        id,
        'update',
        oldTeam,
        newTeam,
        {
          entityName: newTeam.name,
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'team-management',
            changed_fields: Object.keys(request)
          }
        }
      ).subscribe();

      this.logger.info('Team updated successfully', {
        teamId: id,
        name: newTeam.name
      });

      return newTeam;
    } catch (error) {
      this.logger.error('Failed to update team', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'team',
        id,
        'update',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'team-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 軟刪除團隊
   * Soft delete team
   */
  async softDeleteTeam(id: string): Promise<Team> {
    try {
      this.logger.info('Deleting team', { teamId: id });

      // Get team before deletion for audit log
      const team = await this.findById(id);
      if (!team) {
        throw new Error('Team not found');
      }

      // Perform soft delete
      const deletedTeam = await firstValueFrom(this.teamRepo.softDelete(id));
      if (!deletedTeam) {
        throw new Error('Failed to delete team');
      }

      // Record deletion in audit log (warning severity for sensitive operation)
      this.auditLog.quickLog(
        'team',
        id,
        'delete',
        {
          entityName: team.name,
          oldValue: team,
          severity: 'warning',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'team-management',
            deletion_type: 'soft_delete'
          }
        }
      ).subscribe();

      this.logger.info('Team deleted successfully', {
        teamId: id,
        name: team.name
      });

      return deletedTeam;
    } catch (error) {
      this.logger.error('Failed to delete team', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'team',
        id,
        'delete',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'team-management'
          }
        }
      ).subscribe();

      throw error;
    }
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
    try {
      this.logger.info('Adding team member', {
        teamId,
        accountId,
        role
      });

      const member = await firstValueFrom(
        this.teamRepo.addMember({
          team_id: teamId,
          account_id: accountId,
          role
        })
      );

      if (member) {
        // Record member addition in audit log
        this.auditLog.quickLog(
          'team_member',
          member.id,
          'create',
          {
            entityName: `Team member: ${accountId}`,
            newValue: member,
            severity: 'info',
            metadata: {
              source: 'ui',
              module: 'account',
              feature: 'team-management',
              team_id: teamId,
              account_id: accountId,
              role
            }
          }
        ).subscribe();

        this.logger.info('Team member added successfully', {
          teamId,
          memberId: member.id,
          accountId
        });
      }

      return member;
    } catch (error) {
      this.logger.error('Failed to add team member', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'team_member',
        'N/A',
        'create',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'team-management',
            team_id: teamId,
            account_id: accountId
          }
        }
      ).subscribe();

      throw error;
    }
  }

  /**
   * 移除團隊成員
   * Remove team member
   */
  async removeMember(memberId: string): Promise<boolean> {
    try {
      this.logger.info('Removing team member', { memberId });

      // Get member info before removal for audit log
      const members = await firstValueFrom(this.teamRepo.findMembers(''));
      const member = members.find(m => m.id === memberId);

      const success = await firstValueFrom(this.teamRepo.removeMember(memberId));

      if (success && member) {
        // Record member removal in audit log
        this.auditLog.quickLog(
          'team_member',
          memberId,
          'delete',
          {
            entityName: `Team member: ${member.account_id}`,
            oldValue: member,
            severity: 'warning',
            metadata: {
              source: 'ui',
              module: 'account',
              feature: 'team-management',
              team_id: member.team_id,
              account_id: member.account_id
            }
          }
        ).subscribe();

        this.logger.info('Team member removed successfully', {
          memberId,
          accountId: member.account_id
        });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to remove team member', error);

      // Record failed attempt in audit log
      this.auditLog.quickLog(
        'team_member',
        memberId,
        'delete',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true,
            source: 'ui',
            module: 'account',
            feature: 'team-management'
          }
        }
      ).subscribe();

      throw error;
    }
  }
}
