/**
 * Supabase Business Models
 *
 * 業務模型定義，從資料庫類型轉換為業務層使用的模型
 * Business model definitions, converting database types to business layer models
 *
 * Features:
 * - camelCase naming convention
 * - Business-specific enumerations
 * - Domain-specific interfaces
 * - DTO (Data Transfer Object) definitions
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';

/**
 * 使用者模型
 * User model
 */
export interface UserModel {
  id: string;
  email: string;
  emailConfirmedAt?: Date | null;
  phone?: string | null;
  phoneConfirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt?: Date | null;
  role?: string;
  metadata?: Record<string, any>;
}

/**
 * Session 模型
 * Session model
 */
export interface SessionModel {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
  tokenType: string;
  user: UserModel;
}

/**
 * 檔案上傳模型
 * File upload model
 */
export interface FileUploadModel {
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  bucket: string;
  publicUrl?: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

/**
 * 使用者狀態枚舉
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * 使用者角色枚舉
 * User role enumeration
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
  MODERATOR = 'moderator'
}

/**
 * 檔案類型枚舉
 * File type enumeration
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

/**
 * 使用者建立請求
 * User creation request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

/**
 * 使用者更新請求
 * User update request
 */
export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

/**
 * 檔案上傳請求
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  bucket: string;
  path?: string;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

/**
 * 分頁請求
 * Pagination request
 */
export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * 從 Supabase User 轉換為 UserModel
 * Convert Supabase User to UserModel
 *
 * @param {SupabaseUser} user - Supabase user
 * @returns {UserModel} User model
 */
export function toUserModel(user: SupabaseUser): UserModel {
  return {
    id: user.id,
    email: user.email || '',
    emailConfirmedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
    phone: user.phone || null,
    phoneConfirmedAt: user.phone_confirmed_at ? new Date(user.phone_confirmed_at) : null,
    createdAt: new Date(user.created_at),
    updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
    role: user.role,
    metadata: user.user_metadata
  };
}

/**
 * 從 Supabase Session 轉換為 SessionModel
 * Convert Supabase Session to SessionModel
 *
 * @param {Session} session - Supabase session
 * @returns {SessionModel} Session model
 */
export function toSessionModel(session: Session): SessionModel {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at || 0,
    expiresIn: session.expires_in || 0,
    tokenType: session.token_type || 'bearer',
    user: toUserModel(session.user)
  };
}

/**
 * 檔案大小格式化
 * Format file size
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * 根據副檔名獲取檔案類型
 * Get file type by extension
 *
 * @param {string} fileName - File name
 * @returns {FileType} File type
 */
export function getFileType(fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

  if (extension && imageExtensions.includes(extension)) return FileType.IMAGE;
  if (extension && documentExtensions.includes(extension)) return FileType.DOCUMENT;
  if (extension && videoExtensions.includes(extension)) return FileType.VIDEO;
  if (extension && audioExtensions.includes(extension)) return FileType.AUDIO;
  if (extension && archiveExtensions.includes(extension)) return FileType.ARCHIVE;

  return FileType.OTHER;
}
