/**
 * Mock Supabase Auth Service for E2E Testing
 * 
 * 用於 E2E 測試的 Mock Supabase 認證服務
 * 
 * This mock service simulates Supabase authentication without requiring
 * network access to the actual Supabase backend. Useful for:
 * - CI/CD environments with network restrictions
 * - Offline development and testing
 * - Faster test execution
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AuthResponse, SignInCredentials, SignUpCredentials } from '../supabase/supabase-auth.service';

/**
 * Mock user database for testing
 */
const MOCK_USERS = [
  {
    id: 'test-user-001',
    email: 'ac7x@pm.me',
    password: '123123', // In real scenarios, this would be hashed
    created_at: '2024-01-01T00:00:00Z',
    user_metadata: {
      name: 'Test User'
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class MockSupabaseAuthService {
  private readonly tokenService = inject(DA_SERVICE_TOKEN) as ITokenService;
  private readonly router = inject(Router);
  
  private currentMockUser: any = null;

  /**
   * Mock sign in with email and password
   * Simulates 500ms network delay
   */
  signIn(credentials: SignInCredentials): Observable<AuthResponse<any>> {
    const user = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      return throwError(() => ({
        data: null,
        error: {
          message: 'Invalid login credentials',
          status: 400
        }
      })).pipe(delay(500));
    }

    // Create mock session
    const mockSession = {
      access_token: `mock-token-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_at: Date.now() + 3600000, // 1 hour
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata
      }
    };

    // Store session
    this.currentMockUser = mockSession.user;
    this.tokenService.set({
      token: mockSession.access_token,
      refresh_token: mockSession.refresh_token,
      expired: mockSession.expires_at,
      user: mockSession.user
    });

    return of({
      data: mockSession,
      error: null
    }).pipe(delay(500)); // Simulate network delay
  }

  /**
   * Mock sign up
   */
  signUp(credentials: SignUpCredentials): Observable<AuthResponse<any>> {
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (existingUser) {
      return throwError(() => ({
        data: null,
        error: {
          message: 'User already registered',
          status: 400
        }
      })).pipe(delay(500));
    }

    // Create new mock user
    const newUser = {
      id: `mock-user-${Date.now()}`,
      email: credentials.email,
      created_at: new Date().toISOString(),
      user_metadata: credentials.options?.data || {}
    };

    return of({
      data: { user: newUser },
      error: null
    }).pipe(delay(500));
  }

  /**
   * Mock sign out
   */
  signOut(): Observable<{ error: any | null }> {
    this.currentMockUser = null;
    this.tokenService.clear();
    this.router.navigate(['/passport/login']);
    
    return of({ error: null }).pipe(delay(200));
  }

  /**
   * Mock password reset
   */
  resetPassword(email: string): Observable<{ error: any | null }> {
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (!user) {
      return throwError(() => ({
        error: {
          message: 'User not found',
          status: 404
        }
      })).pipe(delay(500));
    }

    return of({ error: null }).pipe(delay(500));
  }

  /**
   * Get current mock user
   */
  getCurrentUser(): any {
    return this.currentMockUser;
  }

  /**
   * Get current mock session
   */
  getCurrentSession(): any {
    const token = this.tokenService.get()?.token;
    if (!token) return null;

    return {
      access_token: token,
      user: this.currentMockUser
    };
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.tokenService.get()?.token;
  }
}
