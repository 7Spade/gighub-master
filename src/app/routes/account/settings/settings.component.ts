/**
 * Account Settings Component
 *
 * 組織設定組件
 * Organization settings component
 *
 * Provides settings management for the current organization.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContextType, OrganizationFacade } from '@core';
import { WorkspaceContextService, OrganizationBusinessModel, UpdateOrganizationRequest } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'app-account-settings',
  template: `
    <div class="settings-container">
      <div class="page-header">
        <h2>組織設定</h2>
      </div>

      @if (!isOrganizationContext()) {
        <nz-card [nzBordered]="false">
          <nz-empty nzNotFoundContent="請先切換到組織上下文以管理設定"></nz-empty>
        </nz-card>
      } @else {
        <nz-spin [nzSpinning]="loading()">
          <nz-card nzTitle="基本資訊" [nzBordered]="false">
            <form nz-form [formGroup]="form" nzLayout="vertical">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
                <nz-form-control [nzErrorTip]="'請輸入組織名稱（2-50個字符）'">
                  <input
                    nz-input
                    formControlName="name"
                    placeholder="請輸入組織名稱"
                  />
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
                  <input
                    nz-input
                    formControlName="logoUrl"
                    placeholder="請輸入組織 Logo URL（可選）"
                  />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <button
                  nz-button
                  nzType="primary"
                  (click)="saveSettings()"
                  [nzLoading]="saving()"
                  [disabled]="form.invalid || !form.dirty"
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
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h2 {
      margin: 0;
    }
    .danger-zone {
      border: 1px solid #ff4d4f;
    }
    .warning-text {
      color: #ff4d4f;
      margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    NzEmptyModule,
    NzDividerModule,
    NzPopconfirmModule
  ]
})
export class AccountSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly organizationFacade = inject(OrganizationFacade);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  saving = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]],
    logoUrl: ['']
  });

  readonly isOrganizationContext = computed(() => {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  });

  readonly currentOrganization = this.workspaceContext.currentOrganization;

  ngOnInit(): void {
    if (this.isOrganizationContext()) {
      this.loadSettings();
    }
  }

  private loadSettings(): void {
    const org = this.currentOrganization();
    if (org) {
      this.form.patchValue({
        name: org.name || '',
        description: org.description || '',
        logoUrl: org.logo_url || ''
      });
      this.form.markAsPristine();
    }
  }

  async saveSettings(): Promise<void> {
    if (this.form.invalid) return;

    const org = this.currentOrganization();
    if (!org) {
      this.msg.error('無法找到當前組織');
      return;
    }

    this.saving.set(true);
    try {
      const request: UpdateOrganizationRequest = {
        name: this.form.value.name?.trim()
      };

      await this.organizationFacade.updateOrganization(org.id, request);
      this.msg.success('設定已儲存');
      this.form.markAsPristine();
      this.workspaceContext.reload();
    } catch (error) {
      console.error('[AccountSettingsComponent] Failed to save settings:', error);
      this.msg.error('儲存設定失敗');
    } finally {
      this.saving.set(false);
    }
  }

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
      const user = this.workspaceContext.currentUser();
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
