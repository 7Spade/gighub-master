/**
 * Supabase Authentication Service
 *
 * 整合 Supabase Auth 與 @delon/auth 的認證服務
 * Authentication service integrating Supabase Auth with @delon/auth
 *
 * Features:
 * - Email/password authentication (phone authentication removed as per requirements)
 * - Session management with @delon/auth TokenService sync
 * - OAuth provider support
 * - Password reset functionality
 * - Replaces Auth0 integration
 *
 * @example
 * ```typescript
 * constructor(private authService: SupabaseAuthService) {}
 *
 * async login() {
 *   const { data, error } = await this.authService.signIn({
 *     email: 'user@example.com',
 *     password: 'password'
 *   });
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { SupabaseService } from './supabase.service';
import { SignInCredentials, SignUpCredentials, AuthResponse, AuthState, Session, User, Provider } from '../types/supabase.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly tokenService = inject(DA_SERVICE_TOKEN) as ITokenService;
  private readonly router = inject(Router);

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
   *
   * @private
   */
  private initializeAuthListener(): void {
    const client = this.supabaseService.getClient();

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
   *
   * @private
   */
  private async checkSession(): Promise<void> {
    const session = await this.supabaseService.getSession();

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
   *
   * @private
   * @param {string} event - Auth event type
   * @param {Session | null} session - Current session
   */
  private handleAuthStateChange(event: string, session: Session | null): void {
    console.log('Auth state changed:', event);

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
        // 可以在這裡添加登入後的邏輯
        // Add post-login logic here
        break;
      case 'SIGNED_OUT':
        // 可以在這裡添加登出後的邏輯
        // Add post-logout logic here
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
   *
   * @private
   * @param {Session} session - Supabase session
   */
  private syncSessionToDelonAuth(session: Session): void {
    // 將 Supabase Session 映射到 @delon/auth Token 格式
    // Map Supabase Session to @delon/auth Token format
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
   *
   * @private
   */
  private clearDelonAuth(): void {
    this.tokenService.clear();
  }

  /**
   * 使用 Email 和密碼登入
   * Sign in with email and password
   *
   * @param {SignInCredentials} credentials - Login credentials
   * @returns {Observable<AuthResponse<Session>>} Authentication response
   */
  signIn(credentials: SignInCredentials): Observable<AuthResponse<Session>> {
    const client = this.supabaseService.getClient();

    return from(
      client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      map(({ data, error }) => ({
        data: data.session,
        error
      }))
    );
  }

  /**
   * 註冊新使用者
   * Sign up new user
   *
   * @param {SignUpCredentials} credentials - Signup credentials
   * @returns {Observable<AuthResponse<User>>} Authentication response
   */
  signUp(credentials: SignUpCredentials): Observable<AuthResponse<User>> {
    const client = this.supabaseService.getClient();

    return from(
      client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.options
      })
    ).pipe(
      map(({ data, error }) => ({
        data: data.user,
        error
      }))
    );
  }

  /**
   * 登出
   * Sign out
   *
   * @returns {Observable<{ error: any | null }>} Logout response
   */
  signOut(): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(client.auth.signOut()).pipe(
      tap(() => {
        this.clearDelonAuth();
      })
    );
  }

  /**
   * 使用 OAuth 提供商登入
   * Sign in with OAuth provider
   *
   * @param {Provider} provider - OAuth provider (google, github, etc.)
   * @returns {Observable<{ error: any | null }>} Authentication response
   */
  signInWithProvider(provider: Provider): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(
      client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
    );
  }

  /**
   * 重設密碼請求
   * Request password reset
   *
   * @param {string} email - User email
   * @returns {Observable<{ error: any | null }>} Reset response
   */
  resetPassword(email: string): Observable<{ error: any | null }> {
    const client = this.supabaseService.getClient();

    return from(
      client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
    );
  }

  /**
   * 更新密碼
   * Update password
   *
   * @param {string} newPassword - New password
   * @returns {Observable<AuthResponse<User>>} Update response
   */
  updatePassword(newPassword: string): Observable<AuthResponse<User>> {
    const client = this.supabaseService.getClient();

    return from(client.auth.updateUser({ password: newPassword })).pipe(
      map(({ data, error }) => ({
        data: data.user,
        error
      }))
    );
  }

  /**
   * 獲取當前 session
   * Get current session
   *
   * @returns {Observable<Session | null>} Current session
   */
  getSession(): Observable<Session | null> {
    return from(this.supabaseService.getSession());
  }

  /**
   * 獲取當前使用者
   * Get current user
   *
   * @returns {Observable<User | null>} Current user
   */
  getUser(): Observable<User | null> {
    return from(this.supabaseService.getUser());
  }

  /**
   * 檢查是否已登入
   * Check if user is authenticated
   *
   * @returns {boolean} True if authenticated
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value === AuthState.SIGNED_IN;
  }
}
