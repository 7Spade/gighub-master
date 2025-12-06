/**
 * QC Inspections Component
 *
 * 品質控制檢查管理組件
 * Quality Control inspection management component
 *
 * Features:
 * - Inspection list with filtering and search
 * - Create/edit inspection functionality
 * - Inspection items management
 * - Statistics cards for QC overview
 * - Approval workflow support
 *
 * @module routes/blueprint/qc-inspections
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { format } from 'date-fns';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { firstValueFrom } from 'rxjs';

import {
  CreateQcInspectionRequest,
  QcInspection,
  QcInspectionStatus,
  QcInspectionType,
  QcInspectionWithDetails,
  QC_INSPECTION_STATUS_CONFIG,
  QC_INSPECTION_TYPE_CONFIG,
  generateInspectionCode
} from '../../../core/infra/types/qc';
import { QcService } from '../../../shared/services/qc/qc.service';

@Component({
  selector: 'app-blueprint-qc-inspections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzSelectModule,
    NzInputModule,
    NzDatePickerModule,
    NzStatisticModule,
    NzGridModule,
    NzDrawerModule,
    NzFormModule,
    NzInputNumberModule,
    NzPopconfirmModule,
    NzTabsModule,
    NzAvatarModule,
    NzDescriptionsModule,
    NzResultModule,
    NzModalModule,
    NzToolTipModule,
    NzProgressModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-spin [nzSpinning]="qcService.loading()">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button nz-button nzType="text" (click)="goBack()">
            <span nz-icon nzType="arrow-left"></span>
          </button>
          <h2>品質管控</h2>
        </div>
        <div class="header-right">
          <button nz-button nzType="primary" (click)="openCreateDrawer()">
            <span nz-icon nzType="plus"></span>
            新增檢查
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="stats-row">
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card total" [nzBordered]="false">
            <nz-statistic [nzValue]="qcService.total()" nzTitle="總檢查數" [nzPrefix]="totalPrefix"></nz-statistic>
            <ng-template #totalPrefix><span nz-icon nzType="file-search"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card pending" [nzBordered]="false">
            <nz-statistic [nzValue]="pendingCount()" nzTitle="待檢查" [nzPrefix]="pendingPrefix"></nz-statistic>
            <ng-template #pendingPrefix><span nz-icon nzType="clock-circle"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card in-progress" [nzBordered]="false">
            <nz-statistic [nzValue]="inProgressCount()" nzTitle="檢查中" [nzPrefix]="inProgressPrefix"></nz-statistic>
            <ng-template #inProgressPrefix><span nz-icon nzType="sync"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card passed" [nzBordered]="false">
            <nz-statistic [nzValue]="passedCount()" nzTitle="已通過" [nzPrefix]="passedPrefix"></nz-statistic>
            <ng-template #passedPrefix><span nz-icon nzType="check-circle"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card failed" [nzBordered]="false">
            <nz-statistic [nzValue]="failedCount()" nzTitle="未通過" [nzPrefix]="failedPrefix"></nz-statistic>
            <ng-template #failedPrefix><span nz-icon nzType="close-circle"></span></ng-template>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
          <nz-card class="stat-card rate" [nzBordered]="false">
            <nz-statistic [nzValue]="avgPassRate()" nzTitle="平均通過率" nzSuffix="%" [nzPrefix]="ratePrefix"></nz-statistic>
            <ng-template #ratePrefix><span nz-icon nzType="pie-chart"></span></ng-template>
          </nz-card>
        </div>
      </div>

      <!-- Filters -->
      <nz-card class="filter-card" [nzBordered]="false">
        <div class="filters">
          <div class="filter-item">
            <nz-select
              [(ngModel)]="filterStatus"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="檢查狀態"
              nzAllowClear
              style="width: 150px"
            >
              @for (option of statusOptions; track option.value) {
                <nz-option [nzValue]="option.value" [nzLabel]="option.label"></nz-option>
              }
            </nz-select>
          </div>
          <div class="filter-item">
            <nz-select
              [(ngModel)]="filterType"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="檢查類型"
              nzAllowClear
              style="width: 150px"
            >
              @for (option of typeOptions; track option.value) {
                <nz-option [nzValue]="option.value" [nzLabel]="option.label"></nz-option>
              }
            </nz-select>
          </div>
          <div class="filter-item">
            <nz-input-group [nzPrefix]="searchPrefix" style="width: 200px">
              <input nz-input [(ngModel)]="searchKeyword" (ngModelChange)="onFilterChange()" placeholder="搜尋檢查..." />
            </nz-input-group>
            <ng-template #searchPrefix><span nz-icon nzType="search"></span></ng-template>
          </div>
          <div class="filter-item">
            <button nz-button (click)="resetFilters()">
              <span nz-icon nzType="reload"></span>
              重置
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Inspection Table -->
      <nz-card class="table-card" [nzBordered]="false">
        @if (qcService.isEmpty() && !qcService.loading()) {
          <nz-empty nzNotFoundContent="尚無品質檢查記錄"></nz-empty>
        } @else {
          <nz-table
            #inspectionTable
            [nzData]="qcService.inspections()"
            [nzTotal]="qcService.total()"
            [nzPageSize]="currentPageSize"
            [nzPageIndex]="currentPage"
            [nzShowSizeChanger]="true"
            [nzPageSizeOptions]="[10, 20, 50]"
            [nzFrontPagination]="true"
            (nzPageIndexChange)="onPageChange($event)"
            (nzPageSizeChange)="onPageSizeChange($event)"
            nzSize="middle"
          >
            <thead>
              <tr>
                <th nzWidth="120px">檢查編號</th>
                <th>檢查標題</th>
                <th nzWidth="100px">類型</th>
                <th nzWidth="100px">狀態</th>
                <th nzWidth="100px">通過率</th>
                <th nzWidth="140px">預定日期</th>
                <th nzWidth="140px">檢查日期</th>
                <th nzWidth="160px" nzAlign="center">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (inspection of inspectionTable.data; track inspection.id) {
                <tr class="clickable-row" (click)="viewInspection(inspection)">
                  <td>
                    <a (click)="$event.stopPropagation(); viewInspection(inspection)">{{ inspection.inspection_code }}</a>
                  </td>
                  <td>
                    <span class="inspection-title">{{ inspection.title }}</span>
                    @if (inspection.description) {
                      <span class="text-muted" style="display: block; font-size: 12px;">{{ inspection.description }}</span>
                    }
                  </td>
                  <td>
                    <nz-tag>{{ getTypeConfig(inspection.inspection_type).label }}</nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getStatusConfig(inspection.status).color">
                      {{ getStatusConfig(inspection.status).label }}
                    </nz-tag>
                  </td>
                  <td>
                    @if (inspection.total_count > 0) {
                      <nz-progress
                        [nzPercent]="inspection.pass_rate"
                        [nzStatus]="inspection.pass_rate >= 80 ? 'success' : inspection.pass_rate >= 60 ? 'normal' : 'exception'"
                        [nzShowInfo]="true"
                        nzSize="small"
                      ></nz-progress>
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td>
                    @if (inspection.scheduled_date) {
                      {{ inspection.scheduled_date | date: 'yyyy-MM-dd' }}
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td>
                    @if (inspection.inspection_date) {
                      {{ inspection.inspection_date | date: 'yyyy-MM-dd HH:mm' }}
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td nzAlign="center" (click)="$event.stopPropagation()">
                    <div class="action-buttons">
                      @if (inspection.status === 'pending') {
                        <button nz-button nzType="link" nzSize="small" (click)="startInspection(inspection)" nz-tooltip="開始檢查">
                          <span nz-icon nzType="play-circle"></span>
                        </button>
                      }
                      @if (inspection.status === 'in_progress') {
                        <button nz-button nzType="link" nzSize="small" (click)="completeInspection(inspection)" nz-tooltip="完成檢查">
                          <span nz-icon nzType="check-circle"></span>
                        </button>
                      }
                      <button nz-button nzType="link" nzSize="small" (click)="editInspection(inspection)" nz-tooltip="編輯">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        nz-button
                        nzType="link"
                        nzDanger
                        nzSize="small"
                        nz-popconfirm
                        nzPopconfirmTitle="確定刪除此檢查？"
                        (nzOnConfirm)="deleteInspection(inspection)"
                        nz-tooltip="刪除"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-card>

      <!-- Create/Edit Drawer -->
      <nz-drawer
        [nzVisible]="drawerVisible()"
        [nzWidth]="520"
        [nzTitle]="drawerTitle()"
        (nzOnClose)="closeDrawer()"
        [nzFooter]="drawerFooter"
      >
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="inspectionForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>檢查標題</nz-form-label>
              <nz-form-control nzErrorTip="請輸入檢查標題">
                <input nz-input formControlName="title" placeholder="輸入檢查標題..." />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>描述</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="description"
                  [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                  placeholder="輸入檢查描述..."
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired>檢查類型</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="inspection_type" nzPlaceHolder="選擇類型">
                      @for (option of typeOptions; track option.value) {
                        <nz-option [nzValue]="option.value" [nzLabel]="option.label"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>預定日期</nz-form-label>
                  <nz-form-control>
                    <nz-date-picker formControlName="scheduled_date" style="width: 100%"></nz-date-picker>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <nz-form-item>
              <nz-form-label>備註</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="notes"
                  [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                  placeholder="其他備註事項..."
                ></textarea>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
        <ng-template #drawerFooter>
          <div class="drawer-footer">
            <button nz-button (click)="closeDrawer()">取消</button>
            <button nz-button nzType="primary" [nzLoading]="saving()" (click)="saveInspection()">
              {{ isEditing() ? '更新' : '建立' }}
            </button>
          </div>
        </ng-template>
      </nz-drawer>

      <!-- Inspection Detail Drawer -->
      <nz-drawer [nzVisible]="detailDrawerVisible()" [nzWidth]="700" nzTitle="檢查詳情" (nzOnClose)="closeDetailDrawer()">
        <ng-container *nzDrawerContent>
          @if (selectedInspection()) {
            <nz-descriptions nzTitle="基本資訊" nzBordered [nzColumn]="2">
              <nz-descriptions-item nzTitle="檢查編號">{{ selectedInspection()!.inspection_code }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態">
                <nz-tag [nzColor]="getStatusConfig(selectedInspection()!.status).color">
                  {{ getStatusConfig(selectedInspection()!.status).label }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="檢查標題" [nzSpan]="2">{{ selectedInspection()!.title }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="檢查類型">
                <nz-tag>{{ getTypeConfig(selectedInspection()!.inspection_type).label }}</nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="通過率">
                @if (selectedInspection()!.total_count > 0) {
                  <nz-progress
                    [nzPercent]="selectedInspection()!.pass_rate"
                    [nzStatus]="
                      selectedInspection()!.pass_rate >= 80 ? 'success' : selectedInspection()!.pass_rate >= 60 ? 'normal' : 'exception'
                    "
                    [nzShowInfo]="true"
                  ></nz-progress>
                } @else {
                  <span class="text-muted">尚無檢查項目</span>
                }
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="預定日期">
                {{ selectedInspection()!.scheduled_date | date: 'yyyy-MM-dd' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="檢查日期">
                {{ selectedInspection()!.inspection_date | date: 'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              @if (selectedInspection()!.description) {
                <nz-descriptions-item nzTitle="描述" [nzSpan]="2">{{ selectedInspection()!.description }}</nz-descriptions-item>
              }
              @if (selectedInspection()!.findings) {
                <nz-descriptions-item nzTitle="發現問題" [nzSpan]="2">{{ selectedInspection()!.findings }}</nz-descriptions-item>
              }
              @if (selectedInspection()!.recommendations) {
                <nz-descriptions-item nzTitle="建議事項" [nzSpan]="2">{{ selectedInspection()!.recommendations }}</nz-descriptions-item>
              }
              @if (selectedInspection()!.notes) {
                <nz-descriptions-item nzTitle="備註" [nzSpan]="2">{{ selectedInspection()!.notes }}</nz-descriptions-item>
              }
            </nz-descriptions>

            <!-- Inspection Items -->
            <div class="section-margin">
              <h4>檢查項目 ({{ selectedInspection()!.total_count }} 項)</h4>
              @if (selectedInspection()!.items && selectedInspection()!.items!.length > 0) {
                <nz-table [nzData]="selectedInspection()!.items!" [nzShowPagination]="false" nzSize="small">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th nzWidth="80px">狀態</th>
                      <th nzWidth="100px">實測值</th>
                      <th nzWidth="100px">標準值</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedInspection()!.items; track item.id) {
                      <tr>
                        <td>
                          <span>{{ item.title }}</span>
                          @if (item.description) {
                            <span class="text-muted" style="display: block; font-size: 12px;">{{ item.description }}</span>
                          }
                        </td>
                        <td>
                          <nz-tag [nzColor]="getItemStatusColor(item.status)">
                            {{ getItemStatusLabel(item.status) }}
                          </nz-tag>
                        </td>
                        <td>{{ item.actual_value || '-' }}</td>
                        <td>{{ item.expected_value || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </nz-table>
              } @else {
                <nz-empty nzNotFoundContent="尚無檢查項目"></nz-empty>
              }
            </div>

            <!-- Action Buttons -->
            <div class="detail-actions">
              @if (selectedInspection()!.status === 'pending') {
                <button nz-button nzType="primary" (click)="startInspection(selectedInspection()!)">
                  <span nz-icon nzType="play-circle"></span>
                  開始檢查
                </button>
              }
              @if (selectedInspection()!.status === 'in_progress') {
                <button nz-button nzType="primary" (click)="completeInspection(selectedInspection()!)">
                  <span nz-icon nzType="check-circle"></span>
                  完成檢查
                </button>
              }
              <button nz-button (click)="editInspection(selectedInspection()!)">
                <span nz-icon nzType="edit"></span>
                編輯
              </button>
            </div>
          } @else {
            <nz-result nzStatus="404" nzTitle="無法載入檢查詳情"></nz-result>
          }
        </ng-container>
      </nz-drawer>
    </nz-spin>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 0 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-left h2 {
        margin: 0;
      }

      .stats-row {
        margin-bottom: 16px;
      }

      .stat-card {
        text-align: center;
        border-radius: 8px;
      }

      .stat-card.total ::ng-deep .ant-statistic-content {
        color: #1890ff;
      }

      .stat-card.pending ::ng-deep .ant-statistic-content {
        color: #8c8c8c;
      }

      .stat-card.in-progress ::ng-deep .ant-statistic-content {
        color: #722ed1;
      }

      .stat-card.passed ::ng-deep .ant-statistic-content {
        color: #52c41a;
      }

      .stat-card.failed ::ng-deep .ant-statistic-content {
        color: #f5222d;
      }

      .stat-card.rate ::ng-deep .ant-statistic-content {
        color: #fa8c16;
      }

      .filter-card {
        margin-bottom: 16px;
      }

      .filters {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
      }

      .filter-item {
        flex-shrink: 0;
      }

      .table-card {
        margin-bottom: 24px;
      }

      .clickable-row {
        cursor: pointer;
      }

      .clickable-row:hover {
        background-color: #fafafa;
      }

      .inspection-title {
        font-weight: 500;
      }

      .action-buttons {
        display: flex;
        gap: 4px;
      }

      .text-muted {
        color: #8c8c8c;
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .section-margin {
        margin-top: 24px;
      }

      .detail-actions {
        margin-top: 24px;
        display: flex;
        gap: 8px;
      }
    `
  ]
})
export class BlueprintQcInspectionsComponent implements OnInit {
  readonly qcService = inject(QcService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // State
  readonly error = signal<string | null>(null);
  readonly drawerVisible = signal(false);
  readonly detailDrawerVisible = signal(false);
  readonly isEditing = signal(false);
  readonly saving = signal(false);
  readonly selectedInspection = signal<QcInspectionWithDetails | null>(null);
  readonly editingInspectionId = signal<string | null>(null);

  // Computed
  readonly blueprintId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly drawerTitle = computed(() => (this.isEditing() ? '編輯檢查' : '新增檢查'));

  // Statistics
  readonly pendingCount = computed(() => this.qcService.inspections().filter(i => i.status === 'pending').length);
  readonly inProgressCount = computed(() => this.qcService.inspections().filter(i => i.status === 'in_progress').length);
  readonly passedCount = computed(() => this.qcService.inspections().filter(i => i.status === 'passed').length);
  readonly failedCount = computed(() => this.qcService.inspections().filter(i => i.status === 'failed').length);
  readonly avgPassRate = computed(() => {
    const inspections = this.qcService.inspections().filter(i => i.total_count > 0);
    if (inspections.length === 0) return 0;
    const totalRate = inspections.reduce((sum, i) => sum + i.pass_rate, 0);
    return Math.round((totalRate / inspections.length) * 10) / 10;
  });

  // Filters
  filterStatus: QcInspectionStatus | null = null;
  filterType: QcInspectionType | null = null;
  searchKeyword = '';
  currentPage = 1;
  currentPageSize = 20;

  // Options
  readonly statusOptions = Object.entries(QC_INSPECTION_STATUS_CONFIG).map(([value, config]) => ({
    value: value as QcInspectionStatus,
    label: config.label
  }));

  readonly typeOptions = Object.entries(QC_INSPECTION_TYPE_CONFIG).map(([value, config]) => ({
    value: value as QcInspectionType,
    label: config.label
  }));

  // Form
  readonly inspectionForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    inspection_type: ['self_check' as QcInspectionType, Validators.required],
    scheduled_date: [null as Date | null],
    notes: ['']
  });

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.loadInspections();
    }
  }

  loadInspections(): void {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.error.set(null);
    this.qcService.loadByBlueprint(blueprintId, {
      status: this.filterStatus || undefined,
      inspectionType: this.filterType || undefined
    });
  }

  // Filter Methods
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInspections();
  }

  resetFilters(): void {
    this.filterStatus = null;
    this.filterType = null;
    this.searchKeyword = '';
    this.currentPage = 1;
    this.loadInspections();
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(pageSize: number): void {
    this.currentPageSize = pageSize;
    this.currentPage = 1;
  }

  // CRUD Operations
  openCreateDrawer(): void {
    this.isEditing.set(false);
    this.editingInspectionId.set(null);
    this.inspectionForm.reset({
      inspection_type: 'self_check'
    });
    this.drawerVisible.set(true);
  }

  editInspection(inspection: QcInspection): void {
    this.isEditing.set(true);
    this.editingInspectionId.set(inspection.id);
    this.inspectionForm.patchValue({
      title: inspection.title,
      description: inspection.description || '',
      inspection_type: inspection.inspection_type,
      scheduled_date: inspection.scheduled_date ? new Date(inspection.scheduled_date) : null,
      notes: inspection.notes || ''
    });
    this.drawerVisible.set(true);
    this.closeDetailDrawer();
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.isEditing.set(false);
    this.editingInspectionId.set(null);
  }

  async saveInspection(): Promise<void> {
    if (this.inspectionForm.invalid) {
      Object.values(this.inspectionForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.saving.set(true);
    const formValue = this.inspectionForm.value;

    try {
      if (this.isEditing() && this.editingInspectionId()) {
        const result = await firstValueFrom(
          this.qcService.updateInspection(this.editingInspectionId()!, {
            title: formValue.title || undefined,
            description: formValue.description || null,
            inspection_type: formValue.inspection_type as QcInspectionType,
            scheduled_date: formValue.scheduled_date ? format(formValue.scheduled_date, 'yyyy-MM-dd') : null,
            notes: formValue.notes || null
          })
        );
        if (result) {
          this.msg.success('檢查已更新');
          this.closeDrawer();
        } else {
          this.msg.error('更新失敗');
        }
      } else {
        const createRequest: CreateQcInspectionRequest = {
          blueprint_id: blueprintId,
          title: formValue.title!,
          description: formValue.description || null,
          inspection_type: formValue.inspection_type as QcInspectionType,
          inspection_code: generateInspectionCode(),
          scheduled_date: formValue.scheduled_date ? format(formValue.scheduled_date, 'yyyy-MM-dd') : null,
          notes: formValue.notes || null
        };

        const result = await firstValueFrom(this.qcService.createInspection(createRequest));
        if (result) {
          this.msg.success('檢查已建立');
          this.closeDrawer();
        } else {
          this.msg.error('建立失敗');
        }
      }
    } catch (err) {
      this.msg.error('操作失敗');
    } finally {
      this.saving.set(false);
    }
  }

  // View Details
  viewInspection(inspection: QcInspection): void {
    this.qcService.selectInspection(inspection.id);
    this.selectedInspection.set(inspection as QcInspectionWithDetails);
    this.detailDrawerVisible.set(true);

    // Subscribe to selected inspection updates
    const sub = this.qcService.selectedInspection;
    const checkInterval = setInterval(() => {
      const selected = sub();
      if (selected) {
        this.selectedInspection.set(selected);
        clearInterval(checkInterval);
      }
    }, 100);

    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  closeDetailDrawer(): void {
    this.detailDrawerVisible.set(false);
    this.selectedInspection.set(null);
    this.qcService.clearSelection();
  }

  // Workflow Actions
  async startInspection(inspection: QcInspection): Promise<void> {
    const result = await firstValueFrom(this.qcService.startInspection(inspection.id));
    if (result) {
      this.msg.success('檢查已開始');
      this.loadInspections();
    } else {
      this.msg.error('開始檢查失敗');
    }
  }

  async completeInspection(inspection: QcInspection): Promise<void> {
    this.modal.confirm({
      nzTitle: '完成檢查',
      nzContent: '確定完成此檢查？系統將根據檢查項目計算通過率並更新狀態。',
      nzOnOk: async () => {
        const result = await firstValueFrom(this.qcService.completeInspection(inspection.id));
        if (result) {
          this.msg.success('檢查已完成');
          this.loadInspections();
          if (this.detailDrawerVisible()) {
            this.viewInspection(result);
          }
        } else {
          this.msg.error('完成檢查失敗');
        }
      }
    });
  }

  async deleteInspection(inspection: QcInspection): Promise<void> {
    const result = await firstValueFrom(this.qcService.deleteInspection(inspection.id));
    if (result) {
      this.msg.success('檢查已刪除');
    } else {
      this.msg.error('刪除失敗');
    }
  }

  // Utility Methods
  getStatusConfig(status: QcInspectionStatus) {
    return QC_INSPECTION_STATUS_CONFIG[status];
  }

  getTypeConfig(type: string) {
    return QC_INSPECTION_TYPE_CONFIG[type as QcInspectionType] || { label: type, icon: 'question' };
  }

  getItemStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'default',
      passed: 'success',
      failed: 'error',
      na: 'default'
    };
    return colors[status] || 'default';
  }

  getItemStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待檢查',
      passed: '合格',
      failed: '不合格',
      na: '不適用'
    };
    return labels[status] || status;
  }

  // Navigation
  goBack(): void {
    const blueprintId = this.blueprintId();
    if (blueprintId) {
      this.router.navigate(['/blueprint', blueprintId, 'overview']);
    } else {
      this.router.navigate(['/blueprint/list']);
    }
  }
}
