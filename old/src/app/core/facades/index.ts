/**
 * Core Facades Module
 *
 * This module serves as a central export point for all facade classes.
 * Facades provide a unified interface for business modules and coordinate multiple services.
 *
 * Facades 層提供業務模組的統一對外接口，協調多個 Services
 *
 * Example Facade Structure:
 *
 * ```typescript
 * import { Injectable, inject, OnDestroy } from '@angular/core';
 * import { SomeService } from '@shared';
 *
 * // Some Feature Facade
 * //
 * // {功能名稱}模組門面，統一對外接口
 * // Coordinates SomeService and related services
 * @Injectable({ providedIn: 'root' })
 * export class SomeFacade implements OnDestroy {
 *   private readonly someService = inject(SomeService);
 *
 *   // Expose service state through facade
 *   readonly items = this.someService.items;
 *   readonly loading = this.someService.loading;
 *   readonly error = this.someService.error;
 *   readonly itemCount = this.someService.itemCount;
 *
 *   // Business methods (delegate to service)
 *   async loadItems(): Promise<void> {
 *     try {
 *       await this.someService.loadItems();
 *     } catch (error) {
 *       // Handle errors at facade level if needed
 *       console.error('Error loading items:', error);
 *       throw error;
 *     }
 *   }
 *
 *   async createItem(data: CreateItemRequest): Promise<void> {
 *     try {
 *       await this.someService.createItem(data);
 *
 *       // Can coordinate with other services here
 *       // await this.activityService.logActivity({...});
 *     } catch (error) {
 *       console.error('Error creating item:', error);
 *       throw error;
 *     }
 *   }
 *
 *   ngOnDestroy(): void {
 *     // Cleanup resources if needed
 *   }
 * }
 * ```
 *
 * Facade Layer Guidelines:
 * - Use @Injectable({ providedIn: 'root' })
 * - Coordinate multiple services
 * - Expose unified Signal state interface
 * - Integrate error handling
 * - Integrate activity logging (if needed)
 * - Delegate business logic to services
 * - Test coverage should be ≥80%
 */

// Export your facades here
// Example: export * from './some.facade';

export * from './account';

// NOTE: Blueprint and Task facades have been migrated to features/blueprint module
// Import BlueprintStore and TaskStore from 'src/app/features/blueprint/data-access/stores' instead

// Temporary export to make this a valid module
export const FACADES_MODULE = 'facades';
