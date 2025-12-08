/**
 * Supabase Email Authentication Register Component
 *
 * 使用 Supabase 電子郵件認證的註冊元件
 * Register component using Supabase email authentication
 *
 * Email-only registration (no phone number required)
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseAuthService, LoggerService } from '@core';
import { I18nPipe } from '@delon/theme';
import { MatchControl } from '@delon/util/form';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzProgressModule } from 'ng-zorro-antd/progress';

@Component({
  selector: 'passport-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    I18nPipe,
    RouterLink,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzPopoverModule,
    NzProgressModule,
    NzButtonModule
  ]
})
export class UserRegisterComponent {
  private readonly router = inject(Router);
  private readonly supabaseAuth = inject(SupabaseAuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);

  // Form with email and password only (no phone)
  form = inject(FormBuilder).nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), UserRegisterComponent.checkPassword.bind(this)]],
      confirm: ['', [Validators.required, Validators.minLength(6)]]
    },
    {
      validators: MatchControl('password', 'confirm')
    }
  );
  error = '';
  loading = false;
  visible = false;
  status = 'pool';
  progress = 0;
  passwordProgressMap: Record<string, 'success' | 'normal' | 'exception'> = {
    ok: 'success',
    pass: 'normal',
    pool: 'exception'
  };

  static checkPassword(control: FormControl): NzSafeAny {
    if (!control) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: NzSafeAny = this;
    self.visible = !!control.value;
    if (control.value && control.value.length > 9) {
      self.status = 'ok';
    } else if (control.value && control.value.length > 5) {
      self.status = 'pass';
    } else {
      self.status = 'pool';
    }

    if (self.visible) {
      self.progress = control.value.length * 10 > 100 ? 100 : control.value.length * 10;
    }
  }

  submit(): void {
    this.error = '';

    // Mark all controls as dirty and validate
    const { email, password, confirm } = this.form.controls;
    email.markAsDirty();
    email.updateValueAndValidity();
    password.markAsDirty();
    password.updateValueAndValidity();
    confirm.markAsDirty();
    confirm.updateValueAndValidity();

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const passwordValue = String(this.form.controls.password.value);

    this.supabaseAuth
      .signUp({
        email: this.form.value.email!,
        password: passwordValue
      })
      .subscribe({
        next: ({ error }) => {
          this.loading = false;

          if (error) {
            this.error = error.message || '註冊失敗，請檢查您的 Supabase 設定。';
            this.cdr.detectChanges();
            return;
          }

          // Navigate to registration result page
          this.router.navigate(['passport', 'register-result'], { queryParams: { email: this.form.value.email } });
        },
        error: err => {
          this.error = '無法連接認證服務，請檢查設定。';
          this.logger.error('Registration error', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
