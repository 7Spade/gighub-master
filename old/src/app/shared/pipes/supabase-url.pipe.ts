/**
 * Supabase URL Pipe
 *
 * 轉換 Supabase Storage 路徑為公開 URL
 * Transform Supabase Storage path to public URL
 *
 * Features:
 * - Convert storage path to public URL
 * - Support image transformation options
 * - Cache URLs for performance
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <img [src]="'avatars/user-123/avatar.png' | supabaseUrl:'avatars'" />
 *
 * <!-- With image transformation -->
 * <img [src]="imagePath | supabaseUrl:'images':{ width: 200, height: 200 }" />
 * ```
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { SupabaseStorageService, PublicUrlOptions } from '@core';

@Pipe({
  name: 'supabaseUrl',
  standalone: true
})
export class SupabaseUrlPipe implements PipeTransform {
  private readonly storageService = inject(SupabaseStorageService);
  private readonly urlCache = new Map<string, string>();

  /**
   * 轉換 Storage 路徑為公開 URL
   * Transform storage path to public URL
   *
   * @param {string} path - File path in storage
   * @param {string} bucket - Bucket name
   * @param {PublicUrlOptions} [options] - URL options
   * @returns {string} Public URL
   */
  transform(path: string, bucket: string, options?: PublicUrlOptions): string {
    if (!path || !bucket) {
      return '';
    }

    // Generate cache key
    const cacheKey = `${bucket}:${path}:${JSON.stringify(options || {})}`;

    // Return cached URL if available
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey)!;
    }

    // Get public URL
    const publicUrl = this.storageService.getPublicUrl(bucket, path, options);

    // Cache URL
    this.urlCache.set(cacheKey, publicUrl);

    return publicUrl;
  }
}
