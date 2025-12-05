-- ============================================================================
-- Migration: Financial Extension
-- Description: PART B - 財務功能擴展 (contracts, expenses, payment_requests, payments)
-- Created: 2024-12-02
-- ============================================================================

-- PART B: FINANCIAL EXTENSION (來自 20241202104900_add_financial_extension.sql)
-- ============================================================================

-- ############################################################################
-- Migration: Financial Extension (財務功能擴展)
-- Date: 2024-12-02
-- Description: 擴展財務功能，新增 contracts, expenses, payment_requests, payments 資料表
-- 
-- 設計原則：
-- 1. 與 Blueprint 接軌：每張表皆帶 blueprint_id
-- 2. 權限沿用：blueprint_members / roles 不需改動
-- 3. 狀態機：沿用 lifecycle_transitions，不新增 status enum
-- 4. 可擴展性高：後續可加入 change_orders / vendors / tax / retainage
-- ############################################################################

-- ============================================================================
-- PART 1: EXTEND ENTITY_TYPE ENUM (擴展實體類型列舉)
-- ============================================================================

-- 新增財務相關實體類型到 entity_type enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'contract';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'expense';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'payment_request';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'payment';

-- ============================================================================
-- PART 2: CONTRACTS TABLE (合約 & 預算起點)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: contracts (合約)
-- 合約與預算管理的起點，可擴展 vendor 模組，支援生命週期狀態管理
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,                          -- 合約名稱 (必填)
  vendor_name TEXT,                                     -- 可擴展 vendor 模組
  contract_number VARCHAR(100),                         -- 合約編號
  contract_amount NUMERIC(18,2) NOT NULL,               -- 合約金額
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',           -- 幣別
  start_date DATE,                                      -- 開始日期
  end_date DATE,                                        -- 結束日期
  description TEXT,                                     -- 合約描述
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',  -- 生命週期狀態
  metadata JSONB DEFAULT '{}'::jsonb,                   -- 擴展欄位
  created_by UUID REFERENCES accounts(id),              -- 建立者
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ                                -- 軟刪除
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_contracts_blueprint ON contracts(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_name ON contracts(vendor_name);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_lifecycle ON contracts(lifecycle);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at) WHERE deleted_at IS NULL;

-- 更新時間觸發器
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "contracts_insert" ON contracts 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_update" ON contracts 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_delete" ON contracts 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 註解
COMMENT ON TABLE contracts IS '合約 - 合約與預算管理的起點，支援生命週期狀態管理';
COMMENT ON COLUMN contracts.blueprint_id IS '所屬藍圖 ID';
COMMENT ON COLUMN contracts.title IS '合約名稱 (必填)';
COMMENT ON COLUMN contracts.vendor_name IS '供應商名稱 (可擴展 vendor 模組)';
COMMENT ON COLUMN contracts.contract_number IS '合約編號';
COMMENT ON COLUMN contracts.contract_amount IS '合約金額';
COMMENT ON COLUMN contracts.currency IS '幣別 (預設 TWD)';
COMMENT ON COLUMN contracts.lifecycle IS '生命週期狀態：draft, active, on_hold, archived, deleted';

-- ============================================================================
-- PART 3: EXPENSES TABLE (成本支出紀錄)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: expenses (成本實際投入紀錄)
-- 記錄實際成本支出
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,  -- 關聯合約（可選）
  title TEXT NOT NULL,                                  -- 費用名稱
  description TEXT,                                     -- 費用說明
  amount NUMERIC(18,2) NOT NULL,                        -- 金額
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',           -- 幣別
  expense_date DATE NOT NULL,                           -- 費用日期
  category VARCHAR(100),                                -- 費用類別
  receipt_number VARCHAR(100),                          -- 收據/發票編號
  metadata JSONB DEFAULT '{}'::jsonb,                   -- 擴展欄位
  created_by UUID REFERENCES accounts(id),              -- 建立者
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ                                -- 軟刪除
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_expenses_blueprint ON expenses(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_expenses_contract ON expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NULL;

-- 更新時間觸發器
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON expenses 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "expenses_insert" ON expenses 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_update" ON expenses 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_delete" ON expenses 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 註解
COMMENT ON TABLE expenses IS '成本支出 - 實際成本投入紀錄';
COMMENT ON COLUMN expenses.blueprint_id IS '所屬藍圖 ID';
COMMENT ON COLUMN expenses.contract_id IS '關聯合約 ID（可選）';
COMMENT ON COLUMN expenses.title IS '費用名稱';
COMMENT ON COLUMN expenses.amount IS '費用金額';
COMMENT ON COLUMN expenses.expense_date IS '費用發生日期';
COMMENT ON COLUMN expenses.category IS '費用類別';

-- ============================================================================
-- PART 4: PAYMENT_REQUESTS TABLE (請款單)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: payment_requests (請款單)
-- 使用 blueprint_lifecycle 進行狀態管理
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,  -- 關聯合約（可選）
  request_number VARCHAR(100),                          -- 請款單編號
  title TEXT NOT NULL,                                  -- 請款名稱
  description TEXT,                                     -- 請款說明
  requested_amount NUMERIC(18,2) NOT NULL,              -- 請款金額
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',           -- 幣別
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',  -- 使用現有 enum 進行狀態管理
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,      -- 請款日期
  due_date DATE,                                        -- 預計付款日期
  requester_id UUID REFERENCES accounts(id),            -- 請款人
  approver_id UUID REFERENCES accounts(id),             -- 核准人
  approved_at TIMESTAMPTZ,                              -- 核准時間
  metadata JSONB DEFAULT '{}'::jsonb,                   -- 擴展欄位
  created_by UUID REFERENCES accounts(id),              -- 建立者
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ                                -- 軟刪除
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_requests_blueprint ON payment_requests(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_contract ON payment_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_lifecycle ON payment_requests(lifecycle);
CREATE INDEX IF NOT EXISTS idx_payment_requests_request_date ON payment_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_approver ON payment_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_deleted_at ON payment_requests(deleted_at) WHERE deleted_at IS NULL;

-- 更新時間觸發器
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at 
  BEFORE UPDATE ON payment_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_requests_select" ON payment_requests 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payment_requests_insert" ON payment_requests 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_update" ON payment_requests 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_delete" ON payment_requests 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 註解
COMMENT ON TABLE payment_requests IS '請款單 - 使用 lifecycle 狀態機管理請款流程';
COMMENT ON COLUMN payment_requests.blueprint_id IS '所屬藍圖 ID';
COMMENT ON COLUMN payment_requests.contract_id IS '關聯合約 ID（可選）';
COMMENT ON COLUMN payment_requests.request_number IS '請款單編號';
COMMENT ON COLUMN payment_requests.requested_amount IS '請款金額';
COMMENT ON COLUMN payment_requests.lifecycle IS '生命週期狀態：draft, active, on_hold, archived, deleted';
COMMENT ON COLUMN payment_requests.request_date IS '請款日期';
COMMENT ON COLUMN payment_requests.due_date IS '預計付款日期';

-- ============================================================================
-- PART 5: PAYMENTS TABLE (付款紀錄)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: payments (實際付款紀錄)
-- 記錄每筆實際付款
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  payment_request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,  -- 關聯請款單
  payment_number VARCHAR(100),                          -- 付款編號
  paid_amount NUMERIC(18,2) NOT NULL,                   -- 付款金額
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',           -- 幣別
  paid_at DATE NOT NULL,                                -- 付款日期
  payment_method VARCHAR(50),                           -- 付款方式（現金、轉帳等）
  reference_number VARCHAR(100),                        -- 銀行參考編號
  notes TEXT,                                           -- 備註
  metadata JSONB DEFAULT '{}'::jsonb,                   -- 擴展欄位
  created_by UUID REFERENCES accounts(id),              -- 建立者
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payments_blueprint ON payments(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_request ON payments(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- 更新時間觸發器
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON payments 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payments_insert" ON payments 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_update" ON payments 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_delete" ON payments 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 註解
COMMENT ON TABLE payments IS '付款紀錄 - 實際付款記錄，與請款單關聯';
COMMENT ON COLUMN payments.blueprint_id IS '所屬藍圖 ID';
COMMENT ON COLUMN payments.payment_request_id IS '關聯請款單 ID';
COMMENT ON COLUMN payments.payment_number IS '付款編號';
COMMENT ON COLUMN payments.paid_amount IS '付款金額';
COMMENT ON COLUMN payments.paid_at IS '付款日期';
COMMENT ON COLUMN payments.payment_method IS '付款方式';

-- ============================================================================
-- PART 6: LIFECYCLE TRIGGERS (生命週期觸發器)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1: 合約生命週期變更觸發器函數
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6.2: 請款單生命週期變更觸發器函數
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION payment_request_lifecycle_trigger()
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
      'payment_request'::entity_type,
      NEW.id,
      OLD.lifecycle::text,
      NEW.lifecycle::text,
      NULL,  -- 可透過應用層傳入
      jsonb_build_object(
        'request_number', NEW.request_number,
        'requested_amount', NEW.requested_amount
      ),
      auth.uid(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為 payment_requests 表建立觸發器
DROP TRIGGER IF EXISTS payment_request_lifecycle_change ON payment_requests;
CREATE TRIGGER payment_request_lifecycle_change
  AFTER UPDATE ON payment_requests
  FOR EACH ROW
  WHEN (OLD.lifecycle IS DISTINCT FROM NEW.lifecycle)
  EXECUTE FUNCTION payment_request_lifecycle_trigger();

COMMENT ON FUNCTION payment_request_lifecycle_trigger() IS '請款單生命週期變更時自動記錄到 lifecycle_transitions';

-- ============================================================================
-- PART 7: REALTIME CONFIGURATION (即時配置)
-- ============================================================================

-- 為需要即時更新的財務資料表啟用 Realtime
DO $$
BEGIN
  -- contracts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contracts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
  END IF;
  
  -- expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
  
  -- payment_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
  END IF;
  
  -- payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;
END $$;

-- ============================================================================
-- PART 8: HELPER FUNCTIONS (輔助函數)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: get_contract_summary (取得合約摘要)
-- 取得合約的財務摘要，包括已請款金額、已付款金額
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_contract_summary(p_contract_id UUID)
RETURNS TABLE (
  contract_id UUID,
  contract_amount NUMERIC(18,2),
  total_expenses NUMERIC(18,2),
  total_requested NUMERIC(18,2),
  total_paid NUMERIC(18,2),
  remaining_amount NUMERIC(18,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contract_id,
    c.contract_amount,
    COALESCE(SUM(e.amount), 0::NUMERIC(18,2)) AS total_expenses,
    COALESCE((
      SELECT SUM(pr.requested_amount) 
      FROM public.payment_requests pr 
      WHERE pr.contract_id = c.id 
        AND pr.lifecycle != 'deleted'
        AND pr.deleted_at IS NULL
    ), 0::NUMERIC(18,2)) AS total_requested,
    COALESCE((
      SELECT SUM(p.paid_amount) 
      FROM public.payments p 
      JOIN public.payment_requests pr ON p.payment_request_id = pr.id
      WHERE pr.contract_id = c.id
    ), 0::NUMERIC(18,2)) AS total_paid,
    c.contract_amount - COALESCE(SUM(e.amount), 0::NUMERIC(18,2)) AS remaining_amount
  FROM public.contracts c
  LEFT JOIN public.expenses e ON e.contract_id = c.id AND e.deleted_at IS NULL
  WHERE c.id = p_contract_id
    AND c.deleted_at IS NULL
  GROUP BY c.id, c.contract_amount;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contract_summary(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_contract_summary(UUID) IS '取得合約的財務摘要，包括已請款金額、已付款金額';

-- ----------------------------------------------------------------------------
-- Function: get_blueprint_financial_summary (取得藍圖財務摘要)
-- 取得整個藍圖的財務概況
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_blueprint_financial_summary(p_blueprint_id UUID)
RETURNS TABLE (
  blueprint_id UUID,
  total_contract_amount NUMERIC(18,2),
  total_expenses NUMERIC(18,2),
  total_requested NUMERIC(18,2),
  total_paid NUMERIC(18,2),
  pending_payment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 檢查存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint %', p_blueprint_id;
  END IF;

  RETURN QUERY
  SELECT 
    p_blueprint_id AS blueprint_id,
    COALESCE((
      SELECT SUM(c.contract_amount) 
      FROM public.contracts c 
      WHERE c.blueprint_id = p_blueprint_id AND c.deleted_at IS NULL
    ), 0::NUMERIC(18,2)) AS total_contract_amount,
    COALESCE((
      SELECT SUM(e.amount) 
      FROM public.expenses e 
      WHERE e.blueprint_id = p_blueprint_id AND e.deleted_at IS NULL
    ), 0::NUMERIC(18,2)) AS total_expenses,
    COALESCE((
      SELECT SUM(pr.requested_amount) 
      FROM public.payment_requests pr 
      WHERE pr.blueprint_id = p_blueprint_id 
        AND pr.lifecycle != 'deleted'
        AND pr.deleted_at IS NULL
    ), 0::NUMERIC(18,2)) AS total_requested,
    COALESCE((
      SELECT SUM(p.paid_amount) 
      FROM public.payments p 
      WHERE p.blueprint_id = p_blueprint_id
    ), 0::NUMERIC(18,2)) AS total_paid,
    (
      SELECT COUNT(*) 
      FROM public.payment_requests pr 
      WHERE pr.blueprint_id = p_blueprint_id 
        AND pr.lifecycle = 'active'
        AND pr.deleted_at IS NULL
    ) AS pending_payment_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_financial_summary(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_blueprint_financial_summary(UUID) IS '取得整個藍圖的財務概況';

-- ############################################################################
-- END OF FINANCIAL EXTENSION MIGRATION
-- ############################################################################

-- ############################################################################
-- END OF COMBINED SEED FILE
-- ############################################################################
