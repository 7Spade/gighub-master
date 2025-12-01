/**
 * Blueprint Context Service
 *
 * 藍圖上下文服務
 * Blueprint Context Service
 *
 * Provides blueprint-level shared context for all modules within a blueprint.
 * Manages current blueprint state, enabled modules, and module-level operations.
 *
 * @module shared/services/blueprint
 */

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, distinctUntilChanged, map } from 'rxjs/operators';
import { BlueprintService } from './blueprint.service';
import { BlueprintBusinessModel } from '../../models/blueprint';
import { ModuleType } from '@core';

/**
 * 藍圖上下文狀態
 * Blueprint context state interface
 */
export interface BlueprintContextState {
  /** 當前藍圖 | Current blueprint */
  blueprint: BlueprintBusinessModel | null;
  /** 載入中 | Loading state */
  loading: boolean;
  /** 錯誤訊息 | Error message */
  error: string | null;
  /** 當前選中的模組 | Currently selected module */
  activeModule: ModuleType | null;
}

/**
 * 模組配置
 * Module configuration
 */
export interface ModuleConfig {
  type: ModuleType;
  label: string;
  icon: string;
  route: string;
  description: string;
}

/**
 * 所有可用模組的配置
 * Configuration for all available modules
 */
export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  [ModuleType.TASKS]: {
    type: ModuleType.TASKS,
    label: '任務',
    icon: 'check-square',
    route: 'tasks',
    description: '任務管理與追蹤'
  },
  [ModuleType.DIARY]: {
    type: ModuleType.DIARY,
    label: '日誌',
    icon: 'book',
    route: 'diary',
    description: '施工日誌記錄'
  },
  [ModuleType.DASHBOARD]: {
    type: ModuleType.DASHBOARD,
    label: '儀表板',
    icon: 'dashboard',
    route: 'dashboard',
    description: '數據概覽與統計'
  },
  [ModuleType.BOT_WORKFLOW]: {
    type: ModuleType.BOT_WORKFLOW,
    label: '自動化',
    icon: 'robot',
    route: 'workflows',
    description: '自動化工作流程'
  },
  [ModuleType.FILES]: {
    type: ModuleType.FILES,
    label: '檔案',
    icon: 'folder',
    route: 'files',
    description: '檔案管理'
  },
  [ModuleType.TODOS]: {
    type: ModuleType.TODOS,
    label: '待辦',
    icon: 'ordered-list',
    route: 'todos',
    description: '個人待辦事項'
  },
  [ModuleType.CHECKLISTS]: {
    type: ModuleType.CHECKLISTS,
    label: '檢查清單',
    icon: 'audit',
    route: 'checklists',
    description: '檢查清單管理'
  },
  [ModuleType.ISSUES]: {
    type: ModuleType.ISSUES,
    label: '問題',
    icon: 'bug',
    route: 'issues',
    description: '問題追蹤'
  }
};

@Injectable({
  providedIn: 'root'
})
export class BlueprintContextService {
  private readonly blueprintService = inject(BlueprintService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // === Private State ===
  private readonly blueprintState = signal<BlueprintBusinessModel | null>(null);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly activeModuleState = signal<ModuleType | null>(null);

  // === Public Readonly Signals ===

  /** 當前藍圖 | Current blueprint */
  readonly blueprint = this.blueprintState.asReadonly();

  /** 載入中 | Loading state */
  readonly loading = this.loadingState.asReadonly();

  /** 錯誤訊息 | Error message */
  readonly error = this.errorState.asReadonly();

  /** 當前選中的模組 | Currently active module */
  readonly activeModule = this.activeModuleState.asReadonly();

  // === Computed Signals ===

  /** 藍圖 ID | Blueprint ID */
  readonly blueprintId = computed(() => this.blueprint()?.id ?? null);

  /** 藍圖名稱 | Blueprint name */
  readonly blueprintName = computed(() => this.blueprint()?.name ?? '');

  /** 啟用的模組列表 | List of enabled modules */
  readonly enabledModules = computed(() => this.blueprint()?.enabled_modules ?? []);

  /** 啟用的模組配置 | Enabled module configurations */
  readonly enabledModuleConfigs = computed(() => {
    const enabled = this.enabledModules();
    return enabled
      .map(type => MODULE_CONFIGS[type])
      .filter((config): config is ModuleConfig => config !== undefined);
  });

  /** 是否有藍圖載入 | Whether a blueprint is loaded */
  readonly hasBlueprint = computed(() => this.blueprint() !== null);

  /** 是否為公開藍圖 | Whether the blueprint is public */
  readonly isPublic = computed(() => this.blueprint()?.is_public ?? false);

  /** 藍圖擁有者 ID | Blueprint owner ID */
  readonly ownerId = computed(() => this.blueprint()?.owner_id ?? null);

  /** 檢查模組是否啟用 | Check if a module is enabled */
  isModuleEnabled(moduleType: ModuleType): boolean {
    return this.enabledModules().includes(moduleType);
  }

  /** 取得模組配置 | Get module configuration */
  getModuleConfig(moduleType: ModuleType): ModuleConfig | undefined {
    return MODULE_CONFIGS[moduleType];
  }

  constructor() {
    // 監聽路由變化,自動更新 activeModule
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => this.extractModuleFromUrl(event.urlAfterRedirects)),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(moduleType => {
      this.activeModuleState.set(moduleType);
    });
  }

  // === Public Methods ===

  /**
   * 載入藍圖
   * Load blueprint by ID
   */
  async loadBlueprint(blueprintId: string): Promise<BlueprintBusinessModel | null> {
    if (!blueprintId) {
      this.errorState.set('Blueprint ID is required');
      return null;
    }

    // 如果已經載入相同的藍圖,直接返回
    if (this.blueprintId() === blueprintId && this.blueprint()) {
      return this.blueprint();
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const blueprint = await this.blueprintService.findById(blueprintId);

      if (!blueprint) {
        this.errorState.set('Blueprint not found');
        this.blueprintState.set(null);
        return null;
      }

      this.blueprintState.set(blueprint);
      console.log('[BlueprintContextService] Blueprint loaded:', blueprint.name);
      return blueprint;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load blueprint';
      this.errorState.set(message);
      console.error('[BlueprintContextService] Load failed:', error);
      return null;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 重新載入當前藍圖
   * Reload current blueprint
   */
  async reloadBlueprint(): Promise<BlueprintBusinessModel | null> {
    const id = this.blueprintId();
    if (!id) {
      console.warn('[BlueprintContextService] No blueprint to reload');
      return null;
    }
    // 強制重新載入
    this.blueprintState.set(null);
    return this.loadBlueprint(id);
  }

  /**
   * 清除藍圖上下文
   * Clear blueprint context
   */
  clearContext(): void {
    this.blueprintState.set(null);
    this.activeModuleState.set(null);
    this.errorState.set(null);
    this.loadingState.set(false);
    console.log('[BlueprintContextService] Context cleared');
  }

  /**
   * 設置活躍模組
   * Set active module
   */
  setActiveModule(moduleType: ModuleType | null): void {
    if (moduleType && !this.isModuleEnabled(moduleType)) {
      console.warn('[BlueprintContextService] Module not enabled:', moduleType);
      return;
    }
    this.activeModuleState.set(moduleType);
  }

  /**
   * 導航到模組
   * Navigate to module
   */
  navigateToModule(moduleType: ModuleType): void {
    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      console.warn('[BlueprintContextService] No blueprint loaded');
      return;
    }

    if (!this.isModuleEnabled(moduleType)) {
      console.warn('[BlueprintContextService] Module not enabled:', moduleType);
      return;
    }

    const config = MODULE_CONFIGS[moduleType];
    if (config) {
      this.router.navigate(['/blueprint', blueprintId, 'workspace', config.route]);
    }
  }

  /**
   * 取得模組路由路徑
   * Get module route path
   */
  getModuleRoutePath(moduleType: ModuleType): string {
    const blueprintId = this.blueprintId();
    const config = MODULE_CONFIGS[moduleType];
    if (blueprintId && config) {
      return `/blueprint/${blueprintId}/workspace/${config.route}`;
    }
    return '';
  }

  /**
   * 更新藍圖啟用的模組
   * Update blueprint enabled modules
   */
  async updateEnabledModules(modules: ModuleType[]): Promise<boolean> {
    const blueprint = this.blueprint();
    if (!blueprint) {
      console.warn('[BlueprintContextService] No blueprint to update');
      return false;
    }

    try {
      const updated = await this.blueprintService.updateBlueprint(blueprint.id, {
        enabledModules: modules
      });
      this.blueprintState.set(updated);
      return true;
    } catch (error) {
      console.error('[BlueprintContextService] Failed to update modules:', error);
      return false;
    }
  }

  // === Private Methods ===

  /**
   * 從 URL 中提取模組類型
   * Extract module type from URL
   */
  private extractModuleFromUrl(url: string): ModuleType | null {
    // URL pattern: /blueprint/:id/workspace/:module
    const match = url.match(/\/blueprint\/[^/]+\/workspace\/([^/?]+)/);
    if (!match) return null;

    const moduleRoute = match[1];
    const entry = Object.entries(MODULE_CONFIGS).find(
      ([, config]) => config.route === moduleRoute
    );

    return entry ? (entry[0] as ModuleType) : null;
  }
}
