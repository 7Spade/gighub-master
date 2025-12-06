/**
 * Financial Repository
 *
 * 財務資料存取層
 * Financial data access layer
 *
 * Provides read operations for financial tables and RPC functions using Supabase client.
 *
 * @module core/infra/repositories/financial
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
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
} from '../../types/financial';

@Injectable({
  providedIn: 'root'
})
export class FinancialRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Blueprint Financial Summary (藍圖財務摘要)
  // ============================================================================

  /**
   * 取得藍圖財務摘要
   * Get blueprint financial summary
   *
   * Uses the get_blueprint_financial_summary RPC function
   */
  getBlueprintFinancialSummary(blueprintId: string): Observable<BlueprintFinancialSummary | null> {
    return from(this.supabase.client.rpc('get_blueprint_financial_summary', { p_blueprint_id: blueprintId })).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] getBlueprintFinancialSummary error:', error);
          return null;
        }
        // The RPC returns a single row as an array
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as BlueprintFinancialSummary;
        }
        return data as BlueprintFinancialSummary;
      })
    );
  }

  // ============================================================================
  // Contract Operations (合約操作)
  // ============================================================================

  /**
   * 根據 ID 查詢合約
   * Find contract by ID
   */
  findContractById(id: string): Observable<Contract | null> {
    return from(this.supabase.client.from('contracts').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findContractById error:', error);
          return null;
        }
        return data as Contract;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢合約列表
   * Find contracts by blueprint ID
   */
  findContractsByBlueprint(blueprintId: string): Observable<Contract[]> {
    return from(
      this.supabase.client.from('contracts').select('*').eq('blueprint_id', blueprintId).order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findContractsByBlueprint error:', error);
          return [];
        }
        return (data || []) as Contract[];
      })
    );
  }

  /**
   * 根據查詢選項查詢合約
   * Find contracts with options
   */
  findContractsWithOptions(options: ContractQueryOptions): Observable<Contract[]> {
    let query = this.supabase.client.from('contracts').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findContractsWithOptions error:', error);
          return [];
        }
        return (data || []) as Contract[];
      })
    );
  }

  /**
   * 取得合約摘要
   * Get contract summary
   *
   * Uses the get_contract_summary RPC function
   */
  getContractSummary(contractId: string): Observable<ContractSummary | null> {
    return from(this.supabase.client.rpc('get_contract_summary', { p_contract_id: contractId })).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] getContractSummary error:', error);
          return null;
        }
        // The RPC returns a single row as an array
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as ContractSummary;
        }
        return data as ContractSummary;
      })
    );
  }

  // ============================================================================
  // Expense Operations (費用操作)
  // ============================================================================

  /**
   * 根據藍圖 ID 查詢費用列表
   * Find expenses by blueprint ID
   */
  findExpensesByBlueprint(blueprintId: string): Observable<Expense[]> {
    return from(
      this.supabase.client.from('expenses').select('*').eq('blueprint_id', blueprintId).order('expense_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findExpensesByBlueprint error:', error);
          return [];
        }
        return (data || []) as Expense[];
      })
    );
  }

  /**
   * 根據查詢選項查詢費用
   * Find expenses with options
   */
  findExpensesWithOptions(options: ExpenseQueryOptions): Observable<Expense[]> {
    let query = this.supabase.client.from('expenses').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.contractId) {
      query = query.eq('contract_id', options.contractId);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.startDate) {
      query = query.gte('expense_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('expense_date', options.endDate);
    }

    query = query.order('expense_date', { ascending: false });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findExpensesWithOptions error:', error);
          return [];
        }
        return (data || []) as Expense[];
      })
    );
  }

  // ============================================================================
  // Payment Request Operations (請款操作)
  // ============================================================================

  /**
   * 根據藍圖 ID 查詢請款列表
   * Find payment requests by blueprint ID
   */
  findPaymentRequestsByBlueprint(blueprintId: string): Observable<PaymentRequest[]> {
    return from(
      this.supabase.client.from('payment_requests').select('*').eq('blueprint_id', blueprintId).order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findPaymentRequestsByBlueprint error:', error);
          return [];
        }
        return (data || []) as PaymentRequest[];
      })
    );
  }

  /**
   * 根據查詢選項查詢請款
   * Find payment requests with options
   */
  findPaymentRequestsWithOptions(options: PaymentRequestQueryOptions): Observable<PaymentRequest[]> {
    let query = this.supabase.client.from('payment_requests').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.contractId) {
      query = query.eq('contract_id', options.contractId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findPaymentRequestsWithOptions error:', error);
          return [];
        }
        return (data || []) as PaymentRequest[];
      })
    );
  }

  // ============================================================================
  // Payment Operations (付款操作)
  // ============================================================================

  /**
   * 根據藍圖 ID 查詢付款列表
   * Find payments by blueprint ID
   */
  findPaymentsByBlueprint(blueprintId: string): Observable<Payment[]> {
    return from(
      this.supabase.client.from('payments').select('*').eq('blueprint_id', blueprintId).order('payment_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findPaymentsByBlueprint error:', error);
          return [];
        }
        return (data || []) as Payment[];
      })
    );
  }

  /**
   * 根據查詢選項查詢付款
   * Find payments with options
   */
  findPaymentsWithOptions(options: PaymentQueryOptions): Observable<Payment[]> {
    let query = this.supabase.client.from('payments').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.paymentRequestId) {
      query = query.eq('payment_request_id', options.paymentRequestId);
    }

    if (options.startDate) {
      query = query.gte('payment_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('payment_date', options.endDate);
    }

    query = query.order('payment_date', { ascending: false });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] findPaymentsWithOptions error:', error);
          return [];
        }
        return (data || []) as Payment[];
      })
    );
  }

  // ============================================================================
  // Contract CRUD Operations (合約 CRUD 操作)
  // ============================================================================

  /**
   * 建立合約
   * Create contract
   */
  createContract(data: Partial<Contract>): Observable<Contract | null> {
    return from(this.supabase.client.from('contracts').insert(data).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] createContract error:', error);
          throw error;
        }
        return result as Contract;
      })
    );
  }

  /**
   * 更新合約
   * Update contract
   */
  updateContract(id: string, data: Partial<Contract>): Observable<Contract | null> {
    return from(this.supabase.client.from('contracts').update(data).eq('id', id).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] updateContract error:', error);
          throw error;
        }
        return result as Contract;
      })
    );
  }

  /**
   * 刪除合約
   * Delete contract
   */
  deleteContract(id: string): Observable<boolean> {
    return from(this.supabase.client.from('contracts').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] deleteContract error:', error);
          throw error;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Expense CRUD Operations (費用 CRUD 操作)
  // ============================================================================

  /**
   * 建立費用
   * Create expense
   */
  createExpense(data: Partial<Expense>): Observable<Expense | null> {
    return from(this.supabase.client.from('expenses').insert(data).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] createExpense error:', error);
          throw error;
        }
        return result as Expense;
      })
    );
  }

  /**
   * 更新費用
   * Update expense
   */
  updateExpense(id: string, data: Partial<Expense>): Observable<Expense | null> {
    return from(this.supabase.client.from('expenses').update(data).eq('id', id).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] updateExpense error:', error);
          throw error;
        }
        return result as Expense;
      })
    );
  }

  /**
   * 刪除費用
   * Delete expense
   */
  deleteExpense(id: string): Observable<boolean> {
    return from(this.supabase.client.from('expenses').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] deleteExpense error:', error);
          throw error;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Payment Request CRUD Operations (請款 CRUD 操作)
  // ============================================================================

  /**
   * 建立請款
   * Create payment request
   */
  createPaymentRequest(data: Partial<PaymentRequest>): Observable<PaymentRequest | null> {
    return from(this.supabase.client.from('payment_requests').insert(data).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] createPaymentRequest error:', error);
          throw error;
        }
        return result as PaymentRequest;
      })
    );
  }

  /**
   * 更新請款
   * Update payment request
   */
  updatePaymentRequest(id: string, data: Partial<PaymentRequest>): Observable<PaymentRequest | null> {
    return from(this.supabase.client.from('payment_requests').update(data).eq('id', id).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] updatePaymentRequest error:', error);
          throw error;
        }
        return result as PaymentRequest;
      })
    );
  }

  /**
   * 刪除請款
   * Delete payment request
   */
  deletePaymentRequest(id: string): Observable<boolean> {
    return from(this.supabase.client.from('payment_requests').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] deletePaymentRequest error:', error);
          throw error;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Payment CRUD Operations (付款 CRUD 操作)
  // ============================================================================

  /**
   * 建立付款
   * Create payment
   */
  createPayment(data: Partial<Payment>): Observable<Payment | null> {
    return from(this.supabase.client.from('payments').insert(data).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] createPayment error:', error);
          throw error;
        }
        return result as Payment;
      })
    );
  }

  /**
   * 更新付款
   * Update payment
   */
  updatePayment(id: string, data: Partial<Payment>): Observable<Payment | null> {
    return from(this.supabase.client.from('payments').update(data).eq('id', id).select().single()).pipe(
      map(({ data: result, error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] updatePayment error:', error);
          throw error;
        }
        return result as Payment;
      })
    );
  }

  /**
   * 刪除付款
   * Delete payment
   */
  deletePayment(id: string): Observable<boolean> {
    return from(this.supabase.client.from('payments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[FinancialRepository] deletePayment error:', error);
          throw error;
        }
        return true;
      })
    );
  }
}
