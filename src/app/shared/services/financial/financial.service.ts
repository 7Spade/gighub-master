/**
 * Financial Service
 *
 * 財務業務服務
 * Financial business service
 *
 * Provides business logic for financial operations.
 *
 * @module shared/services/financial
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import {
  BlueprintFinancialSummary,
  Contract,
  ContractQueryOptions,
  ContractSummary,
  Expense,
  ExpenseQueryOptions,
  FinancialRepository,
  Payment,
  PaymentQueryOptions,
  PaymentRequest,
  PaymentRequestQueryOptions
} from '@core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private readonly financialRepository = inject(FinancialRepository);

  // ============================================================================
  // Signals for State Management
  // ============================================================================

  /** 載入狀態 | Loading state */
  readonly loading = signal(false);

  /** 錯誤訊息 | Error message */
  readonly error = signal<string | null>(null);

  /** 當前藍圖財務摘要 | Current blueprint financial summary */
  readonly currentSummary = signal<BlueprintFinancialSummary | null>(null);

  /** 合約列表 | Contracts list */
  readonly contracts = signal<Contract[]>([]);

  /** 費用列表 | Expenses list */
  readonly expenses = signal<Expense[]>([]);

  /** 請款列表 | Payment requests list */
  readonly paymentRequests = signal<PaymentRequest[]>([]);

  /** 付款列表 | Payments list */
  readonly payments = signal<Payment[]>([]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /** 是否有財務資料 | Has financial data */
  readonly hasFinancialData = computed(() => {
    const summary = this.currentSummary();
    return summary !== null && (summary.total_contract_amount ?? 0) > 0;
  });

  /** 預算使用百分比 | Budget usage percentage */
  readonly budgetUsagePercent = computed(() => {
    const summary = this.currentSummary();
    const budget = summary?.total_contract_amount ?? 0;
    if (!summary || budget === 0) return 0;
    return Math.round(((summary.total_expenses ?? 0) / budget) * 100);
  });

  /** 付款完成百分比 | Payment completion percentage */
  readonly paymentCompletionPercent = computed(() => {
    const summary = this.currentSummary();
    const requested = summary?.total_requested ?? 0;
    if (!summary || requested === 0) return 0;
    return Math.round(((summary.total_paid ?? 0) / requested) * 100);
  });

  // ============================================================================
  // Blueprint Financial Summary Methods
  // ============================================================================

  /**
   * 載入藍圖財務摘要
   * Load blueprint financial summary
   */
  async loadBlueprintFinancialSummary(blueprintId: string): Promise<BlueprintFinancialSummary | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const summary = await firstValueFrom(this.financialRepository.getBlueprintFinancialSummary(blueprintId));
      this.currentSummary.set(summary);
      return summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入財務摘要失敗';
      console.error('[FinancialService] loadBlueprintFinancialSummary error:', err);
      this.error.set(message);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 取得藍圖財務摘要（不更新 signal）
   * Get blueprint financial summary (without updating signal)
   */
  async getBlueprintFinancialSummary(blueprintId: string): Promise<BlueprintFinancialSummary | null> {
    try {
      return await firstValueFrom(this.financialRepository.getBlueprintFinancialSummary(blueprintId));
    } catch (err) {
      console.error('[FinancialService] getBlueprintFinancialSummary error:', err);
      return null;
    }
  }

  // ============================================================================
  // Contract Methods
  // ============================================================================

  /**
   * 載入藍圖合約列表
   * Load contracts for blueprint
   */
  async loadContractsForBlueprint(blueprintId: string): Promise<Contract[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const contracts = await firstValueFrom(this.financialRepository.findContractsByBlueprint(blueprintId));
      this.contracts.set(contracts);
      return contracts;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入合約列表失敗';
      console.error('[FinancialService] loadContractsForBlueprint error:', err);
      this.error.set(message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 根據 ID 查詢合約
   * Find contract by ID
   */
  async findContractById(id: string): Promise<Contract | null> {
    try {
      return await firstValueFrom(this.financialRepository.findContractById(id));
    } catch (err) {
      console.error('[FinancialService] findContractById error:', err);
      return null;
    }
  }

  /**
   * 根據查詢選項查詢合約
   * Find contracts with options
   */
  async findContractsWithOptions(options: ContractQueryOptions): Promise<Contract[]> {
    try {
      return await firstValueFrom(this.financialRepository.findContractsWithOptions(options));
    } catch (err) {
      console.error('[FinancialService] findContractsWithOptions error:', err);
      return [];
    }
  }

  /**
   * 取得合約摘要
   * Get contract summary
   */
  async getContractSummary(contractId: string): Promise<ContractSummary | null> {
    try {
      return await firstValueFrom(this.financialRepository.getContractSummary(contractId));
    } catch (err) {
      console.error('[FinancialService] getContractSummary error:', err);
      return null;
    }
  }

  // ============================================================================
  // Expense Methods
  // ============================================================================

  /**
   * 載入藍圖費用列表
   * Load expenses for blueprint
   */
  async loadExpensesForBlueprint(blueprintId: string): Promise<Expense[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const expenses = await firstValueFrom(this.financialRepository.findExpensesByBlueprint(blueprintId));
      this.expenses.set(expenses);
      return expenses;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入費用列表失敗';
      console.error('[FinancialService] loadExpensesForBlueprint error:', err);
      this.error.set(message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 根據查詢選項查詢費用
   * Find expenses with options
   */
  async findExpensesWithOptions(options: ExpenseQueryOptions): Promise<Expense[]> {
    try {
      return await firstValueFrom(this.financialRepository.findExpensesWithOptions(options));
    } catch (err) {
      console.error('[FinancialService] findExpensesWithOptions error:', err);
      return [];
    }
  }

  // ============================================================================
  // Payment Request Methods
  // ============================================================================

  /**
   * 載入藍圖請款列表
   * Load payment requests for blueprint
   */
  async loadPaymentRequestsForBlueprint(blueprintId: string): Promise<PaymentRequest[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const requests = await firstValueFrom(this.financialRepository.findPaymentRequestsByBlueprint(blueprintId));
      this.paymentRequests.set(requests);
      return requests;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入請款列表失敗';
      console.error('[FinancialService] loadPaymentRequestsForBlueprint error:', err);
      this.error.set(message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 根據查詢選項查詢請款
   * Find payment requests with options
   */
  async findPaymentRequestsWithOptions(options: PaymentRequestQueryOptions): Promise<PaymentRequest[]> {
    try {
      return await firstValueFrom(this.financialRepository.findPaymentRequestsWithOptions(options));
    } catch (err) {
      console.error('[FinancialService] findPaymentRequestsWithOptions error:', err);
      return [];
    }
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /**
   * 載入藍圖付款列表
   * Load payments for blueprint
   */
  async loadPaymentsForBlueprint(blueprintId: string): Promise<Payment[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payments = await firstValueFrom(this.financialRepository.findPaymentsByBlueprint(blueprintId));
      this.payments.set(payments);
      return payments;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入付款列表失敗';
      console.error('[FinancialService] loadPaymentsForBlueprint error:', err);
      this.error.set(message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 根據查詢選項查詢付款
   * Find payments with options
   */
  async findPaymentsWithOptions(options: PaymentQueryOptions): Promise<Payment[]> {
    try {
      return await firstValueFrom(this.financialRepository.findPaymentsWithOptions(options));
    } catch (err) {
      console.error('[FinancialService] findPaymentsWithOptions error:', err);
      return [];
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 載入所有藍圖財務資料
   * Load all financial data for blueprint
   */
  async loadAllFinancialData(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await Promise.all([
        this.loadBlueprintFinancialSummary(blueprintId),
        this.loadContractsForBlueprint(blueprintId),
        this.loadExpensesForBlueprint(blueprintId),
        this.loadPaymentRequestsForBlueprint(blueprintId),
        this.loadPaymentsForBlueprint(blueprintId)
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入財務資料失敗';
      console.error('[FinancialService] loadAllFinancialData error:', err);
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 清除財務資料
   * Clear financial data
   */
  clearFinancialData(): void {
    this.currentSummary.set(null);
    this.contracts.set([]);
    this.expenses.set([]);
    this.paymentRequests.set([]);
    this.payments.set([]);
    this.error.set(null);
  }

  // ============================================================================
  // Contract CRUD Methods (合約 CRUD 方法)
  // ============================================================================

  /**
   * 載入合約（別名）
   * Load contracts (alias)
   */
  async loadContracts(blueprintId: string): Promise<Contract[]> {
    return this.loadContractsForBlueprint(blueprintId);
  }

  /**
   * 建立合約
   * Create contract
   */
  async createContract(data: Partial<Contract>): Promise<Contract | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const contract = await firstValueFrom(this.financialRepository.createContract(data));
      if (contract) {
        this.contracts.update(list => [contract, ...list]);
      }
      return contract;
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立合約失敗';
      console.error('[FinancialService] createContract error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 更新合約
   * Update contract
   */
  async updateContract(id: string, data: Partial<Contract>): Promise<Contract | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const contract = await firstValueFrom(this.financialRepository.updateContract(id, data));
      if (contract) {
        this.contracts.update(list => list.map(c => (c.id === id ? contract : c)));
      }
      return contract;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新合約失敗';
      console.error('[FinancialService] updateContract error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 刪除合約
   * Delete contract
   */
  async deleteContract(id: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.financialRepository.deleteContract(id));
      this.contracts.update(list => list.filter(c => c.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除合約失敗';
      console.error('[FinancialService] deleteContract error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // ============================================================================
  // Expense CRUD Methods (費用 CRUD 方法)
  // ============================================================================

  /**
   * 載入費用（別名）
   * Load expenses (alias)
   */
  async loadExpenses(blueprintId: string): Promise<Expense[]> {
    return this.loadExpensesForBlueprint(blueprintId);
  }

  /**
   * 建立費用
   * Create expense
   */
  async createExpense(data: Partial<Expense>): Promise<Expense | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const expense = await firstValueFrom(this.financialRepository.createExpense(data));
      if (expense) {
        this.expenses.update(list => [expense, ...list]);
      }
      return expense;
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立費用失敗';
      console.error('[FinancialService] createExpense error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 更新費用
   * Update expense
   */
  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const expense = await firstValueFrom(this.financialRepository.updateExpense(id, data));
      if (expense) {
        this.expenses.update(list => list.map(e => (e.id === id ? expense : e)));
      }
      return expense;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新費用失敗';
      console.error('[FinancialService] updateExpense error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 刪除費用
   * Delete expense
   */
  async deleteExpense(id: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.financialRepository.deleteExpense(id));
      this.expenses.update(list => list.filter(e => e.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除費用失敗';
      console.error('[FinancialService] deleteExpense error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // ============================================================================
  // Payment Request CRUD Methods (請款 CRUD 方法)
  // ============================================================================

  /**
   * 載入請款（別名）
   * Load payment requests (alias)
   */
  async loadPaymentRequests(blueprintId: string): Promise<PaymentRequest[]> {
    return this.loadPaymentRequestsForBlueprint(blueprintId);
  }

  /**
   * 建立請款
   * Create payment request
   */
  async createPaymentRequest(data: Partial<PaymentRequest>): Promise<PaymentRequest | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const request = await firstValueFrom(this.financialRepository.createPaymentRequest(data));
      if (request) {
        this.paymentRequests.update(list => [request, ...list]);
      }
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立請款失敗';
      console.error('[FinancialService] createPaymentRequest error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 更新請款
   * Update payment request
   */
  async updatePaymentRequest(id: string, data: Partial<PaymentRequest>): Promise<PaymentRequest | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const request = await firstValueFrom(this.financialRepository.updatePaymentRequest(id, data));
      if (request) {
        this.paymentRequests.update(list => list.map(r => (r.id === id ? request : r)));
      }
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新請款失敗';
      console.error('[FinancialService] updatePaymentRequest error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 核准請款
   * Approve payment request - use lifecycle instead of status
   * Store approved_at in metadata since the column doesn't exist
   */
  async approvePaymentRequest(id: string): Promise<PaymentRequest | null> {
    return this.updatePaymentRequest(id, {
      lifecycle: 'archived',
      metadata: { approved_at: new Date().toISOString() }
    });
  }

  /**
   * 拒絕請款
   * Reject payment request - use lifecycle instead of status
   * Store rejection reason in metadata since rejected_reason column doesn't exist
   */
  async rejectPaymentRequest(id: string, reason: string): Promise<PaymentRequest | null> {
    return this.updatePaymentRequest(id, {
      lifecycle: 'deleted',
      metadata: { rejected_reason: reason, rejected_at: new Date().toISOString() }
    });
  }

  /**
   * 刪除請款
   * Delete payment request
   */
  async deletePaymentRequest(id: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.financialRepository.deletePaymentRequest(id));
      this.paymentRequests.update(list => list.filter(r => r.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除請款失敗';
      console.error('[FinancialService] deletePaymentRequest error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // ============================================================================
  // Payment CRUD Methods (付款 CRUD 方法)
  // ============================================================================

  /**
   * 載入付款（別名）
   * Load payments (alias)
   */
  async loadPayments(blueprintId: string): Promise<Payment[]> {
    return this.loadPaymentsForBlueprint(blueprintId);
  }

  /**
   * 建立付款
   * Create payment
   */
  async createPayment(data: Partial<Payment>): Promise<Payment | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payment = await firstValueFrom(this.financialRepository.createPayment(data));
      if (payment) {
        this.payments.update(list => [payment, ...list]);
        // 如果有關聯請款單，更新其狀態為已完成（archived）
        if (data.payment_request_id) {
          await this.updatePaymentRequest(data.payment_request_id, {
            lifecycle: 'archived'
          });
        }
      }
      return payment;
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立付款失敗';
      console.error('[FinancialService] createPayment error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 更新付款
   * Update payment
   */
  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payment = await firstValueFrom(this.financialRepository.updatePayment(id, data));
      if (payment) {
        this.payments.update(list => list.map(p => (p.id === id ? payment : p)));
      }
      return payment;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新付款失敗';
      console.error('[FinancialService] updatePayment error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 刪除付款
   * Delete payment
   */
  async deletePayment(id: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.financialRepository.deletePayment(id));
      this.payments.update(list => list.filter(p => p.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除付款失敗';
      console.error('[FinancialService] deletePayment error:', err);
      this.error.set(message);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
