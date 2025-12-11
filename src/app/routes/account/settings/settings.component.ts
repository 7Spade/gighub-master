/**
 * Account Settings Component
 *
 * 帳戶設定組件
 * Account settings component
 *
 * Provides settings management for the current context (user or organization).
 * Supports both USER context (個人設定) and ORGANIZATION context (組織設定).
 *
 * @module routes/account
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContextType } from '@core';
import { OrganizationFacade, WorkspaceContextService, UpdateOrganizationRequest, AccountService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-account-settings',
  template: `
    <div class="settings-container">
      <div class="page-header">
        <h2>{{ pageTitle() }}</h2>
      </div>

      @switch (contextType()) {
        @case (ContextType.USER) {
          <!-- 個人設定 / User Settings -->
          <nz-spin [nzSpinning]="loading()">
            <nz-card nzTitle="個人資料" [nzBordered]="false">
              <div class="avatar-section">
                <nz-avatar [nzSize]="80" [nzSrc]="currentUser()?.avatar_url || ''" [nzIcon]="'user'"></nz-avatar>
                <div class="avatar-info">
                  <span class="user-name">{{ currentUser()?.name || '未設定' }}</span>
                  <span class="user-email">{{ currentUser()?.email || '' }}</span>
                </div>
              </div>

              <nz-divider></nz-divider>

              <form nz-form [formGroup]="userForm" nzLayout="vertical">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">顯示名稱</nz-form-label>
                  <nz-form-control [nzErrorTip]="'請輸入顯示名稱（2-50個字符）'">
                    <input nz-input formControlName="name" placeholder="請輸入顯示名稱" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>頭像 URL</nz-form-label>
                  <nz-form-control>
                    <input nz-input formControlName="avatarUrl" placeholder="請輸入頭像 URL（可選）" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <button
                    nz-button
                    nzType="primary"
                    (click)="saveUserSettings()"
                    [nzLoading]="saving()"
                    [disabled]="userForm.invalid || !userForm.dirty"
                  >
                    儲存變更
                  </button>
                </nz-form-item>
              </form>
            </nz-card>

            <nz-divider></nz-divider>

            <nz-card nzTitle="帳戶資訊" [nzBordered]="false">
              <div class="info-row">
                <span class="info-label">帳戶 ID</span>
                <span class="info-value">{{ currentUser()?.id || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">帳戶狀態</span>
                <span class="info-value">{{ currentUser()?.status || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">建立時間</span>
                <span class="info-value">{{ currentUser()?.created_at | date: 'yyyy-MM-dd HH:mm' }}</span>
              </div>
            </nz-card>
          </nz-spin>
        }

        @case (ContextType.ORGANIZATION) {
          <!-- 組織設定 / Organization Settings -->
          <nz-spin [nzSpinning]="loading()">
            <nz-card nzTitle="基本資訊" [nzBordered]="false">
              <form nz-form [formGroup]="orgForm" nzLayout="vertical">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
                  <nz-form-control [nzErrorTip]="'請輸入組織名稱（2-50個字符）'">
                    <input nz-input formControlName="name" placeholder="請輸入組織名稱" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>組織描述</nz-form-label>
                  <nz-form-control>
                    <textarea
                      nz-input
                      formControlName="description"
                      placeholder="請輸入組織描述（可選）"
                      [nzAutosize]="{ minRows: 2, maxRows: 6 }"
                    ></textarea>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Logo URL</nz-form-label>
                  <nz-form-control>
                    <input nz-input formControlName="logoUrl" placeholder="請輸入組織 Logo URL（可選）" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <button
                    nz-button
                    nzType="primary"
                    (click)="saveOrgSettings()"
                    [nzLoading]="saving()"
                    [disabled]="orgForm.invalid || !orgForm.dirty"
                  >
                    儲存變更
                  </button>
                </nz-form-item>
              </form>
            </nz-card>

            <nz-divider></nz-divider>

            <nz-card nzTitle="危險區域" [nzBordered]="false" class="danger-zone">
              <p class="warning-text">刪除組織將會移除所有相關的團隊、成員及資料。此操作無法復原。</p>
              <button
                nz-button
                nzType="primary"
                nzDanger
                nz-popconfirm
                nzPopconfirmTitle="確定要刪除此組織嗎？此操作無法復原！"
                (nzOnConfirm)="deleteOrganization()"
                nzOkText="確定刪除"
                nzCancelText="取消"
              >
                刪除組織
              </button>
            </nz-card>
          </nz-spin>
        }

        @default {
          <!-- 其他上下文 - 顯示空狀態 -->
          <nz-card [nzBordered]="false">
            <nz-empty nzNotFoundContent="請切換到個人帳戶或組織以管理設定"></nz-empty>
          </nz-card>
        }
      }
    </div>
  `,
  styles: [
    `
      .settings-container {
        padding: 24px;
      }
      .page-header {
        margin-bottom: 24px;
      }
      .page-header h2 {
        margin: 0;
      }
      .avatar-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .avatar-info {
        display: flex;
        flex-direction: column;
      }
      .user-name {
        font-size: 18px;
        font-weight: 500;
      }
      .user-email {
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
      }
      .info-row {
        display: flex;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .info-row:last-child {
        border-bottom: none;
      }
      .info-label {
        width: 120px;
        color: rgba(0, 0, 0, 0.45);
      }
      .info-value {
        flex: 1;
      }
      .danger-zone {
        border: 1px solid #ff4d4f;
      }
      .warning-text {
        color: #ff4d4f;
        margin-bottom: 16px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzSpinModule
  ]
})
export class AccountSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly accountService = inject(AccountService);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly msg = inject(NzMessageService);

  // Expose ContextType enum for template
  protected readonly ContextType = ContextType;

  loading = signal(false);
  saving = signal(false);

  // User settings form
  userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    avatarUrl: ['']
  });

  // Organization settings form
  orgForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]],
    logoUrl: ['']
  });

  readonly contextType = this.workspaceContext.contextType;
  readonly currentUser = this.workspaceContext.currentUser;
  readonly currentOrganization = this.workspaceContext.currentOrganization;

  readonly pageTitle = computed(() => {
    const type = this.contextType();
    switch (type) {
      case ContextType.USER:
        return '個人設定';
      case ContextType.ORGANIZATION:
        return '組織設定';
      default:
        return '設定';
    }
  });

  constructor() {
    // React to context changes
    effect(() => {
      const type = this.contextType();
      console.log('[AccountSettingsComponent] Context changed:', type);
      this.loadSettingsForContext(type);
    });
  }

  ngOnInit(): void {
    this.loadSettingsForContext(this.contextType());
  }

  /**
   * Load settings based on current context type
   */
  private loadSettingsForContext(type: ContextType): void {
    switch (type) {
      case ContextType.USER:
        this.loadUserSettings();
        break;
      case ContextType.ORGANIZATION:
        this.loadOrgSettings();
        break;
    }
  }

  /**
   * Load user settings into form
   */
  private loadUserSettings(): void {
    const user = this.currentUser();
    if (user) {
      this.userForm.patchValue({
        name: user.name || '',
        avatarUrl: user.avatar_url || ''
      });
      this.userForm.markAsPristine();
    }
  }

  /**
   * Load organization settings into form
   */
  private loadOrgSettings(): void {
    const org = this.currentOrganization();
    if (org) {
      this.orgForm.patchValue({
        name: org.name || '',
        description: org.description || '',
        logoUrl: org.logo_url || ''
      });
      this.orgForm.markAsPristine();
    }
  }

  /**
   * Save user settings
   */
  async saveUserSettings(): Promise<void> {
    if (this.userForm.invalid) return;

    const user = this.currentUser();
    if (!user) {
      this.msg.error('無法找到當前用戶');
      return;
    }

    this.saving.set(true);
    try {
      await this.accountService.updateAccount(user.id, {
        name: this.userForm.value.name?.trim(),
        avatar_url: this.userForm.value.avatarUrl?.trim() || null
      });
      this.msg.success('個人設定已儲存');
      this.userForm.markAsPristine();
      this.workspaceContext.reload();
    } catch (error) {
      console.error('[AccountSettingsComponent] Failed to save user settings:', error);
      this.msg.error('儲存設定失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Save organization settings
   */
  async saveOrgSettings(): Promise<void> {
    if (this.orgForm.invalid) return;

    const org = this.currentOrganization();
    if (!org) {
      this.msg.error('無法找到當前組織');
      return;
    }

    this.saving.set(true);
    try {
      const request: UpdateOrganizationRequest = {
        name: this.orgForm.value.name?.trim()
      };

      await this.organizationFacade.updateOrganization(org.id, request);
      this.msg.success('組織設定已儲存');
      this.orgForm.markAsPristine();
      this.workspaceContext.reload();
    } catch (error) {
      console.error('[AccountSettingsComponent] Failed to save org settings:', error);
      this.msg.error('儲存設定失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(): Promise<void> {
    const org = this.currentOrganization();
    if (!org) {
      this.msg.error('無法找到當前組織');
      return;
    }

    try {
      await this.organizationFacade.deleteOrganization(org.id);
      this.msg.success('組織已刪除');
      // Switch back to user context
      const user = this.currentUser();
      if (user?.id) {
        this.workspaceContext.switchToUser(user.id);
      }
      this.workspaceContext.reload();
    } catch (error) {
      console.error('[AccountSettingsComponent] Failed to delete organization:', error);
      this.msg.error('刪除組織失敗');
    }
  }
}
