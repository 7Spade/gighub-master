import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

import { LoggerService } from '../logger';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);
  private _session = new BehaviorSubject<Session | null>(null);
  private _isConfigured = false;
  private logger = inject(LoggerService);

  constructor() {
    const supabaseConfig = environment['supabase'] as { url?: string; anonKey?: string } | undefined;
    const url = supabaseConfig?.url;
    const anonKey = supabaseConfig?.anonKey;

    if (!url || !anonKey) {
      this.logger.error(
        '[SupabaseService] Supabase configuration is missing. ' +
          'Please check src/environments/environment.ts or environment.prod.ts for proper configuration.'
      );
      // Create a placeholder client with empty values to prevent app crash
      // The app will show appropriate error messages when Supabase operations are attempted
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          persistSession: false
        }
      });
      this._isConfigured = false;
    } else {
      // Configure Supabase client with optimized auth settings
      // - storageKey: Use a unique key to avoid conflicts between tabs/windows
      // - lock: Custom lock function to prevent NavigatorLockAcquireTimeoutError
      this.supabase = createClient(url, anonKey, {
        auth: {
          storageKey: 'gighub-auth-token',
          // Custom lock function that executes immediately without using Navigator Locks API
          // This prevents NavigatorLockAcquireTimeoutError in multi-tab scenarios
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
            return await fn();
          },
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      this._isConfigured = true;
    }

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this._session.next(session);
      this._currentUser.next(session?.user ?? null);
    });

    // Initialize session from storage
    this.loadSession();
  }

  private async loadSession(): Promise<void> {
    const {
      data: { session }
    } = await this.supabase.auth.getSession();
    this._session.next(session);
    this._currentUser.next(session?.user ?? null);
  }

  /**
   * Get the Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Observable for current user
   */
  get currentUser$(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  /**
   * Observable for current session
   */
  get session$(): Observable<Session | null> {
    return this._session.asObservable();
  }

  /**
   * Get current user synchronously
   */
  get currentUser(): User | null {
    return this._currentUser.value;
  }

  /**
   * Get current session synchronously
   */
  get session(): Session | null {
    return this._session.value;
  }

  /**
   * Check if Supabase is properly configured
   */
  get isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email);
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
  }

  /**
   * Query data from a table
   */
  from(table: string) {
    return this.supabase.from(table);
  }

  /**
   * Access Supabase Storage
   */
  get storage() {
    return this.supabase.storage;
  }

  /**
   * Access Supabase Realtime
   */
  get realtime() {
    return this.supabase.realtime;
  }

  /**
   * Access Supabase Functions
   */
  get functions() {
    return this.supabase.functions;
  }
}
