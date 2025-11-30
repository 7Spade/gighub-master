/**
 * Supabase Email Authentication Login Component
 *
 * 使用 Supabase 電子郵件認證的登入元件
 * Login component using Supabase email authentication
 *
 * Replaces phone-based authentication with email-based authentication
 * Integrates Supabase Auth with @delon/auth TokenService
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StartupService, SupabaseAuthService } from '@core';
import { ReuseTabService } from '@delon/abc/reuse-tab';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    I18nPipe,
    NzCheckboxModule,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ]
})
export class UserLoginComponent {
  private readonly router = inject(Router);
  private readonly reuseTabService = inject(ReuseTabService, { optional: true });
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly startupSrv = inject(StartupService);
  private readonly supabaseAuth = inject(SupabaseAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });
  error = '';
  loading = false;

  async submit(): Promise<void> {
    this.error = '';
    const { email, password } = this.form.controls;
    email.markAsDirty();
    email.updateValueAndValidity();
    password.markAsDirty();
    password.updateValueAndValidity();

    if (email.invalid || password.invalid) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.supabaseAuth
      .signIn({
        email: this.form.value.email!,
        password: this.form.value.password!
      })
      .subscribe({
        next: ({ data, error }) => {
          if (error) {
            this.error = error.message || 'Login failed. Please check your credentials.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          if (data) {
            // Clear route reuse information
            this.reuseTabService?.clear();

            // Reload startup service (user-specific app data)
            this.startupSrv.load().subscribe(() => {
              let url = this.tokenService.referrer!.url || '/';
              if (url.includes('/passport')) {
                url = '/';
              }
              this.router.navigateByUrl(url);
            });
          }
        },
        error: err => {
          this.error = 'An unexpected error occurred. Please try again.';
          console.error('Login error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
