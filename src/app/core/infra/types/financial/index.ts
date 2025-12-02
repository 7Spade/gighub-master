/**
 * Financial Types Module
 * 財務類型定義模組
 *
 * Exports all financial-related type definitions.
 * Types match PostgreSQL enums and table definitions in seed.sql.
 *
 * @module core/infra/types/financial
 */

// ============================================================================
// Financial Enums (財務枚舉)
// ============================================================================

/**
 * 合約狀態枚舉
 * Contract status enumeration
 *
 * Corresponds to database contract_status enum
 */
export enum ContractStatus {
  /** 草稿 | Draft */
  DRAFT = 'draft',
  /** 進行中 | Active */
  ACTIVE = 'active',
  /** 已完成 | Completed */
  COMPLETED = 'completed',
  /** 已取消 | Cancelled */
  CANCELLED = 'cancelled'
}

/**
 * 費用類別枚舉
 * Expense category enumeration
 *
 * Corresponds to database expense_category enum
 */
export enum ExpenseCategory {
  /** 人工 | Labor */
  LABOR = 'labor',
  /** 材料 | Material */
  MATERIAL = 'material',
  /** 設備 | Equipment */
  EQUIPMENT = 'equipment',
  /** 管理費 | Management */
  MANAGEMENT = 'management',
  /** 其他 | Other */
  OTHER = 'other'
}

/**
 * 請款狀態枚舉
 * Payment request status enumeration
 *
 * Corresponds to database payment_request_status enum
 */
export enum PaymentRequestStatus {
  /** 草稿 | Draft */
  DRAFT = 'draft',
  /** 待審核 | Pending */
  PENDING = 'pending',
  /** 已核准 | Approved */
  APPROVED = 'approved',
  /** 已拒絕 | Rejected */
  REJECTED = 'rejected',
  /** 已付款 | Paid */
  PAID = 'paid'
}

/**
 * 付款方式枚舉
 * Payment method enumeration
 *
 * Corresponds to database payment_method enum
 */
export enum PaymentMethod {
  /** 現金 | Cash */
  CASH = 'cash',
  /** 轉帳 | Transfer */
  TRANSFER = 'transfer',
  /** 支票 | Check */
  CHECK = 'check',
  /** 信用卡 | Credit Card */
  CREDIT_CARD = 'credit_card',
  /** 其他 | Other */
  OTHER = 'other'
}

// ============================================================================
// Financial Entity Interfaces (財務實體介面)
// ============================================================================

/**
 * Contract entity interface
 * 合約實體介面
 *
 * Corresponds to database contracts table
 */
export interface Contract {
  id: string;
  blueprint_id: string;
  name: string;
  description?: string | null;
  contractor_name?: string | null;
  total_amount: number;
  status: ContractStatus;
  start_date?: string | null;
  end_date?: string | null;
  signed_at?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Expense entity interface
 * 費用實體介面
 *
 * Corresponds to database expenses table
 */
export interface Expense {
  id: string;
  blueprint_id: string;
  contract_id?: string | null;
  category: ExpenseCategory;
  description: string;
  unit_price: number;
  quantity: number;
  amount: number;
  expense_date: string;
  receipt_url?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * PaymentRequest entity interface
 * 請款單實體介面
 *
 * Corresponds to database payment_requests table
 */
export interface PaymentRequest {
  id: string;
  blueprint_id: string;
  contract_id?: string | null;
  request_number: string;
  requested_amount: number;
  status: PaymentRequestStatus;
  description?: string | null;
  requested_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payment entity interface
 * 付款實體介面
 *
 * Corresponds to database payments table
 */
export interface Payment {
  id: string;
  blueprint_id: string;
  payment_request_id?: string | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  paid_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Financial Summary Interfaces (財務摘要介面)
// ============================================================================

/**
 * Contract summary interface
 * 合約摘要介面
 *
 * Corresponds to get_contract_summary function return
 */
export interface ContractSummary {
  contract_id: string;
  contract_name: string;
  total_budget: number;
  total_expenses: number;
  total_requested: number;
  total_approved: number;
  total_paid: number;
  remaining_budget: number;
  expense_rate: number;
  payment_rate: number;
}

/**
 * Blueprint financial summary interface
 * 藍圖財務摘要介面
 *
 * Corresponds to get_blueprint_financial_summary function return
 */
export interface BlueprintFinancialSummary {
  blueprint_id: string;
  total_contracts: number;
  total_budget: number;
  total_expenses: number;
  total_requested: number;
  total_approved: number;
  total_paid: number;
  remaining_budget: number;
  expense_rate: number;
  payment_rate: number;
}

// ============================================================================
// Financial Query Options (財務查詢選項)
// ============================================================================

/**
 * 合約查詢選項
 * Contract query options
 */
export interface ContractQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 狀態過濾 | Filter by status */
  status?: ContractStatus;
}

/**
 * 費用查詢選項
 * Expense query options
 */
export interface ExpenseQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 合約 ID | Contract ID */
  contractId?: string;
  /** 類別過濾 | Filter by category */
  category?: ExpenseCategory;
  /** 開始日期 | Start date */
  startDate?: string;
  /** 結束日期 | End date */
  endDate?: string;
}

/**
 * 請款查詢選項
 * Payment request query options
 */
export interface PaymentRequestQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 合約 ID | Contract ID */
  contractId?: string;
  /** 狀態過濾 | Filter by status */
  status?: PaymentRequestStatus;
}

/**
 * 付款查詢選項
 * Payment query options
 */
export interface PaymentQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 請款單 ID | Payment request ID */
  paymentRequestId?: string;
  /** 開始日期 | Start date */
  startDate?: string;
  /** 結束日期 | End date */
  endDate?: string;
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type ContractModel = Contract;
export type ExpenseModel = Expense;
export type PaymentRequestModel = PaymentRequest;
export type PaymentModel = Payment;
