-- ============================================================================
-- Migration: Task Comments (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟡 高 - 任務系統達標後實現
-- ============================================================================
-- 
-- 📋 功能說明：
-- 任務討論與評論系統
--
-- 🎯 目標：
-- 1. 支援任務內討論
-- 2. 支援巢狀回覆
-- 3. 支援 @提及通知
-- 4. 支援附件
--
-- 📦 計劃表結構：
-- task_comments
--   - id: UUID PRIMARY KEY
--   - task_id: UUID FK → tasks.id
--   - parent_comment_id: UUID FK → task_comments.id (NULL 表示頂層評論)
--   - author_id: UUID FK → accounts.id
--   - content: TEXT NOT NULL
--   - mentioned_account_ids: UUID[] (被 @ 提及的帳號)
--   - is_edited: BOOLEAN DEFAULT false
--   - is_deleted: BOOLEAN DEFAULT false (軟刪除)
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--   - deleted_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 07 - Module Tables (tasks)
-- - 依賴 04 - Foundation Tables (accounts)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看與建立評論
-- - 作者可編輯/刪除自己的評論
-- - 專案經理可刪除任何評論
--
-- 📝 相關 PRD 章節：
-- - 4.3 任務系統 - 任務評論與討論
-- - 4.9 協作溝通模組 - GH-029: 任務討論
--
-- ⚠️ 實作注意事項：
-- 1. 巢狀回覆建議限制層級（如 3 層）
-- 2. @提及需觸發通知
-- 3. 需與 Realtime 整合實現即時更新
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES accounts(id),
    content TEXT NOT NULL,
    content_html TEXT,  -- 渲染後的 HTML（含 @ 連結）
    mentioned_account_ids UUID[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',  -- [{name, url, type, size}]
    reaction_counts JSONB DEFAULT '{}',  -- {👍: 3, ❤️: 1}
    is_edited BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    reply_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 建立索引
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX idx_task_comments_author ON task_comments(author_id);
CREATE INDEX idx_task_comments_created ON task_comments(created_at DESC);
CREATE INDEX idx_task_comments_mentions ON task_comments USING GIN (mentioned_account_ids);

-- 啟用 RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "task_comments_select" ON task_comments
    FOR SELECT TO authenticated
    USING (
        NOT is_deleted
        AND (SELECT private.has_blueprint_access(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    );

CREATE POLICY "task_comments_insert" ON task_comments
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.has_blueprint_access(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

CREATE POLICY "task_comments_update" ON task_comments
    FOR UPDATE TO authenticated
    USING (author_id = (SELECT private.get_user_account_id()))
    WITH CHECK (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "task_comments_delete" ON task_comments
    FOR DELETE TO authenticated
    USING (
        author_id = (SELECT private.get_user_account_id())
        OR (SELECT private.is_blueprint_owner(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    );

-- 觸發器：更新父評論回覆數
CREATE OR REPLACE FUNCTION private.update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
        UPDATE task_comments
        SET reply_count = reply_count + 1
        WHERE id = NEW.parent_comment_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
        UPDATE task_comments
        SET reply_count = reply_count - 1
        WHERE id = OLD.parent_comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reply_count
    AFTER INSERT OR DELETE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION private.update_comment_reply_count();
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Task Comments - Placeholder Migration' AS status;
