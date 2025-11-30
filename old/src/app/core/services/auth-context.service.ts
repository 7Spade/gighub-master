/**
 * AuthContextService - 統一認證與上下文管理服務
 *
 * Phase 1 實作：建立核心 Signal-based 狀態管理
 *
 * 設計原則：
 * - 零外部依賴（僅使用 Angular 原生 Signals）
 * - 單一真相來源（Single Source of Truth）
 * - 完整類型安全
 * - 可漸進脫離 DA_SERVICE_TOKEN
 *
 * 認證流程：
 * Supabase Auth → AuthContextService → UI Components
 *
 * @module core/services/auth-context
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, OrganizationService, TeamService, MenuManagementService, ContextParams } from '@shared';
import type { OrganizationModel, TeamModel } from '@shared';

import { SupabaseService } from '../infra/supabase';
import { ContextType, ContextState, Account } from '../infra/types/account';
import { User, Session } from '../infra/types/supabase.types';

// ============================================================================
// Types
// ============================================================================

/**
 * 認證狀態類型
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * 認證狀態介面
 */
export interface AuthStateData {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
}

/**
 * 上下文狀態介面（擴展基礎 ContextState）
 */
export interface ContextStateData extends ContextState {
  /** 上下文是否準備就緒 */
  ready: boolean;
}

/**
 * 工作區資料介面
 */
export interface WorkspaceData {
  currentUser: Account | null;
  organizations: OrganizationModel[];
  teams: TeamModel[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'auth_context_state';

// ============================================================================
// Service
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class AuthContextService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly accountService = inject(AccountService);
  private readonly organizationService = inject(OrganizationService);
  private readonly teamService = inject(TeamService);
  private readonly menuManagementService = inject(MenuManagementService);
  private readonly router = inject(Router);

  // ============================================================================
  // 私有狀態 (Private State)
  // ============================================================================

  /** 認證狀態 */
  private readonly _authState = signal<AuthStateData>({
    status: 'loading',
    user: null,
    session: null,
    error: null
  });

  /** 上下文狀態 */
  private readonly _contextState = signal<ContextStateData>({
    type: ContextType.USER,
    id: null,
    label: '個人帳戶',
    icon: 'user',
    ready: false
  });

  /** 工作區資料 */
  private readonly _workspaceData = signal<WorkspaceData>({
    currentUser: null,
    organizations: [],
    teams: [],
    loading: false,
    error: null
  });

  /** 初始化標記 */
  private _initialized = false;

  /** 上下文切換中標記 */
  private readonly _switching = signal(false);

  // ============================================================================
  // 公開狀態 (Public Readonly Signals)
  // ============================================================================

  /** 是否正在切換上下文 */
  readonly switching = this._switching.asReadonly();

  // --- 認證相關 ---

  /** 認證狀態 */
  readonly authState = this._authState.asReadonly();

  /** 認證狀態碼 */
  readonly authStatus = computed(() => this._authState().status);

  /** 當前用戶（Supabase User） */
  readonly currentAuthUser = computed(() => this._authState().user);

  /** 是否已認證 */
  readonly isAuthenticated = computed(() => this._authState().status === 'authenticated');

  /** 是否正在載入認證狀態 */
  readonly isAuthLoading = computed(() => this._authState().status === 'loading');

  /** 認證錯誤 */
  readonly authError = computed(() => this._authState().error);

  // --- 上下文相關 ---

  /** 上下文狀態 */
  readonly contextState = this._contextState.asReadonly();

  /** 當前上下文類型 */
  readonly contextType = computed(() => this._contextState().type);

  /** 當前上下文 ID */
  readonly contextId = computed(() => this._contextState().id);

  /** 上下文標籤 */
  readonly contextLabel = computed(() => this._contextState().label);

  /** 上下文圖標 */
  readonly contextIcon = computed(() => this._contextState().icon);

  /** 上下文是否準備就緒 */
  readonly contextReady = computed(() => this._contextState().ready);

  /**
   * 是否有有效的工作區上下文
   * 核心檢查：有有效 ID 且系統準備就緒
   */
  readonly hasValidContext = computed(() => {
    const state = this._contextState();
    return !!state.id && state.ready;
  });

  // --- 工作區資料 ---

  /** 工作區資料 */
  readonly workspaceData = this._workspaceData.asReadonly();

  /** 當前帳戶（Account 表） */
  readonly currentAccount = computed(() => this._workspaceData().currentUser);

  /** 組織列表 */
  readonly organizations = computed(() => this._workspaceData().organizations);

  /** 團隊列表 */
  readonly teams = computed(() => this._workspaceData().teams);

  /** 是否正在載入工作區資料 */
  readonly isWorkspaceLoading = computed(() => this._workspaceData().loading);

  /** 工作區錯誤 */
  readonly workspaceError = computed(() => this._workspaceData().error);

  // --- 複合狀態 ---

  /**
   * 系統是否完全準備就緒
   * 條件：已認證 + 上下文準備完成
   */
  readonly isReady = computed(() => this.isAuthenticated() && this.contextReady());

  /**
   * 團隊按組織分組
   */
  readonly teamsByOrganization = computed(() => {
    const teams = this.teams();
    const orgs = this.organizations();
    const map = new Map<string, TeamModel[]>();

    orgs.forEach(org => map.set(org['id'] as string, []));
    teams.forEach(team => {
      const orgId = (team as any).organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(team);
      }
    });

    return map;
  });

  /** 工作區統計 */
  readonly workspaceStats = computed(() => ({
    organizations: this.organizations().length,
    teams: this.teams().length,
    total: this.organizations().length + this.teams().length + 1 // +1 for user
  }));

  // ============================================================================
  // 建構子 - 初始化監聯
  // ============================================================================

  constructor() {
    // 監聽 Supabase Auth 狀態變化
    this.initializeAuthListener();
  }

  /**
   * 初始化認證監聽器
   */
  private initializeAuthListener(): void {
    // 監聽 Supabase 認證事件（這是主要的認證觸發點）
    this.supabaseService.getClient().auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContextService] 🔄 Auth event:', event, { hasSession: !!session });

      const user = session?.user || null;

      if (event === 'SIGNED_IN' && session) {
        this._authState.set({
          status: 'authenticated',
          user,
          session,
          error: null
        });

        // 載入工作區資料並恢復上下文
        await this.initializeWorkspace(user!.id);
      } else if (event === 'SIGNED_OUT') {
        this._authState.set({
          status: 'unauthenticated',
          user: null,
          session: null,
          error: null
        });
        this.reset();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        this._authState.update(state => ({
          ...state,
          session
        }));
      } else if (event === 'INITIAL_SESSION') {
        // 初始 session 載入
        if (session && user) {
          this._authState.set({
            status: 'authenticated',
            user,
            session,
            error: null
          });
          await this.initializeWorkspace(user.id);
        } else {
          this._authState.set({
            status: 'unauthenticated',
            user: null,
            session: null,
            error: null
          });
        }
      }
    });

    // 同時檢查當前 session（處理頁面刷新的情況）
    this.checkCurrentSession();
  }

  /**
   * 檢查當前 session（頁面刷新時使用）
   */
  private async checkCurrentSession(): Promise<void> {
    try {
      const session = await this.supabaseService.getSession();
      const user = session?.user || null;

      console.log('[AuthContextService] 🔐 Current session check:', {
        hasSession: !!session,
        userId: user?.id,
        initialized: this._initialized
      });

      if (session && user && !this._initialized) {
        this._authState.set({
          status: 'authenticated',
          user,
          session,
          error: null
        });
        await this.initializeWorkspace(user.id);
      } else if (!session) {
        this._authState.set({
          status: 'unauthenticated',
          user: null,
          session: null,
          error: null
        });
      }
    } catch (error) {
      console.error('[AuthContextService] Session check failed:', error);
      this._authState.set({
        status: 'error',
        user: null,
        session: null,
        error: 'Failed to check session'
      });
    }
  }

  /**
   * 初始化工作區（統一入口）
   */
  private async initializeWorkspace(authUserId: string): Promise<void> {
    if (this._initialized) {
      console.log('[AuthContextService] ⏭️ Already initialized, skipping');
      return;
    }

    console.log('[AuthContextService] 🚀 Initializing workspace for:', authUserId);
    this._initialized = true;

    try {
      // 1. 載入菜單配置
      await this.menuManagementService.loadConfig();

      // 2. 載入工作區資料
      await this.loadWorkspaceData(authUserId);

      // 3. 恢復上一次的上下文
      this.restoreContext();
    } catch (error) {
      console.error('[AuthContextService] Workspace initialization failed:', error);
      // 即使失敗也標記為 ready，讓 UI 可以顯示錯誤
      this._contextState.update(state => ({
        ...state,
        ready: true
      }));
    }
  }

  // ============================================================================
  // 工作區資料載入
  // ============================================================================

  /**
   * 載入工作區資料
   */
  async loadWorkspaceData(authUserId: string): Promise<void> {
    if (this._workspaceData().loading) return;

    console.log('[AuthContextService] 📊 Loading workspace data for:', authUserId);

    this._workspaceData.update(state => ({
      ...state,
      loading: true,
      error: null
    }));

    try {
      // 並行載入所有資料
      const [userAccount, createdOrgs, joinedOrgs, teams] = await Promise.allSettled([
        this.accountService.findByAuthUserId(authUserId),
        this.organizationService.getUserCreatedOrganizations(authUserId),
        this.accountService
          .findByAuthUserId(authUserId)
          .then(user => (user ? this.organizationService.getUserJoinedOrganizations(user['id'] as string) : [])),
        this.accountService.findByAuthUserId(authUserId).then(user => (user ? this.accountService.getUserTeams(user['id'] as string) : []))
      ]);

      // 處理用戶帳戶
      let currentUser: Account | null = null;
      if (userAccount.status === 'fulfilled' && userAccount.value) {
        currentUser = userAccount.value;
      }

      // 合併組織列表（去重）
      const allOrgs = [
        ...(createdOrgs.status === 'fulfilled' ? createdOrgs.value : []),
        ...(joinedOrgs.status === 'fulfilled' ? joinedOrgs.value : [])
      ];
      const uniqueOrgs = Array.from(new Map(allOrgs.map(org => [org['id'], org])).values());

      // 處理團隊
      const userTeams = teams.status === 'fulfilled' ? teams.value : [];

      this._workspaceData.set({
        currentUser,
        organizations: uniqueOrgs,
        teams: userTeams,
        loading: false,
        error: null
      });

      console.log('[AuthContextService] ✅ Workspace data loaded:', {
        hasUser: !!currentUser,
        orgsCount: uniqueOrgs.length,
        teamsCount: userTeams.length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workspace data';
      console.error('[AuthContextService] ❌ Load failed:', error);

      this._workspaceData.update(state => ({
        ...state,
        loading: false,
        error: message
      }));
    }
  }

  // ============================================================================
  // 上下文切換
  // ============================================================================

  /**
   * 切換到用戶上下文
   */
  switchToUser(userId: string): void {
    this.switchContext(ContextType.USER, userId);
  }

  /**
   * 切換到組織上下文
   */
  switchToOrganization(organizationId: string): void {
    this.switchContext(ContextType.ORGANIZATION, organizationId);
  }

  /**
   * 切換到團隊上下文
   */
  switchToTeam(teamId: string): void {
    this.switchContext(ContextType.TEAM, teamId);
  }

  /**
   * 切換到機器人上下文
   */
  switchToBot(botId: string): void {
    this.switchContext(ContextType.BOT, botId);
  }

  /**
   * 核心上下文切換方法
   */
  switchContext(type: ContextType, id: string | null): void {
    console.log('[AuthContextService] 🔀 Switching context:', { type, id });

    this._switching.set(true);

    const label = this.getContextLabel(type, id);
    const icon = this.getContextIcon(type);

    this._contextState.set({
      type,
      id,
      label,
      icon,
      ready: true
    });

    this.persistContext();
    this.syncMenu();

    this._switching.set(false);
    console.log('[AuthContextService] ✅ Context switched:', { type, id, label });
  }

  /**
   * 同步菜單 (根據當前上下文)
   */
  syncMenu(): void {
    const type = this.contextType();
    const id = this.contextId();

    if (!id) {
      // No valid context ID, use USER menu as default
      this.menuManagementService.updateMenu(ContextType.USER);
      return;
    }

    // 根據不同上下文類型準備參數
    const params = this.buildMenuParams(type, id);
    this.menuManagementService.updateMenu(type, params);
  }

  /**
   * 構建菜單參數
   */
  private buildMenuParams(type: ContextType, id: string): ContextParams {
    switch (type) {
      case ContextType.USER:
        return { userId: id };
      case ContextType.ORGANIZATION:
        return { organizationId: id };
      case ContextType.TEAM:
        return { teamId: id };
      case ContextType.BOT:
        return { botId: id };
      default:
        return {};
    }
  }

  /**
   * 獲取上下文標籤
   */
  private getContextLabel(type: ContextType, id: string | null): string {
    switch (type) {
      case ContextType.USER:
        return (this._workspaceData().currentUser?.['name'] as string) || '個人帳戶';
      case ContextType.ORGANIZATION:
        return (this._workspaceData().organizations.find(o => o['id'] === id)?.['name'] as string) || '組織';
      case ContextType.TEAM:
        return (this._workspaceData().teams.find(t => t['id'] === id)?.['name'] as string) || '團隊';
      case ContextType.BOT:
        return '機器人';
      default:
        return '個人帳戶';
    }
  }

  /**
   * 獲取上下文圖標
   */
  private getContextIcon(type: ContextType): string {
    const iconMap = {
      [ContextType.USER]: 'user',
      [ContextType.ORGANIZATION]: 'team',
      [ContextType.TEAM]: 'usergroup-add',
      [ContextType.BOT]: 'robot'
    };
    return iconMap[type] || 'user';
  }

  // ============================================================================
  // 持久化
  // ============================================================================

  /**
   * 恢復上下文（從 localStorage）
   */
  restoreContext(): void {
    if (typeof localStorage === 'undefined') {
      this.setDefaultContext();
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[AuthContextService] 💾 Restoring context:', saved);

      if (saved) {
        const context = JSON.parse(saved) as ContextState;
        if (context.type && context.id) {
          this.switchContext(context.type, context.id);
          return;
        }
      }

      // 預設切換到用戶上下文
      this.setDefaultContext();
    } catch (error) {
      console.error('[AuthContextService] Restore failed:', error);
      this.setDefaultContext();
    }
  }

  /**
   * 設定預設上下文（用戶上下文）
   */
  private setDefaultContext(): void {
    // 優先使用 Account 表的 ID
    const accountId = this._workspaceData().currentUser?.['id'];
    // 備用：使用 Auth 用戶的 ID
    const authUserId = this._authState().user?.id;

    const userId = accountId || authUserId;
    console.log('[AuthContextService] 👤 Setting default context:', {
      accountId,
      authUserId,
      finalUserId: userId
    });

    if (userId) {
      this.switchToUser(userId as string);
    } else {
      // 標記為準備就緒，即使沒有用戶（未登入情況）
      this._contextState.update(state => ({
        ...state,
        ready: true
      }));
    }
  }

  /**
   * 持久化上下文到 localStorage
   */
  private persistContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const state = this._contextState();
      const context: ContextState = {
        type: state.type,
        id: state.id,
        label: state.label,
        icon: state.icon
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('[AuthContextService] Persist failed:', error);
    }
  }

  // ============================================================================
  // 輔助方法
  // ============================================================================

  /**
   * 根據 ID 查找組織
   */
  getOrganizationById(id: string): OrganizationModel | undefined {
    return this.organizations().find(org => org['id'] === id);
  }

  /**
   * 根據 ID 查找團隊
   */
  getTeamById(id: string): TeamModel | undefined {
    return this.teams().find(team => team['id'] === id);
  }

  /**
   * 獲取組織的所有團隊
   */
  getTeamsByOrganization(organizationId: string): TeamModel[] {
    return this.teamsByOrganization().get(organizationId) || [];
  }

  /**
   * 檢查用戶是否是組織創建者
   */
  isOrganizationCreator(organizationId: string): boolean {
    const org = this.getOrganizationById(organizationId);
    const userId = this.currentAccount()?.['id'];
    return (org as any)?.['creator_id'] === userId;
  }

  /**
   * 重新載入工作區資料
   * 用於在創建組織/團隊後刷新數據
   */
  async reloadWorkspaceData(): Promise<void> {
    const authUserId = this._authState().user?.id;
    if (!authUserId) {
      console.warn('[AuthContextService] Cannot reload: no auth user');
      return;
    }

    console.log('[AuthContextService] 🔄 Reloading workspace data');
    await this.loadWorkspaceData(authUserId);
  }

  // ============================================================================
  // 重置
  // ============================================================================

  /**
   * 重置所有狀態
   */
  reset(): void {
    console.log('[AuthContextService] 🔄 Resetting state');

    this._workspaceData.set({
      currentUser: null,
      organizations: [],
      teams: [],
      loading: false,
      error: null
    });

    this._contextState.set({
      type: ContextType.USER,
      id: null,
      label: '個人帳戶',
      icon: 'user',
      ready: false
    });

    this._initialized = false;

    // 清除持久化的上下文
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * 重新載入工作區資料
   */
  async reload(): Promise<void> {
    const user = this._authState().user;
    if (user) {
      await this.loadWorkspaceData(user.id);
    }
  }
}
