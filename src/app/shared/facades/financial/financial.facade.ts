/**
 * Financial Facade
 *
 * 財務業務域門面（Shared 層）
 * Financial business domain facade (Shared layer)
 *
 * Provides unified interface for financial operations.
 *
 * @module shared/facades/financial
 */

import { Injectable, inject } from '@angular/core';
import { FinancialService } from '../services';

import {
  BlueprintFinancialSummary,
  Contract,
  ContractQueryOptions,
  ContractSummary,
  Expense,
  ExpenseQueryOptions,
  Payment,
  PaymentQueryOptions,
  PaymentRequest,
  PaymentRequestQueryOptions
} from '../../../core/infra/types/financial';

@Injectable({
  providedIn: 'root'
})
export class FinancialFacade {
  private readonly financialService = inject(FinancialService);

  // Proxy financial service signals
  readonly loading = this.financialService.loading;
  readonly error = this.financialService.error;
  readonly currentSummary = this.financialService.currentSummary;
  readonly contracts = this.financialService.contracts;
  readonly expenses = this.financialService.expenses;
  readonly paymentRequests = this.financialService.paymentRequests;
  readonly payments = this.financialService.payments;
  readonly hasFinancialData = this.financialService.hasFinancialData;
  readonly budgetUsagePercent = this.financialService.budgetUsagePercent;
  readonly paymentCompletionPercent = this.financialService.paymentCompletionPercent;

  // ============================================================================
  // Blueprint Financial Summary Methods
  // ============================================================================

  /**
   * 載入藍圖財務摘要
   * Load blueprint financial summary
   */
  async loadBlueprintFinancialSummary(blueprintId: string): Promise<BlueprintFinancialSummary | null> {
    return this.financialService.loadBlueprintFinancialSummary(blueprintId);
  }

  /**
   * 取得藍圖財務摘要
   * Get blueprint financial summary
   */
  async getBlueprintFinancialSummary(blueprintId: string): Promise<BlueprintFinancialSummary | null> {
    return this.financialService.getBlueprintFinancialSummary(blueprintId);
  }

  // ============================================================================
  // Contract Methods
  // ============================================================================

  /**
   * 載入藍圖合約列表
   * Load contracts for blueprint
   */
  async loadContractsForBlueprint(blueprintId: string): Promise<Contract[]> {
    return this.financialService.loadContractsForBlueprint(blueprintId);
  }

  /**
   * 根據 ID 查詢合約
   * Find contract by ID
   */
  async findContractById(id: string): Promise<Contract | null> {
    return this.financialService.findContractById(id);
  }

  /**
   * 根據查詢選項查詢合約
   * Find contracts with options
   */
  async findContractsWithOptions(options: ContractQueryOptions): Promise<Contract[]> {
    return this.financialService.findContractsWithOptions(options);
  }

  /**
   * 取得合約摘要
   * Get contract summary
   */
  async getContractSummary(contractId: string): Promise<ContractSummary | null> {
    return this.financialService.getContractSummary(contractId);
  }

  // ============================================================================
  // Expense Methods
  // ============================================================================

  /**
   * 載入藍圖費用列表
   * Load expenses for blueprint
   */
  async loadExpensesForBlueprint(blueprintId: string): Promise<Expense[]> {
    return this.financialService.loadExpensesForBlueprint(blueprintId);
  }

  /**
   * 根據查詢選項查詢費用
   * Find expenses with options
   */
  async findExpensesWithOptions(options: ExpenseQueryOptions): Promise<Expense[]> {
    return this.financialService.findExpensesWithOptions(options);
  }

  // ============================================================================
  // Payment Request Methods
  // ============================================================================

  /**
   * 載入藍圖請款列表
   * Load payment requests for blueprint
   */
  async loadPaymentRequestsForBlueprint(blueprintId: string): Promise<PaymentRequest[]> {
    return this.financialService.loadPaymentRequestsForBlueprint(blueprintId);
  }

  /**
   * 根據查詢選項查詢請款
   * Find payment requests with options
   */
  async findPaymentRequestsWithOptions(options: PaymentRequestQueryOptions): Promise<PaymentRequest[]> {
    return this.financialService.findPaymentRequestsWithOptions(options);
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /**
   * 載入藍圖付款列表
   * Load payments for blueprint
   */
  async loadPaymentsForBlueprint(blueprintId: string): Promise<Payment[]> {
    return this.financialService.loadPaymentsForBlueprint(blueprintId);
  }

  /**
   * 根據查詢選項查詢付款
   * Find payments with options
   */
  async findPaymentsWithOptions(options: PaymentQueryOptions): Promise<Payment[]> {
    return this.financialService.findPaymentsWithOptions(options);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 載入所有藍圖財務資料
   * Load all financial data for blueprint
   */
  async loadAllFinancialData(blueprintId: string): Promise<void> {
    return this.financialService.loadAllFinancialData(blueprintId);
  }

  /**
   * 清除財務資料
   * Clear financial data
   */
  clearFinancialData(): void {
    this.financialService.clearFinancialData();
  }
}
