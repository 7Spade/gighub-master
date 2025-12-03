-- ============================================================================
-- Migration: Create Documentation for New Infrastructure
-- Description: PART 16 - 新基礎設施文件註解
-- Created: 2024-12-01
-- ============================================================================

-- PART 16: DOCUMENTATION FOR NEW INFRASTRUCTURE (新基礎設施文件註解)
-- ############################################################################

-- 容器層基礎設施資料表註解
COMMENT ON TABLE blueprint_configs IS '藍圖配置 - Blueprint-level configuration management';
COMMENT ON TABLE activities IS '活動時間軸 - Cross-module activity tracking';
COMMENT ON TABLE events IS '事件表 - Event bus for inter-module communication';
COMMENT ON TABLE event_subscriptions IS '事件訂閱 - Event subscription management';
COMMENT ON TABLE entity_references IS '實體引用 - Cross-module resource references';
COMMENT ON TABLE custom_field_definitions IS '自訂欄位定義 - Custom field definitions per entity type';
COMMENT ON TABLE custom_field_values IS '自訂欄位值 - Custom field values for entities';
COMMENT ON TABLE lifecycle_transitions IS '生命週期轉換 - State transition history';
COMMENT ON TABLE search_index IS '搜尋索引 - Full-text search index';
COMMENT ON TABLE files IS '檔案 - File management system';
COMMENT ON TABLE file_shares IS '檔案分享 - File sharing management';
COMMENT ON TABLE notification_preferences IS '通知偏好 - User notification preferences';

-- 容器層基礎設施函數註解
COMMENT ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB) IS '記錄活動 - Log activity to timeline';
COMMENT ON FUNCTION public.publish_event(VARCHAR, JSONB, UUID, VARCHAR, TIMESTAMPTZ) IS '發布事件 - Publish event to event bus';
COMMENT ON FUNCTION public.search_blueprint(UUID, TEXT, entity_type[], INTEGER, INTEGER) IS '搜尋藍圖 - Full-text search within blueprint';
COMMENT ON FUNCTION public.get_blueprint_context(UUID) IS '取得藍圖上下文 - Get complete blueprint context';
COMMENT ON FUNCTION public.get_user_blueprints() IS '取得用戶藍圖 - Get all blueprints accessible to user';
COMMENT ON FUNCTION public.get_blueprint_stats(UUID) IS '取得藍圖統計 - Get blueprint statistics';
COMMENT ON FUNCTION public.send_notification(UUID, UUID, VARCHAR, TEXT, notification_type, entity_type, UUID, TEXT, JSONB) IS '發送通知 - Send notification to user';
COMMENT ON FUNCTION public.update_search_vector() IS '更新搜尋向量 - Trigger function to update search vector';

-- 類型註解
COMMENT ON TYPE blueprint_config_type IS '配置類型 - Types of blueprint configurations';
COMMENT ON TYPE activity_type IS '活動類型 - Types of activity log entries';
COMMENT ON TYPE entity_type IS '實體類型 - Types of entities in the system';
COMMENT ON TYPE event_status IS '事件狀態 - Status of events in event bus';
COMMENT ON TYPE reference_type IS '引用類型 - Types of cross-module references';
COMMENT ON TYPE custom_field_type IS '自訂欄位類型 - Types of custom fields';
COMMENT ON TYPE blueprint_lifecycle IS '藍圖生命週期 - Lifecycle states of blueprints';
COMMENT ON TYPE file_status IS '檔案狀態 - Status of files';
COMMENT ON TYPE notification_type IS '通知類型 - Types of notifications';
COMMENT ON TYPE notification_channel IS '通知渠道 - Channels for sending notifications';

