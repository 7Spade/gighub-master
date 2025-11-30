/**
 * Upload Component
 *
 * 通用上傳元件，整合 Supabase Storage
 * General upload component with Supabase Storage integration
 *
 * Features:
 * - Drag and drop file upload
 * - File type validation
 * - File size validation
 * - Upload progress tracking
 * - Preview for images
 * - Multiple upload types support (avatar, logo, task photo, etc.)
 *
 * Architecture:
 * - Component layer: UI presentation and event handling only
 * - Uses SupabaseStorageService from Infrastructure layer
 * - Follows enterprise architecture guidelines
 *
 * @example
 * ```html
 * <app-upload
 *   [config]="uploadConfig"
 *   (uploadComplete)="onUploadComplete($event)"
 *   (uploadError)="onUploadError($event)"
 * />
 * ```
 */

import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { SupabaseStorageService } from '@core';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { SHARED_IMPORTS } from '../shared-imports';
import { UploadConfig, UploadComponentResult, UploadStatus, UploadFileInfo, DEFAULT_UPLOAD_CONFIG } from './upload.types';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadComponent {
  // ============================================
  // Dependencies
  // ============================================
  private readonly storageService = inject(SupabaseStorageService);

  // ============================================
  // Inputs
  // ============================================
  /** 上傳組態 / Upload configuration */
  readonly config = input<UploadConfig>();

  /** 初始預覽 URL（用於編輯場景）/ Initial preview URL for edit scenarios */
  readonly initialPreviewUrl = input<string>();

  // ============================================
  // Outputs
  // ============================================
  /** 上傳完成事件 / Upload complete event */
  readonly uploadComplete = output<UploadComponentResult>();

  /** 上傳錯誤事件 / Upload error event */
  readonly uploadError = output<UploadComponentResult>();

  /** 檔案移除事件 / File remove event */
  readonly fileRemoved = output<void>();

  // ============================================
  // State Signals
  // ============================================
  /** 上傳狀態 / Upload status */
  private readonly uploadStatus = signal<UploadStatus>(UploadStatus.IDLE);

  /** 上傳進度（0-100） / Upload progress (0-100) */
  readonly uploadProgress = signal<number>(0);

  /** 預覽 URL / Preview URL */
  readonly previewUrl = signal<string | null>(null);

  /** 錯誤訊息 / Error message */
  readonly errorMessage = signal<string | null>(null);

  /** 成功訊息顯示狀態 / Success message display state */
  readonly showSuccessMessage = signal<boolean>(false);

  /** 已上傳的檔案資訊 / Uploaded file info */
  private readonly uploadedFileInfo = signal<UploadFileInfo | null>(null);

  // ============================================
  // Computed Properties
  // ============================================
  /** 是否正在上傳 / Is uploading */
  readonly isUploading = computed(() => this.uploadStatus() === UploadStatus.UPLOADING);

  /** 是否顯示預覽 / Should show preview */
  readonly showPreview = computed(() => {
    const cfg = this.config();
    return cfg?.showPreview ?? DEFAULT_UPLOAD_CONFIG.showPreview;
  });

  /** 接受的檔案類型字串 / Accepted file types string */
  readonly acceptedTypesString = computed(() => {
    const cfg = this.config();
    const types = cfg?.acceptedTypes ?? DEFAULT_UPLOAD_CONFIG.acceptedTypes;
    return types?.join(',') ?? '';
  });

  /** 接受的檔案類型顯示文字 / Accepted file types display text */
  readonly acceptedTypesDisplay = computed(() => {
    const cfg = this.config();
    const types = cfg?.acceptedTypes ?? DEFAULT_UPLOAD_CONFIG.acceptedTypes;
    if (!types || types.length === 0) return '所有檔案';

    // 將 MIME 類型轉換為可讀格式
    const readableTypes = types.map(type => {
      const parts = type.split('/');
      if (parts.length === 2) {
        return parts[1].toUpperCase();
      }
      return type;
    });

    return readableTypes.join(', ');
  });

  /** 最大檔案大小顯示文字 / Max file size display text */
  readonly maxFileSizeDisplay = computed(() => {
    const cfg = this.config();
    const maxSize = cfg?.maxFileSize ?? DEFAULT_UPLOAD_CONFIG.maxFileSize;
    if (!maxSize) return null;

    if (maxSize >= 1024 * 1024) {
      return `${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
    }
    return `${(maxSize / 1024).toFixed(0)}KB`;
  });

  /** 上傳進度狀態 / Upload progress status */
  readonly uploadProgressStatus = computed(() => {
    const status = this.uploadStatus();
    switch (status) {
      case UploadStatus.SUCCESS:
        return 'success';
      case UploadStatus.ERROR:
        return 'exception';
      default:
        return 'active';
    }
  });

  // ============================================
  // Lifecycle
  // ============================================
  constructor() {
    // 設定初始預覽 URL
    const initialUrl = this.initialPreviewUrl();
    if (initialUrl) {
      this.previewUrl.set(initialUrl);
    }
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * 上傳前處理（驗證檔案）
   * Before upload handler (validate file)
   */
  beforeUpload = (file: NzUploadFile): boolean => {
    // 重置狀態
    this.clearError();
    this.showSuccessMessage.set(false);

    // 驗證檔案類型
    if (!this.validateFileType(file)) {
      return false;
    }

    // 驗證檔案大小
    if (!this.validateFileSize(file)) {
      return false;
    }

    // 開始上傳
    this.uploadFile(file as unknown as File);
    return false; // 返回 false 以阻止 nz-upload 的預設上傳行為
  };

  /**
   * 移除檔案
   * Remove file
   */
  onRemove(): void {
    const fileInfo = this.uploadedFileInfo();
    if (fileInfo) {
      // 從 Supabase Storage 刪除檔案
      const cfg = this.config();
      if (cfg) {
        this.storageService.remove(cfg.bucket, [fileInfo.storagePath]).subscribe({
          next: () => {
            this.resetState();
            this.fileRemoved.emit();
          },
          error: err => {
            console.error('Failed to remove file:', err);
            // 即使刪除失敗，也重置 UI 狀態
            this.resetState();
            this.fileRemoved.emit();
          }
        });
      }
    } else {
      this.resetState();
      this.fileRemoved.emit();
    }
  }

  /**
   * 清除錯誤訊息
   * Clear error message
   */
  clearError(): void {
    this.errorMessage.set(null);
  }

  /**
   * 清除成功訊息
   * Clear success message
   */
  clearSuccessMessage(): void {
    this.showSuccessMessage.set(false);
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * 驗證檔案類型
   * Validate file type
   */
  private validateFileType(file: NzUploadFile): boolean {
    const cfg = this.config();
    const acceptedTypes = cfg?.acceptedTypes ?? DEFAULT_UPLOAD_CONFIG.acceptedTypes;

    if (!acceptedTypes || acceptedTypes.length === 0) {
      return true;
    }

    const fileType = file.type ?? '';
    if (!acceptedTypes.includes(fileType)) {
      this.errorMessage.set(`不支援的檔案類型：${fileType}。支援的類型：${this.acceptedTypesDisplay()}`);
      return false;
    }

    return true;
  }

  /**
   * 驗證檔案大小
   * Validate file size
   */
  private validateFileSize(file: NzUploadFile): boolean {
    const cfg = this.config();
    const maxSize = cfg?.maxFileSize ?? DEFAULT_UPLOAD_CONFIG.maxFileSize;

    if (!maxSize) {
      return true;
    }

    const fileSize = file.size ?? 0;
    if (fileSize > maxSize) {
      this.errorMessage.set(`檔案大小超過限制。最大允許：${this.maxFileSizeDisplay()}`);
      return false;
    }

    return true;
  }

  /**
   * 上傳檔案到 Supabase Storage
   * Upload file to Supabase Storage
   */
  private async uploadFile(file: File): Promise<void> {
    const cfg = this.config();
    if (!cfg) {
      this.errorMessage.set('上傳組態未設定');
      return;
    }

    this.uploadStatus.set(UploadStatus.UPLOADING);
    this.uploadProgress.set(0);

    try {
      // 生成檔案路徑
      const storagePath = this.generateStoragePath(file);

      // 建立預覽（如果是圖片）
      if (file.type.startsWith('image/')) {
        await this.createPreview(file);
      }

      // 模擬進度（因為 Supabase SDK 不提供上傳進度）
      const progressInterval = setInterval(() => {
        const currentProgress = this.uploadProgress();
        if (currentProgress < 90) {
          this.uploadProgress.set(currentProgress + 10);
        }
      }, 200);

      // 上傳檔案
      const response = await firstValueFrom(
        this.storageService.upload(cfg.bucket, storagePath, file, {
          cacheControl: cfg.cacheControl ?? DEFAULT_UPLOAD_CONFIG.cacheControl,
          contentType: file.type,
          upsert: cfg.upsert ?? DEFAULT_UPLOAD_CONFIG.upsert
        })
      );

      clearInterval(progressInterval);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('上傳回應中缺少資料');
      }

      // 獲取公開 URL
      const publicUrl = this.storageService.getPublicUrl(cfg.bucket, storagePath);

      // 建立檔案資訊
      const fileInfo: UploadFileInfo = {
        originalName: file.name,
        storagePath: storagePath,
        fullPath: response.data.fullPath,
        fileId: response.data.id,
        publicUrl: publicUrl,
        size: file.size,
        mimeType: file.type
      };

      this.uploadedFileInfo.set(fileInfo);
      this.uploadProgress.set(100);
      this.uploadStatus.set(UploadStatus.SUCCESS);
      this.showSuccessMessage.set(true);

      // 更新預覽 URL 為公開 URL
      if (file.type.startsWith('image/')) {
        this.previewUrl.set(publicUrl);
      }

      // 發送成功事件
      const result: UploadComponentResult = {
        success: true,
        fileInfo: fileInfo
      };
      this.uploadComplete.emit(result);
    } catch (error) {
      this.uploadStatus.set(UploadStatus.ERROR);
      this.uploadProgress.set(0);

      const errorMsg = error instanceof Error ? error.message : '上傳失敗';
      this.errorMessage.set(errorMsg);

      const result: UploadComponentResult = {
        success: false,
        errorMessage: errorMsg
      };
      this.uploadError.emit(result);
    }
  }

  /**
   * 生成儲存路徑
   * Generate storage path
   */
  private generateStoragePath(file: File): string {
    const cfg = this.config();
    const fileExtension = file.name.split('.').pop() ?? '';
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.${fileExtension}`;

    if (cfg?.pathPrefix) {
      return `${cfg.pathPrefix}/${fileName}`;
    }

    return fileName;
  }

  /**
   * 建立圖片預覽
   * Create image preview
   */
  private createPreview(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
        resolve();
      };
      reader.onerror = () => {
        reject(new Error('無法讀取檔案'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 重置狀態
   * Reset state
   */
  private resetState(): void {
    this.uploadStatus.set(UploadStatus.IDLE);
    this.uploadProgress.set(0);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.showSuccessMessage.set(false);
    this.uploadedFileInfo.set(null);
  }
}
