/**
 * Workspace Data Service
 *
 * 工作區資料載入服務
 * Workspace data loading service
 *
 * Loads and caches organizations and teams accessible to the user.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';

import { AccountService, OrganizationService, TeamService } from './index';
import { Account, OrganizationBusinessModel, TeamBusinessModel } from '../../models/account';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceDataService {
  private readonly accountService = inject(AccountService);
  private readonly organizationService = inject(OrganizationService);
  private readonly teamService = inject(TeamService);

  // State
  private currentUserAccountState = signal<Account | null>(null);
  private currentUserAccountIdState = signal<string | null>(null);
  private createdOrganizationsState = signal<OrganizationBusinessModel[]>([]);
  private joinedOrganizationsState = signal<OrganizationBusinessModel[]>([]);
  private loadingOrganizationsState = signal<boolean>(false);
  private userTeamsState = signal<TeamBusinessModel[]>([]);
  private loadingTeamsState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly currentUserAccount = this.currentUserAccountState.asReadonly();
  readonly currentUserAccountId = this.currentUserAccountIdState.asReadonly();
  readonly createdOrganizations = this.createdOrganizationsState.asReadonly();
  readonly joinedOrganizations = this.joinedOrganizationsState.asReadonly();
  readonly loadingOrganizations = this.loadingOrganizationsState.asReadonly();
  readonly userTeams = this.userTeamsState.asReadonly();
  readonly loadingTeams = this.loadingTeamsState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 載入用戶工作區資料
   * Load user workspace data
   */
  async loadWorkspaceData(authUserId: string): Promise<void> {
    console.log('[WorkspaceDataService] 🚀 開始載入工作區資料, authUserId:', authUserId);
    this.loadingOrganizationsState.set(true);
    this.loadingTeamsState.set(true);
    this.errorState.set(null);

    try {
      // 1. Get user account
      const userAccount = await this.accountService.findByAuthUserId(authUserId);
      console.log('[WorkspaceDataService] ✅ 用戶帳戶:', userAccount);
      if (!userAccount) {
        throw new Error('User account not found');
      }

      this.currentUserAccountState.set(userAccount);
      this.currentUserAccountIdState.set(userAccount['id'] as string | null);

      // 2. Load organizations
      let createdOrgs: OrganizationBusinessModel[] = [];
      let joinedOrgs: OrganizationBusinessModel[] = [];

      try {
        createdOrgs = await this.organizationService.getUserCreatedOrganizations(authUserId);
        console.log(`[WorkspaceDataService] ✅ 創建的組織 (${createdOrgs.length}):`, createdOrgs);
      } catch (error) {
        console.error('[WorkspaceDataService] ❌ Failed to load created organizations:', error);
      }

      try {
        joinedOrgs = await this.organizationService.getUserJoinedOrganizations(userAccount['id'] as string);
        console.log(`[WorkspaceDataService] ✅ 加入的組織 (${joinedOrgs.length}):`, joinedOrgs);
      } catch (error) {
        console.error('[WorkspaceDataService] ❌ Failed to load joined organizations:', error);
      }

      this.createdOrganizationsState.set(createdOrgs);
      this.joinedOrganizationsState.set(joinedOrgs);
      this.loadingOrganizationsState.set(false);

      // 3. Load user accounts (for context switcher)
      try {
        await this.accountService.loadUserAccounts(authUserId);
        console.log('[WorkspaceDataService] ✅ 用戶帳戶列表:', this.accountService.userAccounts());
      } catch (error) {
        console.error('[WorkspaceDataService] ❌ Failed to load user accounts:', error);
      }

      // 4. Load teams
      let teams: TeamBusinessModel[] = [];

      try {
        teams = await this.accountService.getUserTeams(userAccount['id'] as string);
        console.log(`[WorkspaceDataService] ✅ 用戶團隊 (${teams.length}):`, teams);
      } catch (error) {
        console.error('[WorkspaceDataService] ❌ Failed to load teams:', error);
      }

      this.userTeamsState.set(teams);
      this.loadingTeamsState.set(false);

      console.log('[WorkspaceDataService] ✅ 工作區資料載入完成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workspace data';
      this.errorState.set(errorMessage);
      console.error('[WorkspaceDataService] ❌ Failed to load workspace data:', error);

      this.loadingOrganizationsState.set(false);
      this.loadingTeamsState.set(false);
    }
  }

  /**
   * 重置狀態
   * Reset state
   */
  reset(): void {
    this.currentUserAccountState.set(null);
    this.currentUserAccountIdState.set(null);
    this.createdOrganizationsState.set([]);
    this.joinedOrganizationsState.set([]);
    this.userTeamsState.set([]);
    this.errorState.set(null);
  }
}
