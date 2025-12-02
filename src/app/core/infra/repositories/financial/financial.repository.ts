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
          console.error('[FinancialRepository] getBlueprintFinancialSummary error:', error);
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
          console.error('[FinancialRepository] findContractById error:', error);
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
          console.error('[FinancialRepository] findContractsByBlueprint error:', error);
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
          console.error('[FinancialRepository] findContractsWithOptions error:', error);
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
          console.error('[FinancialRepository] getContractSummary error:', error);
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
          console.error('[FinancialRepository] findExpensesByBlueprint error:', error);
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
          console.error('[FinancialRepository] findExpensesWithOptions error:', error);
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
          console.error('[FinancialRepository] findPaymentRequestsByBlueprint error:', error);
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
          console.error('[FinancialRepository] findPaymentRequestsWithOptions error:', error);
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
          console.error('[FinancialRepository] findPaymentsByBlueprint error:', error);
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
          console.error('[FinancialRepository] findPaymentsWithOptions error:', error);
          return [];
        }
        return (data || []) as Payment[];
      })
    );
  }
}
