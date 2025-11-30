/**
 * Upload Types
 *
 * 上傳元件型別定義
 * Type definitions for the upload component
 *
 * This file defines all types used by the upload component,
 * following the enterprise architecture guidelines where
 * Types layer contains only data structures without logic.
 */

/**
 * 上傳類型枚舉
 * Upload type enumeration
 *
 * Defines different upload scenarios for the application
 */
export enum UploadType {
  /** 使用者頭像 - User avatar */
  USER_AVATAR = 'user-avatar',
  /** 組織標誌 - Organization logo */
  ORG_LOGO = 'org-logo',
  /** 團隊頭像 - Team avatar */
  TEAM_AVATAR = 'team-avatar',
  /** 任務照片 - Task photo */
  TASK_PHOTO = 'task-photo',
  /** 任務附件 - Task attachment */
  TASK_ATTACHMENT = 'task-attachment',
  /** 通用檔案 - General file */
  GENERAL = 'general'
}

/**
 * 上傳狀態枚舉
 * Upload status enumeration
 */
export enum UploadStatus {
  /** 閒置狀態 - Idle state */
  IDLE = 'idle',
  /** 上傳中 - Uploading */
  UPLOADING = 'uploading',
  /** 上傳成功 - Success */
  SUCCESS = 'success',
  /** 上傳失敗 - Error */
  ERROR = 'error'
}

/**
 * 上傳組態介面
 * Upload configuration interface
 *
 * Configures the upload component behavior
 */
export interface UploadConfig {
  /** Supabase Storage bucket 名稱 */
  bucket: string;
  /** 上傳類型 */
  uploadType: UploadType;
  /** 允許的 MIME 類型 */
  acceptedTypes?: string[];
  /** 檔案大小上限（bytes）*/
  maxFileSize?: number;
  /** 是否允許多檔上傳 */
  multiple?: boolean;
  /** 自訂路徑前綴（不含尾部斜線）*/
  pathPrefix?: string;
  /** 是否覆蓋現有檔案 */
  upsert?: boolean;
  /** 快取控制（秒）*/
  cacheControl?: string;
  /** 是否顯示預覽 */
  showPreview?: boolean;
  /** 是否顯示移除按鈕 */
  showRemoveButton?: boolean;
  /** 自訂上傳按鈕文字 */
  uploadButtonText?: string;
  /** 是否為圓形裁切（用於頭像） */
  roundedCrop?: boolean;
}

/**
 * 上傳檔案資訊介面
 * Upload file info interface
 */
export interface UploadFileInfo {
  /** 原始檔案名稱 */
  originalName: string;
  /** 儲存路徑 */
  storagePath: string;
  /** 完整路徑（含 bucket） */
  fullPath: string;
  /** 檔案 ID */
  fileId: string;
  /** 公開 URL */
  publicUrl: string;
  /** 檔案大小（bytes） */
  size: number;
  /** MIME 類型 */
  mimeType: string;
}

/**
 * 上傳元件結果介面
 * Upload component result interface
 */
export interface UploadComponentResult {
  /** 是否成功 */
  success: boolean;
  /** 上傳的檔案資訊（成功時） */
  fileInfo?: UploadFileInfo;
  /** 錯誤訊息（失敗時） */
  errorMessage?: string;
  /** 錯誤代碼（失敗時） */
  errorCode?: string;
}

/**
 * 上傳錯誤介面
 * Upload error interface
 */
export interface UploadError {
  /** 錯誤訊息 */
  message: string;
  /** 錯誤代碼 */
  code?: string;
  /** HTTP 狀態碼 */
  statusCode?: number;
}

/**
 * 上傳進度介面
 * Upload progress interface
 */
export interface UploadProgress {
  /** 已上傳位元組數 */
  loaded: number;
  /** 總位元組數 */
  total: number;
  /** 進度百分比（0-100） */
  percent: number;
}

/**
 * 預設組態常數
 * Default configuration constants
 */
export const DEFAULT_UPLOAD_CONFIG: Partial<UploadConfig> = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  multiple: false,
  upsert: false,
  cacheControl: '3600',
  showPreview: true,
  showRemoveButton: true,
  uploadButtonText: '上傳檔案',
  roundedCrop: false
};

/**
 * Bucket 名稱對照表
 * Bucket name mapping
 */
export const UPLOAD_BUCKETS: Record<UploadType, string> = {
  [UploadType.USER_AVATAR]: 'avatars',
  [UploadType.ORG_LOGO]: 'logos',
  [UploadType.TEAM_AVATAR]: 'avatars',
  [UploadType.TASK_PHOTO]: 'task-photos',
  [UploadType.TASK_ATTACHMENT]: 'task-attachments',
  [UploadType.GENERAL]: 'files'
};

/**
 * 圖片 MIME 類型
 * Image MIME types
 */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * 文件 MIME 類型
 * Document MIME types
 */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
