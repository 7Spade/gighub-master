-- ============================================================================
-- Migration: Blueprint Pull Requests (Placeholder)
-- Category: 06 - Blueprint Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🔵 Phase 2 - 未來規劃
-- ============================================================================
-- 
-- 📋 功能說明：
-- Pull Request 系統，用於分支合併審核
--
-- 🎯 目標：
-- 1. Pull Request 提交與審核
-- 2. PR 合併與衝突解決
-- 3. PR 討論與評論
--
-- 📦 計劃表結構：
-- blueprint_pull_requests
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - source_branch_id: UUID FK → blueprint_branches.id (來源分支)
--   - target_branch_id: UUID FK → blueprint_branches.id (目標分支)
--   - title: TEXT NOT NULL
--   - description: TEXT
--   - status: pr_status ENUM ('draft', 'open', 'reviewing', 'approved', 'merged', 'closed')
--   - created_by: UUID FK → accounts.id
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--   - merged_at: TIMESTAMPTZ
--   - merged_by: UUID FK → accounts.id
--
-- blueprint_pull_request_reviews
--   - id: UUID PRIMARY KEY
--   - pull_request_id: UUID FK → blueprint_pull_requests.id
--   - reviewer_id: UUID FK → accounts.id
--   - status: review_status ENUM ('pending', 'approved', 'changes_requested', 'commented')
--   - comment: TEXT
--   - created_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 blueprint_branches 表
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 04 - Foundation Tables (accounts)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看 PR
-- - 分支擁有者可建立 PR
-- - 目標分支擁有者可審核/合併
--
-- 📝 相關 PRD 章節：
-- - 4.2 藍圖系統 - Pull Request 提交與審核
-- - 4.12 藍圖管理 - GH-012: 提交 Pull Request
--
-- ⚠️ 實作注意事項：
-- 1. 需要先完成 blueprint_branches 表
-- 2. PR 合併需實作衝突偵測與解決機制
-- 3. 需與通知系統整合
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 建立 PR 狀態類型
DO $$ BEGIN
    CREATE TYPE public.pr_status AS ENUM (
        'draft',        -- 草稿
        'open',         -- 開啟中
        'reviewing',    -- 審核中
        'approved',     -- 已批准
        'merged',       -- 已合併
        'closed'        -- 已關閉
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.review_status AS ENUM (
        'pending',              -- 待審核
        'approved',             -- 已批准
        'changes_requested',    -- 要求修改
        'commented'             -- 已評論
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. 建立 PR 主表
CREATE TABLE IF NOT EXISTS blueprint_pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    source_branch_id UUID NOT NULL REFERENCES blueprint_branches(id) ON DELETE CASCADE,
    target_branch_id UUID NOT NULL REFERENCES blueprint_branches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.pr_status NOT NULL DEFAULT 'draft',
    is_mergeable BOOLEAN DEFAULT true,
    conflict_files JSONB,  -- 衝突檔案清單
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    merged_at TIMESTAMPTZ,
    merged_by UUID REFERENCES accounts(id),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES accounts(id),
    CONSTRAINT different_branches CHECK (source_branch_id != target_branch_id)
);

-- 3. 建立 PR 審核表
CREATE TABLE IF NOT EXISTS blueprint_pull_request_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pull_request_id UUID NOT NULL REFERENCES blueprint_pull_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES accounts(id),
    status public.review_status NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_reviewer_per_pr UNIQUE (pull_request_id, reviewer_id)
);

-- 4. 建立索引
CREATE INDEX idx_pull_requests_blueprint_id ON blueprint_pull_requests(blueprint_id);
CREATE INDEX idx_pull_requests_status ON blueprint_pull_requests(status);
CREATE INDEX idx_pull_requests_source ON blueprint_pull_requests(source_branch_id);
CREATE INDEX idx_pull_requests_target ON blueprint_pull_requests(target_branch_id);
CREATE INDEX idx_pr_reviews_pr_id ON blueprint_pull_request_reviews(pull_request_id);

-- 5. 啟用 RLS
ALTER TABLE blueprint_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_pull_request_reviews ENABLE ROW LEVEL SECURITY;

-- RLS 政策略...
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Blueprint Pull Requests - Placeholder Migration' AS status;
