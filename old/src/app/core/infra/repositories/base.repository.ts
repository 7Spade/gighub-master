/**
 * Base Repository
 *
 * 基礎 Repository 類，提供通用的 CRUD 操作
 * Base Repository class providing generic CRUD operations
 *
 * Features:
 * - Generic CRUD operations (Create, Read, Update, Delete)
 * - snake_case ↔ camelCase automatic conversion
 * - Type-safe database operations
 * - RxJS Observable support
 * - Query options support (filters, sorting, pagination)
 * - Error handling
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class UserRepository extends BaseRepository<User, UserInsert, UserUpdate> {
 *   protected tableName = 'users';
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from '../supabase/supabase.service';
import { QueryOptions, PaginatedResponse } from '../types/supabase.types';

/**
 * 基礎 Repository 抽象類
 * Base Repository abstract class
 *
 * @template TEntity - Entity type (Row)
 * @template TInsert - Insert type
 * @template TUpdate - Update type
 */
@Injectable()
export abstract class BaseRepository<TEntity, TInsert, TUpdate> {
  protected readonly supabaseService = inject(SupabaseService);

  /**
   * 資料表名稱（必須在子類中定義）
   * Table name (must be defined in subclass)
   */
  protected abstract tableName: string;

  /**
   * 查詢所有記錄
   * Find all records
   *
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<TEntity[]>} Array of entities
   */
  findAll(options?: QueryOptions): Observable<TEntity[]> {
    const client = this.supabaseService.getClient();
    let query = client.from(this.tableName).select(options?.select || '*');

    // 應用過濾條件
    // Apply filters
    if (options?.filters) {
      query = this.applyFilters(query, options.filters);
    }

    // 應用排序
    // Apply sorting
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true
      });
    }

    // 應用分頁
    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []) as TEntity[];
      }),
      catchError(error => {
        console.error(`Error in findAll for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 根據 ID 查詢單一記錄
   * Find single record by ID
   *
   * @param {string} id - Record ID
   * @param {string} [select] - Select clause
   * @returns {Observable<TEntity | null>} Entity or null
   */
  findById(id: string, select?: string): Observable<TEntity | null> {
    const client = this.supabaseService.getClient();

    return from(
      client
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return null;
          }
          throw error;
        }
        return data as TEntity;
      }),
      catchError(error => {
        console.error(`Error in findById for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 根據條件查詢單一記錄
   * Find single record by conditions
   *
   * @param {Record<string, any>} filters - Filter conditions
   * @param {string} [select] - Select clause
   * @returns {Observable<TEntity | null>} Entity or null
   */
  findOne(filters: Record<string, any>, select?: string): Observable<TEntity | null> {
    const client = this.supabaseService.getClient();
    let query = client.from(this.tableName).select(select || '*');

    // 應用過濾條件
    // Apply filters
    query = this.applyFilters(query, filters);

    return from(query.single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return null;
          }
          throw error;
        }
        return data as TEntity;
      }),
      catchError(error => {
        console.error(`Error in findOne for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 創建新記錄
   * Create new record
   *
   * @param {TInsert} data - Data to insert
   * @returns {Observable<TEntity>} Created entity
   */
  create(data: TInsert): Observable<TEntity> {
    const client = this.supabaseService.getClient();
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = this.convertKeysToSnakeCase(data as Record<string, any>);

    return from(client.from(this.tableName).insert(snakeCaseData).select().single()).pipe(
      map(({ data: inserted, error }) => {
        if (error) {
          throw error;
        }
        return inserted as TEntity;
      }),
      catchError(error => {
        console.error(`Error in create for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 批量創建記錄
   * Create multiple records
   *
   * @param {TInsert[]} data - Array of data to insert
   * @returns {Observable<TEntity[]>} Created entities
   */
  createMany(data: TInsert[]): Observable<TEntity[]> {
    const client = this.supabaseService.getClient();
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = data.map(item => this.convertKeysToSnakeCase(item as Record<string, any>));

    return from(client.from(this.tableName).insert(snakeCaseData).select()).pipe(
      map(({ data: inserted, error }) => {
        if (error) {
          throw error;
        }
        return (inserted || []) as TEntity[];
      }),
      catchError(error => {
        console.error(`Error in createMany for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 更新記錄
   * Update record
   *
   * @param {string} id - Record ID
   * @param {TUpdate} data - Data to update
   * @returns {Observable<TEntity>} Updated entity
   */
  update(id: string, data: TUpdate): Observable<TEntity> {
    const client = this.supabaseService.getClient();
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = this.convertKeysToSnakeCase(data as Record<string, any>);

    return from(client.from(this.tableName).update(snakeCaseData).eq('id', id).select().single()).pipe(
      map(({ data: updated, error }) => {
        if (error) {
          throw error;
        }
        return updated as TEntity;
      }),
      catchError(error => {
        console.error(`Error in update for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 根據條件更新記錄
   * Update records by conditions
   *
   * @param {Record<string, any>} filters - Filter conditions
   * @param {TUpdate} data - Data to update
   * @returns {Observable<TEntity[]>} Updated entities
   */
  updateBy(filters: Record<string, any>, data: TUpdate): Observable<TEntity[]> {
    const client = this.supabaseService.getClient();
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = this.convertKeysToSnakeCase(data as Record<string, any>);
    let query = client.from(this.tableName).update(snakeCaseData);

    // 應用過濾條件
    // Apply filters
    query = this.applyFilters(query, filters);

    return from(query.select()).pipe(
      map(({ data: updated, error }) => {
        if (error) {
          throw error;
        }
        return (updated || []) as TEntity[];
      }),
      catchError(error => {
        console.error(`Error in updateBy for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 刪除記錄
   * Delete record
   *
   * @param {string} id - Record ID
   * @returns {Observable<void>} Void
   */
  delete(id: string): Observable<void> {
    const client = this.supabaseService.getClient();

    return from(client.from(this.tableName).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError(error => {
        console.error(`Error in delete for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 根據條件刪除記錄
   * Delete records by conditions
   *
   * @param {Record<string, any>} filters - Filter conditions
   * @returns {Observable<void>} Void
   */
  deleteBy(filters: Record<string, any>): Observable<void> {
    const client = this.supabaseService.getClient();
    let query = client.from(this.tableName).delete();

    // 應用過濾條件
    // Apply filters
    query = this.applyFilters(query, filters);

    return from(query).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError(error => {
        console.error(`Error in deleteBy for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 計數記錄數量
   * Count records
   *
   * @param {Record<string, any>} [filters] - Filter conditions
   * @returns {Observable<number>} Record count
   */
  count(filters?: Record<string, any>): Observable<number> {
    const client = this.supabaseService.getClient();
    let query = client.from(this.tableName).select('*', { count: 'exact', head: true });

    // 應用過濾條件
    // Apply filters
    if (filters) {
      query = this.applyFilters(query, filters);
    }

    return from(query).pipe(
      map(({ count, error }) => {
        if (error) {
          throw error;
        }
        return count || 0;
      }),
      catchError(error => {
        console.error(`Error in count for ${this.tableName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 應用過濾條件到查詢
   * Apply filters to query
   *
   * @private
   * @param {any} query - Query builder
   * @param {Record<string, any>} filters - Filter conditions
   * @returns {any} Modified query
   */
  private applyFilters(query: any, filters: Record<string, any>): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // 將 camelCase 轉換為 snake_case
        // Convert camelCase to snake_case
        const snakeKey = this.toSnakeCase(key);

        if (Array.isArray(value)) {
          query = query.in(snakeKey, value);
        } else {
          query = query.eq(snakeKey, value);
        }
      }
    });
    return query;
  }

  /**
   * 將 camelCase 轉換為 snake_case
   * Convert camelCase to snake_case
   *
   * @private
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 將 snake_case 轉換為 camelCase
   * Convert snake_case to camelCase
   *
   * @private
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 將物件的所有 key 從 camelCase 轉換為 snake_case
   * Convert all object keys from camelCase to snake_case
   *
   * @private
   * @param {Record<string, any>} obj - Object with camelCase keys
   * @returns {Record<string, any>} Object with snake_case keys
   */
  private convertKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const snakeKey = this.toSnakeCase(key);
        result[snakeKey] = value;
      }
    }
    return result;
  }
}
