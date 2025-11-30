/**
 * Blueprint Store
 *
 * State management store for Blueprint feature
 * Acts as Facade layer providing unified API to components
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/data-access/stores/blueprint.store
 */

import { Injectable, inject } from '@angular/core';

import { BlueprintModel, CreateBlueprintRequest, UpdateBlueprintRequest } from '../../domain';
import { BlueprintService } from '../services';

/**
 * Blueprint Store (Facade)
 *
 * Provides unified API for Blueprint Container system
 * Note: In the new schema, blueprints serve as both templates AND workspaces
 */
@Injectable({ providedIn: 'root' })
export class BlueprintStore {
  private readonly blueprintService = inject(BlueprintService);

  // Expose Blueprint Service state
  readonly blueprints = this.blueprintService.blueprints;
  readonly selectedBlueprint = this.blueprintService.selectedBlueprint;
  readonly loading = this.blueprintService.loading;
  readonly error = this.blueprintService.error;
  readonly statistics = this.blueprintService.statistics;

  // Computed signals
  readonly activeBlueprints = this.blueprintService.activeBlueprints;
  readonly inactiveBlueprints = this.blueprintService.inactiveBlueprints;

  /**
   * Load blueprints by owner
   */
  async loadOwnerBlueprints(ownerId: string): Promise<void> {
    await this.blueprintService.loadBlueprintsByOwner(ownerId);
  }

  /**
   * Load public blueprints
   */
  async loadPublicBlueprints(): Promise<void> {
    await this.blueprintService.loadPublicBlueprints();
  }

  /**
   * Get blueprint by ID
   */
  async getBlueprint(id: string): Promise<BlueprintModel> {
    return this.blueprintService.getBlueprintById(id);
  }

  /**
   * Create new blueprint
   */
  async createBlueprint(request: CreateBlueprintRequest): Promise<BlueprintModel> {
    return this.blueprintService.createBlueprint(request);
  }

  /**
   * Update blueprint
   */
  async updateBlueprint(id: string, request: UpdateBlueprintRequest): Promise<BlueprintModel> {
    return this.blueprintService.updateBlueprint(id, request);
  }

  /**
   * Delete blueprint (soft delete)
   */
  async deleteBlueprint(id: string): Promise<void> {
    return this.blueprintService.deleteBlueprint(id);
  }

  /**
   * Deactivate blueprint
   */
  async deactivateBlueprint(id: string): Promise<BlueprintModel> {
    return this.blueprintService.deactivateBlueprint(id);
  }

  /**
   * Activate blueprint
   */
  async activateBlueprint(id: string): Promise<BlueprintModel> {
    return this.blueprintService.activateBlueprint(id);
  }

  /**
   * Search blueprints
   */
  async searchBlueprints(searchTerm: string): Promise<BlueprintModel[]> {
    return this.blueprintService.searchBlueprints(searchTerm);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.blueprintService.clearError();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.blueprintService.clearSelection();
  }
}
