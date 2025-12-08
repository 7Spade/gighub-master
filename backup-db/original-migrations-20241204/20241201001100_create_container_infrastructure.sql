-- ============================================================================
-- Migration: Create Container Layer Infrastructure
-- Description: PART 15 - 容器層核心基礎設施 (12 項)
-- Created: 2024-12-01
-- ============================================================================

-- PART 15: CONTAINER LAYER INFRASTRUCTURE (容器層核心基礎設施)
-- ############################################################################
-- 根據 architecture-rules.md 定義的 12 項核心基礎設施

-- ============================================================================
-- 15.1: BLUEPRINT CONFIGURATIONS (藍圖配置中心)
-- 藍圖級別配置管理
-- ============================================================================

-- 配置類型
CREATE TYPE blueprint_config_type AS ENUM (
  'general',           -- 一般設定
  'notification',      -- 通知設定
  'workflow',          -- 工作流程設定
  'display',           -- 顯示設定
  'integration',       -- 整合設定
  'permission'         -- 權限設定
);

-- 藍圖配置表
CREATE TABLE blueprint_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  config_type blueprint_config_type NOT NULL DEFAULT 'general',
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_configs_unique UNIQUE (blueprint_id, config_type, key)
);

CREATE INDEX idx_blueprint_configs_blueprint ON blueprint_configs(blueprint_id);
CREATE INDEX idx_blueprint_configs_type ON blueprint_configs(config_type);

-- 觸發器
CREATE TRIGGER update_blueprint_configs_updated_at 
  BEFORE UPDATE ON blueprint_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE blueprint_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprint_configs_select" ON blueprint_configs 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_configs_insert" ON blueprint_configs 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_update" ON blueprint_configs 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_delete" ON blueprint_configs 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)) AND is_system = false);

-- ============================================================================
-- 15.2: ACTIVITY TIMELINE (時間軸服務)
-- 跨模組活動追蹤
-- ============================================================================

-- 活動類型
CREATE TYPE activity_type AS ENUM (
  'create',            -- 建立
  'update',            -- 更新
  'delete',            -- 刪除
  'comment',           -- 評論
  'assign',            -- 指派
  'status_change',     -- 狀態變更
  'attachment',        -- 附件操作
  'approval',          -- 審核
  'mention',           -- 提及
  'share',             -- 分享
  'move',              -- 移動
  'archive',           -- 封存
  'restore'            -- 還原
);

-- 實體類型
CREATE TYPE entity_type AS ENUM (
  'blueprint',
  'task',
  'diary',
  'checklist',
  'checklist_item',
  'issue',
  'todo',
  'file',
  'acceptance',
  'comment'
);

-- 活動時間軸表
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  actor_id UUID REFERENCES accounts(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_blueprint ON activities(blueprint_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_actor ON activities(actor_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_blueprint_created ON activities(blueprint_id, created_at DESC);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "activities_insert" ON activities 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

-- 記錄活動函數
CREATE OR REPLACE FUNCTION public.log_activity(
  p_blueprint_id UUID,
  p_entity_type entity_type,
  p_entity_id UUID,
  p_activity_type activity_type,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_activity_id UUID;
  v_actor_id UUID;
BEGIN
  v_actor_id := (SELECT private.get_user_account_id());
  
  INSERT INTO public.activities (
    blueprint_id,
    entity_type,
    entity_id,
    activity_type,
    actor_id,
    metadata,
    old_value,
    new_value
  )
  VALUES (
    p_blueprint_id,
    p_entity_type,
    p_entity_id,
    p_activity_type,
    v_actor_id,
    p_metadata,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB) TO authenticated;

-- ============================================================================
-- 15.3: EVENT BUS (事件總線)
-- 模組間解耦通訊
-- ============================================================================

-- 事件狀態
CREATE TYPE event_status AS ENUM (
  'pending',           -- 待處理
  'processing',        -- 處理中
  'completed',         -- 已完成
  'failed',            -- 失敗
  'cancelled'          -- 已取消
);

-- 事件表
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(100),
  status event_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_blueprint ON events(blueprint_id);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_scheduled ON events(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_events_created ON events(created_at DESC);

-- 事件訂閱表
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  handler_name VARCHAR(255) NOT NULL,
  filter_conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT event_subscriptions_unique UNIQUE (blueprint_id, event_name, handler_name)
);

CREATE INDEX idx_event_subscriptions_blueprint ON event_subscriptions(blueprint_id);
CREATE INDEX idx_event_subscriptions_event ON event_subscriptions(event_name);
CREATE INDEX idx_event_subscriptions_active ON event_subscriptions(is_active) WHERE is_active = true;

-- 觸發器
CREATE TRIGGER update_event_subscriptions_updated_at 
  BEFORE UPDATE ON event_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events 
  FOR SELECT TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "events_insert" ON events 
  FOR INSERT TO authenticated 
  WITH CHECK (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "event_subscriptions_select" ON event_subscriptions 
  FOR SELECT TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "event_subscriptions_insert" ON event_subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "event_subscriptions_update" ON event_subscriptions 
  FOR UPDATE TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "event_subscriptions_delete" ON event_subscriptions 
  FOR DELETE TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

-- 發布事件函數
CREATE OR REPLACE FUNCTION public.publish_event(
  p_event_name VARCHAR(255),
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_blueprint_id UUID DEFAULT NULL,
  p_source VARCHAR(100) DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.events (
    blueprint_id,
    event_name,
    payload,
    source,
    scheduled_at,
    status
  )
  VALUES (
    p_blueprint_id,
    p_event_name,
    p_payload,
    p_source,
    COALESCE(p_scheduled_at, now()),
    CASE WHEN p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN 'pending' ELSE 'pending' END
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_event(VARCHAR, JSONB, UUID, VARCHAR, TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- 15.4: CROSS-MODULE REFERENCES (關聯管理)
-- 跨模組資源引用
-- ============================================================================

-- 引用類型
CREATE TYPE reference_type AS ENUM (
  'link',              -- 連結
  'parent',            -- 父子關係
  'related',           -- 相關
  'blocks',            -- 阻擋
  'blocked_by',        -- 被阻擋
  'duplicates',        -- 重複
  'duplicate_of'       -- 重複自
);

-- 跨模組引用表
CREATE TABLE entity_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  source_type entity_type NOT NULL,
  source_id UUID NOT NULL,
  target_type entity_type NOT NULL,
  target_id UUID NOT NULL,
  reference_type reference_type NOT NULL DEFAULT 'related',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT entity_references_unique UNIQUE (blueprint_id, source_type, source_id, target_type, target_id, reference_type)
);

CREATE INDEX idx_entity_references_blueprint ON entity_references(blueprint_id);
CREATE INDEX idx_entity_references_source ON entity_references(source_type, source_id);
CREATE INDEX idx_entity_references_target ON entity_references(target_type, target_id);
CREATE INDEX idx_entity_references_type ON entity_references(reference_type);

-- RLS
ALTER TABLE entity_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_references_select" ON entity_references 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "entity_references_insert" ON entity_references 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "entity_references_delete" ON entity_references 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- 15.5: METADATA SYSTEM (元數據系統)
-- 自訂欄位支援
-- ============================================================================

-- 欄位類型
CREATE TYPE custom_field_type AS ENUM (
  'text',              -- 文字
  'number',            -- 數字
  'date',              -- 日期
  'datetime',          -- 日期時間
  'boolean',           -- 布林值
  'select',            -- 單選
  'multiselect',       -- 多選
  'user',              -- 用戶
  'url',               -- 連結
  'email',             -- 電子郵件
  'phone',             -- 電話
  'currency',          -- 貨幣
  'percentage',        -- 百分比
  'file',              -- 檔案
  'formula'            -- 公式
);

-- 自訂欄位定義表
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  field_type custom_field_type NOT NULL,
  description TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  default_value JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_definitions_unique UNIQUE (blueprint_id, entity_type, name)
);

CREATE INDEX idx_custom_field_definitions_blueprint ON custom_field_definitions(blueprint_id);
CREATE INDEX idx_custom_field_definitions_entity ON custom_field_definitions(entity_type);

-- 自訂欄位值表
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_values_unique UNIQUE (field_definition_id, entity_type, entity_id)
);

CREATE INDEX idx_custom_field_values_blueprint ON custom_field_values(blueprint_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_definition_id);

-- 觸發器
CREATE TRIGGER update_custom_field_definitions_updated_at 
  BEFORE UPDATE ON custom_field_definitions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_field_values_updated_at 
  BEFORE UPDATE ON custom_field_values 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_field_definitions_select" ON custom_field_definitions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_definitions_insert" ON custom_field_definitions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_definitions_update" ON custom_field_definitions 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_definitions_delete" ON custom_field_definitions 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)) AND is_system = false);

CREATE POLICY "custom_field_values_select" ON custom_field_values 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_insert" ON custom_field_values 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_update" ON custom_field_values 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_delete" ON custom_field_values 
  FOR DELETE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- ============================================================================
-- 15.6: LIFECYCLE MANAGEMENT (生命週期管理)
-- 狀態機支援
-- ============================================================================

-- 藍圖生命週期狀態
CREATE TYPE blueprint_lifecycle AS ENUM (
  'draft',             -- 草稿
  'active',            -- 啟用中
  'on_hold',           -- 暫停
  'archived',          -- 已封存
  'deleted'            -- 已刪除
);

-- 增加 lifecycle 欄位到 blueprints (使用 ALTER TABLE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blueprints' AND column_name = 'lifecycle'
  ) THEN
    ALTER TABLE blueprints ADD COLUMN lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blueprints_lifecycle ON blueprints(lifecycle);

-- 狀態轉換歷史表
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  from_status VARCHAR(100),
  to_status VARCHAR(100) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  transitioned_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifecycle_transitions_blueprint ON lifecycle_transitions(blueprint_id);
CREATE INDEX idx_lifecycle_transitions_entity ON lifecycle_transitions(entity_type, entity_id);
CREATE INDEX idx_lifecycle_transitions_created ON lifecycle_transitions(created_at DESC);

-- RLS
ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lifecycle_transitions_select" ON lifecycle_transitions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "lifecycle_transitions_insert" ON lifecycle_transitions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

-- ============================================================================
-- 15.7: SEARCH INFRASTRUCTURE (搜尋引擎基礎設施)
-- 全文檢索支援
-- ============================================================================

-- 搜尋索引表
CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT search_index_unique UNIQUE (blueprint_id, entity_type, entity_id)
);

CREATE INDEX idx_search_index_blueprint ON search_index(blueprint_id);
CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_index_title ON search_index USING GIN(to_tsvector('simple', title));

-- 觸發器：自動更新搜尋向量
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
                       setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_search_index_vector
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- RLS
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_index_select" ON search_index 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_insert" ON search_index 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_update" ON search_index 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_delete" ON search_index 
  FOR DELETE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 搜尋函數
CREATE OR REPLACE FUNCTION public.search_blueprint(
  p_blueprint_id UUID,
  p_query TEXT,
  p_entity_types entity_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type entity_type,
  entity_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;

  RETURN QUERY
  SELECT 
    si.entity_type,
    si.entity_id,
    si.title,
    si.content,
    si.metadata,
    ts_rank(si.search_vector, plainto_tsquery('simple', p_query)) AS rank
  FROM public.search_index si
  WHERE si.blueprint_id = p_blueprint_id
    AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
    AND si.search_vector @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_blueprint(UUID, TEXT, entity_type[], INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- 15.8: FILES MANAGEMENT (檔案管理)
-- 檔案系統支援
-- ============================================================================

-- 檔案狀態
CREATE TYPE file_status AS ENUM (
  'pending',           -- 上傳中
  'active',            -- 有效
  'archived',          -- 已封存
  'deleted'            -- 已刪除
);

-- 檔案表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  display_name VARCHAR(500),
  mime_type VARCHAR(255),
  file_size BIGINT,
  checksum VARCHAR(64),
  status file_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  parent_folder_id UUID REFERENCES files(id) ON DELETE SET NULL,
  is_folder BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_files_blueprint ON files(blueprint_id);
CREATE INDEX idx_files_parent ON files(parent_folder_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_mime ON files(mime_type);
CREATE INDEX idx_files_folder ON files(is_folder);

-- 檔案分享表
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_with_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  share_link VARCHAR(100) UNIQUE,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT file_shares_recipient CHECK (
    (shared_with_account_id IS NOT NULL AND shared_with_team_id IS NULL) OR
    (shared_with_account_id IS NULL AND shared_with_team_id IS NOT NULL) OR
    (share_link IS NOT NULL)
  )
);

CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_account ON file_shares(shared_with_account_id);
CREATE INDEX idx_file_shares_team ON file_shares(shared_with_team_id);
CREATE INDEX idx_file_shares_link ON file_shares(share_link);

-- 觸發器
CREATE TRIGGER update_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select" ON files 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "files_insert" ON files 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "files_update" ON files 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "files_delete" ON files 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "file_shares_select" ON file_shares 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.has_blueprint_access(f.blueprint_id))
    )
  );

CREATE POLICY "file_shares_insert" ON file_shares 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.can_write_blueprint(f.blueprint_id))
    )
  );

CREATE POLICY "file_shares_delete" ON file_shares 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.can_write_blueprint(f.blueprint_id))
    )
  );

-- ============================================================================
-- 15.9: PERMISSION VIEWS (權限系統視圖)
-- RBAC 輔助視圖
-- ============================================================================

-- 用戶權限視圖
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  a.id AS account_id,
  a.auth_user_id,
  b.id AS blueprint_id,
  b.name AS blueprint_name,
  bm.role AS member_role,
  bm.business_role,
  br.name AS custom_role_name,
  br.permissions AS custom_permissions,
  CASE 
    WHEN b.owner_id = a.id THEN true
    WHEN EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE o.account_id = b.owner_id
      AND om.account_id = a.id
      AND om.role = 'owner'
    ) THEN true
    ELSE false
  END AS is_owner,
  CASE 
    WHEN bm.role = 'maintainer' THEN true
    WHEN EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE o.account_id = b.owner_id
      AND om.account_id = a.id
      AND om.role IN ('owner', 'admin')
    ) THEN true
    ELSE false
  END AS can_manage
FROM accounts a
JOIN blueprint_members bm ON bm.account_id = a.id
JOIN blueprints b ON b.id = bm.blueprint_id
LEFT JOIN blueprint_roles br ON br.id = bm.custom_role_id
WHERE a.type = 'user'
  AND a.status = 'active'
  AND b.deleted_at IS NULL;

-- 藍圖成員完整視圖
CREATE OR REPLACE VIEW blueprint_members_full AS
SELECT 
  bm.id,
  bm.blueprint_id,
  bm.account_id,
  a.name AS account_name,
  a.email AS account_email,
  a.avatar_url,
  bm.role,
  bm.business_role,
  bm.custom_role_id,
  br.name AS custom_role_name,
  br.display_name AS custom_role_display_name,
  bm.is_external,
  bm.created_at,
  bm.updated_at
FROM blueprint_members bm
JOIN accounts a ON a.id = bm.account_id
LEFT JOIN blueprint_roles br ON br.id = bm.custom_role_id
WHERE a.status != 'deleted';

-- ============================================================================
-- 15.10: API GATEWAY FUNCTIONS (API 閘道)
-- 對外 RPC 函數
-- ============================================================================

-- 取得藍圖完整上下文
CREATE OR REPLACE FUNCTION public.get_blueprint_context(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_user_account_id UUID;
  v_business_role public.blueprint_business_role;
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  v_user_account_id := (SELECT private.get_user_account_id());
  v_business_role := (SELECT private.get_blueprint_business_role(p_blueprint_id));
  
  SELECT jsonb_build_object(
    'blueprint', jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'description', b.description,
      'cover_url', b.cover_url,
      'is_public', b.is_public,
      'status', b.status,
      'lifecycle', b.lifecycle,
      'enabled_modules', b.enabled_modules,
      'owner_id', b.owner_id,
      'created_at', b.created_at
    ),
    'user', jsonb_build_object(
      'account_id', v_user_account_id,
      'business_role', v_business_role,
      'is_owner', (SELECT private.is_blueprint_owner(p_blueprint_id)),
      'can_write', (SELECT private.can_write_blueprint(p_blueprint_id))
    ),
    'roles', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', br.id,
          'name', br.name,
          'display_name', br.display_name,
          'business_role', br.business_role,
          'is_default', br.is_default
        )
      ), '[]'::jsonb)
      FROM public.blueprint_roles br
      WHERE br.blueprint_id = p_blueprint_id
    ),
    'configs', (
      SELECT COALESCE(jsonb_object_agg(
        bc.key, bc.value
      ), '{}'::jsonb)
      FROM public.blueprint_configs bc
      WHERE bc.blueprint_id = p_blueprint_id
    )
  ) INTO v_result
  FROM public.blueprints b
  WHERE b.id = p_blueprint_id;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_context(UUID) TO authenticated;

-- 取得用戶所有藍圖
CREATE OR REPLACE FUNCTION public.get_user_blueprints()
RETURNS TABLE (
  blueprint_id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN,
  status public.account_status,
  lifecycle public.blueprint_lifecycle,
  enabled_modules public.module_type[],
  owner_id UUID,
  owner_name VARCHAR,
  owner_type public.account_type,
  member_role public.blueprint_role,
  business_role public.blueprint_business_role,
  is_owner BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  v_user_account_id := (SELECT private.get_user_account_id());
  
  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id AS blueprint_id,
    b.name,
    b.slug,
    b.description,
    b.cover_url,
    b.is_public,
    b.status,
    b.lifecycle,
    b.enabled_modules,
    b.owner_id,
    a.name AS owner_name,
    a.type AS owner_type,
    bm.role AS member_role,
    COALESCE(bm.business_role, 'observer'::public.blueprint_business_role) AS business_role,
    (b.owner_id = v_user_account_id) AS is_owner,
    b.created_at
  FROM public.blueprints b
  JOIN public.accounts a ON a.id = b.owner_id
  LEFT JOIN public.blueprint_members bm ON bm.blueprint_id = b.id AND bm.account_id = v_user_account_id
  WHERE b.deleted_at IS NULL
    AND (
      -- 擁有者
      b.owner_id = v_user_account_id
      -- 成員
      OR bm.id IS NOT NULL
      -- 組織成員
      OR EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE o.account_id = b.owner_id
        AND om.account_id = v_user_account_id
      )
      -- 團隊成員
      OR EXISTS (
        SELECT 1 FROM public.blueprint_team_roles btr
        JOIN public.team_members tm ON tm.team_id = btr.team_id
        WHERE btr.blueprint_id = b.id
        AND tm.account_id = v_user_account_id
      )
      -- 公開藍圖
      OR b.is_public = true
    )
  ORDER BY b.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_blueprints() TO authenticated;

-- 取得藍圖統計資訊
CREATE OR REPLACE FUNCTION public.get_blueprint_stats(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  SELECT jsonb_build_object(
    'tasks', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'pending', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'pending'),
      'in_progress', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'in_progress'),
      'completed', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'completed')
    ),
    'diaries', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.diaries WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'this_month', (SELECT COUNT(*) FROM public.diaries WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND work_date >= date_trunc('month', CURRENT_DATE))
    ),
    'issues', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.issues WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'open', (SELECT COUNT(*) FROM public.issues WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status NOT IN ('resolved', 'closed'))
    ),
    'members', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.blueprint_members WHERE blueprint_id = p_blueprint_id)
    ),
    'files', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.files WHERE blueprint_id = p_blueprint_id AND status = 'active' AND is_folder = false),
      'total_size', (SELECT COALESCE(SUM(file_size), 0) FROM public.files WHERE blueprint_id = p_blueprint_id AND status = 'active' AND is_folder = false)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_stats(UUID) TO authenticated;

-- ============================================================================
-- 15.11: NOTIFICATION ENHANCEMENTS (通知中心增強)
-- 擴展通知系統
-- ============================================================================

-- 通知類型
CREATE TYPE notification_type AS ENUM (
  'info',              -- 一般資訊
  'warning',           -- 警告
  'error',             -- 錯誤
  'success',           -- 成功
  'mention',           -- 提及
  'assignment',        -- 指派
  'approval',          -- 審核
  'reminder',          -- 提醒
  'system'             -- 系統
);

-- 通知渠道
CREATE TYPE notification_channel AS ENUM (
  'in_app',            -- 應用內
  'email',             -- 電子郵件
  'push',              -- 推播
  'sms'                -- 簡訊
);

-- 增加欄位到 notifications (使用 ALTER TABLE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN notification_type notification_type NOT NULL DEFAULT 'info';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'channels'
  ) THEN
    ALTER TABLE notifications ADD COLUMN channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'sent_channels'
  ) THEN
    ALTER TABLE notifications ADD COLUMN sent_channels notification_channel[] DEFAULT ARRAY[]::notification_channel[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_type entity_type;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 通知偏好設定表
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  channels notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::notification_channel[],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT notification_preferences_unique UNIQUE (account_id, blueprint_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_account ON notification_preferences(account_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_blueprint ON notification_preferences(blueprint_id);

-- 觸發器
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select" ON notification_preferences 
  FOR SELECT TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_insert" ON notification_preferences 
  FOR INSERT TO authenticated 
  WITH CHECK (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_update" ON notification_preferences 
  FOR UPDATE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_delete" ON notification_preferences 
  FOR DELETE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

-- 發送通知函數
CREATE OR REPLACE FUNCTION public.send_notification(
  p_account_id UUID,
  p_blueprint_id UUID,
  p_title VARCHAR(500),
  p_content TEXT DEFAULT NULL,
  p_notification_type notification_type DEFAULT 'info',
  p_entity_type entity_type DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id UUID;
  v_channels public.notification_channel[];
BEGIN
  -- 取得通知偏好
  SELECT COALESCE(np.channels, ARRAY['in_app']::public.notification_channel[])
  INTO v_channels
  FROM public.notification_preferences np
  WHERE np.account_id = p_account_id
    AND (np.blueprint_id = p_blueprint_id OR np.blueprint_id IS NULL)
    AND np.notification_type = p_notification_type
    AND np.is_enabled = true
  LIMIT 1;
  
  -- 如果沒有偏好設定，使用預設
  IF v_channels IS NULL THEN
    v_channels := ARRAY['in_app']::public.notification_channel[];
  END IF;
  
  INSERT INTO public.notifications (
    account_id,
    blueprint_id,
    title,
    content,
    notification_type,
    channels,
    entity_type,
    entity_id,
    action_url,
    metadata
  )
  VALUES (
    p_account_id,
    p_blueprint_id,
    p_title,
    p_content,
    p_notification_type,
    v_channels,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification(UUID, UUID, VARCHAR, TEXT, notification_type, entity_type, UUID, TEXT, JSONB) TO authenticated;

