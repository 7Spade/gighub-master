import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTabsModule, NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { SupabaseService } from '../../../core/supabase/supabase.service';

interface CustomFieldDefinition {
  id: string;
  blueprint_id: string;
  entity_type: string;
  name: string;
  display_name: string;
  field_type: string;
  options: Record<string, unknown>;
  is_required: boolean;
  is_visible: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface FieldTypeOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface EntityTypeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-blueprint-metadata',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzDividerModule,
    NzPopconfirmModule,
    NzSpinModule,
    NzEmptyModule,
    NzStatisticModule,
    NzTagModule,
    NzInputNumberModule,
    NzToolTipModule,
    NzBadgeModule,
    NzTabsModule,
    NzCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-spin [nzSpinning]="loading()">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <nz-card nzSize="small">
          <nz-statistic nzTitle="自訂欄位" [nzValue]="stats().total" [nzPrefix]="totalIcon">
            <ng-template #totalIcon><span nz-icon nzType="field-number" nzTheme="outline"></span></ng-template>
          </nz-statistic>
        </nz-card>
        <nz-card nzSize="small">
          <nz-statistic nzTitle="必填欄位" [nzValue]="stats().required" [nzPrefix]="requiredIcon">
            <ng-template #requiredIcon><span nz-icon nzType="exclamation-circle" nzTheme="outline" style="color: #f5222d"></span></ng-template>
          </nz-statistic>
        </nz-card>
        <nz-card nzSize="small">
          <nz-statistic nzTitle="可見欄位" [nzValue]="stats().visible" [nzPrefix]="visibleIcon">
            <ng-template #visibleIcon><span nz-icon nzType="eye" nzTheme="outline" style="color: #52c41a"></span></ng-template>
          </nz-statistic>
        </nz-card>
        <nz-card nzSize="small">
          <nz-statistic nzTitle="實體類型" [nzValue]="stats().entityTypes" [nzPrefix]="entityIcon">
            <ng-template #entityIcon><span nz-icon nzType="cluster" nzTheme="outline" style="color: #1890ff"></span></ng-template>
          </nz-statistic>
        </nz-card>
      </div>

      <!-- Main Content with Tabs -->
      <nz-card nzTitle="自訂欄位管理" [nzExtra]="extraTpl">
        <ng-template #extraTpl>
          <button nz-button nzType="primary" (click)="openDrawer()">
            <span nz-icon nzType="plus"></span>
            新增欄位
          </button>
        </ng-template>

        <!-- Entity Type Tabs -->
        <nz-tabset (nzSelectChange)="onTabChange($event)" [(nzSelectedIndex)]="selectedTabIndex">
          <nz-tab nzTitle="全部欄位">
            <ng-template nz-tab>
              <ng-container *ngTemplateOutlet="fieldTable; context: { fields: filteredFields() }"></ng-container>
            </ng-template>
          </nz-tab>
          @for (entityType of entityTypes; track entityType.value) {
            <nz-tab [nzTitle]="entityType.label">
              <ng-template nz-tab>
                <ng-container *ngTemplateOutlet="fieldTable; context: { fields: getFieldsByEntityType(entityType.value) }"></ng-container>
              </ng-template>
            </nz-tab>
          }
        </nz-tabset>
      </nz-card>

      <!-- Field Table Template -->
      <ng-template #fieldTable let-fields="fields">
        @if (fields.length === 0) {
          <nz-empty nzNotFoundContent="暫無自訂欄位" [nzNotFoundFooter]="emptyFooter">
            <ng-template #emptyFooter>
              <button nz-button nzType="primary" (click)="openDrawer()">立即新增</button>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-table
            #basicTable
            [nzData]="fields"
            [nzBordered]="true"
            [nzSize]="'middle'"
            [nzFrontPagination]="false"
            [nzShowPagination]="false"
          >
            <thead>
              <tr>
                <th nzWidth="60px">排序</th>
                <th>欄位名稱</th>
                <th>顯示名稱</th>
                <th nzWidth="120px">欄位類型</th>
                <th nzWidth="100px">實體類型</th>
                <th nzWidth="80px">必填</th>
                <th nzWidth="80px">可見</th>
                <th nzWidth="180px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (field of basicTable.data; track field.id) {
                <tr>
                  <td>{{ field.sort_order }}</td>
                  <td>
                    <code>{{ field.name }}</code>
                  </td>
                  <td>{{ field.display_name }}</td>
                  <td>
                    <nz-tag [nzColor]="getFieldTypeColor(field.field_type)">
                      <span nz-icon [nzType]="getFieldTypeIcon(field.field_type)"></span>
                      {{ getFieldTypeLabel(field.field_type) }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag>{{ getEntityTypeLabel(field.entity_type) }}</nz-tag>
                  </td>
                  <td>
                    <nz-badge [nzStatus]="field.is_required ? 'error' : 'default'" [nzText]="field.is_required ? '是' : '否'"></nz-badge>
                  </td>
                  <td>
                    <nz-badge [nzStatus]="field.is_visible ? 'success' : 'default'" [nzText]="field.is_visible ? '是' : '否'"></nz-badge>
                  </td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="editField(field)">
                      <span nz-icon nzType="edit"></span>
                      編輯
                    </button>
                    <nz-divider nzType="vertical"></nz-divider>
                    <button nz-button nzType="link" nzSize="small" nzDanger
                      nz-popconfirm nzPopconfirmTitle="確定要刪除此欄位嗎？" (nzOnConfirm)="deleteField(field)">
                      <span nz-icon nzType="delete"></span>
                      刪除
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </ng-template>

      <!-- Create/Edit Drawer -->
      <nz-drawer
        [nzVisible]="drawerVisible()"
        [nzWidth]="520"
        [nzTitle]="editingField() ? '編輯自訂欄位' : '新增自訂欄位'"
        (nzOnClose)="closeDrawer()"
      >
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="fieldForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>欄位名稱 (程式碼用)</nz-form-label>
              <nz-form-control nzErrorTip="請輸入欄位名稱 (英文小寫加底線)">
                <input nz-input formControlName="name" placeholder="例如: custom_field_1" [disabled]="!!editingField()" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>顯示名稱</nz-form-label>
              <nz-form-control nzErrorTip="請輸入顯示名稱">
                <input nz-input formControlName="display_name" placeholder="例如: 自訂欄位 1" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>實體類型</nz-form-label>
              <nz-form-control nzErrorTip="請選擇實體類型">
                <nz-select formControlName="entity_type" nzPlaceHolder="選擇實體類型" [nzDisabled]="!!editingField()">
                  @for (type of entityTypes; track type.value) {
                    <nz-option [nzValue]="type.value" [nzLabel]="type.label"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>欄位類型</nz-form-label>
              <nz-form-control nzErrorTip="請選擇欄位類型">
                <nz-select formControlName="field_type" nzPlaceHolder="選擇欄位類型" [nzDisabled]="!!editingField()">
                  @for (type of fieldTypes; track type.value) {
                    <nz-option [nzValue]="type.value" [nzLabel]="type.label" nzCustomContent>
                      <span nz-icon [nzType]="type.icon"></span>
                      {{ type.label }} - {{ type.description }}
                    </nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Options for Select/MultiSelect -->
            @if (needsOptions()) {
              <nz-form-item>
                <nz-form-label>選項列表</nz-form-label>
                <nz-form-control>
                  <div formArrayName="selectOptions">
                    @for (option of selectOptionsArray.controls; track $index; let i = $index) {
                      <div class="flex gap-2 mb-2">
                        <input nz-input [formControlName]="i" placeholder="選項值" class="flex-1" />
                        <button nz-button nzType="text" nzDanger (click)="removeOption(i)">
                          <span nz-icon nzType="minus-circle"></span>
                        </button>
                      </div>
                    }
                  </div>
                  <button nz-button nzType="dashed" (click)="addOption()" class="w-full">
                    <span nz-icon nzType="plus"></span>
                    新增選項
                  </button>
                </nz-form-control>
              </nz-form-item>
            }

            <nz-form-item>
              <nz-form-label>排序順序</nz-form-label>
              <nz-form-control>
                <nz-input-number formControlName="sort_order" [nzMin]="0" [nzMax]="999"></nz-input-number>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control>
                <label nz-checkbox formControlName="is_required">
                  <span>必填欄位</span>
                </label>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control>
                <label nz-checkbox formControlName="is_visible">
                  <span>顯示欄位</span>
                </label>
              </nz-form-control>
            </nz-form-item>

            <nz-divider></nz-divider>

            <div class="flex justify-end gap-2">
              <button nz-button (click)="closeDrawer()">取消</button>
              <button nz-button nzType="primary" [nzLoading]="saving()" (click)="saveField()">
                {{ editingField() ? '更新' : '新增' }}
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </nz-spin>
  `,
  styles: [`
    :host {
      display: block;
    }
    code {
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class BlueprintMetadataComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);

  // State
  blueprintId = signal<string>('');
  fields = signal<CustomFieldDefinition[]>([]);
  loading = signal(false);
  saving = signal(false);
  drawerVisible = signal(false);
  editingField = signal<CustomFieldDefinition | null>(null);
  selectedTabIndex = 0;

  // Form
  fieldForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
    display_name: ['', [Validators.required]],
    entity_type: ['task', [Validators.required]],
    field_type: ['text', [Validators.required]],
    sort_order: [0],
    is_required: [false],
    is_visible: [true],
    selectOptions: this.fb.array([])
  });

  // Entity types
  entityTypes: EntityTypeOption[] = [
    { value: 'task', label: '任務', icon: 'project' },
    { value: 'diary', label: '日誌', icon: 'book' },
    { value: 'problem', label: '問題', icon: 'warning' },
    { value: 'qc_inspection', label: '品質檢查', icon: 'safety' },
    { value: 'acceptance', label: '驗收', icon: 'check-circle' },
    { value: 'file', label: '檔案', icon: 'file' }
  ];

  // Field types
  fieldTypes: FieldTypeOption[] = [
    { value: 'text', label: '文字', icon: 'font-size', description: '單行文字輸入' },
    { value: 'number', label: '數字', icon: 'number', description: '數字輸入' },
    { value: 'date', label: '日期', icon: 'calendar', description: '日期選擇' },
    { value: 'datetime', label: '日期時間', icon: 'clock-circle', description: '日期時間選擇' },
    { value: 'select', label: '單選', icon: 'check-circle', description: '單選下拉選單' },
    { value: 'multiselect', label: '多選', icon: 'check-square', description: '多選下拉選單' },
    { value: 'checkbox', label: '核取方塊', icon: 'check-square', description: '是/否選擇' },
    { value: 'url', label: '網址', icon: 'link', description: 'URL 連結' },
    { value: 'email', label: '電子郵件', icon: 'mail', description: 'Email 地址' },
    { value: 'phone', label: '電話', icon: 'phone', description: '電話號碼' },
    { value: 'user', label: '用戶', icon: 'user', description: '選擇用戶' },
    { value: 'file', label: '附件', icon: 'paper-clip', description: '檔案附件' }
  ];

  // Computed
  stats = computed(() => {
    const allFields = this.fields();
    const entityTypesSet = new Set(allFields.map(f => f.entity_type));
    return {
      total: allFields.length,
      required: allFields.filter(f => f.is_required).length,
      visible: allFields.filter(f => f.is_visible).length,
      entityTypes: entityTypesSet.size
    };
  });

  filteredFields = computed(() => {
    return this.fields();
  });

  get selectOptionsArray(): FormArray {
    return this.fieldForm.get('selectOptions') as FormArray;
  }

  needsOptions(): boolean {
    const fieldType = this.fieldForm.get('field_type')?.value;
    return fieldType === 'select' || fieldType === 'multiselect';
  }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadFields();
      }
    });
  }

  async loadFields(): Promise<void> {
    if (!this.blueprintId()) return;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('custom_field_definitions')
        .select('*')
        .eq('blueprint_id', this.blueprintId())
        .order('entity_type')
        .order('sort_order');

      if (error) throw error;
      this.fields.set(data || []);
    } catch (err) {
      console.error('Error loading fields:', err);
      this.msg.error('載入自訂欄位失敗');
    } finally {
      this.loading.set(false);
    }
  }

  getFieldsByEntityType(entityType: string): CustomFieldDefinition[] {
    return this.fields().filter(f => f.entity_type === entityType);
  }

  getFieldTypeLabel(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.label || type;
  }

  getFieldTypeIcon(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.icon || 'question';
  }

  getFieldTypeColor(type: string): string {
    const colors: Record<string, string> = {
      text: 'blue',
      number: 'cyan',
      date: 'purple',
      datetime: 'purple',
      select: 'green',
      multiselect: 'green',
      checkbox: 'orange',
      url: 'geekblue',
      email: 'magenta',
      phone: 'gold',
      user: 'lime',
      file: 'volcano'
    };
    return colors[type] || 'default';
  }

  getEntityTypeLabel(type: string): string {
    return this.entityTypes.find(t => t.value === type)?.label || type;
  }

  onTabChange(_event: NzTabChangeEvent): void {
    // Tab changed, no action needed as we filter in template
  }

  openDrawer(): void {
    this.editingField.set(null);
    this.fieldForm.reset({
      name: '',
      display_name: '',
      entity_type: 'task',
      field_type: 'text',
      sort_order: this.fields().length,
      is_required: false,
      is_visible: true
    });
    this.selectOptionsArray.clear();
    this.drawerVisible.set(true);
  }

  editField(field: CustomFieldDefinition): void {
    this.editingField.set(field);
    this.fieldForm.patchValue({
      name: field.name,
      display_name: field.display_name,
      entity_type: field.entity_type,
      field_type: field.field_type,
      sort_order: field.sort_order,
      is_required: field.is_required,
      is_visible: field.is_visible
    });

    // Load options if select type
    this.selectOptionsArray.clear();
    if ((field.field_type === 'select' || field.field_type === 'multiselect') && field.options) {
      const options = (field.options as { choices?: string[] }).choices || [];
      options.forEach(opt => this.selectOptionsArray.push(this.fb.control(opt)));
    }

    this.drawerVisible.set(true);
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.editingField.set(null);
  }

  addOption(): void {
    this.selectOptionsArray.push(this.fb.control(''));
  }

  removeOption(index: number): void {
    this.selectOptionsArray.removeAt(index);
  }

  async saveField(): Promise<void> {
    if (this.fieldForm.invalid) {
      Object.values(this.fieldForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.fieldForm.value;
      const options: Record<string, unknown> = {};

      if (formValue.field_type === 'select' || formValue.field_type === 'multiselect') {
        options['choices'] = formValue.selectOptions.filter((opt: string) => opt?.trim());
      }

      if (this.editingField()) {
        // Update existing field
        const { error } = await this.supabase.client
          .from('custom_field_definitions')
          .update({
            display_name: formValue.display_name,
            sort_order: formValue.sort_order,
            is_required: formValue.is_required,
            is_visible: formValue.is_visible,
            options,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editingField()!.id);

        if (error) throw error;
        this.msg.success('欄位更新成功');
      } else {
        // Create new field
        const { error } = await this.supabase.client
          .from('custom_field_definitions')
          .insert({
            blueprint_id: this.blueprintId(),
            name: formValue.name,
            display_name: formValue.display_name,
            entity_type: formValue.entity_type,
            field_type: formValue.field_type,
            options,
            is_required: formValue.is_required,
            is_visible: formValue.is_visible,
            sort_order: formValue.sort_order
          });

        if (error) throw error;
        this.msg.success('欄位新增成功');
      }

      this.closeDrawer();
      await this.loadFields();
    } catch (err) {
      console.error('Error saving field:', err);
      this.msg.error(this.editingField() ? '欄位更新失敗' : '欄位新增失敗');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteField(field: CustomFieldDefinition): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('custom_field_definitions')
        .delete()
        .eq('id', field.id);

      if (error) throw error;
      this.msg.success('欄位刪除成功');
      await this.loadFields();
    } catch (err) {
      console.error('Error deleting field:', err);
      this.msg.error('欄位刪除失敗');
    }
  }
}
