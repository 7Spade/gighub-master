/**
 * Supabase Authentication Service
 *
 * 整合 Supabase Auth 與 @delon/auth 的認證服務
 * Authentication service integrating Supabase Auth with @delon/auth
 *
 * Features:
 * - Email/password authentication (no phone required)
 * - Session management with @delon/auth TokenService sync
 * - Password reset functionality
 * - Replaces Auth0 integration
 *
 * @module core/supabase
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { LoggerService } from '../logger';
import { SupabaseService } from './supabase.service';

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
    data?: Record<string, unknown>;
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

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly tokenService = inject(DA_SERVICE_TOKEN) as ITokenService;
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  private readonly authStateSubject = new BehaviorSubject<AuthState>(AuthState.SIGNED_OUT);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  /**
   * 當前認證狀態
   * Current authentication state
   */
  readonly authState$ = this.authStateSubject.asObservable();

  /**
   * 當前使用者
   * Current user
   */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * 初始化認證狀態監聽器
   * Initialize authentication state listener
   */
  private initializeAuthListener(): void {
    const client = this.supabaseService.client;

    // 監聽認證狀態變化
    // Listen to auth state changes
    client.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });

    // 初始化當前 session
    // Initialize current session
    this.checkSession();
  }

  /**
   * 檢查當前 session
   * Check current session
   */
  private async checkSession(): Promise<void> {
    const session = this.supabaseService.session;

    if (session) {
      this.syncSessionToDelonAuth(session);
      this.authStateSubject.next(AuthState.SIGNED_IN);
      this.currentUserSubject.next(session.user);
    } else {
      this.authStateSubject.next(AuthState.SIGNED_OUT);
      this.currentUserSubject.next(null);
    }
  }

  /**
   * 處理認證狀態變化
   * Handle authentication state changes
   */
  private handleAuthStateChange(event: string, session: Session | null): void {
    this.logger.debug('[SupabaseAuthService] Auth state changed:', event);

    if (session) {
      this.syncSessionToDelonAuth(session);
      this.authStateSubject.next(AuthState.SIGNED_IN);
      this.currentUserSubject.next(session.user);
    } else {
      this.clearDelonAuth();
      this.authStateSubject.next(AuthState.SIGNED_OUT);
      this.currentUserSubject.next(null);
    }

    // 根據事件類型執行相應動作
    // Execute corresponding actions based on event type
    switch (event) {
      case 'SIGNED_IN':
        break;
      case 'SIGNED_OUT':
        this.router.navigate(['/passport/login']);
        break;
      case 'PASSWORD_RECOVERY':
        this.authStateSubject.next(AuthState.PASSWORD_RECOVERY);
        break;
      case 'USER_UPDATED':
        this.authStateSubject.next(AuthState.USER_UPDATED);
        break;
    }
  }

  /**
   * 同步 Supabase Session 到 @delon/auth TokenService
   * Sync Supabase Session to @delon/auth TokenService
   */
  private syncSessionToDelonAuth(session: Session): void {
    this.tokenService.set({
      token: session.access_token,
      refresh_token: session.refresh_token,
      expired: session.expires_at ? session.expires_at * 1000 : undefined,
      user: session.user
    });
  }

  /**
   * 清除 @delon/auth 認證資訊
   * Clear @delon/auth authentication info
   */
  private clearDelonAuth(): void {
    this.tokenService.clear();
  }

  /**
   * 使用 Email 和密碼登入
   * Sign in with email and password
   */
  signIn(credentials: SignInCredentials): Observable<AuthResponse<Session>> {
    return from(this.supabaseService.signInWithPassword(credentials.email, credentials.password)).pipe(
      map(({ data, error }) => ({
        data: data.session,
        error
      }))
    );
  }

  /**
   * 註冊新使用者 (僅使用 Email，不需要手機號)
   * Sign up new user (email only, no phone required)
   */
  signUp(credentials: SignUpCredentials): Observable<AuthResponse<User>> {
    return from(this.supabaseService.signUp(credentials.email, credentials.password)).pipe(
      map(({ data, error }) => ({
        data: data.user,
        error
      }))
    );
  }

  /**
   * 登出
   * Sign out
   */
  signOut(): Observable<{ error: AuthError | null }> {
    return from(this.supabaseService.signOut());
  }

  /**
   * 重設密碼
   * Reset password
   */
  resetPassword(email: string): Observable<{ error: AuthError | null }> {
    return from(this.supabaseService.resetPassword(email)).pipe(map(({ error }) => ({ error })));
  }

  /**
   * 更新密碼
   * Update password
   */
  updatePassword(newPassword: string): Observable<AuthResponse<User>> {
    return from(this.supabaseService.updatePassword(newPassword)).pipe(
      map(({ data, error }) => ({
        data: data.user,
        error
      }))
    );
  }

  /**
   * 取得當前使用者
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.supabaseService.currentUser;
  }

  /**
   * 取得當前 Session
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.supabaseService.session;
  }

  /**
   * 是否已登入
   * Is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.supabaseService.session;
  }
}
