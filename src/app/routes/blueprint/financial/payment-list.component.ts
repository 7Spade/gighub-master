/**
 * Payment List Component
 *
 * 付款列表元件
 * Payment list component with enterprise-grade features
 *
 * Features:
 * - Payment tracking and recording
 * - Multiple payment methods support
 * - Full CRUD operations
 * - Audit trail integration
 *
 * @module routes/blueprint/financial
 */

import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Payment } from '@core';
import { STColumn, STComponent, STPage } from '@delon/abc/st';
import { FinancialService, SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="page-container">
      <!-- Header -->
      <app-page-header title="付款紀錄" subtitle="Payment Records - 追蹤付款流水與紀錄" [showBack]="true" (backClick)="goBack()">
        <button actions nz-button nzType="primary" (click)="openCreateDrawer()">
          <span nz-icon nzType="plus"></span>
          新增付款
        </button>
      </app-page-header>

      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="stats-section">
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="總付款筆數" [nzValue]="totalPayments()"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="總付款金額" [nzValue]="totalAmount()" [nzValueStyle]="{ color: '#52c41a' }" nzPrefix="$"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic
              nzTitle="本月付款"
              [nzValue]="thisMonthAmount()"
              [nzValueStyle]="{ color: '#1890ff' }"
              nzPrefix="$"
            ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="12" [nzMd]="6">
          <nz-card [nzBordered]="false" class="stat-card">
            <nz-statistic nzTitle="轉帳佔比" [nzValue]="transferPercentage()" nzSuffix="%"></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Filter Section -->
      <nz-card [nzBordered]="false" class="filter-card">
        <div nz-row [nzGutter]="16" class="filter-row">
          <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
            <nz-input-group [nzPrefix]="prefixSearch">
              <input nz-input placeholder="搜尋參考編號..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
            </nz-input-group>
            <ng-template #prefixSearch>
              <span nz-icon nzType="search"></span>
            </ng-template>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
            <nz-select
              [(ngModel)]="selectedMethod"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="付款方式"
              nzAllowClear
              style="width: 100%"
            >
              <nz-option nzValue="cash" nzLabel="現金"></nz-option>
              <nz-option nzValue="transfer" nzLabel="轉帳"></nz-option>
              <nz-option nzValue="check" nzLabel="支票"></nz-option>
              <nz-option nzValue="credit_card" nzLabel="信用卡"></nz-option>
              <nz-option nzValue="other" nzLabel="其他"></nz-option>
            </nz-select>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="6">
            <nz-range-picker
              [(ngModel)]="dateRange"
              (ngModelChange)="onDateRangeChange()"
              nzFormat="yyyy-MM-dd"
              style="width: 100%"
            ></nz-range-picker>
          </div>
          <div nz-col [nzXs]="12" [nzSm]="6" [nzMd]="4">
            <button nz-button (click)="resetFilters()">
              <span nz-icon nzType="clear"></span>
              清除篩選
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Payment Table -->
      <nz-card [nzBordered]="false" class="table-card">
        <st
          #st
          [data]="filteredPayments()"
          [columns]="columns"
          [page]="page"
          [loading]="financialService.loading()"
          (change)="onTableChange()"
          [scroll]="{ x: '1000px' }"
        >
          <ng-template st-row="method" let-item>
            <nz-tag [nzColor]="getMethodColor(item.payment_method)">
              {{ getMethodLabel(item.payment_method) }}
            </nz-tag>
          </ng-template>
          <ng-template st-row="amount" let-item>
            {{ item.paid_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}
          </ng-template>
          <ng-template st-row="actions" let-item>
            <button nz-button nzType="link" nzSize="small" (click)="viewPayment(item)">
              <span nz-icon nzType="eye"></span>
            </button>
            <button nz-button nzType="link" nzSize="small" (click)="editPayment(item)">
              <span nz-icon nzType="edit"></span>
            </button>
            <button
              nz-button
              nzType="link"
              nzSize="small"
              nzDanger
              nz-popconfirm
              nzPopconfirmTitle="確定要刪除此付款紀錄嗎？"
              (nzOnConfirm)="deletePayment(item)"
            >
              <span nz-icon nzType="delete"></span>
            </button>
          </ng-template>
        </st>
      </nz-card>

      <!-- Payment Form Drawer -->
      <nz-drawer [nzVisible]="drawerVisible()" [nzTitle]="drawerTitle()" [nzWidth]="520" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="paymentForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired nzFor="payment_request_id">關聯請款單</nz-form-label>
              <nz-form-control nzErrorTip="請選擇關聯請款單">
                <nz-select
                  formControlName="payment_request_id"
                  id="payment_request_id"
                  nzPlaceHolder="選擇關聯請款單"
                  style="width: 100%"
                  (ngModelChange)="onPaymentRequestChange($event)"
                >
                  @for (request of approvedRequests(); track request.id) {
                    <nz-option
                      [nzValue]="request.id"
                      [nzLabel]="(request.title || request.request_number || '請款單') + ' - ' + (request.requested_amount | number)"
                    ></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="paid_amount">付款金額</nz-form-label>
              <nz-form-control nzErrorTip="請輸入付款金額">
                <nz-input-number
                  formControlName="paid_amount"
                  id="paid_amount"
                  [nzMin]="0"
                  [nzStep]="1000"
                  [nzFormatter]="currencyFormatter"
                  [nzParser]="currencyParser"
                  style="width: 100%"
                ></nz-input-number>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="payment_method">付款方式</nz-form-label>
              <nz-form-control nzErrorTip="請選擇付款方式">
                <nz-select formControlName="payment_method" id="payment_method" style="width: 100%">
                  <nz-option nzValue="cash" nzLabel="現金"></nz-option>
                  <nz-option nzValue="transfer" nzLabel="轉帳"></nz-option>
                  <nz-option nzValue="check" nzLabel="支票"></nz-option>
                  <nz-option nzValue="credit_card" nzLabel="信用卡"></nz-option>
                  <nz-option nzValue="other" nzLabel="其他"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired nzFor="paid_at">付款日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇付款日期">
                <nz-date-picker formControlName="paid_at" id="paid_at" style="width: 100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="reference_number">參考編號</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="reference_number" id="reference_number" placeholder="例如：銀行交易序號" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzFor="notes">備註</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="notes"
                  id="notes"
                  [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                  placeholder="請輸入備註..."
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <div class="drawer-footer">
              <button nz-button nzType="default" (click)="closeDrawer()">取消</button>
              <button nz-button nzType="primary" [nzLoading]="saving()" [disabled]="paymentForm.invalid" (click)="savePayment()">
                {{ editingPayment() ? '更新' : '建立' }}
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Payment Detail Drawer -->
      <nz-drawer [nzVisible]="detailDrawerVisible()" nzTitle="付款詳情" [nzWidth]="600" (nzOnClose)="closeDetailDrawer()">
        <ng-container *nzDrawerContent>
          @if (viewingPayment(); as payment) {
            <nz-descriptions nzTitle="付款資訊" nzBordered [nzColumn]="1">
              <nz-descriptions-item nzTitle="付款金額">
                <span style="font-size: 18px; font-weight: 600; color: #52c41a">
                  {{ payment.paid_amount | currency: 'TWD' : 'symbol' : '1.0-0' }}
                </span>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="付款方式">
                <nz-tag [nzColor]="getMethodColor(payment.payment_method)">
                  {{ getMethodLabel(payment.payment_method) }}
                </nz-tag>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="付款日期">
                {{ payment.paid_at | date: 'yyyy-MM-dd' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="參考編號">{{ payment.reference_number || '-' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="備註">{{ payment.notes || '-' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">{{ payment.created_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="更新時間">{{ payment.updated_at | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
            </nz-descriptions>

            <div class="detail-actions">
              <button nz-button nzType="primary" (click)="editPayment(payment)">
                <span nz-icon nzType="edit"></span>
                編輯
              </button>
            </div>
          }
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [
    `
      .page-container {
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

      .header-actions {
        display: flex;
        gap: 12px;
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
export class PaymentListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly financialService = inject(FinancialService);

  @ViewChild('st') private st!: STComponent;

  /** Blueprint ID from route param */
  id = input.required<string>();

  /** Filter states */
  searchText = '';
  selectedMethod = '';
  dateRange: Date[] = [];

  /** Drawer states */
  drawerVisible = signal(false);
  detailDrawerVisible = signal(false);
  editingPayment = signal<Payment | null>(null);
  viewingPayment = signal<Payment | null>(null);
  saving = signal(false);

  /** Form */
  paymentForm: FormGroup = this.fb.group({
    payment_request_id: [null, [Validators.required]],
    paid_amount: [0, [Validators.required, Validators.min(1)]],
    payment_method: [null],
    paid_at: [new Date(), [Validators.required]],
    reference_number: [''],
    notes: ['']
  });

  /** Computed values */
  readonly totalPayments = computed(() => this.financialService.payments().length);
  readonly totalAmount = computed(() => this.financialService.payments().reduce((sum, p) => sum + (p.paid_amount || 0), 0));

  readonly thisMonthAmount = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.financialService
      .payments()
      .filter(p => new Date(p.paid_at) >= startOfMonth)
      .reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  });

  readonly transferPercentage = computed(() => {
    const total = this.totalAmount();
    if (total === 0) return 0;
    const transferAmount = this.financialService
      .payments()
      .filter(p => p.payment_method === 'transfer')
      .reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    return Math.round((transferAmount / total) * 100);
  });

  /** Approved payment requests (lifecycle = archived) */
  readonly approvedRequests = computed(() =>
    this.financialService.paymentRequests().filter(r => r.lifecycle === 'archived' || r.lifecycle === 'active')
  );

  /** Filtered payments */
  readonly filteredPayments = computed(() => {
    let payments = this.financialService.payments();

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      payments = payments.filter(
        p =>
          (p.reference_number && p.reference_number.toLowerCase().includes(search)) || (p.notes && p.notes.toLowerCase().includes(search))
      );
    }

    if (this.selectedMethod) {
      payments = payments.filter(p => p.payment_method === this.selectedMethod);
    }

    if (this.dateRange.length === 2) {
      const startDate = this.dateRange[0];
      const endDate = this.dateRange[1];
      payments = payments.filter(p => {
        const paidAt = new Date(p.paid_at);
        return paidAt >= startDate && paidAt <= endDate;
      });
    }

    return payments;
  });

  /** Drawer title */
  readonly drawerTitle = computed(() => (this.editingPayment() ? '編輯付款' : '新增付款'));

  /** Table columns */
  columns: STColumn[] = [
    { title: '付款金額', render: 'amount', width: 150 },
    { title: '付款方式', render: 'method', width: 100 },
    { title: '付款日期', index: 'paid_at', type: 'date', dateFormat: 'yyyy-MM-dd', width: 120 },
    { title: '參考編號', index: 'reference_number', width: 150 },
    { title: '備註', index: 'notes', width: 200 },
    { title: '操作', render: 'actions', fixed: 'right', width: 120 }
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
    this.loadPayments();
  }

  /** Load payments */
  async loadPayments(): Promise<void> {
    try {
      await this.financialService.loadPayments(this.id());
      await this.financialService.loadPaymentRequests(this.id());
    } catch {
      this.msg.error('載入付款失敗');
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

  /** On date range change */
  onDateRangeChange(): void {
    // Trigger computed signal update
  }

  /** Reset filters */
  resetFilters(): void {
    this.searchText = '';
    this.selectedMethod = '';
    this.dateRange = [];
  }

  /** Table change handler */
  onTableChange(): void {
    // Handle table events if needed
  }

  /** On payment request change */
  onPaymentRequestChange(requestId: string | null): void {
    if (requestId) {
      const request = this.approvedRequests().find(r => r.id === requestId);
      if (request) {
        this.paymentForm.patchValue({ paid_amount: request.requested_amount });
      }
    }
  }

  /** Open create drawer */
  openCreateDrawer(): void {
    this.editingPayment.set(null);
    this.paymentForm.reset({
      payment_method: null,
      paid_amount: 0,
      paid_at: new Date()
    });
    this.drawerVisible.set(true);
  }

  /** Close drawer */
  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.editingPayment.set(null);
  }

  /** Close detail drawer */
  closeDetailDrawer(): void {
    this.detailDrawerVisible.set(false);
    this.viewingPayment.set(null);
  }

  /** View payment */
  viewPayment(payment: Payment): void {
    this.viewingPayment.set(payment);
    this.detailDrawerVisible.set(true);
  }

  /** Edit payment */
  editPayment(payment: Payment): void {
    this.detailDrawerVisible.set(false);
    this.editingPayment.set(payment);
    this.paymentForm.patchValue({
      payment_request_id: payment.payment_request_id,
      paid_amount: payment.paid_amount,
      payment_method: payment.payment_method,
      paid_at: payment.paid_at,
      reference_number: payment.reference_number,
      notes: payment.notes
    });
    this.drawerVisible.set(true);
  }

  /** Save payment */
  async savePayment(): Promise<void> {
    if (this.paymentForm.invalid) return;

    this.saving.set(true);
    try {
      const formValue = this.paymentForm.value;
      const data = {
        ...formValue,
        blueprint_id: this.id(),
        paid_at: formValue.paid_at instanceof Date ? formValue.paid_at.toISOString().split('T')[0] : formValue.paid_at
      };

      if (this.editingPayment()) {
        await this.financialService.updatePayment(this.editingPayment()!.id, data);
        this.msg.success('付款更新成功');
      } else {
        await this.financialService.createPayment(data);
        this.msg.success('付款建立成功');
      }
      this.closeDrawer();
    } catch {
      this.msg.error(this.editingPayment() ? '更新付款失敗' : '建立付款失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /** Delete payment */
  async deletePayment(payment: Payment): Promise<void> {
    try {
      await this.financialService.deletePayment(payment.id);
      this.msg.success('付款已刪除');
    } catch {
      this.msg.error('刪除付款失敗');
    }
  }

  /** Get method color */
  getMethodColor(method: string | null | undefined): string {
    switch (method) {
      case 'cash':
        return 'green';
      case 'transfer':
        return 'blue';
      case 'check':
        return 'orange';
      case 'credit_card':
        return 'purple';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  }

  /** Get method label */
  getMethodLabel(method: string | null | undefined): string {
    switch (method) {
      case 'cash':
        return '現金';
      case 'transfer':
        return '轉帳';
      case 'check':
        return '支票';
      case 'credit_card':
        return '信用卡';
      case 'other':
        return '其他';
      default:
        return method || '-';
    }
  }

  /** Go back */
  goBack(): void {
    this.router.navigate(['/blueprint', this.id(), 'financial', 'overview']);
  }
}
