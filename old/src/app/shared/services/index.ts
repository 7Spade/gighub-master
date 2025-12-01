/**
 * Shared Services Module
 *
 * This module serves as a central export point for all shared services.
 * Services in this layer contain business logic and coordinate between repositories and facades.
 *
 * 服務層包含業務邏輯，協調 Repositories 和 Facades 之間的互動
 *
 * Example Service Structure:
 *
 * ```typescript
 * import { Injectable, inject, signal, computed } from '@angular/core';
 * import { Observable, firstValueFrom } from 'rxjs';
 * import { SomeRepository } from '@core';
 * import { SomeModel } from '@shared';
 *
 * @Injectable({ providedIn: 'root' })
 * export class SomeService {
 *   private readonly repository = inject(SomeRepository);
 *
 *   // State management with Signals
 *   private itemsState = signal<SomeModel[]>([]);
 *   private loadingState = signal<boolean>(false);
 *   private errorState = signal<string | null>(null);
 *
 *   // Expose readonly signals
 *   readonly items = this.itemsState.asReadonly();
 *   readonly loading = this.loadingState.asReadonly();
 *   readonly error = this.errorState.asReadonly();
 *
 *   // Computed signals
 *   readonly itemCount = computed(() => this.items().length);
 *
 *   // Business logic methods
 *   async loadItems(): Promise<void> {
 *     this.loadingState.set(true);
 *     this.errorState.set(null);
 *
 *     try {
 *       const items = await firstValueFrom(this.repository.findAll());
 *       this.itemsState.set(items);
 *     } catch (error) {
 *       this.errorState.set(error instanceof Error ? error.message : 'Unknown error');
 *       throw error;
 *     } finally {
 *       this.loadingState.set(false);
 *     }
 *   }
 * }
 * ```
 *
 * Service Layer Guidelines:
 * - Use Angular Signals for state management
 * - Inject dependencies using inject() function
 * - Expose ReadonlySignal to components
 * - Handle loading and error states
 * - Use async/await with firstValueFrom for Observables
 * - Test coverage should be ≥80%
 */

// Export your services here
// Example: export * from './feature/feature.service';

// Account services (includes user, organization, team, bot via account/index.ts)
export * from './account';

// NOTE: Blueprint, Workspace, and Task services have been migrated to features/blueprint module
// Import from 'src/app/features/blueprint/data-access/services' or use BlueprintStore/TaskStore as facades

// Menu management service
export * from './menu';

// Error handling service
export * from './error-handler.service';

// Temporary export to make this a valid module
export const SERVICES_MODULE = 'services';
