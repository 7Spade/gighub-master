-- ============================================================================
-- Migration: 17-0005 - Add Approval Workflow Fields to payment_requests
-- Description: 新增請款單審核流程欄位
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================
-- Features:
-- 1. requester_id - 請款人 ID (references accounts)
-- 2. approver_id - 審核人 ID (references accounts)
-- 3. approved_at - 審核時間
-- 4. rejected_at - 拒絕時間
-- 5. rejection_reason - 拒絕原因
-- ============================================================================

-- Add approval workflow columns
ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_id) WHERE requester_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_requests_approver ON payment_requests(approver_id) WHERE approver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_requests_approved_at ON payment_requests(approved_at) WHERE approved_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN payment_requests.requester_id IS '請款人 ID - 提交請款的人員';
COMMENT ON COLUMN payment_requests.approver_id IS '審核人 ID - 核准或拒絕請款的人員';
COMMENT ON COLUMN payment_requests.approved_at IS '審核時間 - 核准的時間戳';
COMMENT ON COLUMN payment_requests.rejected_at IS '拒絕時間 - 拒絕的時間戳';
COMMENT ON COLUMN payment_requests.rejection_reason IS '拒絕原因 - 拒絕請款的原因說明';
