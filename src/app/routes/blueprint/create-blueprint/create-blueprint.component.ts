/**
 * Create Blueprint Component
 *
 * 建立藍圖組件
 * Create blueprint component
 *
 * Allows users to create a new blueprint/workspace.
 * Integrated with BlueprintFacade.
 *
 * @module routes/blueprint
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BlueprintFacade, ModuleType, ContextType, ESSENTIAL_MODULES, DEFAULT_ENABLED_MODULES } from '@core';
import { CreateBlueprintRequest, WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-create-blueprint',
  template: `
    <div class="modal-header">
      <div class="modal-title">建立藍圖</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">藍圖名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入藍圖名稱（2-100個字符）'">
            <input nz-input formControlName="name" placeholder="請輸入藍圖名稱" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入藍圖描述（可選）"
              [nzAutosize]="{ minRows: 2, maxRows: 4 }"
              [disabled]="loading()"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>封面 URL</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="coverUrl" placeholder="請輸入藍圖封面 URL（可選）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>啟用模組</nz-form-label>
          <nz-form-control [nzExtra]="moduleHint">
            <nz-select formControlName="enabledModules" nzMode="multiple" nzPlaceHolder="選擇要啟用的模組" [nzDisabled]="loading()">
              @for (module of moduleOptions; track module.value) {
                <nz-option [nzValue]="module.value" [nzLabel]="module.label" nzCustomContent>
                  <span nz-icon [nzType]="module.icon"></span>
                  {{ module.label }}
                  @if (module.isCore) {
                    <span class="core-badge">核心</span>
                  }
                </nz-option>
              }
            </nz-select>
            <ng-template #moduleHint>
              <span class="hint-text">建議啟用核心模組以獲得完整的施工管理功能</span>
            </ng-template>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <label nz-checkbox formControlName="isPublic" [nzDisabled]="loading()"> 設為公開藍圖 </label>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()"> 取消 </button>
      <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
        建立藍圖
      </button>
    </div>
  `,
  styles: [
    `
      .modal-header {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
      }
      .modal-title {
        font-size: 16px;
        font-weight: 500;
      }
      .modal-body {
        padding: 24px;
      }
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
      }
      .modal-footer button + button {
        margin-left: 8px;
      }
      .core-badge {
        font-size: 10px;
        padding: 1px 4px;
        background: #1890ff;
        color: white;
        border-radius: 2px;
        margin-left: 6px;
      }
      .hint-text {
        font-size: 12px;
        color: #999;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzTooltipModule
  ]
})
export class CreateBlueprintComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
    coverUrl: [''],
    enabledModules: [DEFAULT_ENABLED_MODULES], // Use unified default configuration
    isPublic: [false]
  });

  // Use essential modules following Occam's Razor principle
  moduleOptions = ESSENTIAL_MODULES;

  private ownerId = signal<string | null>(null);

  ngOnInit(): void {
    // Get owner ID from workspace context
    // If context is organization, use contextAccountId; otherwise use currentUser's id
    const contextType = this.workspaceContext.contextType();
    const currentUser = this.workspaceContext.currentUser();

    if (contextType === ContextType.ORGANIZATION) {
      // 使用 contextAccountId 獲取組織的 account_id
      const accountId = this.workspaceContext.contextAccountId();
      this.ownerId.set(accountId);
    } else if (currentUser?.id) {
      this.ownerId.set(currentUser.id);
    }
  }

  /**
   * 提交表單創建藍圖
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsDirty();
        control?.updateValueAndValidity();
      });
      return;
    }

    const ownerId = this.ownerId();
    if (!ownerId) {
      this.msg.error('無法確定藍圖擁有者，請重新登入');
      return;
    }

    this.loading.set(true);
    try {
      const request: CreateBlueprintRequest = {
        ownerId,
        name: this.form.value.name?.trim(),
        description: this.form.value.description?.trim() || undefined,
        coverUrl: this.form.value.coverUrl?.trim() || undefined,
        enabledModules: this.form.value.enabledModules || DEFAULT_ENABLED_MODULES, // Use unified default
        isPublic: this.form.value.isPublic ?? false
      };
      const blueprint = await this.blueprintFacade.createBlueprint(request);
      this.msg.success('藍圖創建成功！');
      this.modal.close(blueprint);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '創建藍圖失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 取消並關閉模態框
   */
  cancel(): void {
    this.modal.destroy();
  }
}
