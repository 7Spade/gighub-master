/**
 * Supabase Type Definitions
 *
 * Contains type definitions for Supabase-specific interfaces and types
 * including authentication, storage, and client-related types.
 */

import { Session, User, AuthError, Provider, SupabaseClient } from '@supabase/supabase-js';

import { Database } from './database.types';

/**
 * Re-export commonly used Supabase types
 */
export type { Session, User, AuthError, Provider, SupabaseClient };

/**
 * Custom Supabase client type with database schema
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Authentication related types
 */

/**
 * 認證狀態枚舉
 * Authentication state enumeration
 */
export enum AuthState {
  SIGNED_OUT = 'SIGNED_OUT',
  SIGNED_IN = 'SIGNED_IN',
  PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
  USER_UPDATED = 'USER_UPDATED'
}

/**
 * 登入憑證介面
 * Sign in credentials interface
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * 註冊憑證介面
 * Sign up credentials interface
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, any>;
    emailRedirectTo?: string;
  };
}

/**
 * 認證回應介面
 * Authentication response interface
 */
export interface AuthResponse<T = User> {
  data: T | null;
  error: AuthError | null;
}

/**
 * Session 更新回調類型
 * Session update callback type
 */
export type SessionUpdateCallback = (session: Session | null) => void;

/**
 * Storage related types
 */

/**
 * 檔案上傳選項
 * File upload options
 */
export interface FileUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * 檔案上傳回應
 * File upload response
 */
export interface FileUploadResponse {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  error: StorageError | null;
}

/**
 * 儲存錯誤介面
 * Storage error interface
 */
export interface StorageError {
  message: string;
  statusCode?: string;
}

/**
 * 公開 URL 選項
 * Public URL options
 */
export interface PublicUrlOptions {
  download?: boolean | string;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * 檔案清單項目
 * File list item
 */
export interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  bucket_id?: string;
}

/**
 * Query related types
 */

/**
 * 查詢選項介面
 * Query options interface
 */
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  single?: boolean;
}

/**
 * 分頁資訊介面
 * Pagination information interface
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 分頁回應介面
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * 排序方向類型
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 排序選項介面
 * Sort options interface
 */
export interface SortOptions {
  column: string;
  direction: SortDirection;
}

/**
 * 過濾操作符類型
 * Filter operator type
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'contains'
  | 'containedBy'
  | 'overlaps';

/**
 * 過濾條件介面
 * Filter condition interface
 */
export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Error handling types
 */

/**
 * Supabase 錯誤類型
 * Supabase error type
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * 錯誤回應介面
 * Error response interface
 */
export interface ErrorResponse {
  error: SupabaseError;
  status: number;
}
