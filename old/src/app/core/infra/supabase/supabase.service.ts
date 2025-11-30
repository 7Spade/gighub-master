/**
 * Supabase Service
 *
 * 核心 Supabase 客戶端服務，提供 Supabase Client 單例
 * Core Supabase client service, provides Supabase Client singleton
 *
 * Features:
 * - SSR compatible (supports both browser and server environments)
 * - Singleton pattern for client instance
 * - Type-safe database operations
 * - Environment-based configuration
 *
 * @example
 * ```typescript
 * constructor(private supabase: SupabaseService) {}
 *
 * async fetchData() {
 *   const client = this.supabase.getClient();
 *   const { data, error } = await client.from('users').select('*');
 * }
 * ```
 */

import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '@env/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '../types/database.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient<Database>;
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.client = this.initializeClient();
  }

  /**
   * 初始化 Supabase 客戶端
   * Initialize Supabase client
   *
   * @private
   * @returns {SupabaseClient<Database>} Configured Supabase client instance
   */
  private initializeClient(): SupabaseClient<Database> {
    // 根據運行環境選擇適當的 API key
    // Select appropriate API key based on runtime environment
    const supabaseKey = this.isBrowser
      ? environment['supabase'].anonKey
      : environment['supabase'].serviceRoleKey || environment['supabase'].anonKey;

    return createClient<Database>(environment['supabase'].url, supabaseKey, {
      auth: {
        // 瀏覽器端持久化 session
        // Persist session on browser side
        persistSession: this.isBrowser,
        // 自動刷新 token
        // Auto refresh token
        autoRefreshToken: this.isBrowser,
        // 檢測 session 變化
        // Detect session changes
        detectSessionInUrl: this.isBrowser,
        // Storage key for session
        storageKey: 'ng-alain-supabase-auth'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'ng-alain@20.1.0'
        }
      }
    });
  }

  /**
   * 獲取 Supabase 客戶端實例
   * Get Supabase client instance
   *
   * @returns {SupabaseClient<Database>} The Supabase client instance
   */
  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * 檢查是否在瀏覽器環境
   * Check if running in browser environment
   *
   * @returns {boolean} True if running in browser
   */
  isClientSide(): boolean {
    return this.isBrowser;
  }

  /**
   * 獲取當前認證狀態
   * Get current authentication state
   *
   * @returns {Promise<Session | null>} Current session or null
   */
  async getSession() {
    const {
      data: { session },
      error
    } = await this.client.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  }

  /**
   * 獲取當前使用者
   * Get current user
   *
   * @returns {Promise<User | null>} Current user or null
   */
  async getUser() {
    const {
      data: { user },
      error
    } = await this.client.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  }
}
