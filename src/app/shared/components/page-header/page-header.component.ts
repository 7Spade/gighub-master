/**
 * Page Header Component
 *
 * 頁面標頭元件
 * Unified page header component for consistent UI
 *
 * Features:
 * - Back button with navigation
 * - Title and subtitle
 * - Action buttons slot
 * - Avatar support (optional)
 *
 * @module shared/components/page-header
 */

import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NzButtonModule, NzIconModule, NzAvatarModule],
  template: `
    <div class="page-header" [class.with-avatar]="avatarSrc() || avatarIcon()">
      <div class="header-left">
        @if (showBack()) {
          <button nz-button nzType="text" (click)="onBack()" class="back-button">
            <span nz-icon nzType="arrow-left"></span>
          </button>
        }
        @if (avatarSrc() || avatarIcon()) {
          @if (avatarSrc()) {
            <nz-avatar [nzSize]="64" [nzSrc]="avatarSrc()!" nzShape="square"></nz-avatar>
          } @else {
            <nz-avatar [nzSize]="64" [nzIcon]="avatarIcon()!" nzShape="square"></nz-avatar>
          }
        }
        <div class="title-section">
          <h3 class="page-title">{{ title() }}</h3>
          @if (subtitle()) {
            <span class="page-subtitle">{{ subtitle() }}</span>
          }
        </div>
      </div>
      <div class="header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 24px;
        border-radius: 8px;
        background: #fff;

        &.with-avatar {
          align-items: flex-start;
        }
      }

      .header-left {
        display: flex;
        gap: 16px;
        align-items: center;

        .with-avatar & {
          align-items: flex-start;
        }
      }

      .back-button {
        padding: 4px 8px;
        color: #666;
        transition: all 0.3s ease;

        &:hover {
          color: #1890ff;
        }
      }

      .title-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .page-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .page-subtitle {
        font-size: 14px;
        color: #666;
      }

      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  private readonly router = inject(Router);

  // Input signals
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly showBack = input<boolean>(true);
  readonly backUrl = input<string | string[]>();
  readonly avatarSrc = input<string>();
  readonly avatarIcon = input<string>();

  // Output signals
  readonly backClick = output<void>();

  onBack(): void {
    this.backClick.emit();
    const url = this.backUrl();
    if (url) {
      if (Array.isArray(url)) {
        this.router.navigate(url);
      } else {
        this.router.navigateByUrl(url);
      }
    } else {
      window.history.back();
    }
  }
}
