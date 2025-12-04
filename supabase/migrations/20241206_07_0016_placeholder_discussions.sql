-- ============================================================================
-- Migration: Discussions (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 協作溝通模組
-- ============================================================================
-- 
-- 📋 功能說明：
-- 通用討論區系統，支援實體關聯討論
--
-- 🎯 目標：
-- 1. 支援任務/問題/PR/驗收關聯討論
-- 2. 支援巢狀回覆
-- 3. 支援 @提及通知
-- 4. 支援附件
-- 5. Realtime 即時更新
--
-- 📦 計劃表結構：
-- discussions
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - entity_type: TEXT NOT NULL (關聯類型: 'task', 'issue', 'pr', 'acceptance')
--   - entity_id: UUID NOT NULL (關聯實體 ID)
--   - title: TEXT (討論標題，選填)
--   - is_resolved: BOOLEAN DEFAULT false
--   - resolved_by: UUID FK → accounts.id
--   - resolved_at: TIMESTAMPTZ
--   - reply_count: INTEGER DEFAULT 0
--   - last_reply_at: TIMESTAMPTZ
--   - created_by: UUID FK → accounts.id
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- discussion_replies
--   - id: UUID PRIMARY KEY
--   - discussion_id: UUID FK → discussions.id
--   - parent_reply_id: UUID FK → discussion_replies.id
--   - author_id: UUID FK → accounts.id
--   - content: TEXT NOT NULL
--   - mentioned_account_ids: UUID[]
--   - is_edited: BOOLEAN DEFAULT false
--   - is_deleted: BOOLEAN DEFAULT false
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 04 - Foundation Tables (accounts)
-- - 依賴 06 - Blueprint Tables (blueprints)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看與參與討論
-- - 作者可編輯/刪除自己的回覆
--
-- 📝 相關 PRD 章節：
-- - 4.9 協作溝通模組 - 討論區
-- - 10.29 GH-029: 任務討論
--
-- ⚠️ 實作注意事項：
-- 1. entity_type 使用 CHECK 約束限制允許值
-- 2. 需與通知系統整合
-- 3. Realtime 訂閱設定
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 討論主表
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'issue', 'pr', 'acceptance', 'diary', 'general')),
    entity_id UUID,  -- 關聯實體 ID，'general' 類型可為 NULL
    title TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,  -- 鎖定後無法回覆
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES accounts(id),
    resolved_at TIMESTAMPTZ,
    reply_count INTEGER NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES accounts(id),
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_entity_reference CHECK (
        (entity_type = 'general' AND entity_id IS NULL)
        OR (entity_type != 'general' AND entity_id IS NOT NULL)
    )
);

-- 2. 討論回覆表
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES accounts(id),
    content TEXT NOT NULL,
    content_html TEXT,
    mentioned_account_ids UUID[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    reaction_counts JSONB DEFAULT '{}',
    is_edited BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_solution BOOLEAN NOT NULL DEFAULT false,  -- 標記為解決方案
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 3. 建立索引
CREATE INDEX idx_discussions_blueprint ON discussions(blueprint_id);
CREATE INDEX idx_discussions_entity ON discussions(entity_type, entity_id);
CREATE INDEX idx_discussions_created ON discussions(created_at DESC);

CREATE INDEX idx_discussion_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_parent ON discussion_replies(parent_reply_id);
CREATE INDEX idx_discussion_replies_author ON discussion_replies(author_id);
CREATE INDEX idx_discussion_replies_mentions ON discussion_replies USING GIN (mentioned_account_ids);

-- 4. 啟用 RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "discussions_select" ON discussions
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "discussions_insert" ON discussions
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "discussions_update" ON discussions
    FOR UPDATE TO authenticated
    USING (
        created_by = (SELECT private.get_user_account_id())
        OR (SELECT private.can_write_blueprint(blueprint_id))
    );

CREATE POLICY "discussion_replies_select" ON discussion_replies
    FOR SELECT TO authenticated
    USING (
        NOT is_deleted
        AND (SELECT private.has_blueprint_access(
            (SELECT blueprint_id FROM discussions WHERE id = discussion_id)
        ))
    );

CREATE POLICY "discussion_replies_insert" ON discussion_replies
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT private.has_blueprint_access(
            (SELECT blueprint_id FROM discussions WHERE id = discussion_id)
        ))
        AND NOT (SELECT is_locked FROM discussions WHERE id = discussion_id)
    );

-- 5. 觸發器：更新回覆數與最後回覆時間
CREATE OR REPLACE FUNCTION private.update_discussion_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussions
        SET 
            reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id,
            updated_at = NOW()
        WHERE id = NEW.discussion_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
        UPDATE discussions
        SET 
            reply_count = reply_count - 1,
            updated_at = NOW()
        WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discussion_stats_trigger
    AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON discussion_replies
    FOR EACH ROW
    EXECUTE FUNCTION private.update_discussion_stats();
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Discussions - Placeholder Migration' AS status;
