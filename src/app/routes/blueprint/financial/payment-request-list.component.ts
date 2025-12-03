/**
 * Payment Request List Component
 *
 * 請款列表元件
 * Payment request list component with enterprise-grade features
 *
 * Features:
 * - Workflow-based status management (Draft → Pending → Approved/Rejected → Paid)
 * - Approval/Rejection functionality
 * - Full CRUD operations
 * - Audit trail integration
 *
 * @module routes/blueprint/financial
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { STChange, STColumn, STComponent, STPage } from '@delon/abc/st';
import { PaymentRequest, PaymentRequestStatus, Contract } from '@core';
import { FinancialService, SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-payment-request-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="payment-request-list-container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button nz-button nzType="text" (click)="goBack()" class="back-button">
            <span nz-icon nzType="arrow-left"></span>
          </button>
          <div class="title-section">
            <h3>請款管理</h3>
            <span class="subtitle">Payment Request Management - 管理請款與審核流程</span>
          </div>
        </div>
        <div class="header-actions">
          <button nz-button nzType="primary" (click)="openCreateDrawer()">
            <span nz-icon nzType="plus"></span>
            新增請款
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="stats-section">
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="總請款數" [nzValue]="totalRequests()"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="待審核"
              [nzValue]="pendingRequests()"
              [nzValueStyle]="{ color: '#fa8c16' }"
            ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="已核准金額"
              [nzValue]="approvedAmount()"
              [nzValueStyle]="{ color: '#52c41a' }"
              nzPrefix="$"
            ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="待付款金額"
              [nzValue]="pendingAmount()"
              [nzValueStyle]="{ color: '#722ed1' }"
              nzPrefix="$"
            ></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Filter Section -->
      <nz-card [nzBordered]="false" class="filter-card">
        <div nz-row [nzGutter]="16" class="filter-row">
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
            <nz-input-group [nzPrefix]="prefixSearch">
              <input nz-input placeholder="搜尋請款編號或描述..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
            </nz-input-group>
            <ng-template #prefixSearch>
              <span nz-icon nzType="search"></span>
            </ng-template>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
            <nz-select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="狀態篩選"
              nzAllowClear
              style="width: 100%"
            >
              <nz-option nzValue="draft" nzLabel="草稿"></nz-option>
              <nz-option nzValue="pending" nzLabel="待審核"></nz-option>
              <nz-option nzValue="approved" nzLabel="已核准"></nz-option>
              <nz-option nzValue="rejected" nzLabel="已拒絕"></nz-option>
              <nz-option nzValue="paid" nzLabel="已付款"></nz-option>
            </nz-select>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
            <button nz-button (click)="resetFilters()">
              <span nz-icon nzType="clear"></span>
              清除篩選
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Payment Request Table -->
      <nz-card [nzBordered]="false" class="table-card">
        <st
          #st
          [data]="filteredRequests()"
          [columns]="columns"
          [page]="page"
          [loading]="financialService.loading()"
          (change)="onTableChange($event)"
          [scroll]="{ x: '1100px' }"
        >
          <ng-template st-row="status" let-item>
            <nz-tag [nzColor]="getStatusColor(item.status)">
              {{ getStatusLabel(item.status) }}
            </nz-tag>
          </ng-template>
          <ng-template st-row="amount" let-item>
            {{ item.requested_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}
          </ng-template>
          <ng-template st-row="actions" let-item>
            <button nz-button nzType="link" nzSize="small" (click)="viewRequest(item)">
              <span nz-icon nzType="eye"></span>
            </button>
            @if (item.status === 'draft' || item.status === 'pending') {
              <button nz-button nzType="link" nzSize="small" (click)="editRequest(item)">
                <span nz-icon nzType="edit"></span>
              </button>
            }
            @if (item.status === 'pending') {
              <button nz-button nzType="link" nzSize="small" style="color: #52c41a" (click)="approveRequest(item)">
                <span nz-icon nzType="check"></span>
              </button>
              <button nz-button nzType="link" nzSize="small" nzDanger (click)="openRejectModal(item)">
                <span nz-icon nzType="close"></span>
              </button>
            }
            @if (item.status === 'draft') {
              <button
                nz-button
                nzType="link"
                nzSize="small"
                nzDanger
                nz-popconfirm
                nzPopconfirmTitle="確定要刪除此請款嗎？"
                (nzOnConfirm)="deleteRequest(item)"
              >
                <span nz-icon nzType="delete"></span>
              </button>
            }
          </ng-template>
        </st>
      </nz-card>

      <!-- Payment Request Form Drawer -->
      <nz-drawer
        [nzVisible]="drawerVisible()"
        [nzTitle]="drawerTitle()"
        [nzWidth]="520"
        (nzOnClose)="closeDrawer()"
      >
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="requestForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzFor="request_number">請款編號</nz-form-label>
              <nz-form-control>
                <input
                  nz-input
                  formControlName="request_number"
                  id="request_number"
                  placeholder="自動生成"
                  [disabled]="true"
                />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="requested_amount">請款金額</nz-form-label>
              <nz-form-control nzErrorTip="請輸入請款金額">
                <nz-input-number
                  formControlName="requested_amount"
                  id="requested_amount"
                  [nzMin]="0"
                  [nzStep]="1000"
                  [nzFormatter]="currencyFormatter"
                  [nzParser]="currencyParser"
                  style="width: 100%"
                ></nz-input-number>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="contract_id">關聯合約</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="contract_id"
                  id="contract_id"
                  nzPlaceHolder="選擇關聯合約（選填）"
                  nzAllowClear
                  style="width: 100%"
                >
                  @for (contract of financialService.contracts(); track contract.id) {
                    <nz-option [nzValue]="contract.id" [nzLabel]="contract.title"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="description">說明</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="description"
                  id="description"
                  [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                  placeholder="請輸入請款說明..."
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <div class="drawer-footer">
              <button nz-button nzType="default" (click)="closeDrawer()">取消</button>
              @if (!editingRequest() || editingRequest()?.status === 'draft') {
                <button
                  nz-button
                  nzType="default"
                  [nzLoading]="saving()"
                  [disabled]="requestForm.invalid"
                  (click)="saveAsDraft()"
                >
                  儲存草稿
                </button>
              }
              <button
                nz-button
                nzType="primary"
                [nzLoading]="saving()"
                [disabled]="requestForm.invalid"
                (click)="submitForApproval()"
              >
                {{ editingRequest() ? '更新並提交' : '提交審核' }}
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Payment Request Detail Drawer -->
      <nz-drawer
        [nzVisible]="detailDrawerVisible()"
        nzTitle="請款詳情"
        [nzWidth]="600"
        (nzOnClose)="closeDetailDrawer()"
      >
        <ng-container *nzDrawerContent>
          @if (viewingRequest(); as request) {
            <nz-descriptions nzTitle="基本資訊" nzBordered [nzColumn]="1">
              <nz-descriptions-item nzTitle="請款編號">{{ request.request_number }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="請款金額">
                {{ request.requested_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態">
                <nz-tag [nzColor]="getStatusColor(request.status)">
                  {{ getStatusLabel(request.status) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="說明">{{ request.description || '-' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">{{ request.created_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              @if (request.approved_at) {
                <nz-descriptions-item nzTitle="核准時間">{{ request.approved_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              }
              @if (request.rejected_reason) {
                <nz-descriptions-item nzTitle="拒絕原因">
                  <span style="color: #ff4d4f">{{ request.rejected_reason }}</span>
                </nz-descriptions-item>
              }
            </nz-descriptions>

            <nz-divider></nz-divider>

            <!-- Timeline -->
            <h4>審核流程</h4>
            <nz-timeline>
              <nz-timeline-item nzColor="blue">
                建立請款 - {{ request.created_at | date: 'yyyy-MM-dd HH:mm' }}
              </nz-timeline-item>
              @if (request.status !== 'draft') {
                <nz-timeline-item nzColor="orange">
                  提交審核
                </nz-timeline-item>
              }
              @if (request.status === 'approved' || request.status === 'paid') {
                <nz-timeline-item nzColor="green">
                  審核通過 - {{ request.approved_at | date: 'yyyy-MM-dd HH:mm' }}
                </nz-timeline-item>
              }
              @if (request.status === 'rejected') {
                <nz-timeline-item nzColor="red">
                  審核拒絕
                </nz-timeline-item>
              }
              @if (request.status === 'paid') {
                <nz-timeline-item nzColor="green">
                  已完成付款
                </nz-timeline-item>
              }
            </nz-timeline>

            @if (request.status === 'pending') {
              <div class="detail-actions">
                <button nz-button nzType="primary" (click)="approveRequest(request)">
                  <span nz-icon nzType="check"></span>
                  核准
                </button>
                <button nz-button nzDanger (click)="openRejectModal(request)">
                  <span nz-icon nzType="close"></span>
                  拒絕
                </button>
              </div>
            }
          }
        </ng-container>
      </nz-drawer>

      <!-- Reject Modal -->
      <nz-modal
        [(nzVisible)]="rejectModalVisible"
        nzTitle="拒絕請款"
        (nzOnCancel)="closeRejectModal()"
        (nzOnOk)="confirmReject()"
      >
        <ng-container *nzModalContent>
          <nz-form-item>
            <nz-form-label nzRequired>拒絕原因</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="rejectReason"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                placeholder="請輸入拒絕原因..."
              ></textarea>
            </nz-form-control>
          </nz-form-item>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [
    `
      .payment-request-list-container {
        padding: 24px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .back-button {
        padding: 4px 8px;
        color: #666;
      }

      .title-section h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .subtitle {
        color: #666;
        font-size: 14px;
      }

      .stats-section {
        margin-bottom: 16px;
      }

      .stat-card {
        text-align: center;
      }

      .filter-card {
        margin-bottom: 16px;
      }

      .filter-row {
        align-items: center;
      }

      .table-card {
        margin-bottom: 24px;
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #f0f0f0;
      }

      .detail-actions {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentRequestListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly financialService = inject(FinancialService);

  @ViewChild('st') private st!: STComponent;

  /** Blueprint ID from route param */
  id = input.required<string>();

  /** Filter states */
  searchText = '';
  selectedStatus = '';

  /** Drawer states */
  drawerVisible = signal(false);
  detailDrawerVisible = signal(false);
  editingRequest = signal<PaymentRequest | null>(null);
  viewingRequest = signal<PaymentRequest | null>(null);
  saving = signal(false);

  /** Reject modal states */
  rejectModalVisible = false;
  rejectReason = '';
  rejectingRequest: PaymentRequest | null = null;

  /** Form */
  requestForm: FormGroup = this.fb.group({
    request_number: [{ value: '', disabled: true }],
    requested_amount: [0, [Validators.required, Validators.min(1)]],
    contract_id: [null],
    description: ['']
  });

  /** Computed values */
  readonly totalRequests = computed(() => this.financialService.paymentRequests().length);
  readonly pendingRequests = computed(() =>
    this.financialService.paymentRequests().filter(r => r.status === PaymentRequestStatus.PENDING).length
  );
  readonly approvedAmount = computed(() =>
    this.financialService
      .paymentRequests()
      .filter(r => r.status === PaymentRequestStatus.APPROVED || r.status === PaymentRequestStatus.PAID)
      .reduce((sum, r) => sum + (r.requested_amount || 0), 0)
  );
  readonly pendingAmount = computed(() =>
    this.financialService
      .paymentRequests()
      .filter(r => r.status === PaymentRequestStatus.APPROVED)
      .reduce((sum, r) => sum + (r.requested_amount || 0), 0)
  );

  /** Filtered requests */
  readonly filteredRequests = computed(() => {
    let requests = this.financialService.paymentRequests();

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      requests = requests.filter(
        r =>
          r.request_number.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus) {
      requests = requests.filter(r => r.status === this.selectedStatus);
    }

    return requests;
  });

  /** Drawer title */
  readonly drawerTitle = computed(() => (this.editingRequest() ? '編輯請款' : '新增請款'));

  /** Table columns */
  columns: STColumn[] = [
    { title: '請款編號', index: 'request_number', width: 150 },
    { title: '請款金額', render: 'amount', width: 150 },
    { title: '狀態', render: 'status', width: 100 },
    { title: '說明', index: 'description', width: 200 },
    { title: '建立時間', index: 'created_at', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    { title: '操作', render: 'actions', fixed: 'right', width: 180 }
  ];

  /** Table page configuration */
  page: STPage = {
    show: true,
    showSize: true,
    pageSizes: [10, 20, 50],
    showQuickJumper: true,
    total: true,
    front: true
  };

  /** Currency formatter */
  currencyFormatter = (value: number): string => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  currencyParser = (value: string): number => Number(value.replace(/\$\s?|(,*)/g, ''));

  ngOnInit(): void {
    this.loadRequests();
  }

  /** Load payment requests */
  async loadRequests(): Promise<void> {
    try {
      await this.financialService.loadPaymentRequests(this.id());
    } catch {
      this.msg.error('載入請款失敗');
    }
  }

  /** On search text change */
  onSearch(): void {
    // Trigger computed signal update
  }

  /** On filter change */
  onFilterChange(): void {
    // Trigger computed signal update
  }

  /** Reset filters */
  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
  }

  /** Table change handler */
  onTableChange(event: STChange): void {
    // Handle table events if needed
  }

  /** Open create drawer */
  openCreateDrawer(): void {
    this.editingRequest.set(null);
    const requestNumber = this.generateRequestNumber();
    this.requestForm.reset({
      request_number: requestNumber,
      requested_amount: 0
    });
    this.drawerVisible.set(true);
  }

  /** Generate request number */
  private generateRequestNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `PR${year}${month}${day}-${random}`;
  }

  /** Close drawer */
  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.editingRequest.set(null);
  }

  /** Close detail drawer */
  closeDetailDrawer(): void {
    this.detailDrawerVisible.set(false);
    this.viewingRequest.set(null);
  }

  /** View request */
  viewRequest(request: PaymentRequest): void {
    this.viewingRequest.set(request);
    this.detailDrawerVisible.set(true);
  }

  /** Edit request */
  editRequest(request: PaymentRequest): void {
    this.editingRequest.set(request);
    this.requestForm.patchValue({
      request_number: request.request_number,
      requested_amount: request.requested_amount,
      contract_id: request.contract_id,
      description: request.description
    });
    this.drawerVisible.set(true);
  }

  /** Save as draft */
  async saveAsDraft(): Promise<void> {
    if (this.requestForm.invalid) return;
    await this.saveRequest(PaymentRequestStatus.DRAFT);
  }

  /** Submit for approval */
  async submitForApproval(): Promise<void> {
    if (this.requestForm.invalid) return;
    await this.saveRequest(PaymentRequestStatus.PENDING);
  }

  /** Save request with status */
  private async saveRequest(status: PaymentRequestStatus): Promise<void> {
    this.saving.set(true);
    try {
      const formValue = this.requestForm.getRawValue();
      const data = {
        ...formValue,
        blueprint_id: this.id(),
        status
      };

      if (this.editingRequest()) {
        await this.financialService.updatePaymentRequest(this.editingRequest()!.id, data);
        this.msg.success('請款更新成功');
      } else {
        await this.financialService.createPaymentRequest(data);
        this.msg.success(status === PaymentRequestStatus.DRAFT ? '請款已儲存為草稿' : '請款已提交審核');
      }
      this.closeDrawer();
    } catch {
      this.msg.error(this.editingRequest() ? '更新請款失敗' : '建立請款失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /** Approve request */
  async approveRequest(request: PaymentRequest): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認核准',
      nzContent: `確定要核准請款編號 ${request.request_number}，金額 ${request.requested_amount.toLocaleString()} 元嗎？`,
      nzOnOk: async () => {
        try {
          await this.financialService.approvePaymentRequest(request.id);
          this.msg.success('請款已核准');
          this.closeDetailDrawer();
        } catch {
          this.msg.error('核准請款失敗');
        }
      }
    });
  }

  /** Open reject modal */
  openRejectModal(request: PaymentRequest): void {
    this.rejectingRequest = request;
    this.rejectReason = '';
    this.rejectModalVisible = true;
  }

  /** Close reject modal */
  closeRejectModal(): void {
    this.rejectModalVisible = false;
    this.rejectingRequest = null;
    this.rejectReason = '';
  }

  /** Confirm reject */
  async confirmReject(): Promise<void> {
    if (!this.rejectReason.trim()) {
      this.msg.warning('請輸入拒絕原因');
      return;
    }

    try {
      await this.financialService.rejectPaymentRequest(this.rejectingRequest!.id, this.rejectReason);
      this.msg.success('請款已拒絕');
      this.closeRejectModal();
      this.closeDetailDrawer();
    } catch {
      this.msg.error('拒絕請款失敗');
    }
  }

  /** Delete request */
  async deleteRequest(request: PaymentRequest): Promise<void> {
    try {
      await this.financialService.deletePaymentRequest(request.id);
      this.msg.success('請款已刪除');
    } catch {
      this.msg.error('刪除請款失敗');
    }
  }

  /** Get status color */
  getStatusColor(status: string): string {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return 'default';
      case PaymentRequestStatus.PENDING:
        return 'processing';
      case PaymentRequestStatus.APPROVED:
        return 'success';
      case PaymentRequestStatus.REJECTED:
        return 'error';
      case PaymentRequestStatus.PAID:
        return 'green';
      default:
        return 'default';
    }
  }

  /** Get status label */
  getStatusLabel(status: string): string {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return '草稿';
      case PaymentRequestStatus.PENDING:
        return '待審核';
      case PaymentRequestStatus.APPROVED:
        return '已核准';
      case PaymentRequestStatus.REJECTED:
        return '已拒絕';
      case PaymentRequestStatus.PAID:
        return '已付款';
      default:
        return status;
    }
  }

  /** Go back */
  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'financial', 'overview']);
  }
}
