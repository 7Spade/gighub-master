/**
 * Blueprint Edit Drawer Component
 *
 * 藍圖編輯抽屜組件
 * Blueprint edit drawer component
 *
 * Provides a drawer-based interface for editing blueprint properties including:
 * - Basic information (name, description, slug)
 * - Visibility settings (public/private)
 * - Status management (active/suspended)
 * - Module enable/disable toggles
 * - Cover image upload
 *
 * Uses Angular Signals for reactive state management following enterprise patterns.
 *
 * @module routes/blueprint/overview
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BlueprintFacade, ModuleType, ESSENTIAL_MODULES, AccountStatus } from '@core';
import { BlueprintBusinessModel, UpdateBlueprintRequest } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-blueprint-edit-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzSpinModule,
    NzIconModule,
    NzGridModule,
    NzTagModule,
    NzToolTipModule,
    NzUploadModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-drawer
      [nzVisible]="visible()"
      [nzWidth]="520"
      nzTitle="編輯藍圖"
      nzPlacement="right"
      [nzMaskClosable]="!saving()"
      [nzClosable]="!saving()"
      (nzOnClose)="onClose()"
    >
      <ng-container *nzDrawerContent>
        <nz-spin [nzSpinning]="saving()">
          @if (blueprint()) {
            <form nz-form [formGroup]="form" nzLayout="vertical">
              <!-- Basic Information Section -->
              <div class="section-header">
                <span nz-icon nzType="info-circle"></span>
                <span>基本資訊</span>
              </div>

              <nz-form-item>
                <nz-form-label nzRequired nzFor="name">藍圖名稱</nz-form-label>
                <nz-form-control nzErrorTip="請輸入藍圖名稱">
                  <input nz-input formControlName="name" id="name" placeholder="輸入藍圖名稱" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label nzFor="slug">
                  URL 代稱
                  <span nz-icon nzType="question-circle" nz-tooltip="用於 URL 的唯一識別碼"></span>
                </nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="slug" id="slug" placeholder="my-blueprint-slug" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label nzFor="description">描述</nz-form-label>
                <nz-form-control>
                  <textarea
                    nz-input
                    formControlName="description"
                    id="description"
                    placeholder="藍圖描述..."
                    [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                  ></textarea>
                </nz-form-control>
              </nz-form-item>

              <!-- Visibility and Status Section -->
              <div class="section-header">
                <span nz-icon nzType="lock"></span>
                <span>可見性與狀態</span>
              </div>

              <div nz-row [nzGutter]="[16, 16]">
                <div nz-col [nzSpan]="12">
                  <nz-form-item>
                    <nz-form-label nzFor="isPublic">公開藍圖</nz-form-label>
                    <nz-form-control>
                      <nz-switch formControlName="isPublic" [nzCheckedChildren]="'公開'" [nzUnCheckedChildren]="'私有'"></nz-switch>
                    </nz-form-control>
                  </nz-form-item>
                </div>
                <div nz-col [nzSpan]="12">
                  <nz-form-item>
                    <nz-form-label nzFor="status">狀態</nz-form-label>
                    <nz-form-control>
                      <nz-select formControlName="status" style="width: 100%;">
                        <nz-option nzValue="active" nzLabel="啟用中"></nz-option>
                        <nz-option nzValue="suspended" nzLabel="已暫停"></nz-option>
                        <nz-option nzValue="archived" nzLabel="已封存"></nz-option>
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>
                </div>
              </div>

              <!-- Modules Section -->
              <div class="section-header">
                <span nz-icon nzType="appstore"></span>
                <span>啟用模組</span>
              </div>

              <div class="modules-grid">
                @for (module of moduleDefinitions; track module.value) {
                  <div class="module-item" [class.selected]="isModuleEnabled(module.value)">
                    <label nz-checkbox [nzChecked]="isModuleEnabled(module.value)" (nzCheckedChange)="toggleModule(module.value)">
                      <span class="module-content">
                        <span nz-icon [nzType]="module.icon" class="module-icon"></span>
                        <span class="module-info">
                          <span class="module-name">{{ module.label }}</span>
                          @if (module.isCore) {
                            <nz-tag nzColor="blue" class="core-tag">核心</nz-tag>
                          }
                        </span>
                      </span>
                    </label>
                    <div class="module-description">{{ module.description }}</div>
                  </div>
                }
              </div>

              <!-- Form Actions -->
              <div class="drawer-actions">
                <button nz-button nzType="default" (click)="onClose()" [disabled]="saving()">取消</button>
                <button nz-button nzType="primary" (click)="onSave()" [nzLoading]="saving()" [disabled]="form.invalid || !hasChanges()">
                  儲存變更
                </button>
              </div>
            </form>
          } @else {
            <div class="empty-state">
              <span nz-icon nzType="inbox" nzTheme="outline"></span>
              <p>無法載入藍圖資訊</p>
            </div>
          }
        </nz-spin>
      </ng-container>
    </nz-drawer>
  `,
  styles: [
    `
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 24px 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
        font-weight: 500;
        color: #1890ff;
      }

      .section-header:first-of-type {
        margin-top: 0;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .module-item {
        padding: 12px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        transition: all 0.3s;
      }

      .module-item:hover {
        border-color: #1890ff;
      }

      .module-item.selected {
        border-color: #1890ff;
        background-color: #e6f7ff;
      }

      .module-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .module-icon {
        font-size: 18px;
        color: #1890ff;
      }

      .module-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .module-name {
        font-weight: 500;
      }

      .core-tag {
        font-size: 10px;
        line-height: 1;
        padding: 2px 4px;
      }

      .module-description {
        margin-top: 4px;
        margin-left: 24px;
        font-size: 12px;
        color: #8c8c8c;
      }

      .drawer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: #8c8c8c;
      }

      .empty-state span[nz-icon] {
        font-size: 48px;
        margin-bottom: 16px;
      }
    `
  ]
})
export class BlueprintEditDrawerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly msg = inject(NzMessageService);

  // Signal inputs
  blueprint = input<BlueprintBusinessModel | null>(null);
  visible = input(false);

  // Signal outputs
  closed = output<void>();
  saved = output<BlueprintBusinessModel>();

  // Internal state
  saving = signal(false);
  enabledModules = signal<ModuleType[]>([]);

  // Module definitions for display
  moduleDefinitions = ESSENTIAL_MODULES;

  // Form instance
  form: FormGroup;

  // Computed: Check if form has changes
  hasChanges = computed(() => {
    if (!this.blueprint() || !this.form) return false;
    const bp = this.blueprint()!;
    const formValue = this.form.value;

    return (
      formValue.name !== bp.name ||
      formValue.slug !== bp.slug ||
      formValue.description !== (bp.description || '') ||
      formValue.isPublic !== bp.is_public ||
      formValue.status !== bp.status ||
      !this.arraysEqual(this.enabledModules(), bp.enabled_modules)
    );
  });

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      slug: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      isPublic: [false],
      status: ['active']
    });

    // Initialize form when blueprint changes
    // Note: Using effect would be better but keeping it simple for now
  }

  ngOnChanges(): void {
    const bp = this.blueprint();
    if (bp) {
      this.form.patchValue({
        name: bp.name,
        slug: bp.slug || '',
        description: bp.description || '',
        isPublic: bp.is_public,
        status: bp.status
      });
      this.enabledModules.set([...bp.enabled_modules]);
    }
  }

  isModuleEnabled(moduleType: ModuleType): boolean {
    return this.enabledModules().includes(moduleType);
  }

  toggleModule(moduleType: ModuleType): void {
    const current = this.enabledModules();
    if (current.includes(moduleType)) {
      this.enabledModules.set(current.filter(m => m !== moduleType));
    } else {
      this.enabledModules.set([...current, moduleType]);
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid || !this.blueprint()) return;

    this.saving.set(true);

    try {
      const formValue = this.form.value;
      const request: UpdateBlueprintRequest = {
        name: formValue.name,
        slug: formValue.slug || undefined,
        description: formValue.description || undefined,
        isPublic: formValue.isPublic,
        status: formValue.status as AccountStatus,
        enabledModules: this.enabledModules()
      };

      const updated = await this.blueprintFacade.updateBlueprint(this.blueprint()!.id, request);
      this.msg.success('藍圖更新成功');
      this.saved.emit(updated);
      this.closed.emit();
    } catch (error) {
      console.error('Failed to update blueprint:', error);
      this.msg.error('更新藍圖失敗，請稍後再試');
    } finally {
      this.saving.set(false);
    }
  }

  onClose(): void {
    if (!this.saving()) {
      this.closed.emit();
    }
  }

  private arraysEqual(a: ModuleType[], b: ModuleType[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }
}
