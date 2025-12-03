/**
 * File Types Module
 * 檔案類型定義模組
 *
 * Exports all file-related type definitions for the File Management Infrastructure.
 * Types match PostgreSQL enums and table definitions in seed.sql (PART 15.8: Files Management).
 *
 * Features:
 * - Modern (Modernization): Angular 20 patterns, TypeScript strict mode
 * - Enterprise-ready (Enterprise-readiness): Comprehensive type safety
 * - Structured (Structured): Clear hierarchy and organization
 * - High Availability (Reliability): Defensive typing with null safety
 * - Security (Security): Explicit permission types
 * - Scalability (Scalability): Extensible metadata support
 * - Traceability (Auditing): Created/Updated timestamps
 * - Maintainability (Maintainability): Clear documentation
 * - User Experience (UX/DX): Intuitive API design
 *
 * @module core/infra/types/file
 */

// ============================================================================
// File Enums (檔案枚舉)
// ============================================================================

/**
 * 檔案狀態枚舉
 * File status enumeration
 *
 * Corresponds to database file_status enum in seed.sql
 */
export enum FileStatus {
  /** 上傳中 | Uploading */
  PENDING = 'pending',
  /** 有效 | Active */
  ACTIVE = 'active',
  /** 已封存 | Archived */
  ARCHIVED = 'archived',
  /** 已刪除 | Deleted */
  DELETED = 'deleted'
}

/**
 * 檔案類型枚舉 (用於 UI 分類)
 * File category enumeration (for UI categorization)
 */
export enum FileCategory {
  /** 圖片 | Image */
  IMAGE = 'image',
  /** 文件 | Document */
  DOCUMENT = 'document',
  /** 影片 | Video */
  VIDEO = 'video',
  /** 音訊 | Audio */
  AUDIO = 'audio',
  /** 壓縮檔 | Archive */
  ARCHIVE = 'archive',
  /** 其他 | Other */
  OTHER = 'other'
}

/**
 * 儲存桶類型枚舉
 * Storage bucket type enumeration
 *
 * Corresponds to storage.buckets in seed.sql (PART 17)
 */
export enum StorageBucket {
  /** 藍圖附件 | Blueprint attachments (private) */
  BLUEPRINT_ATTACHMENTS = 'blueprint-attachments',
  /** 頭像 | User avatars (public) */
  AVATARS = 'avatars'
}

// ============================================================================
// File Entity Interfaces (檔案實體介面)
// ============================================================================

/**
 * File entity interface
 * 檔案實體介面
 *
 * Corresponds to database files table in seed.sql
 */
export interface FileEntity {
  /** 檔案 ID | File ID */
  id: string;
  /** 藍圖 ID | Blueprint ID */
  blueprint_id: string;
  /** Supabase Storage 路徑 | Supabase Storage path */
  storage_path: string;
  /** 原始檔名 | Original file name */
  file_name: string;
  /** 顯示名稱 | Display name */
  display_name?: string | null;
  /** MIME 類型 | MIME type */
  mime_type?: string | null;
  /** 檔案大小 (bytes) | File size in bytes */
  file_size?: number | null;
  /** 校驗碼 (SHA-256) | Checksum (SHA-256) */
  checksum?: string | null;
  /** 檔案狀態 | File status */
  status: FileStatus;
  /** 元數據 | Metadata (extensible JSON) */
  metadata?: FileMetadata;
  /** 父資料夾 ID | Parent folder ID */
  parent_folder_id?: string | null;
  /** 是否為資料夾 | Is folder */
  is_folder: boolean;
  /** 上傳者帳號 ID | Uploader account ID */
  uploaded_by?: string | null;
  /** 建立時間 | Created at */
  created_at?: string;
  /** 更新時間 | Updated at */
  updated_at?: string;
  /** 刪除時間 (軟刪除) | Deleted at (soft delete) */
  deleted_at?: string | null;
}

/**
 * 檔案元數據介面
 * File metadata interface
 *
 * Extensible metadata stored in JSONB column
 */
export interface FileMetadata {
  /** 圖片寬度 | Image width */
  width?: number;
  /** 圖片高度 | Image height */
  height?: number;
  /** 影片/音訊時長 (秒) | Duration in seconds */
  duration?: number;
  /** 縮圖路徑 | Thumbnail path */
  thumbnail_path?: string;
  /** 描述 | Description */
  description?: string;
  /** 標籤 | Tags */
  tags?: string[];
  /** 版本號 | Version number */
  version?: number;
  /** 原始檔案 ID (版本控制用) | Original file ID (for versioning) */
  original_file_id?: string;
  /** 自訂屬性 | Custom attributes */
  [key: string]: unknown;
}

/**
 * FileShare entity interface
 * 檔案分享實體介面
 *
 * Corresponds to database file_shares table in seed.sql
 */
export interface FileShare {
  /** 分享 ID | Share ID */
  id: string;
  /** 檔案 ID | File ID */
  file_id: string;
  /** 分享給帳號 ID | Shared with account ID */
  shared_with_account_id?: string | null;
  /** 分享給團隊 ID | Shared with team ID */
  shared_with_team_id?: string | null;
  /** 是否可編輯 | Can edit */
  can_edit: boolean;
  /** 過期時間 | Expires at */
  expires_at?: string | null;
  /** 分享連結碼 | Share link code */
  share_link?: string | null;
  /** 建立者 ID | Created by account ID */
  created_by?: string | null;
  /** 建立時間 | Created at */
  created_at?: string;
}

// ============================================================================
// File Tree Interfaces (檔案樹狀結構介面)
// ============================================================================

/**
 * 檔案節點介面 (用於樹狀結構)
 * File node interface (for tree structure)
 */
export interface FileNode extends FileEntity {
  /** 子檔案/資料夾 | Children files/folders */
  children?: FileNode[];
  /** 層級 (計算得出) | Level (calculated) */
  level?: number;
  /** 是否為葉節點 | Is leaf node */
  isLeaf?: boolean;
  /** 子項目數量 | Children count */
  childCount?: number;
  /** 是否展開 | Is expanded */
  expanded?: boolean;
}

/**
 * 麵包屑導航項目
 * Breadcrumb navigation item
 */
export interface FileBreadcrumb {
  /** ID */
  id: string | null;
  /** 名稱 | Name */
  name: string;
  /** 是否為當前位置 | Is current location */
  isCurrent?: boolean;
}

// ============================================================================
// File Query Options (檔案查詢選項)
// ============================================================================

/**
 * 檔案查詢選項
 * File query options
 */
export interface FileQueryOptions {
  /** 按藍圖過濾 | Filter by blueprint */
  blueprintId?: string;
  /** 按父資料夾過濾 | Filter by parent folder */
  parentFolderId?: string | null;
  /** 按狀態過濾 | Filter by status */
  status?: FileStatus | FileStatus[];
  /** 按類型過濾 | Filter by category */
  category?: FileCategory | FileCategory[];
  /** 按 MIME 類型過濾 | Filter by MIME type */
  mimeType?: string | string[];
  /** 是否只查詢資料夾 | Only folders */
  foldersOnly?: boolean;
  /** 是否只查詢檔案 | Only files */
  filesOnly?: boolean;
  /** 是否包含已刪除 | Include deleted */
  includeDeleted?: boolean;
  /** 搜尋關鍵字 | Search keyword */
  searchKeyword?: string;
  /** 排序欄位 | Sort field */
  sortBy?: 'file_name' | 'created_at' | 'updated_at' | 'file_size';
  /** 排序方向 | Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** 分頁限制 | Page limit */
  limit?: number;
  /** 分頁偏移 | Page offset */
  offset?: number;
}

// ============================================================================
// File Create/Update DTOs
// ============================================================================

/**
 * 建立檔案請求
 * Create file request
 */
export interface CreateFileRequest {
  /** 藍圖 ID | Blueprint ID */
  blueprint_id: string;
  /** 儲存路徑 | Storage path */
  storage_path: string;
  /** 檔案名稱 | File name */
  file_name: string;
  /** 顯示名稱 | Display name */
  display_name?: string | null;
  /** MIME 類型 | MIME type */
  mime_type?: string | null;
  /** 檔案大小 | File size */
  file_size?: number | null;
  /** 校驗碼 | Checksum */
  checksum?: string | null;
  /** 元數據 | Metadata */
  metadata?: FileMetadata;
  /** 父資料夾 ID | Parent folder ID */
  parent_folder_id?: string | null;
  /** 是否為資料夾 | Is folder */
  is_folder?: boolean;
}

/**
 * 建立資料夾請求
 * Create folder request
 */
export interface CreateFolderRequest {
  /** 藍圖 ID | Blueprint ID */
  blueprint_id: string;
  /** 資料夾名稱 | Folder name */
  folder_name: string;
  /** 父資料夾 ID | Parent folder ID */
  parent_folder_id?: string | null;
  /** 描述 | Description */
  description?: string | null;
}

/**
 * 更新檔案請求
 * Update file request
 */
export interface UpdateFileRequest {
  /** 顯示名稱 | Display name */
  display_name?: string | null;
  /** 狀態 | Status */
  status?: FileStatus;
  /** 元數據 | Metadata */
  metadata?: FileMetadata;
  /** 父資料夾 ID (移動檔案) | Parent folder ID (for moving) */
  parent_folder_id?: string | null;
}

/**
 * 建立檔案分享請求
 * Create file share request
 */
export interface CreateFileShareRequest {
  /** 檔案 ID | File ID */
  file_id: string;
  /** 分享給帳號 ID | Share with account ID */
  shared_with_account_id?: string | null;
  /** 分享給團隊 ID | Share with team ID */
  shared_with_team_id?: string | null;
  /** 是否可編輯 | Can edit */
  can_edit?: boolean;
  /** 過期時間 | Expires at */
  expires_at?: string | null;
  /** 是否建立分享連結 | Create share link */
  create_share_link?: boolean;
}

// ============================================================================
// Upload Interfaces (上傳介面)
// ============================================================================

/**
 * 上傳進度介面
 * Upload progress interface
 */
export interface UploadProgress {
  /** 檔案 UID (用於追蹤) | File UID (for tracking) */
  uid: string;
  /** 檔案名稱 | File name */
  fileName: string;
  /** 進度百分比 (0-100) | Progress percentage (0-100) */
  percent: number;
  /** 狀態 | Status */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** 錯誤訊息 | Error message */
  errorMessage?: string;
  /** 上傳完成的檔案實體 | Uploaded file entity */
  file?: FileEntity;
  /** 原始 File 物件 | Original File object */
  rawFile?: File;
  /** 開始時間 | Start time */
  startTime?: number;
  /** 已上傳大小 | Uploaded size */
  uploadedSize?: number;
  /** 總大小 | Total size */
  totalSize?: number;
}

/**
 * 上傳選項介面
 * Upload options interface
 */
export interface UploadOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId: string;
  /** 目標資料夾 ID | Target folder ID */
  folderId?: string | null;
  /** 儲存桶 | Storage bucket */
  bucket?: StorageBucket;
  /** 允許的 MIME 類型 | Allowed MIME types */
  allowedMimeTypes?: string[];
  /** 最大檔案大小 (bytes) | Max file size in bytes */
  maxFileSize?: number;
  /** 是否覆蓋同名檔案 | Overwrite existing file */
  overwrite?: boolean;
  /** 自訂元數據 | Custom metadata */
  metadata?: FileMetadata;
}

/**
 * 上傳結果介面
 * Upload result interface
 */
export interface UploadResult {
  /** 是否成功 | Is successful */
  success: boolean;
  /** 檔案實體 | File entity */
  file?: FileEntity;
  /** 錯誤訊息 | Error message */
  error?: string;
  /** 儲存路徑 | Storage path */
  storagePath?: string;
  /** 公開 URL | Public URL */
  publicUrl?: string;
}

// ============================================================================
// File Statistics Interfaces (檔案統計介面)
// ============================================================================

/**
 * 檔案統計介面
 * File statistics interface
 */
export interface FileStats {
  /** 檔案總數 | Total files count */
  totalFiles: number;
  /** 資料夾總數 | Total folders count */
  totalFolders: number;
  /** 總大小 (bytes) | Total size in bytes */
  totalSize: number;
  /** 按類型統計 | Stats by category */
  byCategory: Record<FileCategory, number>;
  /** 按狀態統計 | Stats by status */
  byStatus: Record<FileStatus, number>;
}

// ============================================================================
// Helper Types & Constants
// ============================================================================

/**
 * 檔案狀態顯示配置
 * File status display configuration
 */
export interface FileStatusConfig {
  label: string;
  color: string;
  icon: string;
}

/**
 * 檔案類型顯示配置
 * File category display configuration
 */
export interface FileCategoryConfig {
  label: string;
  color: string;
  icon: string;
  extensions: string[];
  mimeTypes: string[];
}

/**
 * 檔案狀態配置映射
 * File status configuration map
 */
export const FILE_STATUS_CONFIG: Record<FileStatus, FileStatusConfig> = {
  [FileStatus.PENDING]: { label: '上傳中', color: 'processing', icon: 'loading' },
  [FileStatus.ACTIVE]: { label: '有效', color: 'success', icon: 'check-circle' },
  [FileStatus.ARCHIVED]: { label: '已封存', color: 'default', icon: 'inbox' },
  [FileStatus.DELETED]: { label: '已刪除', color: 'error', icon: 'delete' }
};

/**
 * 檔案類型配置映射
 * File category configuration map
 */
export const FILE_CATEGORY_CONFIG: Record<FileCategory, FileCategoryConfig> = {
  [FileCategory.IMAGE]: {
    label: '圖片',
    color: 'green',
    icon: 'file-image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon']
  },
  [FileCategory.DOCUMENT]: {
    label: '文件',
    color: 'blue',
    icon: 'file-text',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.md'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown'
    ]
  },
  [FileCategory.VIDEO]: {
    label: '影片',
    color: 'purple',
    icon: 'video-camera',
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
    mimeTypes: ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska']
  },
  [FileCategory.AUDIO]: {
    label: '音訊',
    color: 'orange',
    icon: 'audio',
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/x-ms-wma']
  },
  [FileCategory.ARCHIVE]: {
    label: '壓縮檔',
    color: 'gold',
    icon: 'file-zip',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-bzip2'
    ]
  },
  [FileCategory.OTHER]: {
    label: '其他',
    color: 'default',
    icon: 'file',
    extensions: [],
    mimeTypes: []
  }
};

/**
 * 根據 MIME 類型獲取檔案類別
 * Get file category from MIME type
 */
export function getFileCategoryFromMimeType(mimeType: string | null | undefined): FileCategory {
  if (!mimeType) return FileCategory.OTHER;

  for (const [category, config] of Object.entries(FILE_CATEGORY_CONFIG)) {
    if (config.mimeTypes.includes(mimeType)) {
      return category as FileCategory;
    }
  }

  // Fallback based on MIME type prefix
  if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
  if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
  if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
  if (mimeType.startsWith('text/')) return FileCategory.DOCUMENT;

  return FileCategory.OTHER;
}

/**
 * 根據副檔名獲取檔案類別
 * Get file category from file extension
 */
export function getFileCategoryFromExtension(fileName: string): FileCategory {
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;

  for (const [category, config] of Object.entries(FILE_CATEGORY_CONFIG)) {
    if (config.extensions.includes(ext)) {
      return category as FileCategory;
    }
  }

  return FileCategory.OTHER;
}

/**
 * 格式化檔案大小
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 生成唯一的儲存路徑
 * Generate unique storage path
 */
export function generateStoragePath(blueprintId: string, fileName: string, folderId?: string | null): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const basePath = folderId ? `${blueprintId}/${folderId}` : blueprintId;

  return `${basePath}/${timestamp}_${randomSuffix}_${sanitizedFileName}`;
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type FileModel = FileEntity;
export type FileNodeModel = FileNode;
export type FileShareModel = FileShare;
