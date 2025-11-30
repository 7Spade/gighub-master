/**
 * Upload Module Public API
 *
 * 上傳模組公開介面
 * Public interface for the upload module
 *
 * This module provides a reusable file upload component
 * that integrates with Supabase Storage.
 *
 * Use cases:
 * - Task photo uploads
 * - User avatar uploads
 * - Organization logo uploads
 * - Team avatar uploads
 *
 * @example
 * ```typescript
 * import { UploadComponent, UploadConfig, UploadResult } from '@shared/upload';
 *
 * // In component template:
 * <app-upload
 *   [config]="uploadConfig"
 *   (uploadComplete)="onUploadComplete($event)"
 *   (uploadError)="onUploadError($event)"
 * />
 * ```
 */

export * from './upload.types';
export * from './upload.component';
