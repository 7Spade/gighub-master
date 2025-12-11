/**
 * Create Team Component
 *
 * 建立團隊組件
 * Create team component
 *
 * Allows users to create a new team within an organization.
 * Integrated with TeamFacade and WorkspaceContextService.
 *
 * @module routes/account
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContextType } from '@core';
import { TeamFacade, WorkspaceContextService, CreateTeamRequest } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-create-team',
  template: `
    <div class="modal-header">
      <div class="modal-title">建立團隊</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        @if (showOrgSelector()) {
          <nz-form-item>
            <nz-form-label [nzRequired]="true">所屬組織</nz-form-label>
            <nz-form-control [nzErrorTip]="'請選擇所屬組織'">
              <nz-select formControlName="organizationId" nzPlaceHolder="請選擇所屬組織" [nzDisabled]="loading()">
                @for (option of organizationOptions(); track option.value) {
                  <nz-option [nzValue]="option.value" [nzLabel]="option.label" />
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        } @else {
          <nz-form-item>
            <nz-form-label>所屬組織</nz-form-label>
            <nz-form-control>
              <input nz-input [value]="getCurrentOrgName()" disabled />
            </nz-form-control>
          </nz-form-item>
        }

        <nz-form-item>
          <nz-form-label [nzRequired]="true">團隊名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入團隊名稱（2-50個字符）'">
            <input nz-input formControlName="name" placeholder="請輸入團隊名稱" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>團隊描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入團隊描述（可選）"
              [nzAutosize]="{ minRows: 2, maxRows: 6 }"
              [disabled]="loading()"
            ></textarea>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()"> 取消 </button>
      <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
        建立團隊
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule]
})
export class CreateTeamComponent {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly teamFacade = inject(TeamFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);

  // 從上下文自動獲取組織 ID
  readonly currentOrgId = computed<string | null>(() => {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    return contextType === ContextType.ORGANIZATION ? contextId : null;
  });

  readonly showOrgSelector = computed(() => !this.currentOrgId());

  form: FormGroup = this.fb.group({
    organizationId: [this.currentOrgId() || '', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]]
  });

  readonly organizations = this.workspaceContext.organizations;

  readonly organizationOptions = computed(() => {
    const orgs = this.organizations();
    return orgs.map(org => ({
      value: org.id,
      label: org.name || '未命名組織'
    }));
  });

  /**
   * 提交表單創建團隊
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

    this.loading.set(true);
    try {
      const request: CreateTeamRequest = {
        organizationId: this.form.value.organizationId,
        name: this.form.value.name?.trim(),
        description: this.form.value.description?.trim() || undefined
      };
      const team = await this.teamFacade.createTeam(request);
      this.msg.success('團隊創建成功！');
      this.modal.close(team);
    } catch (error) {
      this.msg.error(error instanceof Error ? error.message : '創建團隊失敗');
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

  /**
   * 獲取當前組織名稱
   */
  getCurrentOrgName(): string {
    const orgId = this.currentOrgId();
    if (!orgId) return '';
    const org = this.organizations().find(o => o.id === orgId);
    return org?.name || '未命名組織';
  }
}
