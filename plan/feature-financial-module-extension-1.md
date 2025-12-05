---
goal: Extend Database Schema for Financial Module (Contracts, Expenses, Payments)
version: 1.0
date_created: 2025-12-02
last_updated: 2025-12-02
owner: Development Team
status: 'Reviewed'
tags: ['feature', 'database', 'supabase', 'financial', 'contracts', 'payments', 'expenses']
---

# Financial Module Database Extension Plan

![Status: Reviewed](https://img.shields.io/badge/status-Reviewed-green)

This plan describes how to extend the existing GigHub database schema in `supabase/seeds/init.sql` to support comprehensive financial management, including contracts, expenses, payment requests, and payments.

---

## Analysis Summary

**分析日期**: 2024-12-02  
**Migration 檔案**: `supabase/migrations/20241202104900_add_financial_extension.sql`

### ✅ 整體適用性評估：**適用於本專案未來擴展**

財務模組擴展設計遵循了 GigHub 專案的核心架構原則：
1. **Blueprint 為核心** - 所有財務表都帶有 `blueprint_id`
2. **權限沿用** - 使用現有 `private.has_blueprint_access` 和 `private.can_write_blueprint` 函數
3. **生命週期管理** - 沿用 `blueprint_lifecycle` enum 和 `lifecycle_transitions` 表
4. **RLS 政策一致** - 遵循專案既有的 RLS 模式

### 與 init.sql 銜接確認

| 銜接項目 | 狀態 | 說明 |
|----------|------|------|
| `entity_type` ENUM | ✅ | 正確使用 `ALTER TYPE ... ADD VALUE IF NOT EXISTS` |
| `blueprint_lifecycle` ENUM | ✅ | 正確引用 |
| `private.has_blueprint_access()` | ✅ | RLS 政策正確使用 |
| `private.can_write_blueprint()` | ✅ | RLS 政策正確使用 |
| `public.update_updated_at()` | ✅ | 觸發器正確使用 |
| `lifecycle_transitions` 表 | ✅ | 觸發器正確插入 |
| `accounts` 表引用 | ✅ | FK 關係正確 |
| `blueprints` 表引用 | ✅ | FK 關係正確 |

---

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
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'contract';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'expense';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'payment_request';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'payment';

-- 2. Create financial tables
-- (Details in sections below)
```

### 3.2 Table: `contracts` (合約 / 預算起點)

**Purpose**: Track contracts and budgets for construction projects.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,                     -- 合約名稱 (必填)
  contract_number VARCHAR(100),                    -- 合約編號
  description TEXT,                                -- 合約說明
  vendor_name TEXT,                                -- 廠商名稱 (可擴展為 vendor_id)
  contract_amount NUMERIC(18,2) NOT NULL,          -- 合約金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  start_date DATE,                                 -- 合約開始日
  end_date DATE,                                   -- 合約結束日
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',  -- 生命週期
  metadata JSONB DEFAULT '{}'::jsonb,              -- 擴展欄位
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contracts_blueprint ON contracts(blueprint_id);
CREATE INDEX idx_contracts_lifecycle ON contracts(lifecycle);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_name);
```

### 3.3 Table: `expenses` (成本實際投入紀錄)

**Purpose**: Track actual expenses/costs against contracts and blueprints.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                             -- 支出項目名稱
  description TEXT,                                -- 支出說明
  category VARCHAR(100),                           -- 分類
  amount NUMERIC(18,2) NOT NULL,                   -- 支出金額
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  expense_date DATE NOT NULL,                      -- 支出日期
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_expenses_blueprint ON expenses(blueprint_id);
CREATE INDEX idx_expenses_contract ON expenses(contract_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 3.4 Table: `payment_requests` (請款單)

**Purpose**: Manage payment request workflow with lifecycle states.

> **⚠️ 實際實現與設計差異說明**:
> - 實際資料庫使用 `amount` 而非 `requested_amount`
> - `requester_id`, `approver_id`, `approved_at` 欄位未實現，改用 `metadata` JSONB 欄位存儲

```sql
-- 設計規格（未完全實現）
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  request_number VARCHAR(100),                     -- 請款單編號
  title TEXT NOT NULL,                             -- 請款說明
  description TEXT,                                -- 詳細說明
  amount NUMERIC(18,2) NOT NULL,                   -- 請款金額 (實際: amount)
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  request_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 請款日期
  due_date DATE,                                   -- 預計付款日
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  -- 以下欄位未實現，使用 metadata 替代:
  -- requester_id UUID REFERENCES accounts(id),    -- 請款人 (未實現)
  -- approver_id UUID REFERENCES accounts(id),     -- 審核人 (未實現)
  -- approved_at TIMESTAMPTZ,                      -- 審核時間 (未實現, 使用 metadata.approved_at)
  metadata JSONB DEFAULT '{}'::jsonb,              -- 擴展欄位 (存儲 approved_at, requester_id 等)
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_payment_requests_blueprint ON payment_requests(blueprint_id);
CREATE INDEX idx_payment_requests_contract ON payment_requests(contract_id);
CREATE INDEX idx_payment_requests_lifecycle ON payment_requests(lifecycle);
CREATE INDEX idx_payment_requests_request_date ON payment_requests(request_date);
CREATE INDEX idx_payment_requests_due_date ON payment_requests(due_date);
```

### 3.5 Table: `payments` (實際付款紀錄)

**Purpose**: Record individual payments against payment requests.

> **⚠️ 實際實現與設計差異說明**:
> - 實際資料庫使用 `amount` 而非 `paid_amount`
> - 實際資料庫使用 `payment_date` 而非 `paid_at`
> - 實際資料庫包含 `lifecycle` 和 `deleted_at` 欄位

```sql
-- 實際實現版本
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE, -- 可選
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,              -- 新增: 關聯合約
  payment_number VARCHAR(100),                     -- 付款編號
  amount NUMERIC(18,2) NOT NULL,                   -- 付款金額 (實際: amount)
  currency VARCHAR(3) DEFAULT 'TWD',               -- 幣別
  payment_date DATE NOT NULL,                      -- 付款日期 (實際: payment_date)
  payment_method VARCHAR(50),                      -- 付款方式
  reference_number VARCHAR(100),                   -- 參考編號
  notes TEXT,                                      -- 備註
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active', -- 新增: 生命週期
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ                           -- 新增: 軟刪除
);

-- Indexes
CREATE INDEX idx_payments_payment_request ON payments(payment_request_id);
CREATE INDEX idx_payments_blueprint ON payments(blueprint_id);
```

## 4. RLS Policies

All tables use existing helper functions for consistent access control:

```sql
-- Example for contracts (same pattern for all tables)
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
```

## 5. Lifecycle Triggers

### 5.1 Contract Lifecycle Trigger

```sql
CREATE OR REPLACE FUNCTION contract_lifecycle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    INSERT INTO lifecycle_transitions (
      blueprint_id, entity_type, entity_id, from_status, to_status,
      reason, metadata, transitioned_by, created_at
    ) VALUES (
      NEW.blueprint_id, 'contract'::entity_type, NEW.id,
      OLD.lifecycle::text, NEW.lifecycle::text, NULL,
      jsonb_build_object('contract_number', NEW.contract_number, 
                         'title', NEW.title,
                         'contract_amount', NEW.contract_amount),
      auth.uid(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER contract_lifecycle_change
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (OLD.lifecycle IS DISTINCT FROM NEW.lifecycle)
  EXECUTE FUNCTION contract_lifecycle_trigger();
```

### 5.2 Payment Request Lifecycle Trigger

```sql
CREATE OR REPLACE FUNCTION payment_request_lifecycle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    INSERT INTO lifecycle_transitions (
      blueprint_id, entity_type, entity_id, from_status, to_status,
      reason, metadata, transitioned_by, created_at
    ) VALUES (
      NEW.blueprint_id, 'payment_request'::entity_type, NEW.id,
      OLD.lifecycle::text, NEW.lifecycle::text, NULL,
      jsonb_build_object('request_number', NEW.request_number, 
                         'requested_amount', NEW.requested_amount),
      auth.uid(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER payment_request_lifecycle_change
  AFTER UPDATE ON payment_requests
  FOR EACH ROW
  WHEN (OLD.lifecycle IS DISTINCT FROM NEW.lifecycle)
  EXECUTE FUNCTION payment_request_lifecycle_trigger();
```

## 6. Helper Functions

### 6.1 Get Contract Summary

```sql
CREATE OR REPLACE FUNCTION public.get_contract_summary(p_contract_id UUID)
RETURNS TABLE (
  contract_id UUID,
  contract_amount NUMERIC(18,2),
  total_expenses NUMERIC(18,2),
  total_requested NUMERIC(18,2),
  total_paid NUMERIC(18,2),
  remaining_amount NUMERIC(18,2)
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

### 6.2 Get Blueprint Financial Summary

```sql
CREATE OR REPLACE FUNCTION public.get_blueprint_financial_summary(p_blueprint_id UUID)
RETURNS TABLE (
  blueprint_id UUID,
  total_contract_amount NUMERIC(18,2),
  total_expenses NUMERIC(18,2),
  total_requested NUMERIC(18,2),
  total_paid NUMERIC(18,2),
  pending_payment_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

## 7. Realtime Configuration

```sql
-- Enable realtime for financial tables
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
```

## 8. Implementation Phases

### Phase 1: Schema Creation (Priority: HIGH)

| Task | Description | Status |
|------|-------------|--------|
| TASK-001 | Extend `entity_type` ENUM with financial types | ✅ Done |
| TASK-002 | Create `contracts` table with lifecycle | ✅ Done |
| TASK-003 | Create `expenses` table | ✅ Done |
| TASK-004 | Create `payment_requests` table with lifecycle | ✅ Done |
| TASK-005 | Create `payments` table | ✅ Done |

### Phase 2: Security & Triggers (Priority: HIGH)

| Task | Description | Status |
|------|-------------|--------|
| TASK-006 | Enable RLS on all financial tables | ✅ Done |
| TASK-007 | Create RLS policies for all tables | ✅ Done |
| TASK-008 | Create contract lifecycle trigger | ✅ Done |
| TASK-009 | Create payment_request lifecycle trigger | ✅ Done |

### Phase 3: API Functions & Realtime (Priority: MEDIUM)

| Task | Description | Status |
|------|-------------|--------|
| TASK-010 | Create `get_contract_summary` function | ✅ Done |
| TASK-011 | Create `get_blueprint_financial_summary` function | ✅ Done |
| TASK-012 | Enable realtime for financial tables | ✅ Done |

## 8.1 已實現功能清單 (Implemented Features)

> **✅ 以下功能已於 2025-12-05 實現到資料庫中：**

| Feature | 設計欄位 | 實際狀態 | 說明 |
|---------|----------|----------|------|
| 請款人追蹤 | `payment_requests.requester_id` | ✅ 已實現 | 參照 `accounts(id)` |
| 審核人追蹤 | `payment_requests.approver_id` | ✅ 已實現 | 參照 `accounts(id)` |
| 審核時間 | `payment_requests.approved_at` | ✅ 已實現 | `TIMESTAMPTZ` 類型 |
| 拒絕時間 | `payment_requests.rejected_at` | ✅ 已實現 | `TIMESTAMPTZ` 類型 |
| 拒絕原因 | `payment_requests.rejection_reason` | ✅ 已實現 | `TEXT` 類型 |
| 收據編號 | `expenses.receipt_number` | ✅ 已實現 | `VARCHAR(100)` 類型 |

### 遷移檔案 (Migration Files)

```sql
-- 20251205170000_17_0005_add_payment_request_approval_fields.sql
-- 新增請款單審核流程欄位
ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 20251205170001_17_0006_add_expense_receipt_number.sql
-- 新增費用收據編號欄位
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
```

## 9. Future Extensibility

### 9.1 Planned Extensions

| Module | Description | Priority |
|--------|-------------|----------|
| **vendors** | Vendor management with company details, contacts, ratings | MEDIUM |
| **change_orders** | Contract change orders and amendments | MEDIUM |
| **tax** | Tax calculations and reporting | LOW |
| **retainage** | Retainage tracking for construction contracts | LOW |
| **invoices** | Invoice generation and tracking | MEDIUM |

### 9.2 Design Considerations for Extensions

1. **Vendor Module**: Create `vendors` table, replace `vendor_name` with `vendor_id` FK
2. **Change Orders**: Create `change_orders` table linked to `contracts`
3. **Tax Module**: Add `tax_rate` and `tax_amount` columns to relevant tables
4. **Retainage**: Add `retainage_rate` and `retainage_amount` to `contracts`

## 10. Related Specifications

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Existing GigHub Database Schema](../supabase/seeds/init.sql)
- [ng-alain Architecture](https://ng-alain.com/)

---

*文件更新於 2024-12-02*
