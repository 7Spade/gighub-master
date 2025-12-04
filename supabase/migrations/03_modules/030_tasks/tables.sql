-- ============================================================================
-- Migration: 030_tasks/tables
-- Layer: 03_modules
-- Description: 任務模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: tasks (任務)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint ON tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_not_deleted ON tasks(blueprint_id, status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: task_attachments (任務附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: task_acceptances (任務驗收)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  result acceptance_result NOT NULL DEFAULT 'pending',
  notes TEXT,
  accepted_by UUID REFERENCES accounts(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_acceptances_task ON task_acceptances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_result ON task_acceptances(result);

-- Enable RLS
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: todos (待辦事項)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  priority task_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_todos_blueprint ON todos(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_todos_account ON todos(account_id);
CREATE INDEX IF NOT EXISTS idx_todos_task ON todos(task_id);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS todos CASCADE;
-- DROP TABLE IF EXISTS task_acceptances CASCADE;
-- DROP TABLE IF EXISTS task_attachments CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
