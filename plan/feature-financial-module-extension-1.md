---
goal: Extend Database Schema for Financial Module (Contracts, Expenses, Payments)
version: 1.0
date_created: 2025-12-02
last_updated: 2025-12-02
owner: Development Team
status: 'Planning'
tags: ['feature', 'database', 'supabase', 'financial', 'contracts', 'payments', 'expenses']
---

# Financial Module Database Extension Plan

![Status: Planning](https://img.shields.io/badge/status-Planning-blue)

This plan describes how to extend the existing GigHub database schema in `supabase/seeds/init.sql` to support comprehensive financial management, including contracts, expenses, payment requests, and payments.

## 1. Overview

### 1.1 Design Principles

| Concept | Principle | Implementation |
|---------|-----------|----------------|
| **Blueprint Integration** | Every financial table has `blueprint_id` | All tables reference `blueprints(id)` with CASCADE delete |
| **Permission Inheritance** | Reuse existing RBAC | Uses `blueprint_members`/`blueprint_roles`, no new permission tables |
| **State Machine** | Reuse `lifecycle_transitions` | Uses existing `blueprint_lifecycle` enum, no new status enums |
| **Future Extensibility** | Allow modular expansion | Designed for future `vendors`, `change_orders`, `tax`, `retainage` modules |

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BLUEPRINT                                       │
│                         (Container Layer)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────────────┐     ┌────────────────────────┐ │
│  │  contracts  │────▶│  payment_requests   │────▶│       payments         │ │
│  │  (預算起點)  │     │  (請款單/lifecycle) │     │    (實際付款紀錄)      │ │
│  └──────┬──────┘     └─────────────────────┘     └────────────────────────┘ │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                             │
│  │  expenses   │                                                             │
│  │ (成本紀錄)   │                                                             │
│  └─────────────┘                                                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    lifecycle_transitions                                 ││
│  │         (Existing table - records all state changes)                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Requirements & Constraints

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **REQ-F001** | Track contracts with vendor information and budget amounts | HIGH |
| **REQ-F002** | Record actual expense entries linked to contracts | HIGH |
| **REQ-F003** | Support payment request workflow with lifecycle states (draft → active → archived) | HIGH |
| **REQ-F004** | Record individual payments against payment requests | HIGH |
| **REQ-F005** | Automatically log state transitions to `lifecycle_transitions` | HIGH |
| **REQ-F006** | Calculate total paid vs requested amounts for each payment request | MEDIUM |
| **REQ-F007** | Support partial payments (multiple payments per request) | MEDIUM |

### 2.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **REQ-N001** | All financial data must be tied to a blueprint for proper access control | HIGH |
| **REQ-N002** | RLS policies must use existing helper functions (`has_blueprint_access`, `can_write_blueprint`) | HIGH |
| **REQ-N003** | Numeric fields use `NUMERIC(18,2)` for financial precision | HIGH |
| **REQ-N004** | Support realtime subscriptions for payment status updates | MEDIUM |

### 2.3 Constraints

| ID | Constraint | Impact |
|----|------------|--------|
| **CON-001** | Must not create new status ENUMs - reuse `blueprint_lifecycle` | Schema Design |
| **CON-002** | Must not modify existing `blueprint_members` or `blueprint_roles` tables | Permission System |
| **CON-003** | Must follow existing naming conventions (snake_case, singular table names) | Code Consistency |
| **CON-004** | Must add new entity types to `entity_type` ENUM for lifecycle tracking | Schema Migration |

## 3. Database Schema Design

### 3.1 Schema Changes Overview

```sql
-- 1. Extend entity_type ENUM (for lifecycle tracking)
ALTER TYPE entity_type ADD VALUE 'contract';
ALTER TYPE entity_type ADD VALUE 'expense';
ALTER TYPE entity_type ADD VALUE 'payment_request';
ALTER TYPE entity_type ADD VALUE 'payment';

-- 2. Create financial tables
-- (Details in sections below)
```

### 3.2 Table: `contracts` (合約 / 預算起點)

**Purpose**: Track contracts and budgets for construction projects.

```sql
-- ============================================================================
-- FINANCIAL MODULE: contracts (合約/預算起點)
-- ============================================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  
  -- Contract Details
  contract_number VARCHAR(100),                    -- 合約編號
  title VARCHAR(500) NOT NULL,                     -- 合約名稱
  description TEXT,                                -- 合約說明
  vendor_name TEXT,                                -- 廠商名稱 (可擴展為 vendor_id)
  vendor_contact JSONB DEFAULT '{}'::jsonb,        -- 廠商聯絡資訊 (email, phone, address)
  
  -- Financial Data
  contract_amount NUMERIC(18,2) NOT NULL,          -- 合約金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  
  -- Dates
  start_date DATE,                                 -- 合約開始日
  end_date DATE,                                   -- 合約結束日
  signed_date DATE,                                -- 簽約日期
  
  -- Lifecycle
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  
  -- Audit
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  -- Metadata for extensibility
  metadata JSONB DEFAULT '{}'::jsonb               -- 可存放: tax_rate, retainage_rate, etc.
);

-- Indexes
CREATE INDEX idx_contracts_blueprint ON contracts(blueprint_id);
CREATE INDEX idx_contracts_lifecycle ON contracts(lifecycle);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_name);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
```

### 3.3 Table: `expenses` (成本實際投入紀錄)

**Purpose**: Track actual expenses/costs against contracts and blueprints.

```sql
-- ============================================================================
-- FINANCIAL MODULE: expenses (成本支出紀錄)
-- ============================================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Expense Details
  title VARCHAR(500) NOT NULL,                     -- 支出項目名稱
  description TEXT,                                -- 支出說明
  category VARCHAR(100),                           -- 分類 (材料、人工、設備、其他)
  
  -- Financial Data
  amount NUMERIC(18,2) NOT NULL,                   -- 支出金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  
  -- Dates
  expense_date DATE NOT NULL,                      -- 支出日期
  
  -- Lifecycle (optional - expenses typically don't need complex workflow)
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active',
  
  -- Audit
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb               -- 可存放: invoice_number, receipt_path, etc.
);

-- Indexes
CREATE INDEX idx_expenses_blueprint ON expenses(blueprint_id);
CREATE INDEX idx_expenses_contract ON expenses(contract_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_lifecycle ON expenses(lifecycle);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
```

### 3.4 Table: `payment_requests` (請款單)

**Purpose**: Manage payment request workflow with lifecycle states.

```sql
-- ============================================================================
-- FINANCIAL MODULE: payment_requests (請款單)
-- Uses blueprint_lifecycle for state management:
--   draft    = 草稿 (新建立，尚未提交)
--   active   = 已提交 (等待審核/付款)
--   on_hold  = 暫停 (有問題需處理)
--   archived = 已完成 (全額付款完成)
--   deleted  = 已取消 (作廢)
-- ============================================================================
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Request Details
  request_number VARCHAR(100),                     -- 請款單編號
  title VARCHAR(500) NOT NULL,                     -- 請款說明
  description TEXT,                                -- 詳細說明
  
  -- Financial Data
  requested_amount NUMERIC(18,2) NOT NULL,         -- 請款金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  
  -- Dates
  request_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 請款日期
  due_date DATE,                                   -- 預計付款日
  
  -- Lifecycle (核心狀態機)
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  
  -- Approval workflow (optional)
  submitted_by UUID REFERENCES accounts(id),       -- 提交人
  submitted_at TIMESTAMPTZ,                        -- 提交時間
  approved_by UUID REFERENCES accounts(id),        -- 審核人
  approved_at TIMESTAMPTZ,                         -- 審核時間
  
  -- Audit
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb               -- 可存放: attachments, notes, rejection_reason
);

-- Indexes
CREATE INDEX idx_payment_requests_blueprint ON payment_requests(blueprint_id);
CREATE INDEX idx_payment_requests_contract ON payment_requests(contract_id);
CREATE INDEX idx_payment_requests_lifecycle ON payment_requests(lifecycle);
CREATE INDEX idx_payment_requests_request_date ON payment_requests(request_date);
CREATE INDEX idx_payment_requests_due_date ON payment_requests(due_date);

-- Trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at 
  BEFORE UPDATE ON payment_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
```

### 3.5 Table: `payments` (實際付款紀錄)

**Purpose**: Record individual payments against payment requests.

```sql
-- ============================================================================
-- FINANCIAL MODULE: payments (實際付款紀錄)
-- Supports partial payments - multiple payments per payment_request
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
  
  -- Denormalized for query efficiency
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_number VARCHAR(100),                     -- 付款編號
  paid_amount NUMERIC(18,2) NOT NULL,              -- 付款金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  
  -- Dates
  paid_at DATE NOT NULL,                           -- 付款日期
  
  -- Payment Method
  payment_method VARCHAR(50),                      -- 付款方式 (現金、轉帳、支票)
  reference_number VARCHAR(255),                   -- 參考編號 (轉帳帳號、支票號碼)
  
  -- Audit
  paid_by UUID REFERENCES accounts(id),            -- 付款處理人
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb               -- 可存放: bank_info, receipt_path
);

-- Indexes
CREATE INDEX idx_payments_payment_request ON payments(payment_request_id);
CREATE INDEX idx_payments_blueprint ON payments(blueprint_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
```

## 4. Lifecycle Trigger Implementation

### 4.1 Payment Request Lifecycle Trigger

**Purpose**: Automatically log state transitions when `lifecycle` column changes.

```sql
-- ============================================================================
-- TRIGGER: payment_request_lifecycle_trigger
-- Records lifecycle changes to lifecycle_transitions table
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_request_lifecycle_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  -- Only proceed if lifecycle actually changed
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    -- Get the current user's account_id
    v_actor_id := (SELECT private.get_user_account_id());
    
    -- Insert transition record
    INSERT INTO public.lifecycle_transitions (
      blueprint_id,
      entity_type,
      entity_id,
      from_status,
      to_status,
      reason,
      metadata,
      transitioned_by
    ) VALUES (
      NEW.blueprint_id,
      'payment_request'::public.entity_type,
      NEW.id,
      OLD.lifecycle::VARCHAR,
      NEW.lifecycle::VARCHAR,
      NULL,  -- reason can be added via separate API call
      jsonb_build_object(
        'requested_amount', NEW.requested_amount,
        'contract_id', NEW.contract_id
      ),
      v_actor_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_request_lifecycle_change
  AFTER UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.payment_request_lifecycle_trigger();
```

### 4.2 Contract Lifecycle Trigger

```sql
-- ============================================================================
-- TRIGGER: contract_lifecycle_trigger
-- Records lifecycle changes for contracts
-- ============================================================================
CREATE OR REPLACE FUNCTION public.contract_lifecycle_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    v_actor_id := (SELECT private.get_user_account_id());
    
    INSERT INTO public.lifecycle_transitions (
      blueprint_id,
      entity_type,
      entity_id,
      from_status,
      to_status,
      metadata,
      transitioned_by
    ) VALUES (
      NEW.blueprint_id,
      'contract'::public.entity_type,
      NEW.id,
      OLD.lifecycle::VARCHAR,
      NEW.lifecycle::VARCHAR,
      jsonb_build_object(
        'contract_amount', NEW.contract_amount,
        'vendor_name', NEW.vendor_name
      ),
      v_actor_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_lifecycle_change
  AFTER UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.contract_lifecycle_trigger();
```

### 4.3 Expense Lifecycle Trigger

```sql
-- ============================================================================
-- TRIGGER: expense_lifecycle_trigger
-- Records lifecycle changes for expenses
-- ============================================================================
CREATE OR REPLACE FUNCTION public.expense_lifecycle_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    v_actor_id := (SELECT private.get_user_account_id());
    
    INSERT INTO public.lifecycle_transitions (
      blueprint_id,
      entity_type,
      entity_id,
      from_status,
      to_status,
      metadata,
      transitioned_by
    ) VALUES (
      NEW.blueprint_id,
      'expense'::public.entity_type,
      NEW.id,
      OLD.lifecycle::VARCHAR,
      NEW.lifecycle::VARCHAR,
      jsonb_build_object(
        'amount', NEW.amount,
        'expense_date', NEW.expense_date
      ),
      v_actor_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_expense_lifecycle_change
  AFTER UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.expense_lifecycle_trigger();
```

## 5. Row Level Security Policies

### 5.1 Enable RLS on Financial Tables

```sql
-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

### 5.2 Contracts RLS Policies

```sql
-- ============================================================================
-- RLS Policies: contracts
-- ============================================================================
CREATE POLICY "contracts_select" ON contracts 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "contracts_insert" ON contracts 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_update" ON contracts 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_delete" ON contracts 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));
```

### 5.3 Expenses RLS Policies

```sql
-- ============================================================================
-- RLS Policies: expenses
-- ============================================================================
CREATE POLICY "expenses_select" ON expenses 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "expenses_insert" ON expenses 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_update" ON expenses 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_delete" ON expenses 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));
```

### 5.4 Payment Requests RLS Policies

```sql
-- ============================================================================
-- RLS Policies: payment_requests
-- ============================================================================
CREATE POLICY "payment_requests_select" ON payment_requests 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payment_requests_insert" ON payment_requests 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_update" ON payment_requests 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_delete" ON payment_requests 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));
```

### 5.5 Payments RLS Policies

```sql
-- ============================================================================
-- RLS Policies: payments
-- ============================================================================
CREATE POLICY "payments_select" ON payments 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payments_insert" ON payments 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_update" ON payments 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_delete" ON payments 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));
```

## 6. API Functions

### 6.1 Get Payment Request Summary

```sql
-- ============================================================================
-- FUNCTION: get_payment_request_summary
-- Returns payment request with calculated payment totals
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_payment_request_summary(p_payment_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_blueprint_id UUID;
BEGIN
  -- Get blueprint_id for access check
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.payment_requests
  WHERE id = p_payment_request_id;
  
  -- Verify access
  IF NOT (SELECT private.has_blueprint_access(v_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to payment request';
  END IF;
  
  SELECT jsonb_build_object(
    'id', pr.id,
    'request_number', pr.request_number,
    'title', pr.title,
    'requested_amount', pr.requested_amount,
    'currency', pr.currency,
    'lifecycle', pr.lifecycle,
    'request_date', pr.request_date,
    'due_date', pr.due_date,
    'contract_id', pr.contract_id,
    'contract_title', c.title,
    'payments', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'paid_amount', p.paid_amount,
          'paid_at', p.paid_at,
          'payment_method', p.payment_method
        ) ORDER BY p.paid_at DESC
      ), '[]'::jsonb)
      FROM public.payments p
      WHERE p.payment_request_id = pr.id
    ),
    'total_paid', COALESCE(
      (SELECT SUM(paid_amount) FROM public.payments WHERE payment_request_id = pr.id),
      0
    ),
    'remaining_amount', pr.requested_amount - COALESCE(
      (SELECT SUM(paid_amount) FROM public.payments WHERE payment_request_id = pr.id),
      0
    ),
    'payment_status', CASE
      WHEN COALESCE((SELECT SUM(paid_amount) FROM public.payments WHERE payment_request_id = pr.id), 0) = 0 THEN 'unpaid'
      WHEN COALESCE((SELECT SUM(paid_amount) FROM public.payments WHERE payment_request_id = pr.id), 0) < pr.requested_amount THEN 'partial'
      ELSE 'paid'
    END
  ) INTO v_result
  FROM public.payment_requests pr
  LEFT JOIN public.contracts c ON c.id = pr.contract_id
  WHERE pr.id = p_payment_request_id;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_request_summary(UUID) TO authenticated;
```

### 6.2 Get Contract Financial Summary

```sql
-- ============================================================================
-- FUNCTION: get_contract_summary
-- Returns contract with expense and payment totals
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_contract_summary(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_blueprint_id UUID;
BEGIN
  -- Get blueprint_id for access check
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.contracts
  WHERE id = p_contract_id;
  
  -- Verify access
  IF NOT (SELECT private.has_blueprint_access(v_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to contract';
  END IF;
  
  SELECT jsonb_build_object(
    'id', c.id,
    'contract_number', c.contract_number,
    'title', c.title,
    'contract_amount', c.contract_amount,
    'currency', c.currency,
    'lifecycle', c.lifecycle,
    'vendor_name', c.vendor_name,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'total_expenses', COALESCE(
      (SELECT SUM(amount) FROM public.expenses WHERE contract_id = c.id AND deleted_at IS NULL),
      0
    ),
    'total_payment_requests', COALESCE(
      (SELECT SUM(requested_amount) FROM public.payment_requests WHERE contract_id = c.id AND deleted_at IS NULL),
      0
    ),
    'total_paid', COALESCE(
      (SELECT SUM(p.paid_amount) 
       FROM public.payments p 
       JOIN public.payment_requests pr ON pr.id = p.payment_request_id 
       WHERE pr.contract_id = c.id),
      0
    ),
    'remaining_budget', c.contract_amount - COALESCE(
      (SELECT SUM(amount) FROM public.expenses WHERE contract_id = c.id AND deleted_at IS NULL),
      0
    )
  ) INTO v_result
  FROM public.contracts c
  WHERE c.id = p_contract_id;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contract_summary(UUID) TO authenticated;
```

### 6.3 Get Blueprint Financial Overview

```sql
-- ============================================================================
-- FUNCTION: get_blueprint_financial_overview
-- Returns overall financial status for a blueprint
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_blueprint_financial_overview(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verify access
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  SELECT jsonb_build_object(
    'blueprint_id', p_blueprint_id,
    'contracts', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.contracts WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'active_count', (SELECT COUNT(*) FROM public.contracts WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND lifecycle = 'active'),
      'total_amount', COALESCE((SELECT SUM(contract_amount) FROM public.contracts WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL), 0)
    ),
    'expenses', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.expenses WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'total_amount', COALESCE((SELECT SUM(amount) FROM public.expenses WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL), 0)
    ),
    'payment_requests', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.payment_requests WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'draft_count', (SELECT COUNT(*) FROM public.payment_requests WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND lifecycle = 'draft'),
      'active_count', (SELECT COUNT(*) FROM public.payment_requests WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND lifecycle = 'active'),
      'total_requested', COALESCE((SELECT SUM(requested_amount) FROM public.payment_requests WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL), 0)
    ),
    'payments', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM public.payments WHERE blueprint_id = p_blueprint_id),
      'total_paid', COALESCE((SELECT SUM(paid_amount) FROM public.payments WHERE blueprint_id = p_blueprint_id), 0)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_financial_overview(UUID) TO authenticated;
```

## 7. Realtime Configuration

```sql
-- ============================================================================
-- REALTIME: Enable for financial tables
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
```

## 8. Documentation Comments

```sql
-- ============================================================================
-- DOCUMENTATION: Financial Module Tables
-- ============================================================================
COMMENT ON TABLE contracts IS '合約表 - Contracts and budget definitions per blueprint';
COMMENT ON TABLE expenses IS '支出表 - Expense records linked to contracts and blueprints';
COMMENT ON TABLE payment_requests IS '請款單 - Payment request workflow with lifecycle states';
COMMENT ON TABLE payments IS '付款紀錄 - Individual payment records against payment requests';

COMMENT ON FUNCTION public.get_payment_request_summary(UUID) IS '取得請款單摘要 - Get payment request with payment totals';
COMMENT ON FUNCTION public.get_contract_summary(UUID) IS '取得合約摘要 - Get contract with expense and payment totals';
COMMENT ON FUNCTION public.get_blueprint_financial_overview(UUID) IS '取得藍圖財務總覽 - Get overall financial status for a blueprint';
```

## 9. Implementation Phases

### Phase 1: Schema Creation (Priority: HIGH)

| Task | Description | Status |
|------|-------------|--------|
| TASK-001 | Extend `entity_type` ENUM with financial types | Pending |
| TASK-002 | Create `contracts` table | Pending |
| TASK-003 | Create `expenses` table | Pending |
| TASK-004 | Create `payment_requests` table | Pending |
| TASK-005 | Create `payments` table | Pending |

### Phase 2: Security & Triggers (Priority: HIGH)

| Task | Description | Status |
|------|-------------|--------|
| TASK-006 | Enable RLS on all financial tables | Pending |
| TASK-007 | Create RLS policies for `contracts` | Pending |
| TASK-008 | Create RLS policies for `expenses` | Pending |
| TASK-009 | Create RLS policies for `payment_requests` | Pending |
| TASK-010 | Create RLS policies for `payments` | Pending |
| TASK-011 | Create lifecycle triggers for all tables | Pending |

### Phase 3: API Functions (Priority: MEDIUM)

| Task | Description | Status |
|------|-------------|--------|
| TASK-012 | Create `get_payment_request_summary` function | Pending |
| TASK-013 | Create `get_contract_summary` function | Pending |
| TASK-014 | Create `get_blueprint_financial_overview` function | Pending |

### Phase 4: Realtime & Documentation (Priority: LOW)

| Task | Description | Status |
|------|-------------|--------|
| TASK-015 | Enable realtime for financial tables | Pending |
| TASK-016 | Add documentation comments | Pending |

## 10. Future Extensibility

### 10.1 Planned Extensions

| Module | Description | Priority |
|--------|-------------|----------|
| **vendors** | Vendor management with company details, contacts, ratings | MEDIUM |
| **change_orders** | Contract change orders and amendments | MEDIUM |
| **tax** | Tax calculations and reporting | LOW |
| **retainage** | Retainage tracking for construction contracts | LOW |
| **invoices** | Invoice generation and tracking | MEDIUM |

### 10.2 Design Considerations for Extensions

1. **Vendor Module**:
   - Create `vendors` table
   - Replace `vendor_name` in `contracts` with `vendor_id` FK
   - Add vendor rating and performance tracking

2. **Change Orders**:
   - Create `change_orders` table linked to `contracts`
   - Track original vs. amended contract amounts
   - Support approval workflow

3. **Tax Module**:
   - Add `tax_rate` and `tax_amount` columns to relevant tables
   - Create tax calculation functions
   - Support multiple tax types

4. **Retainage**:
   - Add `retainage_rate` and `retainage_amount` to `contracts`
   - Track retainage releases
   - Integrate with payment workflow

## 11. Migration Strategy

### 11.1 For Existing Deployments

```sql
-- Check if financial tables exist before creating
DO $$
BEGIN
  -- Only create if tables don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    -- Execute contract table creation
  END IF;
END $$;
```

### 11.2 Rollback Plan

```sql
-- Rollback script (use with caution)
DROP FUNCTION IF EXISTS public.get_blueprint_financial_overview(UUID);
DROP FUNCTION IF EXISTS public.get_contract_summary(UUID);
DROP FUNCTION IF EXISTS public.get_payment_request_summary(UUID);
DROP FUNCTION IF EXISTS public.payment_request_lifecycle_trigger();
DROP FUNCTION IF EXISTS public.contract_lifecycle_trigger();
DROP FUNCTION IF EXISTS public.expense_lifecycle_trigger();
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_requests;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS contracts;
-- Note: Cannot remove ENUM values in PostgreSQL
```

## 12. Testing

| Test ID | Description | Type |
|---------|-------------|------|
| TEST-001 | Create contract with valid blueprint_id | Integration |
| TEST-002 | Lifecycle transition triggers logging | Integration |
| TEST-003 | RLS blocks unauthorized access | Security |
| TEST-004 | Partial payment calculations are correct | Unit |
| TEST-005 | Blueprint financial overview aggregates correctly | Integration |
| TEST-006 | Realtime updates work for payment requests | E2E |

## 13. Related Specifications

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Existing GigHub Database Schema](../supabase/seeds/init.sql)
- [ng-alain Architecture](https://ng-alain.com/)
