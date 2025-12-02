-- ============================================================================
-- GigHub Financial Module Extension
-- 金融模組擴展 - 預算、費用、付款、發票管理
-- ============================================================================
-- 
-- 📋 目錄 TABLE OF CONTENTS
-- ============================================================================
-- PART 1:  EXTEND EXISTING ENUMS 擴展現有列舉類型
-- PART 2:  FINANCIAL ENUMS       金融相關列舉類型
-- PART 3:  FINANCIAL TABLES      金融資料表
-- PART 4:  FINANCIAL RLS         金融資料列安全政策
-- PART 5:  FINANCIAL API         金融 API 函數
-- PART 6:  FINANCIAL TRIGGERS    金融觸發器
-- PART 7:  REALTIME CONFIG       即時配置
-- PART 8:  DOCUMENTATION         文件註解
-- ============================================================================

-- ############################################################################
-- PART 1: EXTEND EXISTING ENUMS (擴展現有列舉類型)
-- ############################################################################

-- 添加 'expense', 'budget', 'payment', 'invoice' 到 entity_type
DO $$
BEGIN
  -- 添加 expense 到 entity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.entity_type'::regtype 
    AND enumlabel = 'expense'
  ) THEN
    ALTER TYPE entity_type ADD VALUE 'expense';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 添加 budget 到 entity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.entity_type'::regtype 
    AND enumlabel = 'budget'
  ) THEN
    ALTER TYPE entity_type ADD VALUE 'budget';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 添加 payment 到 entity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.entity_type'::regtype 
    AND enumlabel = 'payment'
  ) THEN
    ALTER TYPE entity_type ADD VALUE 'payment';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 添加 invoice 到 entity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.entity_type'::regtype 
    AND enumlabel = 'invoice'
  ) THEN
    ALTER TYPE entity_type ADD VALUE 'invoice';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 添加 'approved', 'rejected' 到 activity_type
DO $$
BEGIN
  -- 添加 approved 到 activity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.activity_type'::regtype 
    AND enumlabel = 'approved'
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'approved';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 添加 rejected 到 activity_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.activity_type'::regtype 
    AND enumlabel = 'rejected'
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'rejected';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 添加 'finance' 到 module_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.module_type'::regtype 
    AND enumlabel = 'finance'
  ) THEN
    ALTER TYPE module_type ADD VALUE 'finance';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: FINANCIAL ENUMS (金融相關列舉類型)
-- ############################################################################

-- 預算類型: labor=人工費, material=材料費, equipment=設備費, subcontract=分包費, 
--           overhead=管理費, other=其他費用
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_category') THEN
    CREATE TYPE budget_category AS ENUM (
      'labor',           -- 人工費用
      'material',        -- 材料費用
      'equipment',       -- 設備費用
      'subcontract',     -- 分包費用
      'overhead',        -- 管理費用
      'other'            -- 其他費用
    );
  END IF;
END $$;

-- 費用狀態: draft=草稿, submitted=已提交, approved=已核准, rejected=已駁回, paid=已支付
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
    CREATE TYPE expense_status AS ENUM (
      'draft',           -- 草稿
      'submitted',       -- 已提交
      'approved',        -- 已核准
      'rejected',        -- 已駁回
      'paid'             -- 已支付
    );
  END IF;
END $$;

-- 付款狀態: pending=待付款, partial=部分付款, completed=已完成, cancelled=已取消
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',         -- 待付款
      'partial',         -- 部分付款
      'completed',       -- 已完成
      'cancelled'        -- 已取消
    );
  END IF;
END $$;

-- 發票類型: invoice=發票, receipt=收據, credit_note=折讓單, debit_note=借方通知單
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
    CREATE TYPE invoice_type AS ENUM (
      'invoice',         -- 發票
      'receipt',         -- 收據
      'credit_note',     -- 折讓單
      'debit_note'       -- 借方通知單
    );
  END IF;
END $$;

-- 發票狀態: draft=草稿, issued=已開立, sent=已寄送, paid=已付款, overdue=逾期, cancelled=已取消
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'draft',           -- 草稿
      'issued',          -- 已開立
      'sent',            -- 已寄送
      'paid',            -- 已付款
      'overdue',         -- 逾期
      'cancelled'        -- 已取消
    );
  END IF;
END $$;

-- 幣別: TWD=新台幣, USD=美元, CNY=人民幣, JPY=日圓
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
    CREATE TYPE currency_code AS ENUM (
      'TWD',             -- 新台幣
      'USD',             -- 美元
      'CNY',             -- 人民幣
      'JPY'              -- 日圓
    );
  END IF;
END $$;

-- ############################################################################
-- PART 3: FINANCIAL TABLES (金融資料表)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- Table: budgets (預算)
-- 藍圖級預算計劃，支援多層次預算結構
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category budget_category NOT NULL DEFAULT 'other',
  planned_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  actual_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency currency_code NOT NULL DEFAULT 'TWD',
  start_date DATE,
  end_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_budgets_blueprint ON budgets(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_budgets_parent ON budgets(parent_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);

-- ----------------------------------------------------------------------------
-- Table: expenses (費用記錄)
-- 實際發生的費用記錄，關聯到預算項目
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category budget_category NOT NULL DEFAULT 'other',
  amount DECIMAL(15,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'TWD',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status expense_status NOT NULL DEFAULT 'draft',
  vendor_name VARCHAR(255),
  vendor_id UUID,                                    -- 未來可連結供應商表
  receipt_number VARCHAR(100),
  receipt_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES accounts(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expenses_blueprint ON expenses(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_expenses_budget ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_task ON expenses(task_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ----------------------------------------------------------------------------
-- Table: expense_attachments (費用附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);

-- ----------------------------------------------------------------------------
-- Table: invoices (發票記錄)
-- 開立/收到的發票管理 - 必須在 payments 之前建立
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  invoice_type invoice_type NOT NULL DEFAULT 'invoice',
  invoice_number VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'TWD',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status invoice_status NOT NULL DEFAULT 'draft',
  issuer_name VARCHAR(255),
  issuer_tax_id VARCHAR(50),
  issuer_address TEXT,
  recipient_name VARCHAR(255),
  recipient_tax_id VARCHAR(50),
  recipient_address TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT invoices_number_unique UNIQUE (blueprint_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_blueprint ON invoices(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- ----------------------------------------------------------------------------
-- Table: payments (付款記錄)
-- 付款流水記錄，支援分期付款
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'TWD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100),
  reference_number VARCHAR(100),
  payer_name VARCHAR(255),
  payee_name VARCHAR(255),
  bank_account VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_blueprint ON payments(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_payments_expense ON payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ----------------------------------------------------------------------------
-- Table: invoice_items (發票明細)
-- 發票的逐項明細
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ----------------------------------------------------------------------------
-- Table: budget_snapshots (預算快照)
-- 預算歷史快照，用於追蹤預算變更
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  planned_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) NOT NULL,
  variance_amount DECIMAL(15,2) NOT NULL,
  variance_percentage DECIMAL(5,2),
  notes TEXT,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_snapshots_budget ON budget_snapshots(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date);

-- ############################################################################
-- PART 4: FINANCIAL RLS (金融資料列安全政策)
-- ############################################################################

-- 啟用 RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: budgets (預算)
-- 財務角色或專案經理可完整存取，其他成員只讀
-- ============================================================================
DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "budgets_update" ON budgets;
CREATE POLICY "budgets_update" ON budgets 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_delete" ON budgets 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) = 'project_manager'
    )
  );

-- ============================================================================
-- RLS Policies: expenses (費用)
-- ============================================================================
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      created_by = (SELECT private.get_user_account_id())
      OR (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

-- ============================================================================
-- RLS Policies: expense_attachments (費用附件)
-- ============================================================================
DROP POLICY IF EXISTS "expense_attachments_select" ON expense_attachments;
CREATE POLICY "expense_attachments_select" ON expense_attachments 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM expenses e 
      WHERE e.id = expense_id 
      AND (SELECT private.has_blueprint_access(e.blueprint_id))
    )
  );

DROP POLICY IF EXISTS "expense_attachments_insert" ON expense_attachments;
CREATE POLICY "expense_attachments_insert" ON expense_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e 
      WHERE e.id = expense_id 
      AND (SELECT private.can_write_blueprint(e.blueprint_id))
    )
  );

DROP POLICY IF EXISTS "expense_attachments_delete" ON expense_attachments;
CREATE POLICY "expense_attachments_delete" ON expense_attachments 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM expenses e 
      WHERE e.id = expense_id 
      AND (SELECT private.can_write_blueprint(e.blueprint_id))
      AND (
        uploaded_by = (SELECT private.get_user_account_id())
        OR (SELECT private.get_blueprint_business_role(e.blueprint_id)) IN ('project_manager', 'finance')
      )
    )
  );

-- ============================================================================
-- RLS Policies: payments (付款)
-- ============================================================================
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) = 'project_manager'
    )
  );

-- ============================================================================
-- RLS Policies: invoices (發票)
-- ============================================================================
DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "invoices_delete" ON invoices;
CREATE POLICY "invoices_delete" ON invoices 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND (
      (SELECT private.get_blueprint_business_role(blueprint_id)) = 'project_manager'
    )
  );

-- ============================================================================
-- RLS Policies: invoice_items (發票明細)
-- ============================================================================
DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
CREATE POLICY "invoice_items_select" ON invoice_items 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_id 
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    )
  );

DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
CREATE POLICY "invoice_items_insert" ON invoice_items 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_id 
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
      AND (SELECT private.get_blueprint_business_role(i.blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
CREATE POLICY "invoice_items_update" ON invoice_items 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_id 
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
      AND (SELECT private.get_blueprint_business_role(i.blueprint_id)) IN ('project_manager', 'finance')
    )
  );

DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_delete" ON invoice_items 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_id 
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
      AND (SELECT private.get_blueprint_business_role(i.blueprint_id)) = 'project_manager'
    )
  );

-- ============================================================================
-- RLS Policies: budget_snapshots (預算快照)
-- ============================================================================
DROP POLICY IF EXISTS "budget_snapshots_select" ON budget_snapshots;
CREATE POLICY "budget_snapshots_select" ON budget_snapshots 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_id 
      AND (SELECT private.has_blueprint_access(b.blueprint_id))
    )
  );

DROP POLICY IF EXISTS "budget_snapshots_insert" ON budget_snapshots;
CREATE POLICY "budget_snapshots_insert" ON budget_snapshots 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_id 
      AND (SELECT private.can_write_blueprint(b.blueprint_id))
      AND (SELECT private.get_blueprint_business_role(b.blueprint_id)) IN ('project_manager', 'finance')
    )
  );

-- ############################################################################
-- PART 5: FINANCIAL API (金融 API 函數)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- get_budget_summary()
-- 取得藍圖預算總覽
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_budget_summary(p_blueprint_id UUID)
RETURNS TABLE (
  category budget_category,
  planned_total DECIMAL(15,2),
  actual_total DECIMAL(15,2),
  variance DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  expense_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 檢查存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.category,
    COALESCE(SUM(b.planned_amount), 0::DECIMAL(15,2)) AS planned_total,
    COALESCE(SUM(b.actual_amount), 0::DECIMAL(15,2)) AS actual_total,
    COALESCE(SUM(b.planned_amount), 0::DECIMAL(15,2)) - COALESCE(SUM(b.actual_amount), 0::DECIMAL(15,2)) AS variance,
    CASE 
      WHEN COALESCE(SUM(b.planned_amount), 0) = 0 THEN 0::DECIMAL(5,2)
      ELSE ROUND(((COALESCE(SUM(b.planned_amount), 0) - COALESCE(SUM(b.actual_amount), 0)) / SUM(b.planned_amount) * 100)::DECIMAL, 2)::DECIMAL(5,2)
    END AS variance_percentage,
    (SELECT COUNT(*) FROM public.expenses e WHERE e.blueprint_id = p_blueprint_id AND e.category = b.category AND e.deleted_at IS NULL) AS expense_count
  FROM public.budgets b
  WHERE b.blueprint_id = p_blueprint_id
    AND b.deleted_at IS NULL
  GROUP BY b.category;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_budget_summary(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- get_financial_overview()
-- 取得藍圖財務總覽
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_financial_overview(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_total_budget DECIMAL(15,2);
  v_total_expenses DECIMAL(15,2);
  v_pending_payments DECIMAL(15,2);
  v_completed_payments DECIMAL(15,2);
  v_open_invoices DECIMAL(15,2);
  v_overdue_invoices DECIMAL(15,2);
BEGIN
  -- 檢查存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  -- 預算總額
  SELECT COALESCE(SUM(planned_amount), 0) INTO v_total_budget
  FROM public.budgets 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND parent_id IS NULL;
  
  -- 費用總額
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.expenses 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status != 'rejected';
  
  -- 待付款金額
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_payments
  FROM public.payments 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'pending';
  
  -- 已完成付款
  SELECT COALESCE(SUM(amount), 0) INTO v_completed_payments
  FROM public.payments 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'completed';
  
  -- 未付發票
  SELECT COALESCE(SUM(total_amount), 0) INTO v_open_invoices
  FROM public.invoices 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status IN ('issued', 'sent');
  
  -- 逾期發票
  SELECT COALESCE(SUM(total_amount), 0) INTO v_overdue_invoices
  FROM public.invoices 
  WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'overdue';
  
  v_result := jsonb_build_object(
    'total_budget', v_total_budget,
    'total_expenses', v_total_expenses,
    'budget_utilization', CASE WHEN v_total_budget = 0 THEN 0 ELSE ROUND((v_total_expenses / v_total_budget * 100)::DECIMAL, 2) END,
    'pending_payments', v_pending_payments,
    'completed_payments', v_completed_payments,
    'open_invoices', v_open_invoices,
    'overdue_invoices', v_overdue_invoices,
    'generated_at', now()
  );
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_overview(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- approve_expense()
-- 核准費用
-- 注意：使用 'approval' activity_type 而非 'approved'，因為 init.sql 中已定義 'approval'
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_expense(
  p_expense_id UUID,
  p_approved BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_blueprint_id UUID;
  v_budget_id UUID;
  v_amount DECIMAL(15,2);
  v_user_account_id UUID;
BEGIN
  v_user_account_id := (SELECT private.get_user_account_id());
  
  -- 取得費用資訊
  SELECT blueprint_id, budget_id, amount INTO v_blueprint_id, v_budget_id, v_amount
  FROM public.expenses
  WHERE id = p_expense_id AND deleted_at IS NULL;
  
  IF v_blueprint_id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;
  
  -- 檢查權限
  IF NOT (
    (SELECT private.get_blueprint_business_role(v_blueprint_id)) IN ('project_manager', 'finance')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to approve expense';
  END IF;
  
  -- 更新費用狀態
  UPDATE public.expenses
  SET 
    status = CASE WHEN p_approved THEN 'approved'::expense_status ELSE 'rejected'::expense_status END,
    approved_by = v_user_account_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_expense_id;
  
  -- 如果核准且有關聯預算，更新實際金額
  IF p_approved AND v_budget_id IS NOT NULL THEN
    UPDATE public.budgets
    SET 
      actual_amount = actual_amount + v_amount,
      updated_at = now()
    WHERE id = v_budget_id;
  END IF;
  
  -- 記錄活動 - 使用 'approval' activity_type (init.sql 中已定義)
  PERFORM public.log_activity(
    v_user_account_id,
    'expense'::entity_type,
    p_expense_id,
    'approval'::activity_type,
    NULL,
    jsonb_build_object('amount', v_amount, 'approved', p_approved),
    jsonb_build_object('blueprint_id', v_blueprint_id)
  );
  
  RETURN p_expense_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_expense(UUID, BOOLEAN) TO authenticated;

-- ----------------------------------------------------------------------------
-- create_budget_snapshot()
-- 建立預算快照
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_budget_snapshot(p_budget_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_snapshot_id UUID;
  v_blueprint_id UUID;
  v_planned DECIMAL(15,2);
  v_actual DECIMAL(15,2);
  v_user_account_id UUID;
BEGIN
  v_user_account_id := (SELECT private.get_user_account_id());
  
  -- 取得預算資訊
  SELECT blueprint_id, planned_amount, actual_amount INTO v_blueprint_id, v_planned, v_actual
  FROM public.budgets
  WHERE id = p_budget_id AND deleted_at IS NULL;
  
  IF v_blueprint_id IS NULL THEN
    RAISE EXCEPTION 'Budget not found';
  END IF;
  
  -- 檢查權限
  IF NOT (
    (SELECT private.get_blueprint_business_role(v_blueprint_id)) IN ('project_manager', 'finance')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create budget snapshot';
  END IF;
  
  -- 建立快照
  INSERT INTO public.budget_snapshots (
    budget_id,
    planned_amount,
    actual_amount,
    variance_amount,
    variance_percentage,
    notes,
    created_by
  )
  VALUES (
    p_budget_id,
    v_planned,
    v_actual,
    v_planned - v_actual,
    CASE WHEN v_planned = 0 THEN 0 ELSE ROUND(((v_planned - v_actual) / v_planned * 100)::DECIMAL, 2) END,
    p_notes,
    v_user_account_id
  )
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_budget_snapshot(UUID, TEXT) TO authenticated;

-- ############################################################################
-- PART 6: FINANCIAL TRIGGERS (金融觸發器)
-- ############################################################################

-- 為金融表建立 updated_at 觸發器
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ----------------------------------------------------------------------------
-- update_invoice_overdue()
-- 自動更新逾期發票狀態的觸發器
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_invoice_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 如果發票未付款且已過期，更新狀態為 overdue
  IF NEW.status IN ('issued', 'sent') AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue'::invoice_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_invoice_overdue ON invoices;
CREATE TRIGGER check_invoice_overdue
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_overdue();

-- ############################################################################
-- PART 7: REALTIME CONFIGURATION (即時配置)
-- ############################################################################

-- 為金融表啟用 Realtime (使用 IF NOT EXISTS 邏輯)
DO $$
BEGIN
  -- 嘗試添加 budgets 到 realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  -- 嘗試添加 expenses 到 realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  -- 嘗試添加 payments 到 realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  -- 嘗試添加 invoices 到 realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ############################################################################
-- PART 8: DOCUMENTATION (文件註解)
-- ############################################################################

-- 資料表註解
COMMENT ON TABLE budgets IS '預算表 - Blueprint-level budget planning with hierarchical structure';
COMMENT ON TABLE expenses IS '費用表 - Actual expense records linked to budgets and tasks';
COMMENT ON TABLE expense_attachments IS '費用附件 - Receipts and supporting documents for expenses';
COMMENT ON TABLE payments IS '付款表 - Payment records with support for installments';
COMMENT ON TABLE invoices IS '發票表 - Invoice management (issued and received)';
COMMENT ON TABLE invoice_items IS '發票明細 - Line items for invoices';
COMMENT ON TABLE budget_snapshots IS '預算快照 - Historical budget snapshots for variance tracking';

-- 列舉類型註解
COMMENT ON TYPE budget_category IS '預算類別 - Categories for budget allocation';
COMMENT ON TYPE expense_status IS '費用狀態 - Status of expense records';
COMMENT ON TYPE payment_status IS '付款狀態 - Status of payment records';
COMMENT ON TYPE invoice_type IS '發票類型 - Types of invoices';
COMMENT ON TYPE invoice_status IS '發票狀態 - Status of invoices';
COMMENT ON TYPE currency_code IS '幣別代碼 - Supported currency codes';

-- 函數註解
COMMENT ON FUNCTION public.get_budget_summary(UUID) IS '取得預算總覽 - Get budget summary by category';
COMMENT ON FUNCTION public.get_financial_overview(UUID) IS '取得財務總覽 - Get complete financial overview';
COMMENT ON FUNCTION public.approve_expense(UUID, BOOLEAN) IS '核准/駁回費用 - Approve or reject expense';
COMMENT ON FUNCTION public.create_budget_snapshot(UUID, TEXT) IS '建立預算快照 - Create budget snapshot for tracking';

-- ############################################################################
-- END OF FINANCIAL MODULE EXTENSION
-- ############################################################################
