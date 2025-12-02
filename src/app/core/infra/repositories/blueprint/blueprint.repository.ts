/**
 * Blueprint Repository
 *
 * 藍圖資料存取層
 * Blueprint data access layer
 *
 * Provides CRUD operations for the blueprints table using Supabase client.
 *
 * @module core/infra/repositories/blueprint
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { Blueprint, BlueprintQueryOptions } from '../../types/blueprint';

@Injectable({
  providedIn: 'root'
})
export class BlueprintRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據 ID 查詢藍圖
   * Find blueprint by ID
   */
  findById(id: string): Observable<Blueprint | null> {
    return from(this.supabase.client.from('blueprints').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findById error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }

  /**
   * 根據 slug 和 owner_id 查詢藍圖
   * Find blueprint by slug and owner
   */
  findBySlug(ownerId: string, slug: string): Observable<Blueprint | null> {
    return from(
      this.supabase.client.from('blueprints').select('*').eq('owner_id', ownerId).eq('slug', slug).is('deleted_at', null).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findBySlug error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }

  /**
   * 根據 owner_id 查詢藍圖列表
   * Find blueprints by owner
   */
  findByOwner(ownerId: string): Observable<Blueprint[]> {
    return from(this.supabase.client.from('blueprints').select('*').eq('owner_id', ownerId).is('deleted_at', null).order('name')).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findByOwner error:', error);
          return [];
        }
        return (data || []) as Blueprint[];
      })
    );
  }

  /**
   * 根據多個 ID 查詢藍圖
   * Find blueprints by IDs
   */
  findByIds(ids: string[]): Observable<Blueprint[]> {
    if (ids.length === 0) {
      return from(Promise.resolve([]));
    }

    return from(this.supabase.client.from('blueprints').select('*').in('id', ids).is('deleted_at', null)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findByIds error:', error);
          return [];
        }
        return (data || []) as Blueprint[];
      })
    );
  }

  /**
   * 根據查詢選項查詢藍圖
   * Find blueprints with options
   */
  findWithOptions(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    let query = this.supabase.client.from('blueprints').select('*');

    if (options.ownerId) {
      query = query.eq('owner_id', options.ownerId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    query = query.order('name');

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as Blueprint[];
      })
    );
  }

  /**
   * 查詢公開藍圖
   * Find public blueprints
   */
  findPublic(): Observable<Blueprint[]> {
    return from(this.supabase.client.from('blueprints').select('*').eq('is_public', true).is('deleted_at', null).order('name')).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] findPublic error:', error);
          return [];
        }
        return (data || []) as Blueprint[];
      })
    );
  }

  /**
   * 創建藍圖
   * Create blueprint
   */
  create(blueprint: Partial<Blueprint>): Observable<Blueprint | null> {
    return from(this.supabase.client.from('blueprints').insert(blueprint).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] create error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }

  /**
   * 更新藍圖
   * Update blueprint
   */
  update(id: string, updates: Partial<Blueprint>): Observable<Blueprint | null> {
    return from(
      this.supabase.client
        .from('blueprints')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] update error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }

  /**
   * 軟刪除藍圖
   * Soft delete blueprint
   */
  softDelete(id: string): Observable<Blueprint | null> {
    return from(
      this.supabase.client
        .from('blueprints')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] softDelete error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }

  /**
   * 恢復已刪除的藍圖
   * Restore deleted blueprint
   */
  restore(id: string): Observable<Blueprint | null> {
    return from(
      this.supabase.client
        .from('blueprints')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[BlueprintRepository] restore error:', error);
          return null;
        }
        return data as Blueprint;
      })
    );
  }
}
