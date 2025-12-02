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
}
