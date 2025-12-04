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
  /** 合約名稱 (database: title) */
  title: string;
  description?: string | null;
  /** 廠商名稱 (database: vendor_name) */
  vendor_name?: string | null;
  /** 合約編號 */
  contract_number?: string | null;
  /** 合約金額 (database: contract_amount) */
  contract_amount: number;
  /** 幣別 */
  currency?: string;
  /** 生命週期狀態 (database: lifecycle) */
  lifecycle: string;
  start_date?: string | null;
  end_date?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Expense entity interface
 * 費用實體介面
 *
 * Corresponds to database expenses table
 * Note: Database schema uses 'title' for expense name and 'amount' for total
 */
export interface Expense {
  id: string;
  blueprint_id: string;
  contract_id?: string | null;
  /** 費用名稱 (database: title) */
  title: string;
  /** 費用說明 (database: description) */
  description?: string | null;
  /** 金額 (database: amount) */
  amount: number;
  /** 幣別 (database: currency, default: TWD) */
  currency?: string;
  /** 費用日期 (database: expense_date) */
  expense_date: string;
  /** 費用類別 (database: category) */
  category?: string | null;
  /** 收據/發票編號 (database: receipt_number) */
  receipt_number?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * PaymentRequest entity interface
 * 請款單實體介面
 *
 * Corresponds to database payment_requests table
 * Note: Database uses 'lifecycle' (blueprint_lifecycle enum) instead of 'status'
 */
export interface PaymentRequest {
  id: string;
  blueprint_id: string;
  contract_id?: string | null;
  /** 請款單編號 (database: request_number) */
  request_number?: string | null;
  /** 請款名稱 (database: title) */
  title: string;
  /** 請款說明 (database: description) */
  description?: string | null;
  /** 請款金額 (database: requested_amount) */
  requested_amount: number;
  /** 幣別 (database: currency, default: TWD) */
  currency?: string;
  /** 生命週期狀態 (database: lifecycle) - maps to draft, active, on_hold, archived, deleted */
  lifecycle: string;
  /** 請款日期 (database: request_date) */
  request_date?: string;
  /** 預計付款日期 (database: due_date) */
  due_date?: string | null;
  /** 請款人 (database: requester_id) */
  requester_id?: string | null;
  /** 核准人 (database: approver_id) */
  approver_id?: string | null;
  /** 核准時間 (database: approved_at) */
  approved_at?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Payment entity interface
 * 付款實體介面
 *
 * Corresponds to database payments table
 * Note: Database uses 'paid_amount' instead of 'amount', 'paid_at' instead of 'payment_date'
 */
export interface Payment {
  id: string;
  blueprint_id: string;
  /** 關聯請款單 ID (database: payment_request_id) - required in database */
  payment_request_id: string;
  /** 付款編號 (database: payment_number) */
  payment_number?: string | null;
  /** 付款金額 (database: paid_amount) */
  paid_amount: number;
  /** 幣別 (database: currency, default: TWD) */
  currency?: string;
  /** 付款日期 (database: paid_at) */
  paid_at: string;
  /** 付款方式 (database: payment_method) */
  payment_method?: string | null;
  /** 銀行參考編號 (database: reference_number) */
  reference_number?: string | null;
  /** 備註 (database: notes) */
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
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
 * Note: The database function returns specific column names that we map to these fields
 */
export interface BlueprintFinancialSummary {
  blueprint_id: string;
  /** Total contract amount (from database: total_contract_amount) */
  total_contract_amount: number;
  /** Total expenses amount */
  total_expenses: number;
  /** Total requested payment amount */
  total_requested: number;
  /** Total paid amount */
  total_paid: number;
  /** Count of pending payment requests */
  pending_payment_count: number;
}

/**
 * Extended financial summary with computed values
 * 擴展財務摘要（包含計算值）
 *
 * Used in components to display additional computed values
 */
export interface ExtendedFinancialSummary extends BlueprintFinancialSummary {
  /** Computed: remaining budget (total_contract_amount - total_expenses) */
  remaining_budget: number;
  /** Computed: expense rate percentage */
  expense_rate: number;
  /** Computed: payment rate percentage */
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
