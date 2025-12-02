-- ############################################################################
-- Migration: Financial Extension Fix (財務功能擴展修正)
-- Date: 2024-12-02
-- Description: 修正 20241202104900_add_financial_extension.sql 中的問題
-- 
-- 修正項目：
-- 1. 為 contracts 表添加 title 欄位
-- 2. 為 contracts 表添加 lifecycle 欄位
-- 3. 添加 contract_lifecycle_trigger 觸發器
-- 4. 啟用 contracts 和 expenses 的 Realtime
-- ############################################################################

-- ============================================================================
-- PART 1: FIX CONTRACTS TABLE (修正合約表)
-- ============================================================================

-- 添加 title 欄位 (合約名稱，必填)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS title VARCHAR(500);

-- 對於已有的資料，使用 contract_number 或 description 作為預設 title
UPDATE contracts 
SET title = COALESCE(contract_number, SUBSTRING(description FROM 1 FOR 500), 'Untitled Contract')
WHERE title IS NULL;

-- 將 title 設為 NOT NULL
ALTER TABLE contracts ALTER COLUMN title SET NOT NULL;

-- 添加 lifecycle 欄位 (生命週期狀態)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft';

-- 添加 lifecycle 索引
CREATE INDEX IF NOT EXISTS idx_contracts_lifecycle ON contracts(lifecycle);

-- ============================================================================
-- PART 2: ADD CONTRACT_LIFECYCLE_TRIGGER (合約生命週期觸發器)
-- ============================================================================

-- 合約生命週期變更觸發器函數
CREATE OR REPLACE FUNCTION contract_lifecycle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 lifecycle 欄位實際變更時記錄
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    INSERT INTO lifecycle_transitions (
      blueprint_id,
      entity_type,
      entity_id,
      from_status,
      to_status,
      reason,
      metadata,
      transitioned_by,
      created_at
    ) VALUES (
      NEW.blueprint_id,
      'contract'::entity_type,
      NEW.id,
      OLD.lifecycle::text,
      NEW.lifecycle::text,
      NULL,  -- 可透過應用層傳入
      jsonb_build_object(
        'contract_number', NEW.contract_number,
        'title', NEW.title,
        'contract_amount', NEW.contract_amount
      ),
      auth.uid(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為 contracts 表建立觸發器
DROP TRIGGER IF EXISTS contract_lifecycle_change ON contracts;
CREATE TRIGGER contract_lifecycle_change
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (OLD.lifecycle IS DISTINCT FROM NEW.lifecycle)
  EXECUTE FUNCTION contract_lifecycle_trigger();

COMMENT ON FUNCTION contract_lifecycle_trigger() IS '合約生命週期變更時自動記錄到 lifecycle_transitions';

-- ============================================================================
-- PART 3: ENABLE REALTIME FOR MISSING TABLES (啟用缺失的即時配置)
-- ============================================================================

-- 為 contracts 和 expenses 啟用 Realtime (如果尚未啟用)
DO $$
BEGIN
  -- Check if contracts is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contracts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
  END IF;
  
  -- Check if expenses is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
END $$;

-- ============================================================================
-- PART 4: ADD EXPENSE_LIFECYCLE_TRIGGER (費用生命週期觸發器 - 可選)
-- ============================================================================

-- 如果未來需要追蹤 expenses 的狀態變更，可以啟用此觸發器
-- 目前 expenses 表沒有 lifecycle 欄位，所以暫時不啟用

/*
-- 如需啟用，請執行以下 SQL：
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_expenses_lifecycle ON expenses(lifecycle);

CREATE OR REPLACE FUNCTION expense_lifecycle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    INSERT INTO lifecycle_transitions (
      blueprint_id, entity_type, entity_id, from_status, to_status, 
      reason, metadata, transitioned_by, created_at
    ) VALUES (
      NEW.blueprint_id, 'expense'::entity_type, NEW.id,
      OLD.lifecycle::text, NEW.lifecycle::text, NULL,
      jsonb_build_object('title', NEW.title, 'amount', NEW.amount),
      auth.uid(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER expense_lifecycle_change
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.lifecycle IS DISTINCT FROM NEW.lifecycle)
  EXECUTE FUNCTION expense_lifecycle_trigger();
*/

-- ============================================================================
-- PART 5: DOCUMENTATION UPDATES (文件更新)
-- ============================================================================

-- 更新 contracts 表註解
COMMENT ON TABLE contracts IS '合約 - 合約與預算管理的起點，支援生命週期狀態管理';
COMMENT ON COLUMN contracts.title IS '合約名稱 (必填)';
COMMENT ON COLUMN contracts.lifecycle IS '生命週期狀態：draft, active, on_hold, archived, deleted';

-- ############################################################################
-- END OF FINANCIAL EXTENSION FIX MIGRATION
-- ############################################################################
