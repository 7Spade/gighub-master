/**
 * Workspace Context Service
 *
 * 統一的工作區上下文管理服務
 * Unified workspace context management service
 *
 * Manages the current workspace context (user, organization, team)
 * and provides reactive state for context switching.
 *
 * @module shared/services/account
 */

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContextType,
  ContextState,
  Account,
  Team,
  SupabaseAuthService
} from '@core';

import { AccountService } from './account.service';
import { OrganizationService } from './organization.service';
import { TeamService } from './team.service';
import { OrganizationBusinessModel } from '../../models/account';
import { MenuManagementService, ContextParams } from '../menu/menu-management.service';

const STORAGE_KEY = 'workspace_context';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceContextService {
  private readonly supabaseAuth = inject(SupabaseAuthService);
  private readonly accountService = inject(AccountService);
  private readonly organizationService = inject(OrganizationService);
  private readonly teamService = inject(TeamService);
  private readonly menuManagementService = inject(MenuManagementService);

  // Convert Supabase auth user observable to a reactive signal
  private readonly supabaseUser = toSignal(this.supabaseAuth.currentUser$, { initialValue: null });

  // === 上下文狀態 Context State ===
  private readonly contextTypeState = signal<ContextType>(ContextType.USER);
  private readonly contextIdState = signal<string | null>(null);
  private readonly switchingState = signal<boolean>(false);

  readonly contextType = this.contextTypeState.asReadonly();
  readonly contextId = this.contextIdState.asReadonly();
  readonly switching = this.switchingState.asReadonly();

  // === 資料狀態 Data State ===
  private readonly currentUserState = signal<Account | null>(null);
  private readonly organizationsState = signal<OrganizationBusinessModel[]>([]);
  private readonly teamsState = signal<Team[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly organizations = this.organizationsState.asReadonly();
  readonly teams = this.teamsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // === Computed Signals ===
  readonly contextLabel = computed(() => {
    const type = this.contextType();
    const id = this.contextId();

    switch (type) {
      case ContextType.USER:
        return this.currentUser()?.name || '個人帳戶';
      case ContextType.ORGANIZATION:
        return this.organizations().find(o => o.id === id)?.name || '組織';
      case ContextType.TEAM:
        return this.teams().find(t => t.id === id)?.name || '團隊';
      case ContextType.BOT:
        return '機器人';
      default:
        return '個人帳戶';
    }
  });

  readonly contextIcon = computed(() => {
    const iconMap = {
      [ContextType.USER]: 'user',
      [ContextType.ORGANIZATION]: 'team',
      [ContextType.TEAM]: 'usergroup-add',
      [ContextType.BOT]: 'robot'
    };
    return iconMap[this.contextType()] || 'user';
  });

  /**
   * 取得當前上下文的 account_id
   * Get the account_id of the current context
   * Used for creating blueprints and other operations that require account_id
   */
  readonly contextAccountId = computed(() => {
    const type = this.contextType();
    const id = this.contextId();

    switch (type) {
      case ContextType.USER:
        return this.currentUser()?.id || null;
      case ContextType.ORGANIZATION:
        // 組織需要使用 account_id 而非 id
        return this.organizations().find(o => o.id === id)?.account_id || null;
      case ContextType.TEAM:
        // 團隊本身沒有 account，返回 null
        return null;
      default:
        return this.currentUser()?.id || null;
    }
  });

  /**
   * 取得當前選中的組織
   * Get the currently selected organization
   */
  readonly currentOrganization = computed(() => {
    const type = this.contextType();
    const id = this.contextId();
    if (type === ContextType.ORGANIZATION && id) {
      return this.organizations().find(o => o.id === id) || null;
    }
    return null;
  });

  readonly teamsByOrganization = computed(() => {
    const teams = this.teams();
    const orgs = this.organizations();
    const map = new Map<string, Team[]>();

    orgs.forEach(org => map.set(org.id, []));
    teams.forEach(team => {
      const orgId = team.organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(team);
      }
    });

    return map;
  });

  /** 是否已認證 */
  readonly isAuthenticated = computed(() => {
    return !!this.supabaseUser()?.id;
  });

  private hasRestored = false;

  constructor() {
    // 監聽認證狀態並自動載入資料 (使用 supabaseUser 信號實現響應式)
    // Listen to auth state and load data automatically (reactive via supabaseUser signal)
    effect(() => {
      const user = this.supabaseUser();
      const authUserId = user?.id;

      console.log('[WorkspaceContextService] 🔐 Auth state check:', { hasUser: !!user, authUserId });

      if (authUserId) {
        this.loadWorkspaceData(authUserId);
      } else {
        this.reset();
      }
    });

    // 資料載入完成後自動恢復上下文
    effect(() => {
      const isLoading = this.loading();
      const userId = this.currentUser()?.id;

      console.log('[WorkspaceContextService] 📊 Loading state:', { isLoading, userId, hasRestored: this.hasRestored });

      if (!isLoading && userId && !this.hasRestored) {
        this.hasRestored = true;
        console.log('[WorkspaceContextService] 🔄 Restoring context...');
        this.restoreContext();
      }
    });
  }

  // === 資料載入 Data Loading ===

  async loadWorkspaceData(authUserId: string): Promise<void> {
    if (this.loadingState()) return; // 防止重複載入

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      // 並行載入所有資料
      const [userAccount, createdOrgs, joinedOrgs, teams] = await Promise.allSettled([
        this.accountService.findByAuthUserId(authUserId),
        this.organizationService.getUserCreatedOrganizations(authUserId),
        this.accountService
          .findByAuthUserId(authUserId)
          .then(user => (user ? this.organizationService.getUserJoinedOrganizations(user.id) : [])),
        this.accountService
          .findByAuthUserId(authUserId)
          .then(user => (user ? this.accountService.getUserTeams(user.id) : []))
      ]);

      // 處理用戶帳戶
      if (userAccount.status === 'fulfilled' && userAccount.value) {
        this.currentUserState.set(userAccount.value);
      } else {
        throw new Error('User account not found');
      }

      // 合併組織列表（去重）
      const allOrgs = [
        ...(createdOrgs.status === 'fulfilled' ? createdOrgs.value : []),
        ...(joinedOrgs.status === 'fulfilled' ? joinedOrgs.value : [])
      ];
      const uniqueOrgs = Array.from(new Map(allOrgs.map(org => [org.id, org])).values());
      this.organizationsState.set(uniqueOrgs);

      // 處理團隊
      if (teams.status === 'fulfilled') {
        this.teamsState.set(teams.value);
      }

      console.log('[WorkspaceContextService] ✅ Workspace data loaded:', {
        user: this.currentUser()?.name,
        orgs: this.organizations().length,
        teams: this.teams().length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workspace data';
      this.errorState.set(message);
      console.error('[WorkspaceContextService] Load failed:', error);
    } finally {
      this.loadingState.set(false);
    }
  }

  // === 上下文切換 Context Switching ===

  switchToUser(userId: string): void {
    this.switchContext(ContextType.USER, userId);
  }

  switchToOrganization(organizationId: string): void {
    this.switchContext(ContextType.ORGANIZATION, organizationId);
  }

  switchToTeam(teamId: string): void {
    this.switchContext(ContextType.TEAM, teamId);
  }

  switchToBot(botId: string): void {
    this.switchContext(ContextType.BOT, botId);
  }

  /**
   * 切換上下文
   * Switch context
   */
  switchContext(type: ContextType, id: string | null): void {
    console.log('[WorkspaceContextService] 🔀 Switching context:', { type, id });
    this.switchingState.set(true);
    this.contextTypeState.set(type);
    this.contextIdState.set(id);
    this.persistContext();
    this.updateMenu(type, id);
    this.switchingState.set(false);
    console.log('[WorkspaceContextService] ✅ Context switched successfully');
  }

  /**
   * 更新菜單
   * Update menu based on context
   */
  private updateMenu(contextType: ContextType, contextId: string | null): void {
    const params: ContextParams = {
      userId: this.currentUser()?.id
    };

    // 根據上下文類型設置對應的 ID
    switch (contextType) {
      case ContextType.ORGANIZATION:
        params.organizationId = contextId ?? undefined;
        break;
      case ContextType.TEAM:
        params.teamId = contextId ?? undefined;
        break;
      case ContextType.BOT:
        params.botId = contextId ?? undefined;
        break;
    }

    this.menuManagementService.updateMenu(contextType, params);
  }

  // === 持久化 Persistence ===

  /**
   * 恢復上下文（從 localStorage）
   * Restore context from localStorage
   */
  restoreContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[WorkspaceContextService] 💾 Saved context:', saved);

      if (saved) {
        const context = JSON.parse(saved) as ContextState;
        if (context.type && context.id) {
          console.log('[WorkspaceContextService] ✅ Restoring saved context:', context);
          this.contextTypeState.set(context.type);
          this.contextIdState.set(context.id);
          return;
        }
      }

      // 預設使用用戶上下文
      const userId = this.currentUser()?.id;
      console.log('[WorkspaceContextService] 👤 Default to user context, userId:', userId);
      if (userId) {
        this.switchToUser(userId);
      }
    } catch (error) {
      console.error('[WorkspaceContextService] Restore failed:', error);
    }
  }

  private persistContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const context: ContextState = {
        type: this.contextType(),
        id: this.contextId(),
        label: this.contextLabel(),
        icon: this.contextIcon()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('[WorkspaceContextService] Persist failed:', error);
    }
  }

  // === 重置 Reset ===

  reset(): void {
    this.currentUserState.set(null);
    this.organizationsState.set([]);
    this.teamsState.set([]);
    this.errorState.set(null);
    // Reset to USER context with null ID
    this.switchContext(ContextType.USER, null);
    this.hasRestored = false;
  }

  /**
   * 重新載入工作區資料
   * Reload workspace data
   */
  async reload(): Promise<void> {
    const authUserId = this.supabaseUser()?.id;
    if (authUserId) {
      this.hasRestored = false;
      await this.loadWorkspaceData(authUserId);
    }
  }
}
