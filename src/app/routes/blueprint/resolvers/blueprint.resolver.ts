/**
 * Blueprint Resolver
 *
 * 藍圖路由解析器
 * Blueprint Route Resolver
 *
 * Pre-fetches blueprint data before navigating to blueprint workspace routes.
 *
 * @module routes/blueprint/resolvers
 */

import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { BlueprintContextService } from '@shared';
import { BlueprintBusinessModel } from '../../../shared/models/blueprint';

/**
 * Blueprint resolver function
 *
 * Loads blueprint data before route activation.
 * Redirects to 404 if blueprint not found.
 */
export const blueprintResolver: ResolveFn<BlueprintBusinessModel | null> = async (route) => {
  const blueprintContextService = inject(BlueprintContextService);
  const router = inject(Router);

  const blueprintId = route.paramMap.get('id');

  if (!blueprintId) {
    console.error('[blueprintResolver] No blueprint ID in route');
    router.navigate(['/exception/404']);
    return null;
  }

  try {
    const blueprint = await blueprintContextService.loadBlueprint(blueprintId);

    if (!blueprint) {
      console.error('[blueprintResolver] Blueprint not found:', blueprintId);
      router.navigate(['/exception/404']);
      return null;
    }

    console.log('[blueprintResolver] Blueprint resolved:', blueprint.name);
    return blueprint;
  } catch (error) {
    console.error('[blueprintResolver] Failed to resolve blueprint:', error);
    router.navigate(['/exception/500']);
    return null;
  }
};

/**
 * Blueprint title resolver function
 *
 * Returns the blueprint name for the page title.
 */
export const blueprintTitleResolver: ResolveFn<string> = async (route) => {
  const blueprintContextService = inject(BlueprintContextService);

  const blueprintId = route.paramMap.get('id');
  if (!blueprintId) return '藍圖';

  // If already loaded, use cached data
  const current = blueprintContextService.blueprint();
  if (current?.id === blueprintId) {
    return current.name;
  }

  // Otherwise load and return name
  const blueprint = await blueprintContextService.loadBlueprint(blueprintId);
  return blueprint?.name ?? '藍圖';
};
