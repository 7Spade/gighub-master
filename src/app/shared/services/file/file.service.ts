/**
 * File Service
 *
 * 檔案管理服務
 * File management service
 *
 * Provides comprehensive file management functionality using Supabase Storage.
 * Uses Angular 20 Signals for reactive state management.
 *
 * Features:
 * - Modern (Modernization): Angular 20 Signals, inject(), async/await
 * - Enterprise-ready (Enterprise-readiness): Error handling, retry logic
 * - Structured (Structured): Clear state management
 * - High Availability (Reliability): Upload progress tracking
 * - Security (Security): File type validation, size limits
 * - Scalability (Scalability): Chunked uploads support (future)
 * - Traceability (Auditing): Upload/download logging
 * - Maintainability (Maintainability): JSDoc documentation
 * - User Experience (UX/DX): Progress callbacks, error messages
 *
 * @module shared/services/file
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FileRepository } from '../../../core/infra/repositories/file/file.repository';
import {
  FileEntity,
  FileStatus,
  FileQueryOptions,
  CreateFileShareRequest,
  FileShare,
  FileBreadcrumb,
  UploadProgress,
  UploadOptions,
  UploadResult,
  FileStats,
  FileCategory,
  StorageBucket,
  getFileCategoryFromMimeType,
  generateStoragePath
} from '../../../core/infra/types/file';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly supabase = inject(SupabaseService);
  private readonly fileRepository = inject(FileRepository);

  // ============================================================================
  // State Signals (狀態信號)
  // ============================================================================

  /** 當前藍圖 ID */
  readonly currentBlueprintId = signal<string | null>(null);

  /** 當前資料夾 ID */
  readonly currentFolderId = signal<string | null>(null);

  /** 檔案列表 */
  readonly files = signal<FileEntity[]>([]);

  /** 載入狀態 */
  readonly loading = signal(false);

  /** 錯誤訊息 */
  readonly error = signal<string | null>(null);

  /** 麵包屑導航 */
  readonly breadcrumbs = signal<FileBreadcrumb[]>([]);

  /** 上傳進度列表 */
  readonly uploadProgressList = signal<UploadProgress[]>([]);

  /** 選中的檔案 */
  readonly selectedFiles = signal<Set<string>>(new Set());

  /** 檔案統計 */
  readonly stats = signal<FileStats | null>(null);

  // ============================================================================
  // Computed Signals (計算信號)
  // ============================================================================

  /** 是否有正在上傳的檔案 */
  readonly isUploading = computed(() => this.uploadProgressList().some(p => p.status === 'uploading'));

  /** 上傳進度總覽 */
  readonly uploadOverallProgress = computed(() => {
    const list = this.uploadProgressList();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, p) => sum + p.percent, 0);
    return Math.round(total / list.length);
  });

  /** 只顯示資料夾 */
  readonly folders = computed(() => this.files().filter(f => f.is_folder));

  /** 只顯示檔案 */
  readonly filesOnly = computed(() => this.files().filter(f => !f.is_folder));

  /** 選中的檔案數量 */
  readonly selectedCount = computed(() => this.selectedFiles().size);

  /** 是否有選中的檔案 */
  readonly hasSelection = computed(() => this.selectedCount() > 0);

  // ============================================================================
  // Navigation Methods (導航方法)
  // ============================================================================

  /**
   * 設定當前藍圖
   * Set current blueprint
   */
  setBlueprint(blueprintId: string): void {
    if (this.currentBlueprintId() !== blueprintId) {
      this.currentBlueprintId.set(blueprintId);
      this.currentFolderId.set(null);
      this.clearSelection();
      this.loadFiles();
    }
  }

  /**
   * 導航到資料夾
   * Navigate to folder
   */
  async navigateToFolder(folderId: string | null): Promise<void> {
    this.currentFolderId.set(folderId);
    this.clearSelection();
    await this.loadFiles();
    await this.loadBreadcrumbs();
  }

  /**
   * 導航到父資料夾
   * Navigate to parent folder
   */
  async navigateUp(): Promise<void> {
    const breadcrumbs = this.breadcrumbs();
    if (breadcrumbs.length > 1) {
      const parentIndex = breadcrumbs.length - 2;
      await this.navigateToFolder(breadcrumbs[parentIndex].id);
    } else {
      await this.navigateToFolder(null);
    }
  }

  /**
   * 透過麵包屑導航
   * Navigate via breadcrumb
   */
  async navigateToBreadcrumb(breadcrumb: FileBreadcrumb): Promise<void> {
    await this.navigateToFolder(breadcrumb.id);
  }

  // ============================================================================
  // Loading Methods (載入方法)
  // ============================================================================

  /**
   * 載入當前資料夾的檔案
   * Load files in current folder
   */
  async loadFiles(): Promise<void> {
    const blueprintId = this.currentBlueprintId();
    if (!blueprintId) {
      this.files.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const files = await firstValueFrom(this.fileRepository.findByFolder(blueprintId, this.currentFolderId()));
      this.files.set(files);
    } catch (err) {
      console.error('[FileService] loadFiles error:', err);
      this.error.set('載入檔案失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 載入檔案 (使用查詢選項)
   * Load files with query options
   */
  async loadFilesWithOptions(options: FileQueryOptions): Promise<FileEntity[]> {
    try {
      return await firstValueFrom(this.fileRepository.findWithOptions(options));
    } catch (err) {
      console.error('[FileService] loadFilesWithOptions error:', err);
      return [];
    }
  }

  /**
   * 載入麵包屑導航
   * Load breadcrumb navigation
   */
  async loadBreadcrumbs(): Promise<void> {
    const folderId = this.currentFolderId();
    const breadcrumbs: FileBreadcrumb[] = [{ id: null, name: '根目錄' }];

    if (folderId) {
      const path = await firstValueFrom(this.fileRepository.getFolderPath(folderId));
      for (const folder of path) {
        breadcrumbs.push({
          id: folder.id,
          name: folder.display_name || folder.file_name
        });
      }
    }

    // Mark current location
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isCurrent = true;
    }

    this.breadcrumbs.set(breadcrumbs);
  }

  /**
   * 載入檔案統計
   * Load file statistics
   */
  async loadStats(): Promise<void> {
    const blueprintId = this.currentBlueprintId();
    if (!blueprintId) {
      this.stats.set(null);
      return;
    }

    try {
      const [totalFiles, totalSize, files] = await Promise.all([
        firstValueFrom(this.fileRepository.countByBlueprint(blueprintId)),
        firstValueFrom(this.fileRepository.getTotalSize(blueprintId)),
        firstValueFrom(this.fileRepository.findByBlueprint(blueprintId))
      ]);

      const totalFolders = files.filter(f => f.is_folder).length;
      const byCategory: Record<FileCategory, number> = {
        [FileCategory.IMAGE]: 0,
        [FileCategory.DOCUMENT]: 0,
        [FileCategory.VIDEO]: 0,
        [FileCategory.AUDIO]: 0,
        [FileCategory.ARCHIVE]: 0,
        [FileCategory.OTHER]: 0
      };
      const byStatus: Record<FileStatus, number> = {
        [FileStatus.PENDING]: 0,
        [FileStatus.ACTIVE]: 0,
        [FileStatus.ARCHIVED]: 0,
        [FileStatus.DELETED]: 0
      };

      for (const file of files) {
        if (!file.is_folder) {
          const category = getFileCategoryFromMimeType(file.mime_type);
          byCategory[category]++;
        }
        byStatus[file.status]++;
      }

      this.stats.set({
        totalFiles,
        totalFolders,
        totalSize,
        byCategory,
        byStatus
      });
    } catch (err) {
      console.error('[FileService] loadStats error:', err);
    }
  }

  // ============================================================================
  // Upload Methods (上傳方法)
  // ============================================================================

  /**
   * 上傳檔案
   * Upload a file
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    const uid = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const storagePath = generateStoragePath(options.blueprintId, file.name, options.folderId);
    const bucket = options.bucket || StorageBucket.BLUEPRINT_ATTACHMENTS;

    // Validate file size
    if (options.maxFileSize && file.size > options.maxFileSize) {
      return {
        success: false,
        error: `檔案大小超過限制 (${Math.round(options.maxFileSize / 1024 / 1024)}MB)`
      };
    }

    // Validate MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(file.type)) {
        return {
          success: false,
          error: `不支援的檔案類型: ${file.type}`
        };
      }
    }

    // Add to progress list
    const progress: UploadProgress = {
      uid,
      fileName: file.name,
      percent: 0,
      status: 'pending',
      rawFile: file,
      startTime: Date.now(),
      totalSize: file.size,
      uploadedSize: 0
    };

    this.uploadProgressList.update(list => [...list, progress]);

    try {
      // Update status to uploading
      this.updateUploadProgress(uid, { status: 'uploading', percent: 10 });

      // Upload to Supabase Storage
      const { error: storageError } = await this.supabase.client.storage.from(bucket).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: options.overwrite || false
      });

      if (storageError) {
        throw storageError;
      }

      this.updateUploadProgress(uid, { percent: 70 });

      // Get current user account ID
      const accountId = await this.getCurrentAccountId();
      if (!accountId) {
        throw new Error('無法取得使用者帳號');
      }

      // Create file record in database
      const fileEntity = await firstValueFrom(
        this.fileRepository.create(
          {
            blueprint_id: options.blueprintId,
            storage_path: storagePath,
            file_name: file.name,
            display_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            parent_folder_id: options.folderId || null,
            is_folder: false,
            metadata: options.metadata || {}
          },
          accountId
        )
      );

      if (!fileEntity) {
        throw new Error('建立檔案記錄失敗');
      }

      this.updateUploadProgress(uid, {
        percent: 100,
        status: 'success',
        file: fileEntity
      });

      // Reload files if in the same folder
      if (this.currentBlueprintId() === options.blueprintId) {
        await this.loadFiles();
      }

      // Get public URL if bucket is public
      let publicUrl: string | undefined;
      const { data: urlData } = this.supabase.client.storage.from(bucket).getPublicUrl(storagePath);
      if (urlData) {
        publicUrl = urlData.publicUrl;
      }

      return {
        success: true,
        file: fileEntity,
        storagePath,
        publicUrl
      };
    } catch (err) {
      console.error('[FileService] uploadFile error:', err);
      const errorMessage = err instanceof Error ? err.message : '上傳失敗';

      this.updateUploadProgress(uid, {
        status: 'error',
        errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 批量上傳檔案
   * Upload multiple files
   */
  async uploadFiles(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 更新上傳進度
   * Update upload progress
   */
  private updateUploadProgress(uid: string, updates: Partial<UploadProgress>): void {
    this.uploadProgressList.update(list => list.map(p => (p.uid === uid ? { ...p, ...updates } : p)));
  }

  /**
   * 清除完成的上傳
   * Clear completed uploads
   */
  clearCompletedUploads(): void {
    this.uploadProgressList.update(list => list.filter(p => p.status === 'uploading' || p.status === 'pending'));
  }

  /**
   * 清除所有上傳進度
   * Clear all upload progress
   */
  clearAllUploads(): void {
    this.uploadProgressList.set([]);
  }

  // ============================================================================
  // Download Methods (下載方法)
  // ============================================================================

  /**
   * 取得檔案下載 URL
   * Get file download URL
   */
  async getDownloadUrl(file: FileEntity, expiresIn = 3600): Promise<string | null> {
    if (!file.storage_path) return null;

    try {
      const { data, error } = await this.supabase.client.storage
        .from(StorageBucket.BLUEPRINT_ATTACHMENTS)
        .createSignedUrl(file.storage_path, expiresIn);

      if (error) {
        console.error('[FileService] getDownloadUrl error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('[FileService] getDownloadUrl error:', err);
      return null;
    }
  }

  /**
   * 下載檔案
   * Download file
   */
  async downloadFile(file: FileEntity): Promise<void> {
    const url = await this.getDownloadUrl(file);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.display_name || file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // ============================================================================
  // Folder Methods (資料夾方法)
  // ============================================================================

  /**
   * 建立資料夾
   * Create folder
   */
  async createFolder(name: string, description?: string): Promise<FileEntity | null> {
    const blueprintId = this.currentBlueprintId();
    if (!blueprintId) return null;

    const accountId = await this.getCurrentAccountId();
    if (!accountId) return null;

    try {
      const folder = await firstValueFrom(
        this.fileRepository.createFolder(
          {
            blueprint_id: blueprintId,
            folder_name: name,
            parent_folder_id: this.currentFolderId(),
            description
          },
          accountId
        )
      );

      if (folder) {
        await this.loadFiles();
      }

      return folder;
    } catch (err) {
      console.error('[FileService] createFolder error:', err);
      return null;
    }
  }

  // ============================================================================
  // File Operations (檔案操作)
  // ============================================================================

  /**
   * 重命名檔案/資料夾
   * Rename file/folder
   */
  async rename(id: string, newName: string): Promise<boolean> {
    try {
      const file = await firstValueFrom(this.fileRepository.rename(id, newName));
      if (file) {
        await this.loadFiles();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[FileService] rename error:', err);
      return false;
    }
  }

  /**
   * 移動檔案/資料夾
   * Move file/folder
   */
  async move(id: string, newParentFolderId: string | null): Promise<boolean> {
    try {
      const file = await firstValueFrom(this.fileRepository.move(id, newParentFolderId));
      if (file) {
        await this.loadFiles();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[FileService] move error:', err);
      return false;
    }
  }

  /**
   * 刪除檔案/資料夾 (軟刪除)
   * Delete file/folder (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const file = await firstValueFrom(this.fileRepository.softDelete(id));
      if (file) {
        await this.loadFiles();
        this.selectedFiles.update(set => {
          const newSet = new Set(set);
          newSet.delete(id);
          return newSet;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[FileService] delete error:', err);
      return false;
    }
  }

  /**
   * 批量刪除
   * Batch delete
   */
  async deleteSelected(): Promise<number> {
    const selected = Array.from(this.selectedFiles());
    let deleted = 0;

    for (const id of selected) {
      if (await this.delete(id)) {
        deleted++;
      }
    }

    this.clearSelection();
    return deleted;
  }

  /**
   * 恢復刪除的檔案
   * Restore deleted file
   */
  async restore(id: string): Promise<boolean> {
    try {
      const file = await firstValueFrom(this.fileRepository.restore(id));
      if (file) {
        await this.loadFiles();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[FileService] restore error:', err);
      return false;
    }
  }

  // ============================================================================
  // Selection Methods (選擇方法)
  // ============================================================================

  /**
   * 選擇檔案
   * Select file
   */
  select(id: string): void {
    this.selectedFiles.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
  }

  /**
   * 取消選擇
   * Deselect file
   */
  deselect(id: string): void {
    this.selectedFiles.update(set => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  /**
   * 切換選擇
   * Toggle selection
   */
  toggleSelect(id: string): void {
    if (this.selectedFiles().has(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }

  /**
   * 選擇全部
   * Select all
   */
  selectAll(): void {
    const ids = this.files().map(f => f.id);
    this.selectedFiles.set(new Set(ids));
  }

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.selectedFiles.set(new Set());
  }

  /**
   * 檢查是否選中
   * Check if selected
   */
  isSelected(id: string): boolean {
    return this.selectedFiles().has(id);
  }

  // ============================================================================
  // Share Methods (分享方法)
  // ============================================================================

  /**
   * 建立分享
   * Create share
   */
  async createShare(request: CreateFileShareRequest): Promise<FileShare | null> {
    const accountId = await this.getCurrentAccountId();
    if (!accountId) return null;

    try {
      return await firstValueFrom(this.fileRepository.createShare(request, accountId));
    } catch (err) {
      console.error('[FileService] createShare error:', err);
      return null;
    }
  }

  /**
   * 取得檔案的分享列表
   * Get shares for a file
   */
  async getShares(fileId: string): Promise<FileShare[]> {
    try {
      return await firstValueFrom(this.fileRepository.findSharesByFile(fileId));
    } catch (err) {
      console.error('[FileService] getShares error:', err);
      return [];
    }
  }

  /**
   * 刪除分享
   * Delete share
   */
  async deleteShare(id: string): Promise<boolean> {
    try {
      return await firstValueFrom(this.fileRepository.deleteShare(id));
    } catch (err) {
      console.error('[FileService] deleteShare error:', err);
      return false;
    }
  }

  // ============================================================================
  // Helper Methods (輔助方法)
  // ============================================================================

  /**
   * 取得當前使用者帳號 ID
   * Get current user account ID
   */
  private async getCurrentAccountId(): Promise<string | null> {
    const {
      data: { user }
    } = await this.supabase.client.auth.getUser();

    if (!user) return null;

    const { data } = await this.supabase.client.from('accounts').select('id').eq('auth_user_id', user.id).single();

    return data?.id || null;
  }

  /**
   * 取得檔案預覽 URL
   * Get file preview URL (for images)
   */
  getPreviewUrl(file: FileEntity): string | null {
    if (!file.storage_path) return null;

    // Only for images
    if (!file.mime_type?.startsWith('image/')) return null;

    const { data } = this.supabase.client.storage.from(StorageBucket.BLUEPRINT_ATTACHMENTS).getPublicUrl(file.storage_path, {
      transform: {
        width: 200,
        height: 200,
        resize: 'contain'
      }
    });

    return data?.publicUrl || null;
  }

  /**
   * 刷新當前視圖
   * Refresh current view
   */
  async refresh(): Promise<void> {
    await Promise.all([this.loadFiles(), this.loadBreadcrumbs(), this.loadStats()]);
  }

  /**
   * 重置服務狀態
   * Reset service state
   */
  reset(): void {
    this.currentBlueprintId.set(null);
    this.currentFolderId.set(null);
    this.files.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.breadcrumbs.set([]);
    this.uploadProgressList.set([]);
    this.selectedFiles.set(new Set());
    this.stats.set(null);
  }
}
