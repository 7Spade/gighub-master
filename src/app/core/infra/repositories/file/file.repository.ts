/**
 * File Repository
 *
 * 檔案資料存取層
 * File data access layer
 *
 * Provides CRUD operations for the files and file_shares tables using Supabase client.
 * Uses Angular 20 inject() function for modern dependency injection.
 *
 * Features:
 * - Modern (Modernization): Angular 20 inject(), RxJS operators
 * - Enterprise-ready (Enterprise-readiness): Comprehensive error handling
 * - Structured (Structured): Clear method organization
 * - High Availability (Reliability): Null-safe operations
 * - Security (Security): RLS-aware queries
 * - Scalability (Scalability): Pagination support
 * - Traceability (Auditing): Soft delete support
 * - Maintainability (Maintainability): JSDoc documentation
 *
 * @module core/infra/repositories/file
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import {
  FileEntity,
  FileShare,
  FileStatus,
  FileQueryOptions,
  CreateFileRequest,
  UpdateFileRequest,
  CreateFolderRequest,
  CreateFileShareRequest
} from '../../types/file';

@Injectable({
  providedIn: 'root'
})
export class FileRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Query Methods (查詢方法)
  // ============================================================================

  /**
   * 根據 ID 查詢檔案
   * Find file by ID
   */
  findById(id: string): Observable<FileEntity | null> {
    return from(this.supabase.client.from('files').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[FileRepository] findById error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢所有檔案
   * Find all files by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<FileEntity[]> {
    return from(
      this.supabase.client
        .from('files')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('is_folder', { ascending: false })
        .order('file_name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as FileEntity[];
      })
    );
  }

  /**
   * 查詢資料夾內容
   * Find contents of a folder
   */
  findByFolder(blueprintId: string, folderId: string | null): Observable<FileEntity[]> {
    let query = this.supabase.client.from('files').select('*').eq('blueprint_id', blueprintId).is('deleted_at', null);

    if (folderId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', folderId);
    }

    query = query.order('is_folder', { ascending: false }).order('file_name', { ascending: true });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] findByFolder error:', error);
          return [];
        }
        return (data || []) as FileEntity[];
      })
    );
  }

  /**
   * 根據查詢選項查詢檔案
   * Find files with query options
   */
  findWithOptions(options: FileQueryOptions): Observable<FileEntity[]> {
    let query = this.supabase.client.from('files').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.parentFolderId !== undefined) {
      if (options.parentFolderId === null) {
        query = query.is('parent_folder_id', null);
      } else {
        query = query.eq('parent_folder_id', options.parentFolderId);
      }
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.mimeType) {
      if (Array.isArray(options.mimeType)) {
        query = query.in('mime_type', options.mimeType);
      } else {
        query = query.eq('mime_type', options.mimeType);
      }
    }

    if (options.foldersOnly) {
      query = query.eq('is_folder', true);
    }

    if (options.filesOnly) {
      query = query.eq('is_folder', false);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (options.searchKeyword) {
      query = query.or(`file_name.ilike.%${options.searchKeyword}%,display_name.ilike.%${options.searchKeyword}%`);
    }

    // Sorting
    const sortBy = options.sortBy || 'file_name';
    const sortDirection = options.sortDirection || 'asc';
    query = query.order('is_folder', { ascending: false }).order(sortBy, { ascending: sortDirection === 'asc' });

    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as FileEntity[];
      })
    );
  }

  /**
   * 獲取資料夾路徑 (麵包屑導航)
   * Get folder path (breadcrumb navigation)
   */
  getFolderPath(folderId: string): Observable<FileEntity[]> {
    const path: FileEntity[] = [];

    const fetchParent = async (id: string | null): Promise<FileEntity[]> => {
      if (!id) return path;

      const { data, error } = await this.supabase.client.from('files').select('*').eq('id', id).single();

      if (error || !data) return path;

      path.unshift(data as FileEntity);

      if (data.parent_folder_id) {
        return fetchParent(data.parent_folder_id);
      }

      return path;
    };

    return from(fetchParent(folderId));
  }

  // ============================================================================
  // CRUD Methods (增刪改查方法)
  // ============================================================================

  /**
   * 建立檔案記錄
   * Create a file record
   */
  create(request: CreateFileRequest, uploadedBy: string): Observable<FileEntity | null> {
    return from(
      this.supabase.client
        .from('files')
        .insert({
          blueprint_id: request.blueprint_id,
          storage_path: request.storage_path,
          file_name: request.file_name,
          display_name: request.display_name || request.file_name,
          mime_type: request.mime_type || null,
          file_size: request.file_size || null,
          checksum: request.checksum || null,
          status: FileStatus.ACTIVE,
          metadata: request.metadata || {},
          parent_folder_id: request.parent_folder_id || null,
          is_folder: request.is_folder || false,
          uploaded_by: uploadedBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] create error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 建立資料夾
   * Create a folder
   */
  createFolder(request: CreateFolderRequest, createdBy: string): Observable<FileEntity | null> {
    return from(
      this.supabase.client
        .from('files')
        .insert({
          blueprint_id: request.blueprint_id,
          storage_path: '',
          file_name: request.folder_name,
          display_name: request.folder_name,
          mime_type: 'inode/directory',
          file_size: 0,
          status: FileStatus.ACTIVE,
          metadata: request.description ? { description: request.description } : {},
          parent_folder_id: request.parent_folder_id || null,
          is_folder: true,
          uploaded_by: createdBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] createFolder error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 更新檔案
   * Update a file
   */
  update(id: string, updates: UpdateFileRequest): Observable<FileEntity | null> {
    return from(
      this.supabase.client
        .from('files')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] update error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 移動檔案到新資料夾
   * Move file to a new folder
   */
  move(id: string, newParentFolderId: string | null): Observable<FileEntity | null> {
    return this.update(id, { parent_folder_id: newParentFolderId });
  }

  /**
   * 重命名檔案
   * Rename a file
   */
  rename(id: string, newName: string): Observable<FileEntity | null> {
    return this.update(id, { display_name: newName });
  }

  /**
   * 軟刪除檔案
   * Soft delete a file
   */
  softDelete(id: string): Observable<FileEntity | null> {
    return from(
      this.supabase.client
        .from('files')
        .update({
          status: FileStatus.DELETED,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] softDelete error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 恢復已刪除的檔案
   * Restore a deleted file
   */
  restore(id: string): Observable<FileEntity | null> {
    return from(
      this.supabase.client
        .from('files')
        .update({
          status: FileStatus.ACTIVE,
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] restore error:', error);
          return null;
        }
        return data as FileEntity;
      })
    );
  }

  /**
   * 永久刪除檔案記錄
   * Permanently delete a file record (use with caution)
   */
  permanentDelete(id: string): Observable<boolean> {
    return from(this.supabase.client.from('files').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FileRepository] permanentDelete error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // File Share Methods (檔案分享方法)
  // ============================================================================

  /**
   * 建立檔案分享
   * Create a file share
   */
  createShare(request: CreateFileShareRequest, createdBy: string): Observable<FileShare | null> {
    const shareLink = request.create_share_link ? this.generateShareLink() : null;

    return from(
      this.supabase.client
        .from('file_shares')
        .insert({
          file_id: request.file_id,
          shared_with_account_id: request.shared_with_account_id || null,
          shared_with_team_id: request.shared_with_team_id || null,
          can_edit: request.can_edit || false,
          expires_at: request.expires_at || null,
          share_link: shareLink,
          created_by: createdBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] createShare error:', error);
          return null;
        }
        return data as FileShare;
      })
    );
  }

  /**
   * 查詢檔案的所有分享
   * Find all shares for a file
   */
  findSharesByFile(fileId: string): Observable<FileShare[]> {
    return from(this.supabase.client.from('file_shares').select('*').eq('file_id', fileId).order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] findSharesByFile error:', error);
          return [];
        }
        return (data || []) as FileShare[];
      })
    );
  }

  /**
   * 根據分享連結查詢
   * Find share by link
   */
  findShareByLink(shareLink: string): Observable<FileShare | null> {
    return from(this.supabase.client.from('file_shares').select('*').eq('share_link', shareLink).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[FileRepository] findShareByLink error:', error);
          return null;
        }
        return data as FileShare;
      })
    );
  }

  /**
   * 刪除檔案分享
   * Delete a file share
   */
  deleteShare(id: string): Observable<boolean> {
    return from(this.supabase.client.from('file_shares').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FileRepository] deleteShare error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Statistics Methods (統計方法)
  // ============================================================================

  /**
   * 計算藍圖的檔案總數
   * Count total files in blueprint
   */
  countByBlueprint(blueprintId: string): Observable<number> {
    return from(
      this.supabase.client
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('blueprint_id', blueprintId)
        .eq('is_folder', false)
        .is('deleted_at', null)
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          this.logger.error('[FileRepository] countByBlueprint error:', error);
          return 0;
        }
        return count || 0;
      })
    );
  }

  /**
   * 計算藍圖的總檔案大小
   * Calculate total file size in blueprint
   */
  getTotalSize(blueprintId: string): Observable<number> {
    return from(
      this.supabase.client.from('files').select('file_size').eq('blueprint_id', blueprintId).eq('is_folder', false).is('deleted_at', null)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] getTotalSize error:', error);
          return 0;
        }
        return (data || []).reduce((sum, file) => sum + (file.file_size || 0), 0);
      })
    );
  }

  /**
   * 計算資料夾內檔案數
   * Count files in folder
   */
  countInFolder(folderId: string): Observable<number> {
    return from(
      this.supabase.client
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('parent_folder_id', folderId)
        .is('deleted_at', null)
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          this.logger.error('[FileRepository] countInFolder error:', error);
          return 0;
        }
        return count || 0;
      })
    );
  }

  // ============================================================================
  // Helper Methods (輔助方法)
  // ============================================================================

  /**
   * 生成分享連結碼
   * Generate share link code
   */
  private generateShareLink(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 檢查資料夾是否為空
   * Check if folder is empty
   */
  isFolderEmpty(folderId: string): Observable<boolean> {
    return this.countInFolder(folderId).pipe(map(count => count === 0));
  }

  /**
   * 檢查檔案名稱是否在同一資料夾內重複
   * Check if file name exists in the same folder
   */
  isNameDuplicate(blueprintId: string, fileName: string, parentFolderId: string | null, excludeId?: string): Observable<boolean> {
    let query = this.supabase.client
      .from('files')
      .select('id')
      .eq('blueprint_id', blueprintId)
      .eq('file_name', fileName)
      .is('deleted_at', null);

    if (parentFolderId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentFolderId);
    }

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FileRepository] isNameDuplicate error:', error);
          return false;
        }
        return (data || []).length > 0;
      })
    );
  }
}
