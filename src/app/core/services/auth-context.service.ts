/**
 * AuthContextService - 統一認證與上下文管理服務
 *
 * 簡化版本，用於支持上下文切換器組件
 *
 * @module core/services
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { ContextType, ContextState } from '../types/context.types';

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
  currentUser: any | null;
  organizations: any[];
  teams: any[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'auth_context_state';

@Injectable({
  providedIn: 'root'
})
export class AuthContextService {
  // ============================================================================
  // 私有狀態 (Private State)
  // ============================================================================

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

  /** 上下文切換中標記 */
  private readonly _switching = signal(false);

  // ============================================================================
  // 公開狀態 (Public Readonly Signals)
  // ============================================================================

  /** 是否正在切換上下文 */
  readonly switching = this._switching.asReadonly();

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

  /** 是否已認證 */
  readonly isAuthenticated = computed(() => true); // 簡化版本，預設為已認證

  /** 工作區資料 */
  readonly workspaceData = this._workspaceData.asReadonly();

  /** 當前帳戶 */
  readonly currentAccount = computed(() => this._workspaceData().currentUser);

  /** 組織列表 */
  readonly organizations = computed(() => this._workspaceData().organizations);

  /** 團隊列表 */
  readonly teams = computed(() => this._workspaceData().teams);

  /** 是否正在載入工作區資料 */
  readonly isWorkspaceLoading = computed(() => this._workspaceData().loading);

  /** 工作區錯誤 */
  readonly workspaceError = computed(() => this._workspaceData().error);

  /**
   * 團隊按組織分組
   */
  readonly teamsByOrganization = computed(() => {
    const teams = this.teams();
    const orgs = this.organizations();
    const map = new Map<string, any[]>();

    orgs.forEach(org => map.set(org['id'] as string, []));
    teams.forEach(team => {
      const orgId = (team as any).organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(team);
      }
    });

    return map;
  });

  // ============================================================================
  // 公開方法 (Public Methods)
  // ============================================================================

  /**
   * 切換到用戶上下文
   */
  switchToUser(userId: string): void {
    console.log('[AuthContextService] 🔀 Switching to user:', userId);
    this.switchContext(ContextType.USER, userId);
  }

  /**
   * 切換到組織上下文
   */
  switchToOrganization(orgId: string): void {
    console.log('[AuthContextService] 🔀 Switching to organization:', orgId);
    this.switchContext(ContextType.ORGANIZATION, orgId);
  }

  /**
   * 切換到團隊上下文
   */
  switchToTeam(teamId: string): void {
    console.log('[AuthContextService] 🔀 Switching to team:', teamId);
    this.switchContext(ContextType.TEAM, teamId);
  }

  /**
   * 切換到機器人上下文
   */
  switchToBot(botId: string): void {
    console.log('[AuthContextService] 🔀 Switching to bot:', botId);
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
    this._switching.set(false);
    console.log('[AuthContextService] ✅ Context switched:', { type, id, label });
  }

  /**
   * 獲取上下文標籤
   */
  getContextLabel(type: ContextType, id: string | null): string {
    if (!id) {
      return '個人帳戶';
    }

    switch (type) {
      case ContextType.USER:
        const user = this._workspaceData().currentUser;
        return (user?.name as string) || (user?.email as string) || '個人帳戶';
      case ContextType.ORGANIZATION:
        const org = this.getOrganizationById(id);
        return (org?.name as string) || '組織';
      case ContextType.TEAM:
        const team = this.getTeamById(id);
        return (team?.name as string) || '團隊';
      case ContextType.BOT:
        return '機器人';
      default:
        return '個人帳戶';
    }
  }

  /**
   * 獲取上下文圖標
   */
  getContextIcon(type: ContextType): string {
    switch (type) {
      case ContextType.USER:
        return 'user';
      case ContextType.ORGANIZATION:
        return 'team';
      case ContextType.TEAM:
        return 'usergroup-add';
      case ContextType.BOT:
        return 'robot';
      default:
        return 'user';
    }
  }

  /**
   * 根據 ID 獲取組織
   */
  getOrganizationById(id: string): any | null {
    return this.organizations().find(org => (org['id'] as string) === id) || null;
  }

  /**
   * 根據 ID 獲取團隊
   */
  getTeamById(id: string): any | null {
    return this.teams().find(team => (team['id'] as string) === id) || null;
  }

  /**
   * 重新載入工作區資料
   */
  reloadWorkspaceData(): void {
    // TODO: 實現實際的資料載入邏輯
    console.log('[AuthContextService] 🔄 Reloading workspace data...');
  }

  /**
   * 持久化上下文狀態
   */
  private persistContext(): void {
    try {
      const state = this._contextState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        type: state.type,
        id: state.id
      }));
    } catch (error) {
      console.error('[AuthContextService] Failed to persist context:', error);
    }
  }

  /**
   * 重置上下文
   */
  reset(): void {
    this._contextState.set({
      type: ContextType.USER,
      id: null,
      label: '個人帳戶',
      icon: 'user',
      ready: false
    });
    this._workspaceData.set({
      currentUser: null,
      organizations: [],
      teams: [],
      loading: false,
      error: null
    });
  }
}

