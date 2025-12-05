-- ============================================================================
-- Migration: 17-0006 - Add receipt_number to expenses
-- Description: 新增費用收據編號欄位
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================
-- Feature: receipt_number - 收據/發票編號
-- ============================================================================

-- Add receipt_number column
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

-- Create index for lookup
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_number ON expenses(receipt_number) WHERE receipt_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN expenses.receipt_number IS '收據/發票編號 - 用於財務對帳';
