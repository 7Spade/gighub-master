/**
 * Supabase Upload Directive
 *
 * 檔案上傳指令，簡化 Supabase Storage 檔案上傳操作
 * File upload directive to simplify Supabase Storage file upload operations
 *
 * Features:
 * - Drag and drop support
 * - File type validation
 * - File size validation
 * - Upload progress tracking
 * - Auto upload on file selection
 *
 * @example
 * ```html
 * <div
 *   appSupabaseUpload
 *   [bucket]="'avatars'"
 *   [path]="userId + '/avatar.png'"
 *   [accept]="'image/*'"
 *   [maxSize]="5 * 1024 * 1024"
 *   (uploaded)="onUploaded($event)"
 *   (error)="onError($event)">
 *   Drop files here or click to upload
 * </div>
 * ```
 */

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { SupabaseStorageService } from '@core';
import { firstValueFrom } from 'rxjs';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

@Directive({
  selector: '[appSupabaseUpload]',
  standalone: true
})
export class SupabaseUploadDirective {
  private readonly el = inject(ElementRef);
  private readonly storageService = inject(SupabaseStorageService);

  /**
   * Supabase bucket name
   */
  @Input() bucket!: string;

  /**
   * File path in bucket
   */
  @Input() path!: string;

  /**
   * Accepted file types (e.g., 'image/*', '.pdf')
   */
  @Input() accept = '*/*';

  /**
   * Maximum file size in bytes
   */
  @Input() maxSize: number = 10 * 1024 * 1024; // 10MB default

  /**
   * Auto upload on file selection
   */
  @Input() autoUpload = true;

  /**
   * Upsert flag (overwrite existing file)
   */
  @Input() upsert = false;

  /**
   * Upload success event
   */
  @Output() readonly uploaded = new EventEmitter<UploadResult>();

  /**
   * Upload error event
   */
  @Output() readonly error = new EventEmitter<Error>();

  /**
   * Upload progress event (0-100)
   */
  @Output() readonly progress = new EventEmitter<number>();

  /**
   * File selection event
   */
  @Output() readonly fileSelected = new EventEmitter<File>();

  @HostListener('click')
  onClick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.accept;
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target?.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    };
    input.click();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.el.nativeElement.classList.add('drag-over');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.el.nativeElement.classList.remove('drag-over');
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.el.nativeElement.classList.remove('drag-over');

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  /**
   * 處理檔案上傳
   * Handle file upload
   *
   * @private
   * @param {File} file - File to upload
   */
  private async handleFile(file: File): Promise<void> {
    // Validate file size
    if (file.size > this.maxSize) {
      const error = new Error(`File size exceeds maximum allowed size of ${this.maxSize} bytes`);
      this.error.emit(error);
      return;
    }

    // Validate file type
    if (!this.isValidFileType(file)) {
      const error = new Error(`File type '${file.type}' is not allowed`);
      this.error.emit(error);
      return;
    }

    this.fileSelected.emit(file);

    if (!this.autoUpload) {
      return;
    }

    try {
      this.progress.emit(0);

      const result = await firstValueFrom(
        this.storageService.upload(this.bucket, this.path, file, {
          upsert: this.upsert,
          contentType: file.type
        })
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data) {
        const publicUrl = this.storageService.getPublicUrl(this.bucket, result.data.path);

        this.progress.emit(100);
        this.uploaded.emit({
          path: result.data.path,
          publicUrl
        });
      }
    } catch (error) {
      this.error.emit(error instanceof Error ? error : new Error('Upload failed'));
    }
  }

  /**
   * 驗證檔案類型
   * Validate file type
   *
   * @private
   * @param {File} file - File to validate
   * @returns {boolean} True if valid
   */
  private isValidFileType(file: File): boolean {
    if (this.accept === '*/*') {
      return true;
    }

    const acceptTypes = this.accept.split(',').map(type => type.trim());

    return acceptTypes.some(type => {
      if (type.startsWith('.')) {
        // File extension check
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else if (type.endsWith('/*')) {
        // MIME type wildcard check (e.g., 'image/*')
        const mimePrefix = type.split('/')[0];
        return file.type.startsWith(mimePrefix);
      } else {
        // Exact MIME type check
        return file.type === type;
      }
    });
  }
}
