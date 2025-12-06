/**
 * Blueprint Problems Component
 *
 * 問題追蹤組件
 * Problem tracking component
 *
 * Features:
 * - Problem list with filters and search
 * - Problem creation/editing drawer
 * - Problem detail view
 * - Status workflow management
 * - Statistics cards
 *
 * @module routes/blueprint/problems
 */

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Problem,
  ProblemStatus,
  ProblemType,
  ProblemPriority,
  ProblemSeverity,
  CreateProblemRequest,
  UpdateProblemRequest,
  PROBLEM_STATUS_CONFIG,
  PROBLEM_TYPE_CONFIG,
  PROBLEM_PRIORITY_CONFIG,
  PROBLEM_SEVERITY_CONFIG
} from '@core';
import { ProblemService, WorkspaceContextService } from '@shared';
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
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-blueprint-problems',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzResultModule,
    NzEmptyModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDescriptionsModule,
    NzDividerModule,
    NzGridModule,
    NzPaginationModule,
    NzStatisticModule,
    NzBadgeModule,
    NzToolTipModule,
    NzModalModule
  ],
  template: `
    <div class="problems-container">
      <nz-spin [nzSpinning]="loading()">
        @if (error()) {
          <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="error() || '未知錯誤'">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="goBack()">返回概覽</button>
              <button nz-button (click)="loadProblems()">重試</button>
            </div>
          </nz-result>
        } @else {
          <!-- Header -->
          <div class="page-header">
            <div class="header-left">
              <button nz-button (click)="goBack()">
                <span nz-icon nzType="arrow-left"></span>
                返回
              </button>
              <h2>問題追蹤</h2>
            </div>
            <div class="header-right">
              <button nz-button nzType="primary" (click)="openCreateDrawer()">
                <span nz-icon nzType="plus"></span>
                新增問題
              </button>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div nz-row [nzGutter]="[16, 16]" class="stats-row">
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card">
                <nz-statistic nzTitle="總問題數" [nzValue]="stats().total"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card open">
                <nz-statistic nzTitle="開立中" [nzValue]="stats().open" [nzValueStyle]="{ color: '#fa8c16' }"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card in-progress">
                <nz-statistic nzTitle="處理中" [nzValue]="stats().inProgress" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card resolved">
                <nz-statistic nzTitle="已解決" [nzValue]="stats().resolved" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card closed">
                <nz-statistic nzTitle="已關閉" [nzValue]="stats().closed"></nz-statistic>
              </nz-card>
            </div>
            <div nz-col [nzXs]="12" [nzSm]="8" [nzMd]="4">
              <nz-card [nzBordered]="false" class="stat-card critical">
                <nz-statistic nzTitle="嚴重問題" [nzValue]="stats().critical" [nzValueStyle]="{ color: '#ff4d4f' }"></nz-statistic>
              </nz-card>
            </div>
          </div>

          <!-- Filters -->
          <nz-card [nzBordered]="false" class="filter-card">
            <div class="filters">
              <nz-select
                [(ngModel)]="filterStatus"
                nzPlaceHolder="狀態篩選"
                nzAllowClear
                style="width: 150px"
                (ngModelChange)="applyFilters()"
              >
                <nz-option nzValue="open" nzLabel="開立中"></nz-option>
                <nz-option nzValue="assessing" nzLabel="評估中"></nz-option>
                <nz-option nzValue="assigned" nzLabel="已分派"></nz-option>
                <nz-option nzValue="in_progress" nzLabel="處理中"></nz-option>
                <nz-option nzValue="resolved" nzLabel="已解決"></nz-option>
                <nz-option nzValue="verifying" nzLabel="驗證中"></nz-option>
                <nz-option nzValue="closed" nzLabel="已關閉"></nz-option>
              </nz-select>

              <nz-select
                [(ngModel)]="filterType"
                nzPlaceHolder="類型篩選"
                nzAllowClear
                style="width: 150px"
                (ngModelChange)="applyFilters()"
              >
                <nz-option nzValue="defect" nzLabel="缺陷"></nz-option>
                <nz-option nzValue="risk" nzLabel="風險"></nz-option>
                <nz-option nzValue="safety" nzLabel="安全問題"></nz-option>
                <nz-option nzValue="quality" nzLabel="品質問題"></nz-option>
                <nz-option nzValue="improvement" nzLabel="改善建議"></nz-option>
              </nz-select>

              <nz-select
                [(ngModel)]="filterPriority"
                nzPlaceHolder="優先級篩選"
                nzAllowClear
                style="width: 150px"
                (ngModelChange)="applyFilters()"
              >
                <nz-option nzValue="critical" nzLabel="嚴重"></nz-option>
                <nz-option nzValue="high" nzLabel="高"></nz-option>
                <nz-option nzValue="medium" nzLabel="中"></nz-option>
                <nz-option nzValue="low" nzLabel="低"></nz-option>
              </nz-select>

              <nz-input-group [nzPrefix]="prefixIcon" style="width: 200px">
                <input
                  nz-input
                  [(ngModel)]="searchKeyword"
                  placeholder="搜尋問題..."
                  (keyup.enter)="applyFilters()"
                />
              </nz-input-group>
              <ng-template #prefixIcon>
                <span nz-icon nzType="search"></span>
              </ng-template>

              <button nz-button (click)="clearFilters()">
                <span nz-icon nzType="clear"></span>
                清除篩選
              </button>
            </div>
          </nz-card>

          <!-- Problems Table -->
          <nz-card [nzBordered]="false" class="table-card">
            <nz-table
              #problemTable
              [nzData]="problems()"
              [nzLoading]="loading()"
              [nzPageSize]="pageSize"
              [nzPageIndex]="pageIndex"
              [nzTotal]="total()"
              [nzShowPagination]="true"
              [nzFrontPagination]="false"
              (nzPageIndexChange)="onPageIndexChange($event)"
              (nzPageSizeChange)="onPageSizeChange($event)"
              nzSize="middle"
            >
              <thead>
                <tr>
                  <th nzWidth="80px">編號</th>
                  <th>標題</th>
                  <th nzWidth="100px">類型</th>
                  <th nzWidth="80px">優先級</th>
                  <th nzWidth="80px">嚴重度</th>
                  <th nzWidth="100px">狀態</th>
                  <th nzWidth="120px">建立日期</th>
                  <th nzWidth="120px">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (problem of problemTable.data; track problem.id) {
                  <tr>
                    <td>{{ problem.problem_code || '-' }}</td>
                    <td>
                      <a (click)="openDetailDrawer(problem)">{{ problem.title }}</a>
                    </td>
                    <td>
                      <nz-tag [nzColor]="getTypeColor(problem.problem_type)">{{ getTypeLabel(problem.problem_type) }}</nz-tag>
                    </td>
                    <td>
                      <nz-tag [nzColor]="getPriorityColor(problem.priority)">{{ getPriorityLabel(problem.priority) }}</nz-tag>
                    </td>
                    <td>
                      <nz-tag [nzColor]="getSeverityColor(problem.severity)">{{ getSeverityLabel(problem.severity) }}</nz-tag>
                    </td>
                    <td>
                      <nz-tag [nzColor]="getStatusColor(problem.status)">{{ getStatusLabel(problem.status) }}</nz-tag>
                    </td>
                    <td>{{ problem.created_at | date:'yyyy-MM-dd' }}</td>
                    <td>
                      <button nz-button nzType="link" nzSize="small" (click)="openEditDrawer(problem)">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button nz-button nzType="link" nzSize="small" (click)="openDetailDrawer(problem)">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      @if (problem.status !== 'closed') {
                        <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteProblem(problem)">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8">
                      <nz-empty nzNotFoundContent="尚無問題記錄"></nz-empty>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-card>
        }
      </nz-spin>

      <!-- Create/Edit Drawer -->
      <nz-drawer
        [nzVisible]="editDrawerVisible()"
        [nzTitle]="editingProblem() ? '編輯問題' : '新增問題'"
        [nzWidth]="600"
        (nzOnClose)="closeEditDrawer()"
      >
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="problemForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired nzFor="title">問題標題</nz-form-label>
              <nz-form-control nzErrorTip="請輸入問題標題">
                <input nz-input formControlName="title" id="title" placeholder="請輸入問題標題" />
              </nz-form-control>
            </nz-form-item>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired nzFor="type">問題類型</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="type" id="type" nzPlaceHolder="選擇類型">
                      <nz-option nzValue="defect" nzLabel="缺陷"></nz-option>
                      <nz-option nzValue="risk" nzLabel="風險"></nz-option>
                      <nz-option nzValue="safety" nzLabel="安全問題"></nz-option>
                      <nz-option nzValue="quality" nzLabel="品質問題"></nz-option>
                      <nz-option nzValue="improvement" nzLabel="改善建議"></nz-option>
                      <nz-option nzValue="change_request" nzLabel="變更請求"></nz-option>
                      <nz-option nzValue="non_conformance" nzLabel="不符合"></nz-option>
                      <nz-option nzValue="other" nzLabel="其他"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired nzFor="priority">優先級</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="priority" id="priority" nzPlaceHolder="選擇優先級">
                      <nz-option nzValue="critical" nzLabel="嚴重"></nz-option>
                      <nz-option nzValue="high" nzLabel="高"></nz-option>
                      <nz-option nzValue="medium" nzLabel="中"></nz-option>
                      <nz-option nzValue="low" nzLabel="低"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzRequired nzFor="severity">嚴重度</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="severity" id="severity" nzPlaceHolder="選擇嚴重度">
                      <nz-option nzValue="critical" nzLabel="嚴重"></nz-option>
                      <nz-option nzValue="major" nzLabel="主要"></nz-option>
                      <nz-option nzValue="minor" nzLabel="次要"></nz-option>
                      <nz-option nzValue="cosmetic" nzLabel="外觀"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label nzFor="dueDate">期限日期</nz-form-label>
                  <nz-form-control>
                    <nz-date-picker
                      formControlName="dueDate"
                      id="dueDate"
                      style="width: 100%"
                      nzFormat="yyyy-MM-dd"
                    ></nz-date-picker>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="description">問題描述</nz-form-label>
              <nz-form-control nzErrorTip="請輸入問題描述">
                <textarea
                  nz-input
                  formControlName="description"
                  id="description"
                  placeholder="詳細描述問題..."
                  [nzAutosize]="{ minRows: 4, maxRows: 8 }"
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="location">問題位置</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="location" id="location" placeholder="例如：3F 樓板、A區外牆..." />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="suggestedAction">建議處置</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="suggestedAction"
                  id="suggestedAction"
                  placeholder="建議的處置方式..."
                  [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <div class="drawer-footer">
              <button nz-button (click)="closeEditDrawer()">取消</button>
              <button nz-button nzType="primary" [nzLoading]="saving()" (click)="saveProblem()">
                {{ editingProblem() ? '更新' : '建立' }}
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Detail Drawer -->
      <nz-drawer
        [nzVisible]="detailDrawerVisible()"
        nzTitle="問題詳情"
        [nzWidth]="600"
        (nzOnClose)="closeDetailDrawer()"
      >
        <ng-container *nzDrawerContent>
          @if (selectedProblem()) {
            <nz-descriptions nzBordered [nzColumn]="2">
              <nz-descriptions-item nzTitle="編號" [nzSpan]="1">
                {{ selectedProblem()!.problem_code || '-' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態" [nzSpan]="1">
                <nz-tag [nzColor]="getStatusColor(selectedProblem()!.status)">
                  {{ getStatusLabel(selectedProblem()!.status) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="標題" [nzSpan]="2">
                {{ selectedProblem()!.title }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="類型" [nzSpan]="1">
                <nz-tag [nzColor]="getTypeColor(selectedProblem()!.problem_type)">
                  {{ getTypeLabel(selectedProblem()!.problem_type) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="優先級" [nzSpan]="1">
                <nz-tag [nzColor]="getPriorityColor(selectedProblem()!.priority)">
                  {{ getPriorityLabel(selectedProblem()!.priority) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="嚴重度" [nzSpan]="1">
                <nz-tag [nzColor]="getSeverityColor(selectedProblem()!.severity)">
                  {{ getSeverityLabel(selectedProblem()!.severity) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="期限日期" [nzSpan]="1">
                {{ selectedProblem()!.target_date | date:'yyyy-MM-dd' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="問題描述" [nzSpan]="2">
                {{ selectedProblem()!.description || '-' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="問題位置" [nzSpan]="2">
                {{ selectedProblem()!.location || '-' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="備註" [nzSpan]="2">
                {{ selectedProblem()!.notes || '-' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間" [nzSpan]="1">
                {{ selectedProblem()!.created_at | date:'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="更新時間" [nzSpan]="1">
                {{ selectedProblem()!.updated_at | date:'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
            </nz-descriptions>

            <nz-divider></nz-divider>

            <!-- Status Actions -->
            <div class="status-actions">
              <h4>狀態操作</h4>
              <div class="action-buttons">
                @if (selectedProblem()!.status === 'open') {
                  <button nz-button nzType="primary" (click)="changeStatus('assessing')">開始評估</button>
                }
                @if (selectedProblem()!.status === 'assessing') {
                  <button nz-button nzType="primary" (click)="changeStatus('assigned')">分派處理</button>
                }
                @if (selectedProblem()!.status === 'assigned') {
                  <button nz-button nzType="primary" (click)="changeStatus('in_progress')">開始處理</button>
                }
                @if (selectedProblem()!.status === 'in_progress') {
                  <button nz-button nzType="primary" (click)="changeStatus('resolved')">標記解決</button>
                }
                @if (selectedProblem()!.status === 'resolved') {
                  <button nz-button nzType="primary" (click)="changeStatus('verifying')">開始驗證</button>
                }
                @if (selectedProblem()!.status === 'verifying') {
                  <button nz-button nzType="primary" (click)="changeStatus('closed')">關閉問題</button>
                  <button nz-button nzDanger (click)="changeStatus('in_progress')">驗證失敗</button>
                }
                @if (selectedProblem()!.status !== 'closed' && selectedProblem()!.status !== 'cancelled') {
                  <button nz-button (click)="changeStatus('cancelled')">取消問題</button>
                }
              </div>
            </div>
          }
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    .problems-container {
      padding: 24px;
    }

    .page-header {
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

    .stats-row {
      margin-bottom: 24px;
    }

    .stat-card {
      text-align: center;
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

    .table-card {
      margin-bottom: 24px;
    }

    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }

    .status-actions {
      margin-top: 16px;
    }

    .status-actions h4 {
      margin-bottom: 12px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintProblemsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly problemService = inject(ProblemService);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly problems = signal<Problem[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly editDrawerVisible = signal(false);
  readonly detailDrawerVisible = signal(false);
  readonly editingProblem = signal<Problem | null>(null);
  readonly selectedProblem = signal<Problem | null>(null);

  // Statistics
  readonly stats = computed(() => {
    const all = this.problems();
    return {
      total: all.length,
      open: all.filter(p => p.status === 'open' || p.status === 'assessing' || p.status === 'assigned').length,
      inProgress: all.filter(p => p.status === 'in_progress').length,
      resolved: all.filter(p => p.status === 'resolved' || p.status === 'verifying').length,
      closed: all.filter(p => p.status === 'closed').length,
      critical: all.filter(p => p.priority === 'critical').length
    };
  });

  // Filters
  filterStatus: ProblemStatus | null = null;
  filterType: ProblemType | null = null;
  filterPriority: ProblemPriority | null = null;
  searchKeyword = '';
  pageIndex = 1;
  pageSize = 10;

  // Form
  problemForm!: FormGroup;
  private blueprintId: string | null = null;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.blueprintId = this.route.snapshot.paramMap.get('id');
    if (this.blueprintId) {
      this.loadProblems();
    } else {
      this.error.set('藍圖 ID 不存在');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.problemForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      type: ['defect', [Validators.required]],
      priority: ['medium', [Validators.required]],
      severity: ['minor', [Validators.required]],
      description: ['', [Validators.required]],
      location: [''],
      dueDate: [null],
      suggestedAction: ['']
    });
  }

  loadProblems(): void {
    if (!this.blueprintId) return;

    this.loading.set(true);
    this.error.set(null);

    // Use the service's signal-based approach
    this.problemService.loadProblems({
      blueprintId: this.blueprintId,
      status: this.filterStatus || undefined,
      problemType: this.filterType || undefined,
      priority: this.filterPriority || undefined,
      searchKeyword: this.searchKeyword || undefined,
      limit: this.pageSize,
      offset: (this.pageIndex - 1) * this.pageSize
    });

    // Subscribe to problems from the service
    this.updateFromService();
  }

  private updateFromService(): void {
    const serviceProblems = this.problemService.problems();
    const serviceLoading = this.problemService.loading();
    const serviceError = this.problemService.error();
    const serviceTotal = this.problemService.total();

    this.problems.set(serviceProblems);
    this.loading.set(serviceLoading);
    this.error.set(serviceError);
    this.total.set(serviceTotal);
  }

  applyFilters(): void {
    this.pageIndex = 1;
    this.loadProblems();
  }

  clearFilters(): void {
    this.filterStatus = null;
    this.filterType = null;
    this.filterPriority = null;
    this.searchKeyword = '';
    this.applyFilters();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.loadProblems();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadProblems();
  }

  openCreateDrawer(): void {
    this.editingProblem.set(null);
    this.problemForm.reset({
      type: 'defect',
      priority: 'medium',
      severity: 'minor'
    });
    this.editDrawerVisible.set(true);
  }

  openEditDrawer(problem: Problem): void {
    this.editingProblem.set(problem);
    this.problemForm.patchValue({
      title: problem.title,
      type: problem.problem_type,
      priority: problem.priority,
      severity: problem.severity,
      description: problem.description,
      location: problem.location,
      dueDate: problem.target_date ? new Date(problem.target_date) : null,
      suggestedAction: problem.notes
    });
    this.editDrawerVisible.set(true);
  }

  closeEditDrawer(): void {
    this.editDrawerVisible.set(false);
    this.editingProblem.set(null);
  }

  openDetailDrawer(problem: Problem): void {
    this.selectedProblem.set(problem);
    this.detailDrawerVisible.set(true);
  }

  closeDetailDrawer(): void {
    this.detailDrawerVisible.set(false);
    this.selectedProblem.set(null);
  }

  async saveProblem(): Promise<void> {
    if (this.problemForm.invalid || !this.blueprintId) {
      Object.values(this.problemForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formValue = this.problemForm.value;
    this.saving.set(true);

    if (this.editingProblem()) {
      this.problemService.updateProblem(this.editingProblem()!.id, {
        title: formValue.title,
        problem_type: formValue.type,
        priority: formValue.priority,
        severity: formValue.severity,
        description: formValue.description,
        location: formValue.location,
        target_date: formValue.dueDate?.toISOString().split('T')[0],
        notes: formValue.suggestedAction
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.msg.success('問題已更新');
          this.closeEditDrawer();
          this.loadProblems();
          this.saving.set(false);
        },
        error: () => {
          this.msg.error('儲存失敗');
          this.saving.set(false);
        }
      });
    } else {
      this.problemService.createProblem({
        blueprint_id: this.blueprintId,
        title: formValue.title,
        problem_type: formValue.type,
        priority: formValue.priority,
        severity: formValue.severity,
        description: formValue.description,
        location: formValue.location,
        target_date: formValue.dueDate?.toISOString().split('T')[0],
        notes: formValue.suggestedAction
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.msg.success('問題已建立');
          this.closeEditDrawer();
          this.loadProblems();
          this.saving.set(false);
        },
        error: () => {
          this.msg.error('儲存失敗');
          this.saving.set(false);
        }
      });
    }
  }

  changeStatus(newStatus: ProblemStatus): void {
    const problem = this.selectedProblem();
    if (!problem) return;

    this.problemService.changeStatus(problem.id, {
      status: newStatus,
      action_description: `狀態變更為 ${newStatus}`
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.msg.success('狀態已更新');
        this.closeDetailDrawer();
        this.loadProblems();
      },
      error: () => {
        this.msg.error('狀態更新失敗');
      }
    });
  }

  deleteProblem(problem: Problem): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除問題「${problem.title}」嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: () => {
        this.problemService.deleteProblem(problem.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.msg.success('問題已刪除');
            this.loadProblems();
          },
          error: () => {
            this.msg.error('刪除失敗');
          }
        });
      }
    });
  }

  // Helper methods for display
  getStatusColor(status: ProblemStatus): string {
    const config = PROBLEM_STATUS_CONFIG[status];
    return config?.color || 'default';
  }

  getStatusLabel(status: ProblemStatus): string {
    const config = PROBLEM_STATUS_CONFIG[status];
    return config?.label || status;
  }

  getTypeColor(type: ProblemType): string {
    const config = PROBLEM_TYPE_CONFIG[type];
    return config?.color || 'default';
  }

  getTypeLabel(type: ProblemType): string {
    const config = PROBLEM_TYPE_CONFIG[type];
    return config?.label || type;
  }

  getPriorityColor(priority: ProblemPriority): string {
    const config = PROBLEM_PRIORITY_CONFIG[priority];
    return config?.color || 'default';
  }

  getPriorityLabel(priority: ProblemPriority): string {
    const config = PROBLEM_PRIORITY_CONFIG[priority];
    return config?.label || priority;
  }

  getSeverityColor(severity: ProblemSeverity): string {
    const config = PROBLEM_SEVERITY_CONFIG[severity];
    return config?.color || 'default';
  }

  getSeverityLabel(severity: ProblemSeverity): string {
    const config = PROBLEM_SEVERITY_CONFIG[severity];
    return config?.label || severity;
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId, 'overview']);
  }
}
