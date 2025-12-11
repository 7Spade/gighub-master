/**
 * Module Enabled Guard
 *
 * 模組啟用守衛
 * Module enabled guard for blueprint routes
 *
 * Checks if a specific module is enabled for the current blueprint.
 * If the module is disabled, redirects to the blueprint overview page
 * with a query parameter indicating which module was disabled.
 *
 * Usage in route configuration:
 * ```typescript
 * {
 *   path: 'tasks',
 *   canActivate: [moduleEnabledGuard],
 *   data: {
 *     requiredModule: ModuleType.TASKS
 *   }
 * }
 * ```
 *
 * @module shared/guards
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ModuleType } from '@core';

import { BlueprintFacade } from '../facades/blueprint/blueprint.facade';

/**
 * Guard function that checks if a module is enabled
 */
export const moduleEnabledGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const blueprintFacade = inject(BlueprintFacade);
  const router = inject(Router);

  // Get required module from route data
  const requiredModule = route.data['requiredModule'] as ModuleType;
  const blueprintId = route.paramMap.get('id');

  // If no module requirement specified, allow access
  if (!requiredModule || !blueprintId) {
    console.log('[ModuleEnabledGuard] No module requirement, allowing access');
    return true;
  }

  try {
    console.log('[ModuleEnabledGuard] Checking module access:', { blueprintId, requiredModule });

    // Load blueprint data
    const blueprint = await blueprintFacade.findById(blueprintId);

    if (!blueprint) {
      console.warn('[ModuleEnabledGuard] Blueprint not found, redirecting to list');
      return router.parseUrl('/blueprint/list');
    }

    // Check if module is enabled
    const enabledModules = blueprint.enabled_modules || [];
    const isModuleEnabled = enabledModules.includes(requiredModule);

    console.log('[ModuleEnabledGuard] Module check result:', {
      module: requiredModule,
      enabled: isModuleEnabled,
      enabledModules
    });

    if (!isModuleEnabled) {
      // Module is disabled, redirect to overview with message
      console.warn('[ModuleEnabledGuard] Module disabled, redirecting to overview');
      return router.parseUrl(`/blueprint/${blueprintId}/overview?moduleDisabled=${requiredModule}`);
    }

    // Module is enabled, allow access
    return true;
  } catch (error) {
    console.error('[ModuleEnabledGuard] Failed to check module status:', error);
    // On error, redirect to blueprint list for safety
    return router.parseUrl('/blueprint/list');
  }
};
