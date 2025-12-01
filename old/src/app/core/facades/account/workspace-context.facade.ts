/**
 * Workspace Facade
 *
 * 工作區門面 - 統一對外接口
 * Workspace facade - Unified external interface
 *
 * 設計理念：
 * - Facade 負責編排和協調多個服務
 * - 提供高階 API 隱藏內部複雜度
 * - 處理跨服務的業務邏輯
 * - 作為穩定的對外契約層
 *
 * @module core/facades
 */

import { Injectable, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType } from '@core';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { WorkspaceContextService, WorkspaceDataService, MenuManagementService } from '@shared';

/**
 * 工作區切換選項
 */
export interface SwitchOptions {
  /** 是否自動導航到儀表板 */
  navigateToDashboard?: boolean;
  /** 是否更新菜單 */
  updateMenu?: boolean;
  /** 自定義導航路徑 */
  navigateTo?: string;
}

/**
 * 工作區資訊
 */
export interface WorkspaceInfo {
  type: ContextType;
  id: string | null;
  label: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceContextFacade {
  private readonly contextService = inject(WorkspaceContextService);
  private readonly dataService = inject(WorkspaceDataService);
  private readonly menuService = inject(MenuManagementService);
  private readonly router = inject(Router);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);

  // ============================================================================
  // Public API - 唯讀狀態
  // ============================================================================

  /** 當前上下文類型 */
  readonly contextType = this.contextService.contextType;

  /** 當前上下文 ID */
  readonly contextId = this.contextService.contextId;

  /** 是否正在切換上下文 */
  readonly switching = this.contextService.switching;

  /** 當前用戶 */
  readonly currentUser = this.dataService.currentUserAccount;

  /** 所有組織 */
  readonly organizations = computed(() => {
    const created = this.dataService.createdOrganizations();
    const joined = this.dataService.joinedOrganizations();
    // 合併並去重
    const all = [...created, ...joined];
    const unique = Array.from(new Map(all.map(org => [org['id'], org])).values());
    return unique;
  });

  /** 所有團隊 */
  readonly teams = this.dataService.userTeams;

  /** 是否正在載入資料 */
  readonly loading = computed(() => this.dataService.loadingOrganizations() || this.dataService.loadingTeams());

  /** 錯誤訊息 */
  readonly error = this.dataService.error;

  // ============================================================================
  // Computed Signals - 高階狀態
  // ============================================================================

  /** 當前工作區資訊 */
  readonly currentWorkspace = computed<WorkspaceInfo>(() => ({
    type: this.contextType(),
    id: this.contextId(),
    label: this.contextService.contextLabel(),
    icon: this.contextService.contextIcon()
  }));

  /** 按組織分組的團隊 */
  readonly teamsByOrganization = this.contextService.teamsByOrganization;

  /** 上下文標籤 */
  readonly contextLabel = this.contextService.contextLabel;

  /** 上下文圖標 */
  readonly contextIcon = this.contextService.contextIcon;

  /** 是否有有效的工作區上下文 */
  readonly hasValidContext = computed(() => {
    const id = this.contextId();
    return !!id;
  });

  /** 可用的工作區數量統計 */
  readonly workspaceStats = computed(() => ({
    organizations: this.organizations().length,
    teams: this.teams().length,
    total: this.organizations().length + this.teams().length + 1 // +1 for user
  }));

  // ============================================================================
  // 生命週期管理
  // ============================================================================

  private hasInitialized = false;

  constructor() {
    // 監聽認證狀態並初始化
    effect(() => {
      const token = this.tokenService.get();
      const authUserId = token?.['user']?.['id'];

      if (authUserId && !this.hasInitialized) {
        this.initialize(authUserId);
      } else if (!authUserId) {
        this.reset();
      }
    });
  }

  /**
   * 初始化工作區
   *
   * @internal
   */
  private async initialize(authUserId: string): Promise<void> {
    this.hasInitialized = true;

    try {
      // 1. 載入菜單配置
      await this.menuService.loadConfig();

      // 2. 載入工作區資料
      await this.dataService.loadWorkspaceData(authUserId);

      // 3. 恢復上一次的上下文
      this.contextService.restoreContext();

      // 4. 同步菜單
      this.syncMenu();
    } catch (error) {
      console.error('[WorkspaceContextFacade] Initialization failed:', error);
    }
  }

  // ============================================================================
  // 高階 API - 上下文切換 (帶業務邏輯)
  // ============================================================================

  /**
   * 切換到用戶工作區
   */
  async switchToUser(userId: string, options: SwitchOptions = {}): Promise<void> {
    await this.switchWorkspace(ContextType.USER, userId, options);
  }

  /**
   * 切換到組織工作區
   */
  async switchToOrganization(organizationId: string, options: SwitchOptions = {}): Promise<void> {
    await this.switchWorkspace(ContextType.ORGANIZATION, organizationId, options);
  }

  /**
   * 切換到團隊工作區
   */
  async switchToTeam(teamId: string, options: SwitchOptions = {}): Promise<void> {
    await this.switchWorkspace(ContextType.TEAM, teamId, options);
  }

  /**
   * 切換到機器人工作區
   */
  async switchToBot(botId: string, options: SwitchOptions = {}): Promise<void> {
    await this.switchWorkspace(ContextType.BOT, botId, options);
  }

  /**
   * 切換工作區的統一處理邏輯
   *
   * @private
   */
  private async switchWorkspace(type: ContextType, id: string, options: SwitchOptions): Promise<void> {
    const { navigateToDashboard = false, updateMenu = true, navigateTo } = options;

    // 1. 切換上下文
    this.contextService.switchContext(type, id);

    // 2. 更新菜單
    if (updateMenu) {
      this.syncMenu();
    }

    // 3. 導航
    if (navigateTo) {
      await this.router.navigateByUrl(navigateTo);
    } else if (navigateToDashboard) {
      await this.router.navigate(['/dashboard']);
    }
  }

  // ============================================================================
  // 菜單管理
  // ============================================================================

  /**
   * 同步菜單 (根據當前上下文)
   */
  syncMenu(): void {
    const type = this.contextType();
    const id = this.contextId();

    if (!id) {
      // No valid context ID, use USER menu as default
      this.menuService.updateMenu(ContextType.USER);
      return;
    }

    // 根據不同上下文類型準備參數
    const params = this.buildMenuParams(type, id);
    this.menuService.updateMenu(type, params);
  }

  /**
   * 構建菜單參數
   *
   * @private
   */
  private buildMenuParams(type: ContextType, id: string) {
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

  // ============================================================================
  // 便捷查詢方法
  // ============================================================================

  /**
   * 根據 ID 查找組織
   */
  getOrganizationById(id: string) {
    return this.organizations().find((org: any) => org['id'] === id);
  }

  /**
   * 根據 ID 查找團隊
   */
  getTeamById(id: string) {
    return this.teams().find((team: any) => team['id'] === id);
  }

  /**
   * 獲取組織的所有團隊
   */
  getTeamsByOrganization(organizationId: string) {
    return this.teamsByOrganization().get(organizationId) || [];
  }

  /**
   * 檢查用戶是否是組織創建者
   */
  isOrganizationCreator(organizationId: string): boolean {
    const org = this.getOrganizationById(organizationId);
    const userId = (this.currentUser() as any)?.['id'];
    return (org as any)?.['creator_id'] === userId;
  }

  // ============================================================================
  // 狀態管理
  // ============================================================================

  /**
   * 重新載入工作區資料
   */
  async reload(): Promise<void> {
    const token = this.tokenService.get();
    const authUserId = token?.['user']?.['id'];

    if (authUserId) {
      await this.dataService.loadWorkspaceData(authUserId);
      this.syncMenu();
    }
  }

  /**
   * 重置所有狀態
   */
  reset(): void {
    this.dataService.reset();
    this.contextService.switchContext(ContextType.USER, null);
    this.hasInitialized = false;
  }
}
