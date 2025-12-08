/**
 * Acceptance Management Component
 *
 * 驗收管理組件 - 驗收流程管理
 * Acceptance management with workflow support
 *
 * Features:
 * - Acceptance list with filters
 * - Acceptance creation/editing
 * - Approval workflow
 * - Statistics dashboard
 * - PDF report generation
 *
 * @module routes/blueprint/acceptances
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Acceptance,
  AcceptanceStatus,
  AcceptanceType,
  AcceptanceDecision,
  AcceptanceWithDetails,
  CreateAcceptanceRequest,
  ACCEPTANCE_STATUS_CONFIG,
  ACCEPTANCE_TYPE_CONFIG,
  ACCEPTANCE_DECISION_CONFIG,
  isAcceptanceCompleted,
  generateAcceptanceCode
} from '@core';
import { AcceptanceService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-blueprint-acceptances',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzDrawerModule,
    NzFormModule,
    NzDividerModule,
    NzTooltipModule,
    NzStatisticModule,
    NzGridModule,
    NzBadgeModule,
    NzAvatarModule,
    NzDescriptionsModule,
    NzTimelineModule,
    NzResultModule,
    NzPopconfirmModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h2>
          <span nz-icon nzType="file-done" nzTheme="outline"></span>
          驗收管理
        </h2>
        <p class="subtitle">管理工程驗收流程、審批記錄與驗收報告</p>
      </div>
      <div class="header-actions">
        <button nz-button nzType="primary" (click)="openCreateDrawer()">
          <span nz-icon nzType="plus" nzTheme="outline"></span>
          新增驗收
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <nz-row [nzGutter]="16" class="stats-row">
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic [nzValue]="stats().total" nzTitle="總驗收數" [nzPrefix]="totalIcon"></nz-statistic>
          <ng-template #totalIcon>
            <span nz-icon nzType="file-done" class="stat-icon"></span>
          </ng-template>
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic
            [nzValue]="stats().pending"
            nzTitle="待驗收"
            [nzValueStyle]="{ color: '#faad14' }"
            [nzPrefix]="pendingIcon"
          ></nz-statistic>
          <ng-template #pendingIcon>
            <span nz-icon nzType="clock-circle" class="stat-icon warning"></span>
          </ng-template>
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic
            [nzValue]="stats().passed"
            nzTitle="已通過"
            [nzValueStyle]="{ color: '#52c41a' }"
            [nzPrefix]="passedIcon"
          ></nz-statistic>
          <ng-template #passedIcon>
            <span nz-icon nzType="check-circle" class="stat-icon success"></span>
          </ng-template>
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic
            [nzValue]="stats().failed"
            nzTitle="未通過"
            [nzValueStyle]="{ color: '#ff4d4f' }"
            [nzPrefix]="failedIcon"
          ></nz-statistic>
          <ng-template #failedIcon>
            <span nz-icon nzType="close-circle" class="stat-icon danger"></span>
          </ng-template>
        </nz-card>
      </nz-col>
    </nz-row>

    <!-- Filters -->
    <nz-card class="filter-card">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-input-group [nzPrefix]="searchIcon">
            <input nz-input placeholder="搜尋驗收編號或標題..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-select [(ngModel)]="filterStatus" nzPlaceHolder="狀態" nzAllowClear style="width: 100%" (ngModelChange)="applyFilters()">
            @for (status of statusOptions; track status.value) {
              <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
            }
          </nz-select>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-select [(ngModel)]="filterType" nzPlaceHolder="驗收類型" nzAllowClear style="width: 100%" (ngModelChange)="applyFilters()">
            @for (type of typeOptions; track type.value) {
              <nz-option [nzValue]="type.value" [nzLabel]="type.label"></nz-option>
            }
          </nz-select>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="applyFilters()" style="width: 100%"></nz-range-picker>
        </nz-col>
        <nz-col [nzSpan]="4">
          <button nz-button (click)="resetFilters()">
            <span nz-icon nzType="reload" nzTheme="outline"></span>
            重置
          </button>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Acceptance List -->
    <nz-card>
      <nz-spin [nzSpinning]="acceptanceService.loading()">
        @if (acceptanceService.isEmpty() && !acceptanceService.loading()) {
          <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'尚無驗收記錄'">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="openCreateDrawer()"> 新增驗收 </button>
            </ng-template>
          </nz-empty>
        } @else {
          <nz-table
            #acceptanceTable
            [nzData]="filteredAcceptances()"
            [nzPageSize]="10"
            [nzShowSizeChanger]="true"
            [nzFrontPagination]="true"
            nzSize="middle"
          >
            <thead>
              <tr>
                <th>驗收編號</th>
                <th>標題</th>
                <th>驗收類型</th>
                <th>狀態</th>
                <th>決定</th>
                <th>預定日期</th>
                <th>建立時間</th>
                <th nzWidth="150px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (acceptance of acceptanceTable.data; track acceptance.id) {
                <tr>
                  <td>
                    <a (click)="viewDetails(acceptance)">{{ acceptance.acceptance_code }}</a>
                  </td>
                  <td>
                    <span class="acceptance-title">{{ acceptance.title }}</span>
                    @if (acceptance.description) {
                      <br />
                      <small class="text-muted">{{ acceptance.description | slice: 0 : 50 }}...</small>
                    }
                  </td>
                  <td>
                    <nz-tag>
                      <span nz-icon [nzType]="getTypeConfig(acceptance.acceptance_type).icon"></span>
                      {{ getTypeConfig(acceptance.acceptance_type).label }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getStatusConfig(acceptance.status).color">
                      <span nz-icon [nzType]="getStatusConfig(acceptance.status).icon"></span>
                      {{ getStatusConfig(acceptance.status).label }}
                    </nz-tag>
                  </td>
                  <td>
                    @if (acceptance.decision) {
                      <nz-tag [nzColor]="getDecisionConfig(acceptance.decision).color">
                        <span nz-icon [nzType]="getDecisionConfig(acceptance.decision).icon"></span>
                        {{ getDecisionConfig(acceptance.decision).label }}
                      </nz-tag>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>
                    @if (acceptance.scheduled_date) {
                      {{ acceptance.scheduled_date | date: 'yyyy-MM-dd' }}
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>{{ acceptance.created_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" nz-tooltip="檢視詳情" (click)="viewDetails(acceptance)">
                      <span nz-icon nzType="eye" nzTheme="outline"></span>
                    </button>

                    @if (!isAcceptanceCompleted(acceptance)) {
                      <button nz-button nzType="link" nzSize="small" nz-tooltip="編輯" (click)="openEditDrawer(acceptance)">
                        <span nz-icon nzType="edit" nzTheme="outline"></span>
                      </button>

                      @if (acceptance.status === 'pending') {
                        <button nz-button nzType="link" nzSize="small" nz-tooltip="開始驗收" (click)="startAcceptance(acceptance)">
                          <span nz-icon nzType="play-circle" nzTheme="outline"></span>
                        </button>
                      }

                      @if (acceptance.status === 'in_progress') {
                        <button nz-button nzType="link" nzSize="small" nz-tooltip="做出決定" (click)="openDecisionModal(acceptance)">
                          <span nz-icon nzType="solution" nzTheme="outline"></span>
                        </button>
                      }
                    }

                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="確定要刪除此驗收記錄嗎？"
                      (nzOnConfirm)="deleteAcceptance(acceptance)"
                      nz-tooltip="刪除"
                    >
                      <span nz-icon nzType="delete" nzTheme="outline"></span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-spin>
    </nz-card>

    <!-- Create/Edit Drawer -->
    <nz-drawer
      [nzVisible]="drawerVisible()"
      [nzTitle]="drawerMode() === 'create' ? '新增驗收' : '編輯驗收'"
      [nzWidth]="520"
      (nzOnClose)="closeDrawer()"
    >
      <ng-container *nzDrawerContent>
        <form nz-form [nzLayout]="'vertical'">
          <nz-form-item>
            <nz-form-label nzRequired>驗收編號</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="formData.acceptance_code" name="code" placeholder="自動生成" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="formData.title" name="title" placeholder="輸入驗收標題" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>說明</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="formData.description"
                name="description"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                placeholder="輸入驗收說明"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>驗收類型</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="formData.acceptance_type" name="type" nzPlaceHolder="選擇驗收類型" style="width: 100%">
                @for (type of typeOptions; track type.value) {
                  <nz-option [nzValue]="type.value" [nzLabel]="type.label"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>驗收範圍</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="formData.scope"
                name="scope"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                placeholder="說明驗收的範圍"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>驗收標準</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="formData.criteria"
                name="criteria"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                placeholder="說明驗收的標準和要求"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>預定驗收日期</nz-form-label>
            <nz-form-control>
              <nz-date-picker
                [(ngModel)]="formData.scheduled_date"
                name="scheduled_date"
                style="width: 100%"
                nzPlaceHolder="選擇預定驗收日期"
              ></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>備註</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="formData.notes"
                name="notes"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                placeholder="其他備註"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-divider></nz-divider>

          <div class="drawer-footer">
            <button nz-button nzType="default" (click)="closeDrawer()">取消</button>
            <button nz-button nzType="primary" [nzLoading]="saving()" (click)="saveAcceptance()">
              {{ drawerMode() === 'create' ? '建立' : '儲存' }}
            </button>
          </div>
        </form>
      </ng-container>
    </nz-drawer>

    <!-- Detail Modal -->
    <nz-modal
      [(nzVisible)]="detailModalVisible"
      [nzTitle]="'驗收詳情'"
      [nzWidth]="720"
      [nzFooter]="detailFooter"
      (nzOnCancel)="closeDetailModal()"
    >
      @if (selectedAcceptance()) {
        <ng-container *nzModalContent>
          <nz-descriptions [nzColumn]="2" nzBordered>
            <nz-descriptions-item nzTitle="驗收編號">
              {{ selectedAcceptance()!.acceptance_code }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="狀態">
              <nz-tag [nzColor]="getStatusConfig(selectedAcceptance()!.status).color">
                {{ getStatusConfig(selectedAcceptance()!.status).label }}
              </nz-tag>
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="標題" [nzSpan]="2">
              {{ selectedAcceptance()!.title }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="驗收類型">
              {{ getTypeConfig(selectedAcceptance()!.acceptance_type).label }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="決定">
              @if (selectedAcceptance()!.decision) {
                <nz-tag [nzColor]="getDecisionConfig(selectedAcceptance()!.decision!).color">
                  {{ getDecisionConfig(selectedAcceptance()!.decision!).label }}
                </nz-tag>
              } @else {
                <span class="text-muted">尚未決定</span>
              }
            </nz-descriptions-item>
            @if (selectedAcceptance()!.description) {
              <nz-descriptions-item nzTitle="說明" [nzSpan]="2">
                {{ selectedAcceptance()!.description }}
              </nz-descriptions-item>
            }
            @if (selectedAcceptance()!.scope) {
              <nz-descriptions-item nzTitle="驗收範圍" [nzSpan]="2">
                {{ selectedAcceptance()!.scope }}
              </nz-descriptions-item>
            }
            @if (selectedAcceptance()!.criteria) {
              <nz-descriptions-item nzTitle="驗收標準" [nzSpan]="2">
                {{ selectedAcceptance()!.criteria }}
              </nz-descriptions-item>
            }
            @if (selectedAcceptance()!.decision_reason) {
              <nz-descriptions-item nzTitle="決定理由" [nzSpan]="2">
                {{ selectedAcceptance()!.decision_reason }}
              </nz-descriptions-item>
            }
            @if (selectedAcceptance()!.conditions) {
              <nz-descriptions-item nzTitle="條件說明" [nzSpan]="2">
                {{ selectedAcceptance()!.conditions }}
              </nz-descriptions-item>
            }
            <nz-descriptions-item nzTitle="預定日期">
              {{ selectedAcceptance()!.scheduled_date | date: 'yyyy-MM-dd' }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="驗收日期">
              {{ selectedAcceptance()!.acceptance_date | date: 'yyyy-MM-dd' }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="建立時間">
              {{ selectedAcceptance()!.created_at | date: 'yyyy-MM-dd HH:mm' }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="更新時間">
              {{ selectedAcceptance()!.updated_at | date: 'yyyy-MM-dd HH:mm' }}
            </nz-descriptions-item>
          </nz-descriptions>

          @if (selectedAcceptance()!.notes) {
            <nz-divider nzText="備註"></nz-divider>
            <p>{{ selectedAcceptance()!.notes }}</p>
          }
        </ng-container>
      }
      <ng-template #detailFooter>
        <button nz-button nzType="default" (click)="closeDetailModal()">關閉</button>
        @if (selectedAcceptance() && !isAcceptanceCompleted(selectedAcceptance()!)) {
          @if (selectedAcceptance()!.status === 'in_progress') {
            <button nz-button nzType="primary" (click)="openDecisionModal(selectedAcceptance()!)"> 做出決定 </button>
          }
        }
      </ng-template>
    </nz-modal>

    <!-- Decision Modal -->
    <nz-modal
      [(nzVisible)]="decisionModalVisible"
      nzTitle="驗收決定"
      [nzWidth]="500"
      (nzOnCancel)="closeDecisionModal()"
      (nzOnOk)="submitDecision()"
      [nzOkLoading]="saving()"
      nzOkText="確認決定"
    >
      <ng-container *nzModalContent>
        <nz-form-item>
          <nz-form-label nzRequired>決定</nz-form-label>
          <nz-form-control>
            <nz-select [(ngModel)]="decisionForm.decision" nzPlaceHolder="選擇決定" style="width: 100%">
              <nz-option nzValue="approve" nzLabel="核准"></nz-option>
              <nz-option nzValue="reject" nzLabel="駁回"></nz-option>
              <nz-option nzValue="conditional" nzLabel="有條件核准"></nz-option>
              <nz-option nzValue="defer" nzLabel="延後"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="decisionForm.decision === 'reject'">決定理由</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              [(ngModel)]="decisionForm.decision_reason"
              [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              placeholder="輸入決定理由"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        @if (decisionForm.decision === 'conditional') {
          <nz-form-item>
            <nz-form-label nzRequired>條件說明</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="decisionForm.conditions"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                placeholder="輸入需要滿足的條件"
              ></textarea>
            </nz-form-control>
          </nz-form-item>
        }
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .header-content h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .subtitle {
        margin: 8px 0 0;
        color: rgba(0, 0, 0, 0.45);
      }

      .stats-row {
        margin-bottom: 16px;
      }

      .stat-icon {
        font-size: 18px;
        margin-right: 8px;
      }

      .stat-icon.success {
        color: #52c41a;
      }

      .stat-icon.warning {
        color: #faad14;
      }

      .stat-icon.danger {
        color: #ff4d4f;
      }

      .filter-card {
        margin-bottom: 16px;
      }

      .text-muted {
        color: rgba(0, 0, 0, 0.45);
      }

      .acceptance-title {
        font-weight: 500;
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `
  ]
})
export class BlueprintAcceptancesComponent implements OnInit {
  readonly acceptanceService = inject(AcceptanceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // State
  blueprintId = '';
  searchText = '';
  filterStatus: AcceptanceStatus | null = null;
  filterType: AcceptanceType | null = null;
  dateRange: [Date, Date] | null = null;

  // Drawer state
  readonly drawerVisible = signal(false);
  readonly drawerMode = signal<'create' | 'edit'>('create');
  readonly saving = signal(false);
  readonly selectedAcceptance = signal<AcceptanceWithDetails | null>(null);

  // Modal state
  detailModalVisible = false;
  decisionModalVisible = false;
  currentDecisionAcceptance: Acceptance | null = null;

  // Form data
  formData: Partial<CreateAcceptanceRequest> = {};
  decisionForm = {
    decision: null as AcceptanceDecision | null,
    decision_reason: '',
    conditions: ''
  };

  // Options
  statusOptions = [
    { value: 'pending', label: '待驗收' },
    { value: 'in_progress', label: '驗收中' },
    { value: 'passed', label: '驗收通過' },
    { value: 'failed', label: '驗收失敗' },
    { value: 'conditionally_passed', label: '有條件通過' },
    { value: 'cancelled', label: '已取消' }
  ];

  typeOptions = [
    { value: 'interim', label: '期中驗收' },
    { value: 'final', label: '最終驗收' },
    { value: 'partial', label: '部分驗收' },
    { value: 'stage', label: '階段驗收' },
    { value: 'completion', label: '完工驗收' }
  ];

  // Computed
  readonly stats = computed(() => {
    const acceptances = this.acceptanceService.acceptances();
    return {
      total: acceptances.length,
      pending: acceptances.filter(a => a.status === 'pending' || a.status === 'in_progress').length,
      passed: acceptances.filter(a => a.status === 'passed' || a.status === 'conditionally_passed').length,
      failed: acceptances.filter(a => a.status === 'failed').length
    };
  });

  readonly filteredAcceptances = computed(() => {
    let results = this.acceptanceService.acceptances();

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      results = results.filter(a => a.acceptance_code.toLowerCase().includes(search) || a.title.toLowerCase().includes(search));
    }

    if (this.filterStatus) {
      results = results.filter(a => a.status === this.filterStatus);
    }

    if (this.filterType) {
      results = results.filter(a => a.acceptance_type === this.filterType);
    }

    if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      const startDate = this.dateRange[0].getTime();
      const endDate = this.dateRange[1].getTime();
      results = results.filter(a => {
        const createdAt = new Date(a.created_at).getTime();
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    return results;
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      this.blueprintId = params['id'];
      if (this.blueprintId) {
        this.loadAcceptances();
      }
    });
  }

  loadAcceptances(): void {
    this.acceptanceService.loadByBlueprint(this.blueprintId);
  }

  onSearch(): void {
    // Filtering is done via computed signal
  }

  applyFilters(): void {
    // Filtering is done via computed signal
  }

  resetFilters(): void {
    this.searchText = '';
    this.filterStatus = null;
    this.filterType = null;
    this.dateRange = null;
  }

  // Drawer operations
  openCreateDrawer(): void {
    this.formData = {
      blueprint_id: this.blueprintId,
      acceptance_code: generateAcceptanceCode('interim'),
      acceptance_type: 'interim'
    };
    this.drawerMode.set('create');
    this.drawerVisible.set(true);
  }

  openEditDrawer(acceptance: Acceptance): void {
    this.formData = { ...acceptance };
    this.drawerMode.set('edit');
    this.drawerVisible.set(true);
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.formData = {};
  }

  async saveAcceptance(): Promise<void> {
    if (!this.formData.title) {
      this.msg.warning('請輸入驗收標題');
      return;
    }

    this.saving.set(true);

    try {
      if (this.drawerMode() === 'create') {
        const result = await this.acceptanceService.createAcceptance(this.formData as CreateAcceptanceRequest).toPromise();
        if (result) {
          this.msg.success('驗收記錄已建立');
          this.closeDrawer();
        } else {
          this.msg.error('建立失敗');
        }
      } else {
        const id = (this.formData as Acceptance).id;
        const result = await this.acceptanceService.updateAcceptance(id, this.formData).toPromise();
        if (result) {
          this.msg.success('驗收記錄已更新');
          this.closeDrawer();
        } else {
          this.msg.error('更新失敗');
        }
      }
    } finally {
      this.saving.set(false);
    }
  }

  // Detail operations
  viewDetails(acceptance: Acceptance): void {
    this.selectedAcceptance.set(acceptance as AcceptanceWithDetails);
    this.detailModalVisible = true;
  }

  closeDetailModal(): void {
    this.detailModalVisible = false;
    this.selectedAcceptance.set(null);
  }

  // Workflow operations
  async startAcceptance(acceptance: Acceptance): Promise<void> {
    const result = await this.acceptanceService.startAcceptance(acceptance.id).toPromise();
    if (result) {
      this.msg.success('驗收流程已開始');
      this.loadAcceptances();
    } else {
      this.msg.error('操作失敗');
    }
  }

  openDecisionModal(acceptance: Acceptance): void {
    this.currentDecisionAcceptance = acceptance;
    this.decisionForm = {
      decision: null,
      decision_reason: '',
      conditions: ''
    };
    this.decisionModalVisible = true;
    this.closeDetailModal();
  }

  closeDecisionModal(): void {
    this.decisionModalVisible = false;
    this.currentDecisionAcceptance = null;
  }

  async submitDecision(): Promise<void> {
    if (!this.decisionForm.decision) {
      this.msg.warning('請選擇決定');
      return;
    }

    if (this.decisionForm.decision === 'reject' && !this.decisionForm.decision_reason) {
      this.msg.warning('駁回時必須提供理由');
      return;
    }

    if (this.decisionForm.decision === 'conditional' && !this.decisionForm.conditions) {
      this.msg.warning('有條件核准時必須說明條件');
      return;
    }

    if (!this.currentDecisionAcceptance) return;

    this.saving.set(true);

    try {
      const result = await this.acceptanceService
        .makeDecision(this.currentDecisionAcceptance.id, {
          decision: this.decisionForm.decision,
          decision_reason: this.decisionForm.decision_reason || undefined,
          conditions: this.decisionForm.conditions || undefined
        })
        .toPromise();

      if (result) {
        this.msg.success('決定已提交');
        this.closeDecisionModal();
        this.loadAcceptances();
      } else {
        this.msg.error('操作失敗');
      }
    } finally {
      this.saving.set(false);
    }
  }

  async deleteAcceptance(acceptance: Acceptance): Promise<void> {
    const success = await this.acceptanceService.deleteAcceptance(acceptance.id).toPromise();
    if (success) {
      this.msg.success('驗收記錄已刪除');
    } else {
      this.msg.error('刪除失敗');
    }
  }

  // Configuration helpers
  getStatusConfig(status: AcceptanceStatus) {
    return ACCEPTANCE_STATUS_CONFIG[status];
  }

  getTypeConfig(type: AcceptanceType) {
    return ACCEPTANCE_TYPE_CONFIG[type];
  }

  getDecisionConfig(decision: AcceptanceDecision) {
    return ACCEPTANCE_DECISION_CONFIG[decision];
  }

  isAcceptanceCompleted(acceptance: Acceptance): boolean {
    return isAcceptanceCompleted(acceptance);
  }
}
