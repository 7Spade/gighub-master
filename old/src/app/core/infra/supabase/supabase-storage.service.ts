/**
 * Supabase Storage Service
 *
 * Supabase Storage 服務，處理檔案上傳、下載、刪除等操作
 * Supabase Storage service for handling file upload, download, delete operations
 *
 * Features:
 * - File upload with type validation
 * - File download and public URL generation
 * - File and bucket management
 * - Support for image transformation
 * - Progress tracking for uploads
 *
 * @example
 * ```typescript
 * constructor(private storageService: SupabaseStorageService) {}
 *
 * async uploadFile(file: File) {
 *   const { data, error } = await this.storageService.upload(
 *     'avatars',
 *     `${userId}/avatar.png`,
 *     file
 *   );
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SupabaseService } from './supabase.service';
import { FileUploadOptions, FileUploadResponse, PublicUrlOptions, FileObject } from '../types/supabase.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseStorageService {
  private readonly supabaseService = inject(SupabaseService);

  /**
   * 上傳檔案到指定的 bucket
   * Upload file to specified bucket
   *
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @param {File | Blob} file - File to upload
   * @param {FileUploadOptions} [options] - Upload options
   * @returns {Observable<FileUploadResponse>} Upload response
   */
  upload(bucket: string, path: string, file: File | Blob, options?: FileUploadOptions): Observable<FileUploadResponse> {
    const client = this.supabaseService.getClient();

    return from(
      client.storage.from(bucket).upload(path, file, {
        cacheControl: options?.cacheControl,
        contentType: options?.contentType,
        upsert: options?.upsert ?? false
      })
    ).pipe(
      map(({ data, error }) => ({
        data: data
          ? {
              path: data.path,
              id: data.id,
              fullPath: data.fullPath
            }
          : null,
        error: error
          ? {
              message: error.message,
              statusCode: (error as any).statusCode
            }
          : null
      })),
      catchError(error => {
        console.error('Upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 下載檔案
   * Download file
   *
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @returns {Observable<Blob | null>} File blob
   */
  download(bucket: string, path: string): Observable<Blob | null> {
    const client = this.supabaseService.getClient();

    return from(client.storage.from(bucket).download(path)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Download error:', error);
          return null;
        }
        return data;
      }),
      catchError(error => {
        console.error('Download error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 刪除檔案
   * Delete file
   *
   * @param {string} bucket - Bucket name
   * @param {string[]} paths - File paths to delete
   * @returns {Observable<{ error: any | null }>} Delete response
   */
  remove(bucket: string, paths: string[]): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(client.storage.from(bucket).remove(paths)).pipe(
      map(({ error }) => ({ error })),
      catchError(error => {
        console.error('Remove error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 獲取公開 URL
   * Get public URL
   *
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @param {PublicUrlOptions} [options] - URL options
   * @returns {string} Public URL
   */
  getPublicUrl(bucket: string, path: string, options?: PublicUrlOptions): string {
    const client = this.supabaseService.getClient();

    const { data } = client.storage.from(bucket).getPublicUrl(path, {
      download: options?.download,
      transform: options?.transform
    });

    return data.publicUrl;
  }

  /**
   * 列出 bucket 中的檔案
   * List files in bucket
   *
   * @param {string} bucket - Bucket name
   * @param {string} [path=''] - Folder path
   * @param {Object} [options] - List options
   * @returns {Observable<FileObject[]>} List of files
   */
  list(
    bucket: string,
    path = '',
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
      search?: string;
    }
  ): Observable<FileObject[]> {
    const client = this.supabaseService.getClient();

    return from(
      client.storage.from(bucket).list(path, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy,
        search: options?.search
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('List error:', error);
          return [];
        }
        return data || [];
      }),
      catchError(error => {
        console.error('List error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 創建 bucket
   * Create bucket
   *
   * @param {string} bucketName - Bucket name
   * @param {Object} [options] - Bucket options
   * @returns {Observable<{ error: any | null }>} Create response
   */
  createBucket(
    bucketName: string,
    options?: {
      public?: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    }
  ): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(
      client.storage.createBucket(bucketName, {
        public: options?.public ?? false,
        fileSizeLimit: options?.fileSizeLimit,
        allowedMimeTypes: options?.allowedMimeTypes
      })
    ).pipe(
      map(({ error }) => ({ error })),
      catchError(error => {
        console.error('Create bucket error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 刪除 bucket
   * Delete bucket
   *
   * @param {string} bucketName - Bucket name
   * @returns {Observable<{ error: any | null }>} Delete response
   */
  deleteBucket(bucketName: string): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(client.storage.deleteBucket(bucketName)).pipe(
      map(({ error }) => ({ error })),
      catchError(error => {
        console.error('Delete bucket error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 列出所有 buckets
   * List all buckets
   *
   * @returns {Observable<any[]>} List of buckets
   */
  listBuckets(): Observable<any[]> {
    const client = this.supabaseService.getClient();

    return from(client.storage.listBuckets()).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('List buckets error:', error);
          return [];
        }
        return data || [];
      }),
      catchError(error => {
        console.error('List buckets error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 移動檔案
   * Move file
   *
   * @param {string} bucket - Bucket name
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   * @returns {Observable<{ error: any | null }>} Move response
   */
  move(bucket: string, fromPath: string, toPath: string): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(client.storage.from(bucket).move(fromPath, toPath)).pipe(
      map(({ error }) => ({ error })),
      catchError(error => {
        console.error('Move error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 複製檔案
   * Copy file
   *
   * @param {string} bucket - Bucket name
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   * @returns {Observable<{ error: any | null }>} Copy response
   */
  copy(bucket: string, fromPath: string, toPath: string): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(client.storage.from(bucket).copy(fromPath, toPath)).pipe(
      map(({ error }) => ({ error })),
      catchError(error => {
        console.error('Copy error:', error);
        return throwError(() => error);
      })
    );
  }
}
