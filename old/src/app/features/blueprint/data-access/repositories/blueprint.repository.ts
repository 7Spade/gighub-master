/**
 * Blueprint Repository
 *
 * Repository for Blueprint Container data access layer
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/data-access/repositories/blueprint.repository
 */

import { Injectable } from '@angular/core';
import { BaseRepository, QueryOptions } from '@core';
import { Observable } from 'rxjs';

import { Blueprint, BlueprintInsert, BlueprintUpdate } from '../../domain';

/**
 * Blueprint Repository
 *
 * Handles data access for blueprints with automatic camelCase conversion
 */
@Injectable({ providedIn: 'root' })
export class BlueprintRepository extends BaseRepository<Blueprint, BlueprintInsert, BlueprintUpdate> {
  protected tableName = 'blueprints';

  /**
   * Find blueprints by owner
   *
   * @param {string} ownerId - Owner ID (user or organization)
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Blueprint[]>} Array of blueprints
   */
  findByOwner(ownerId: string, options?: QueryOptions): Observable<Blueprint[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        ownerId
      }
    });
  }

  /**
   * Find blueprints by status
   *
   * @param {string} status - Blueprint status (active, inactive, suspended, deleted)
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Blueprint[]>} Array of blueprints
   */
  findByStatus(status: string, options?: QueryOptions): Observable<Blueprint[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        status
      }
    });
  }

  /**
   * Find public blueprints (is_public = true)
   *
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Blueprint[]>} Array of public blueprints
   */
  findPublicBlueprints(options?: QueryOptions): Observable<Blueprint[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        isPublic: true,
        status: 'active'
      }
    });
  }

  /**
   * Find blueprints by slug
   *
   * @param {string} slug - Blueprint slug (unique identifier)
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Blueprint[]>} Array of blueprints matching slug
   */
  findBySlug(slug: string, options?: QueryOptions): Observable<Blueprint[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        slug
      }
    });
  }
}
