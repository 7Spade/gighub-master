-- ============================================================================
-- Migration: Create Realtime Configuration
-- Description: PART 18 - 即時配置 (Realtime Channels)
-- Created: 2024-12-01
-- ============================================================================

-- PART 18: REALTIME CONFIGURATION (即時配置)
-- ############################################################################

-- 啟用 Realtime 訂閱
-- 注意：這需要 Supabase Realtime 設定

-- 為需要即時更新的資料表啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE diaries;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE blueprint_members;

-- ############################################################################
-- END OF INIT.SQL
-- ############################################################################

