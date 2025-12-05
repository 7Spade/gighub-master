-- ============================================================================
-- Migration: 17-0007 - Migrate Metadata Values to Dedicated Columns
-- Description: 從 metadata 欄位遷移資料到專用欄位
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================
-- This migration ensures backward compatibility by copying data from
-- metadata JSONB fields to the new dedicated columns.
-- ============================================================================

-- Migrate approved_at from metadata to column
UPDATE payment_requests
SET approved_at = (metadata->>'approved_at')::timestamptz
WHERE metadata->>'approved_at' IS NOT NULL
  AND approved_at IS NULL;

-- Migrate rejected_at from metadata to column
UPDATE payment_requests
SET rejected_at = (metadata->>'rejected_at')::timestamptz
WHERE metadata->>'rejected_at' IS NOT NULL
  AND rejected_at IS NULL;

-- Migrate rejection_reason from metadata to column (check both key names)
UPDATE payment_requests
SET rejection_reason = COALESCE(
  metadata->>'rejection_reason',
  metadata->>'rejected_reason'
)
WHERE (metadata->>'rejection_reason' IS NOT NULL OR metadata->>'rejected_reason' IS NOT NULL)
  AND rejection_reason IS NULL;

-- Migrate requester_id from metadata to column if exists
UPDATE payment_requests
SET requester_id = (metadata->>'requester_id')::uuid
WHERE metadata->>'requester_id' IS NOT NULL
  AND requester_id IS NULL;

-- Migrate approver_id from metadata to column if exists
UPDATE payment_requests
SET approver_id = (metadata->>'approver_id')::uuid
WHERE metadata->>'approver_id' IS NOT NULL
  AND approver_id IS NULL;

-- Add comment documenting the migration
COMMENT ON TABLE payment_requests IS 'Payment requests table with full approval workflow support. Migrated from metadata-based to column-based storage in 2025-12-05.';
