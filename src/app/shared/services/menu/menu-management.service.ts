/**
 * Menu Management Service
 *
 * 菜單管理服務 - 簡化版
 * Menu management service - Simplified version
 *
 * 職責：
 * - 載入菜單配置
 * - 根據上下文生成菜單
 * - 動態路由參數替換
 *
 * @module shared/services/menu
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ContextType } from '@core';
import { Menu, MenuService } from '@delon/theme';
import { firstValueFrom } from 'rxjs';

/**
 * 菜單配置
 */
interface MenuConfig {
  user?: Menu[];
  organization?: Menu[];
  team?: Menu[];
  bot?: Menu[];
  blueprint?: Menu[];
}

/**
 * 上下文參數
 * Context parameters for menu generation
 */
export interface ContextParams {
  userId?: string;
  organizationId?: string;
  teamId?: string;
  botId?: string;
  blueprintId?: string;
}

/**
 * 應用資料結構
 */
interface AppData {
  menus?: MenuConfig;
}

@Injectable({
  providedIn: 'root'
})
export class MenuManagementService {
  private readonly http = inject(HttpClient);
  private readonly menuService = inject(MenuService);

  private readonly configState = signal<MenuConfig | null>(null);
  private readonly loadingState = signal<boolean>(false);

  /**
   * Tracks the last menu update to prevent duplicate consecutive updates
   * 追蹤上次菜單更新以防止重複連續更新
   */
  private lastMenuContext: { type: ContextType; paramsKey: string } | null = null;

  readonly config = this.configState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  /**
   * 載入菜單配置
   */
  async loadConfig(): Promise<void> {
    if (this.configState()) return; // 已載入

    this.loadingState.set(true);
    try {
      const data = await firstValueFrom(this.http.get<AppData>('./assets/tmp/app-data.json'));
      this.configState.set(data.menus || {});
    } catch (error) {
      console.error('[MenuManagementService] Load failed:', error);
      this.configState.set({});
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 更新菜單
   * Update menu with duplicate prevention
   *
   * Includes state tracking to prevent duplicate consecutive updates
   * which can cause performance issues or infinite loops.
   */
  updateMenu(contextType: ContextType, params?: ContextParams): void {
    const config = this.configState();
    if (!config) return;

    // Create a stable key from params to check for duplicates
    const paramsKey = this.createParamsKey(params);

    // Skip update if context type and params are the same as last update
    if (this.lastMenuContext && this.lastMenuContext.type === contextType && this.lastMenuContext.paramsKey === paramsKey) {
      console.log('[MenuManagementService] ⏭️ Skipping duplicate menu update:', { contextType, params });
      return;
    }

    const baseMenu = this.getBaseMenu(contextType, config);
    const menu = this.processParams(baseMenu, params);

    this.menuService.add(menu);

    // Record this update
    this.lastMenuContext = { type: contextType, paramsKey };
    console.log('[MenuManagementService] ✅ Menu updated:', { contextType, params });
  }

  /**
   * 創建參數鍵
   * Create a stable key from params for comparison
   */
  private createParamsKey(params?: ContextParams): string {
    if (!params) return '';
    return JSON.stringify({
      userId: params.userId || '',
      organizationId: params.organizationId || '',
      teamId: params.teamId || '',
      botId: params.botId || '',
      blueprintId: params.blueprintId || ''
    });
  }

  /**
   * 獲取基礎菜單
   */
  private getBaseMenu(contextType: ContextType, config: MenuConfig): Menu[] {
    switch (contextType) {
      case ContextType.USER:
        return config.user || [];
      case ContextType.ORGANIZATION:
        return config.organization || [];
      case ContextType.TEAM:
        return config.team || [];
      case ContextType.BOT:
        return config.bot || [];
      default:
        return [];
    }
  }

  /**
   * 處理動態參數
   */
  private processParams(menu: Menu[], params?: ContextParams): Menu[] {
    if (!params) return menu;

    return menu.map(item => ({
      ...item,
      link: item.link ? this.replaceParams(item.link, params) : item.link,
      children: item.children ? this.processParams(item.children, params) : undefined
    }));
  }

  /**
   * 替換路由參數
   * 支持: {userId}, :userId, {orgId}, :organizationId, {blueprintId}, :blueprintId 等
   */
  private replaceParams(route: string, params: ContextParams): string {
    return route
      .replace(/\{userId\}|:userId/g, params.userId || '')
      .replace(/\{organizationId\}|\{orgId\}|:organizationId|:orgId/g, params.organizationId || '')
      .replace(/\{teamId\}|:teamId/g, params.teamId || '')
      .replace(/\{botId\}|:botId/g, params.botId || '')
      .replace(/\{blueprintId\}|:blueprintId/g, params.blueprintId || '');
  }
}
