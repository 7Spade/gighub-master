-- ============================================================================
-- Migration: Blueprint Branches (Placeholder)
-- Category: 06 - Blueprint Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🔵 Phase 2 - 未來規劃
-- ============================================================================
-- 
-- 📋 功能說明：
-- Git-like 藍圖分支系統，支援 Fork/PR 協作模式
--
-- 🎯 目標：
-- 1. 支援主分支（Main Branch）管理
-- 2. Fork 給協作組織（1:1 承攬關係）
-- 3. 組織分支建立與管理
--
-- 📦 計劃表結構：
-- blueprint_branches
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - name: TEXT NOT NULL (分支名稱，如 'main', 'feature/xxx')
--   - parent_branch_id: UUID FK → blueprint_branches.id (NULL 表示主分支)
--   - owner_account_id: UUID FK → accounts.id (分支擁有者：個人或組織)
--   - status: branch_status ENUM ('active', 'merged', 'closed', 'archived')
--   - base_commit_hash: TEXT (基於哪個提交建立)
--   - is_default: BOOLEAN DEFAULT false (是否為預設分支)
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--   - merged_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 04 - Foundation Tables (accounts)
--
-- 🔒 RLS 政策需求：
-- - 主分支擁有者可管理所有分支
-- - 協作組織只能查看與操作自己的分支
-- - 觀察者唯讀
--
-- 📝 相關 PRD 章節：
-- - 4.2 藍圖系統 - Git-like 分支系統 (Phase 2)
-- - 4.12 藍圖管理 - GH-011: Fork 藍圖給協作組織
--
-- ⚠️ 實作注意事項：
-- 1. 需要先完成藍圖核心功能
-- 2. 分支權限需與 blueprint_members 整合
-- 3. 需實作分支衝突偵測機制
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 建立分支狀態類型
DO $$ BEGIN
    CREATE TYPE public.branch_status AS ENUM (
        'active',       -- 活躍中
        'merged',       -- 已合併
        'closed',       -- 已關閉
        'archived'      -- 已封存
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. 建立分支表
CREATE TABLE IF NOT EXISTS blueprint_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_branch_id UUID REFERENCES blueprint_branches(id) ON DELETE SET NULL,
    owner_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    status public.branch_status NOT NULL DEFAULT 'active',
    base_commit_hash TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    merged_at TIMESTAMPTZ,
    merged_by UUID REFERENCES accounts(id),
    CONSTRAINT unique_branch_name_per_blueprint UNIQUE (blueprint_id, name)
);

-- 3. 建立索引
CREATE INDEX idx_blueprint_branches_blueprint_id ON blueprint_branches(blueprint_id);
CREATE INDEX idx_blueprint_branches_owner ON blueprint_branches(owner_account_id);
CREATE INDEX idx_blueprint_branches_status ON blueprint_branches(status);

-- 4. 啟用 RLS
ALTER TABLE blueprint_branches ENABLE ROW LEVEL SECURITY;

-- 5. RLS 政策
CREATE POLICY "blueprint_branches_select" ON blueprint_branches
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_branches_insert" ON blueprint_branches
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_branches_update" ON blueprint_branches
    FOR UPDATE TO authenticated
    USING (
        (SELECT private.is_blueprint_owner(blueprint_id))
        OR owner_account_id = (SELECT private.get_user_account_id())
    )
    WITH CHECK (
        (SELECT private.is_blueprint_owner(blueprint_id))
        OR owner_account_id = (SELECT private.get_user_account_id())
    );

CREATE POLICY "blueprint_branches_delete" ON blueprint_branches
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(blueprint_id)));

-- 6. 觸發器
CREATE TRIGGER update_blueprint_branches_updated_at
    BEFORE UPDATE ON blueprint_branches
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Blueprint Branches - Placeholder Migration' AS status;
