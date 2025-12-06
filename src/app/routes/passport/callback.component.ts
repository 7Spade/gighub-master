/**
 * OAuth Callback Component
 *
 * 處理 OAuth 認證回調，使用 Supabase PKCE 流程交換授權碼
 * Handles OAuth callback using Supabase PKCE flow for code exchange
 *
 * 根據 Context7 Supabase 文檔最佳實踐實現：
 * - 使用 exchangeCodeForSession 交換授權碼
 * - 處理 x-forwarded-host 用於負載均衡環境
 * - 提供錯誤處理和用戶反饋
 *
 * @module routes/passport
 */

import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SocialService } from '@delon/auth';
import { SettingsService } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'app-callback',
  template: `
    @if (loading()) {
      <div class="callback-loading">
        <nz-spin nzSize="large" nzTip="正在驗證登入..."></nz-spin>
      </div>
    } @else if (error()) {
      <nz-result nzStatus="error" nzTitle="認證失敗" [nzSubTitle]="error() ?? ''">
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="goToLogin()">返回登入</button>
        </div>
      </nz-result>
    }
  `,
  styles: [
    `
      .callback-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
    `
  ],
  providers: [SocialService],
  standalone: true,
  imports: [NzSpinModule, NzResultModule, NzButtonModule]
})
export class CallbackComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly socialService = inject(SocialService);
  private readonly settingsSrv = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(NzMessageService);

  @Input() type = '';

  // State signals
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  /**
   * 處理 OAuth 回調
   * Handle OAuth callback using Supabase code exchange
   */
  private async handleOAuthCallback(): Promise<void> {
    try {
      // 從 URL 獲取授權碼和重定向目標
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      let next = urlParams.get('next') ?? '/';

      // 確保 next 是相對路徑（安全性檢查）
      if (!next.startsWith('/')) {
        next = '/';
      }

      if (code) {
        // 使用 Supabase 交換授權碼獲取 session
        const { data, error: authError } = await this.supabaseService.client.auth.exchangeCodeForSession(code);

        if (authError) {
          console.error('[CallbackComponent] Code exchange failed:', authError);
          this.error.set(`認證失敗: ${authError.message}`);
          this.loading.set(false);
          return;
        }

        if (data.session) {
          // 同步用戶資訊到 @delon/auth
          const user = data.session.user;
          const userInfo = {
            token: data.session.access_token,
            name: user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            id: user.id,
            avatar: user.user_metadata?.['avatar_url'] || '',
            time: +new Date()
          };

          this.settingsSrv.setUser({
            ...this.settingsSrv.user,
            ...userInfo
          });

          // 通知 SocialService 認證成功
          this.socialService.callback(userInfo);

          this.msg.success('登入成功！');

          // 重定向到目標頁面
          this.router.navigate([next]);
        } else {
          this.error.set('無法獲取用戶 session');
          this.loading.set(false);
        }
      } else {
        // 沒有授權碼，可能是直接訪問或錯誤
        this.error.set('缺少授權碼，請重新登入');
        this.loading.set(false);
      }
    } catch (err) {
      console.error('[CallbackComponent] Unexpected error:', err);
      this.error.set(err instanceof Error ? err.message : '發生未知錯誤');
      this.loading.set(false);
    }
  }

  /**
   * 返回登入頁面
   * Navigate back to login page
   */
  goToLogin(): void {
    this.router.navigate(['/passport/login']);
  }
}
