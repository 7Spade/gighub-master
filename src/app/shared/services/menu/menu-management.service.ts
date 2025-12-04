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

  // 防重複更新機制 - 記錄上次更新的上下文
  // Duplicate prevention - track last menu context
  private lastMenuContext?: { type: ContextType; paramsHash: string };

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
   * 根據 docs/analysis-menu-infinite-loop-detailed.md 方案2：
   * 添加防重複更新機制，避免相同上下文重複觸發菜單更新
   */
  updateMenu(contextType: ContextType, params?: ContextParams): void {
    const config = this.configState();
    if (!config) return;

    // 計算參數雜湊，用於比較是否相同
    const paramsHash = params ? JSON.stringify(params) : '';

    // 檢查是否與上次相同，避免重複更新
    if (this.lastMenuContext?.type === contextType && this.lastMenuContext?.paramsHash === paramsHash) {
      console.log('[MenuManagementService] Menu unchanged, skipping update:', { contextType });
      return;
    }

    const baseMenu = this.getBaseMenu(contextType, config);
    const menu = this.processParams(baseMenu, params);

    this.menuService.add(menu);

    // 記錄本次更新的上下文
    this.lastMenuContext = { type: contextType, paramsHash };
    console.log('[MenuManagementService] Menu updated:', { contextType, hasParams: !!params });
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
