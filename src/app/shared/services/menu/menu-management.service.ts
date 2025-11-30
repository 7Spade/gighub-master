/**
 * Menu Management Service
 *
 * 菜單管理服務 - 根據工作區上下文動態切換菜單
 * Menu management service - Dynamically switch menus based on workspace context
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
 * Menu configuration structure from app-data.json
 */
interface MenuConfig {
  app?: Menu[];
  user?: Menu[];
  organization?: Menu[];
  team?: Menu[];
  bot?: Menu[];
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
 * Application data structure from app-data.json
 */
interface AppData {
  app?: {
    name: string;
    description: string;
  };
  menus?: MenuConfig;
  menu?: Menu[]; // Legacy single menu format
}

@Injectable({
  providedIn: 'root'
})
export class MenuManagementService {
  private readonly http = inject(HttpClient);
  private readonly menuService = inject(MenuService);

  private readonly configState = signal<MenuConfig | null>(null);
  private readonly loadingState = signal<boolean>(false);

  readonly config = this.configState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  /**
   * 載入菜單配置
   * Load menu configuration from app-data.json
   */
  async loadConfig(): Promise<void> {
    if (this.configState()) return; // 已載入

    this.loadingState.set(true);
    try {
      const data = await firstValueFrom(this.http.get<AppData>('./assets/tmp/app-data.json'));
      this.configState.set(data.menus || {});
      console.log('[MenuManagementService] Menu config loaded:', data.menus);
    } catch (error) {
      console.error('[MenuManagementService] Load failed:', error);
      this.configState.set({});
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 更新菜單
   * Update menu based on context type
   */
  updateMenu(contextType: ContextType, params?: ContextParams): void {
    const config = this.configState();
    if (!config) {
      console.warn('[MenuManagementService] No config loaded, cannot update menu');
      return;
    }

    const baseMenu = this.getBaseMenu(contextType, config);
    const menu = this.processParams(baseMenu, params);

    console.log('[MenuManagementService] Updating menu for context:', contextType, 'items:', menu.length);
    this.menuService.add(menu);
  }

  /**
   * 獲取基礎菜單
   * Get base menu for context type
   */
  private getBaseMenu(contextType: ContextType, config: MenuConfig): Menu[] {
    switch (contextType) {
      case ContextType.USER:
        return config.user || config.app || [];
      case ContextType.ORGANIZATION:
        return config.organization || config.app || [];
      case ContextType.TEAM:
        return config.team || config.app || [];
      case ContextType.BOT:
        return config.bot || config.app || [];
      default:
        return config.app || [];
    }
  }

  /**
   * 處理動態參數
   * Process dynamic parameters in menu links
   */
  private processParams(menu: Menu[], params?: ContextParams): Menu[] {
    if (!params) return this.deepClone(menu);

    return menu.map(item => ({
      ...item,
      link: item.link ? this.replaceParams(item.link, params) : item.link,
      children: item.children ? this.processParams(item.children, params) : undefined
    }));
  }

  /**
   * 替換路由參數
   * Replace route parameters with actual values
   * 支持: {userId}, :userId, {orgId}, :organizationId 等
   */
  private replaceParams(route: string, params: ContextParams): string {
    return route
      .replace(/\{userId\}|:userId/g, params.userId || '')
      .replace(/\{organizationId\}|\{orgId\}|:organizationId|:orgId/g, params.organizationId || '')
      .replace(/\{teamId\}|:teamId/g, params.teamId || '')
      .replace(/\{botId\}|:botId/g, params.botId || '')
      .replace(/\{blueprintId\}|:blueprintId/g, params.blueprintId || '');
  }

  /**
   * 深拷貝菜單
   * Deep clone menu to avoid mutation
   */
  private deepClone(menu: Menu[]): Menu[] {
    return JSON.parse(JSON.stringify(menu));
  }
}
