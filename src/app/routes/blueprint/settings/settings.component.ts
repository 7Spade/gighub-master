/**
 * Blueprint Settings Component
 *
 * 藍圖設定組件
 * Blueprint settings component
 *
 * Provides configuration management for a blueprint including:
 * - 基本設定: Working hours, timezone, language
 * - 模組設定: Enable/disable modules
 * - 通知設定: Notification preferences
 * - 標籤管理: Custom tags management
 *
 * @module routes/blueprint/settings
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleType, MODULES_CONFIG, isModuleEnabledByDefault } from '@core';
import { BlueprintFacade, BlueprintBusinessModel, WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface ModuleSetting {
  key: ModuleType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

@Component({
  selector: 'app-blueprint-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzTabsModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzResultModule,
    NzDividerModule,
    NzGridModule,
    NzTimePickerModule,
    NzToolTipModule,
    NzModalModule
  ],
  template: `
    <div class="settings-container">
      <nz-spin [nzSpinning]="loading()">
        @if (error()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error() || '未知錯誤'">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回概覽</button>
            </div>
          </nz-result>
        } @else if (blueprint()) {
          <!-- Header -->
          <div class="settings-header">
            <div class="header-left">
              <button nz-button (click)="goBack()">
                <span nz-icon nzType="arrow-left"></span>
                返回
              </button>
              <h2>{{ blueprint()!.name }} - 設定</h2>
            </div>
            <div class="header-right">
              <button nz-button nzType="primary" [disabled]="!hasChanges()" (click)="saveSettings()">
                <span nz-icon nzType="save"></span>
                儲存變更
              </button>
            </div>
          </div>

          <!-- Settings Tabs -->
          <nz-tabs nzType="card">
            <!-- 基本設定 Tab -->
            <nz-tab nzTitle="基本設定">
              <nz-card [nzBordered]="false" nzTitle="工作時間設定">
                <form nz-form [formGroup]="basicForm" nzLayout="vertical">
                  <div nz-row [nzGutter]="16">
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="workStartTime">上班時間</nz-form-label>
                        <nz-form-control>
                          <nz-time-picker formControlName="workStartTime" nzFormat="HH:mm" style="width: 100%"></nz-time-picker>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="workEndTime">下班時間</nz-form-label>
                        <nz-form-control>
                          <nz-time-picker formControlName="workEndTime" nzFormat="HH:mm" style="width: 100%"></nz-time-picker>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                  </div>

                  <nz-form-item>
                    <nz-form-label nzFor="workDays">工作日</nz-form-label>
                    <nz-form-control>
                      <nz-checkbox-group formControlName="workDays" [nzOptions]="workDayOptions"></nz-checkbox-group>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-divider></nz-divider>

                  <div nz-row [nzGutter]="16">
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="timezone">時區</nz-form-label>
                        <nz-form-control>
                          <nz-select formControlName="timezone" nzPlaceHolder="選擇時區">
                            @for (tz of timezones; track tz.value) {
                              <nz-option [nzValue]="tz.value" [nzLabel]="tz.label"></nz-option>
                            }
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="language">語言</nz-form-label>
                        <nz-form-control>
                          <nz-select formControlName="language" nzPlaceHolder="選擇語言">
                            <nz-option nzValue="zh-TW" nzLabel="繁體中文"></nz-option>
                            <nz-option nzValue="zh-CN" nzLabel="简体中文"></nz-option>
                            <nz-option nzValue="en-US" nzLabel="English"></nz-option>
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                  </div>
                </form>
              </nz-card>

              <nz-card [nzBordered]="false" nzTitle="預設設定" class="mt-4">
                <form nz-form [formGroup]="defaultsForm" nzLayout="vertical">
                  <div nz-row [nzGutter]="16">
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="defaultTaskPriority">預設任務優先級</nz-form-label>
                        <nz-form-control>
                          <nz-select formControlName="defaultTaskPriority">
                            <nz-option nzValue="lowest" nzLabel="最低"></nz-option>
                            <nz-option nzValue="low" nzLabel="低"></nz-option>
                            <nz-option nzValue="medium" nzLabel="中"></nz-option>
                            <nz-option nzValue="high" nzLabel="高"></nz-option>
                            <nz-option nzValue="highest" nzLabel="最高"></nz-option>
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                    <div nz-col [nzSpan]="12">
                      <nz-form-item>
                        <nz-form-label nzFor="defaultDueDays">預設任務期限 (天)</nz-form-label>
                        <nz-form-control>
                          <nz-input-number formControlName="defaultDueDays" [nzMin]="1" [nzMax]="365" style="width: 100%"></nz-input-number>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                  </div>
                </form>
              </nz-card>
            </nz-tab>

            <!-- 模組設定 Tab -->
            <nz-tab nzTitle="模組設定">
              <nz-card [nzBordered]="false" nzTitle="啟用模組">
                <p class="description">選擇要在此藍圖中啟用的功能模組</p>
                <div class="modules-grid">
                  @for (module of moduleSettings(); track module.key) {
                    <div class="module-card" [class.enabled]="module.enabled">
                      <div class="module-icon">
                        <span nz-icon [nzType]="module.icon" nzTheme="outline"></span>
                      </div>
                      <div class="module-info">
                        <div class="module-name">{{ module.name }}</div>
                        <div class="module-description">{{ module.description }}</div>
                      </div>
                      <nz-switch [ngModel]="module.enabled" (ngModelChange)="toggleModule(module.key, $event)"></nz-switch>
                    </div>
                  }
                </div>
              </nz-card>
            </nz-tab>

            <!-- 通知設定 Tab -->
            <nz-tab nzTitle="通知設定">
              <nz-card [nzBordered]="false" nzTitle="通知偏好">
                <form nz-form [formGroup]="notificationForm" nzLayout="vertical">
                  <nz-form-item>
                    <nz-form-label>任務通知</nz-form-label>
                    <nz-form-control>
                      <label nz-checkbox formControlName="taskCreated">任務建立</label>
                      <label nz-checkbox formControlName="taskAssigned">任務分配</label>
                      <label nz-checkbox formControlName="taskCompleted">任務完成</label>
                      <label nz-checkbox formControlName="taskOverdue">任務逾期</label>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-divider></nz-divider>

                  <nz-form-item>
                    <nz-form-label>日誌通知</nz-form-label>
                    <nz-form-control>
                      <label nz-checkbox formControlName="diarySubmitted">日誌提交</label>
                      <label nz-checkbox formControlName="diaryApproved">日誌審核通過</label>
                      <label nz-checkbox formControlName="diaryRejected">日誌審核駁回</label>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-divider></nz-divider>

                  <nz-form-item>
                    <nz-form-label>品質檢查通知</nz-form-label>
                    <nz-form-control>
                      <label nz-checkbox formControlName="qcCreated">檢查建立</label>
                      <label nz-checkbox formControlName="qcCompleted">檢查完成</label>
                      <label nz-checkbox formControlName="qcFailed">檢查失敗</label>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-divider></nz-divider>

                  <nz-form-item>
                    <nz-form-label>摘要通知</nz-form-label>
                    <nz-form-control>
                      <label nz-checkbox formControlName="dailySummary">每日摘要</label>
                      <label nz-checkbox formControlName="weeklySummary">每週摘要</label>
                    </nz-form-control>
                  </nz-form-item>
                </form>
              </nz-card>
            </nz-tab>

            <!-- 標籤管理 Tab -->
            <nz-tab nzTitle="標籤管理">
              <nz-card [nzBordered]="false" nzTitle="自訂標籤">
                <div class="tags-header">
                  <button nz-button nzType="primary" (click)="addTag()">
                    <span nz-icon nzType="plus"></span>
                    新增標籤
                  </button>
                </div>
                <div class="tags-list">
                  @for (tag of tags(); track tag.id) {
                    <div class="tag-item">
                      <nz-tag [nzColor]="tag.color">{{ tag.name }}</nz-tag>
                      <div class="tag-actions">
                        <button nz-button nzType="text" nzSize="small" (click)="editTag(tag)">
                          <span nz-icon nzType="edit"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" nzDanger (click)="deleteTag(tag)">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-tags">
                      <p>尚未建立任何標籤</p>
                    </div>
                  }
                </div>
              </nz-card>
            </nz-tab>
          </nz-tabs>
        }
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .settings-container {
        padding: 24px;
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-left h2 {
        margin: 0;
      }

      .mt-4 {
        margin-top: 16px;
      }

      .description {
        color: rgba(0, 0, 0, 0.45);
        margin-bottom: 16px;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }

      .module-card {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        transition: all 0.3s;
      }

      .module-card:hover {
        border-color: #1890ff;
      }

      .module-card.enabled {
        background-color: #f6ffed;
        border-color: #b7eb8f;
      }

      .module-icon {
        font-size: 24px;
        color: #1890ff;
        margin-right: 16px;
      }

      .module-info {
        flex: 1;
      }

      .module-name {
        font-weight: 500;
        font-size: 14px;
      }

      .module-description {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
        margin-top: 4px;
      }

      .tags-header {
        margin-bottom: 16px;
      }

      .tags-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tag-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
      }

      .tag-actions {
        display: flex;
        gap: 4px;
      }

      .empty-tags {
        text-align: center;
        padding: 24px;
        color: rgba(0, 0, 0, 0.45);
      }

      :host ::ng-deep .ant-checkbox-wrapper {
        margin-right: 16px;
        margin-bottom: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly blueprintFacade = inject(BlueprintFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);

  // State signals
  readonly blueprint = signal<BlueprintBusinessModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly moduleSettings = signal<ModuleSetting[]>([]);
  readonly tags = signal<TagItem[]>([]);
  private initialFormValues: Record<string, unknown> = {};

  // Forms
  basicForm!: FormGroup;
  defaultsForm!: FormGroup;
  notificationForm!: FormGroup;

  // Options
  readonly workDayOptions = [
    { label: '週一', value: 'monday' },
    { label: '週二', value: 'tuesday' },
    { label: '週三', value: 'wednesday' },
    { label: '週四', value: 'thursday' },
    { label: '週五', value: 'friday' },
    { label: '週六', value: 'saturday' },
    { label: '週日', value: 'sunday' }
  ];

  readonly timezones = [
    { value: 'Asia/Taipei', label: '(UTC+8) 台北' },
    { value: 'Asia/Hong_Kong', label: '(UTC+8) 香港' },
    { value: 'Asia/Shanghai', label: '(UTC+8) 上海' },
    { value: 'Asia/Tokyo', label: '(UTC+9) 東京' },
    { value: 'America/New_York', label: '(UTC-5) 紐約' },
    { value: 'America/Los_Angeles', label: '(UTC-8) 洛杉磯' },
    { value: 'Europe/London', label: '(UTC+0) 倫敦' }
  ];

  // Computed
  readonly hasChanges = computed(() => {
    // Check if any form has changed
    const currentValues = {
      basic: this.basicForm?.value,
      defaults: this.defaultsForm?.value,
      notification: this.notificationForm?.value
    };
    return JSON.stringify(currentValues) !== JSON.stringify(this.initialFormValues);
  });

  constructor() {
    this.initForms();
  }

  ngOnInit(): void {
    const blueprintId = this.route.snapshot.paramMap.get('id');
    if (blueprintId) {
      this.loadBlueprint(blueprintId);
    } else {
      this.error.set('藍圖 ID 不存在');
      this.loading.set(false);
    }
  }

  private initForms(): void {
    this.basicForm = this.fb.group({
      workStartTime: [new Date(2000, 0, 1, 8, 0)],
      workEndTime: [new Date(2000, 0, 1, 17, 0)],
      workDays: [['monday', 'tuesday', 'wednesday', 'thursday', 'friday']],
      timezone: ['Asia/Taipei'],
      language: ['zh-TW']
    });

    this.defaultsForm = this.fb.group({
      defaultTaskPriority: ['medium'],
      defaultDueDays: [7]
    });

    this.notificationForm = this.fb.group({
      taskCreated: [true],
      taskAssigned: [true],
      taskCompleted: [true],
      taskOverdue: [true],
      diarySubmitted: [true],
      diaryApproved: [true],
      diaryRejected: [true],
      qcCreated: [true],
      qcCompleted: [true],
      qcFailed: [true],
      dailySummary: [false],
      weeklySummary: [true]
    });

    // Store initial values for change detection
    this.initialFormValues = {
      basic: this.basicForm.value,
      defaults: this.defaultsForm.value,
      notification: this.notificationForm.value
    };
  }

  private async loadBlueprint(blueprintId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const blueprint = await this.blueprintFacade.findById(blueprintId);
      if (!blueprint) {
        this.error.set('找不到藍圖');
        return;
      }

      this.blueprint.set(blueprint);
      this.initModuleSettings(blueprint);
      this.loadSettings(blueprint);
    } catch (err) {
      this.error.set('載入藍圖設定失敗');
    } finally {
      this.loading.set(false);
    }
  }

  private initModuleSettings(blueprint: BlueprintBusinessModel): void {
    // Use unified MODULES_CONFIG as single source of truth
    const modules: ModuleSetting[] = MODULES_CONFIG.map(config => ({
      key: config.value,
      name: config.label,
      description: config.description,
      icon: config.icon,
      enabled: blueprint.enabled_modules?.includes(config.value) ?? isModuleEnabledByDefault(config.value)
    }));
    this.moduleSettings.set(modules);
  }

  private loadSettings(blueprint: BlueprintBusinessModel): void {
    // Load settings from blueprint metadata if available
    const metadata = blueprint.metadata || {};

    // Load tags
    const savedTags = (metadata['tags'] as TagItem[]) || [];
    this.tags.set(savedTags);

    // Update initial form values
    this.initialFormValues = {
      basic: this.basicForm.value,
      defaults: this.defaultsForm.value,
      notification: this.notificationForm.value
    };
  }

  toggleModule(moduleKey: ModuleType, enabled: boolean): void {
    const modules = this.moduleSettings();
    const updated = modules.map(m => (m.key === moduleKey ? { ...m, enabled } : m));
    this.moduleSettings.set(updated);
  }

  async saveSettings(): Promise<void> {
    const blueprint = this.blueprint();
    if (!blueprint) return;

    try {
      this.loading.set(true);

      // Collect enabled modules
      const enabledModulesArray = this.moduleSettings()
        .filter(m => m.enabled)
        .map(m => m.key);

      // Update blueprint with new settings - only use valid properties
      await this.blueprintFacade.updateBlueprint(blueprint.id, {
        enabledModules: enabledModulesArray
      });

      // Update initial values
      this.initialFormValues = {
        basic: this.basicForm.value,
        defaults: this.defaultsForm.value,
        notification: this.notificationForm.value
      };

      this.msg.success('設定已儲存');
    } catch (err) {
      this.msg.error('儲存設定失敗');
    } finally {
      this.loading.set(false);
    }
  }

  addTag(): void {
    this.modal.create({
      nzTitle: '新增標籤',
      nzContent: '請輸入標籤名稱',
      nzOnOk: () => {
        const newTag: TagItem = {
          id: crypto.randomUUID(),
          name: '新標籤',
          color: 'blue'
        };
        this.tags.update(tags => [...tags, newTag]);
        this.msg.success('標籤已新增');
      }
    });
  }

  editTag(tag: TagItem): void {
    this.msg.info('標籤編輯功能開發中');
  }

  deleteTag(tag: TagItem): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除標籤「${tag.name}」嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: () => {
        this.tags.update(tags => tags.filter(t => t.id !== tag.id));
        this.msg.success('標籤已刪除');
      }
    });
  }

  goBack(): void {
    const blueprintId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/blueprint', blueprintId, 'overview']);
  }
}
