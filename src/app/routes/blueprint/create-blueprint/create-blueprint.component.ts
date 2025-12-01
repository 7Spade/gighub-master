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
import { BlueprintFacade, ModuleType, ContextType } from '@core';
import { CreateBlueprintRequest, WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

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
            <input
              nz-input
              formControlName="name"
              placeholder="請輸入藍圖名稱"
              [disabled]="loading()"
            />
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
            <input
              nz-input
              formControlName="coverUrl"
              placeholder="請輸入藍圖封面 URL（可選）"
              [disabled]="loading()"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>啟用模組</nz-form-label>
          <nz-form-control>
            <nz-select
              formControlName="enabledModules"
              nzMode="multiple"
              nzPlaceHolder="選擇要啟用的模組"
              [nzDisabled]="loading()"
            >
              @for (module of moduleOptions; track module.value) {
                <nz-option [nzValue]="module.value" [nzLabel]="module.label"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <label nz-checkbox formControlName="isPublic" [nzDisabled]="loading()">
              設為公開藍圖
            </label>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()">
        取消
      </button>
      <button
        nz-button
        type="button"
        nzType="primary"
        (click)="submit()"
        [nzLoading]="loading()"
        [disabled]="form.invalid"
      >
        建立藍圖
      </button>
    </div>
  `,
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule
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
    enabledModules: [[ModuleType.TASKS]],
    isPublic: [false]
  });

  moduleOptions = [
    { value: ModuleType.TASKS, label: '任務管理' },
    { value: ModuleType.DIARY, label: '施工日誌' },
    { value: ModuleType.DASHBOARD, label: '儀表板' },
    { value: ModuleType.FILES, label: '檔案管理' },
    { value: ModuleType.TODOS, label: '待辦事項' },
    { value: ModuleType.CHECKLISTS, label: '檢查清單' },
    { value: ModuleType.ISSUES, label: '問題追蹤' },
    { value: ModuleType.BOT_WORKFLOW, label: '自動化流程' }
  ];

  private ownerId = signal<string | null>(null);

  ngOnInit(): void {
    // Get owner ID from workspace context
    // If context is organization, use contextId; otherwise use currentUser's id
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    const currentUser = this.workspaceContext.currentUser();

    if (contextType === ContextType.ORGANIZATION && contextId) {
      this.ownerId.set(contextId);
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
        enabledModules: this.form.value.enabledModules || [ModuleType.TASKS],
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
