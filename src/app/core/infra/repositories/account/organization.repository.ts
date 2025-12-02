/**
 * Organization Repository
 *
 * 組織資料存取層
 * Organization data access layer
 *
 * Provides CRUD operations for the organizations table using Supabase client.
 *
 * @module core/infra/repositories/account
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { Organization } from '../../types/account';

@Injectable({
  providedIn: 'root'
})
export class OrganizationRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據 ID 查詢組織
   * Find organization by ID
   */
  findById(id: string): Observable<Organization | null> {
    return from(this.supabase.client.from('organizations').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] findById error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }

  /**
   * 根據 slug 查詢組織
   * Find organization by slug
   */
  findBySlug(slug: string): Observable<Organization | null> {
    return from(this.supabase.client.from('organizations').select('*').eq('slug', slug).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] findBySlug error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }

  /**
   * 根據多個 ID 查詢組織
   * Find organizations by IDs
   */
  findByIds(ids: string[]): Observable<Organization[]> {
    if (ids.length === 0) {
      return from(Promise.resolve([]));
    }

    return from(this.supabase.client.from('organizations').select('*').in('id', ids).is('deleted_at', null)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] findByIds error:', error);
          return [];
        }
        return (data || []) as Organization[];
      })
    );
  }

  /**
   * 查詢所有組織
   * Find all organizations
   */
  findAll(): Observable<Organization[]> {
    return from(this.supabase.client.from('organizations').select('*').is('deleted_at', null).order('name')).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] findAll error:', error);
          return [];
        }
        return (data || []) as Organization[];
      })
    );
  }

  /**
   * 創建組織
   * Create organization
   */
  create(organization: Partial<Organization>): Observable<Organization | null> {
    return from(this.supabase.client.from('organizations').insert(organization).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] create error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }

  /**
   * 更新組織
   * Update organization
   */
  update(id: string, updates: Partial<Organization>): Observable<Organization | null> {
    return from(
      this.supabase.client
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[OrganizationRepository] update error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }

  /**
   * 軟刪除組織
   * Soft delete organization
   */
  softDelete(id: string): Observable<Organization | null> {
    return from(
      this.supabase.client
        .from('organizations')
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
          console.error('[OrganizationRepository] softDelete error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }

  /**
   * 恢復已刪除的組織
   * Restore deleted organization
   */
  restore(id: string): Observable<Organization | null> {
    return from(
      this.supabase.client
        .from('organizations')
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
          console.error('[OrganizationRepository] restore error:', error);
          return null;
        }
        return data as Organization;
      })
    );
  }
}
