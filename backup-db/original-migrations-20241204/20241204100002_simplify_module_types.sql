-- ============================================================================
-- Migration: Simplify Module Types (Occam's Razor)
-- Description: 簡化模組類型列舉 - 依據奧卡姆剃刀原則
-- Created: 2024-12-04
--
-- Purpose:
--   - Keep only essential modules for construction site management
--   - Remove redundant or overlapping module types
--   - Simplify the module selection during blueprint creation
--
-- Changes:
--   - Removed: dashboard (not a module, it's a view)
--   - Removed: bot_workflow (advanced feature, can be added later)
--   - Removed: todos (redundant with tasks)
--   - Kept: tasks, diary, files, checklists, issues
--   - Added: financial (core module for construction)
--   - Added: acceptance (品質驗收 - core for construction)
--
-- Note: This migration adds new values to the ENUM.
--       Existing values are preserved for backward compatibility.
--       The old values (dashboard, bot_workflow, todos) can still exist in data
--       but will not be shown in the UI for new blueprints.
-- ============================================================================

-- Add new essential modules to the ENUM
DO $$
BEGIN
  -- Add 'financial' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'module_type'::regtype AND enumlabel = 'financial'
  ) THEN
    ALTER TYPE module_type ADD VALUE 'financial';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- Add 'acceptance' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'module_type'::regtype AND enumlabel = 'acceptance'
  ) THEN
    ALTER TYPE module_type ADD VALUE 'acceptance';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Module Configuration View
-- ============================================================================

-- Create a view for the recommended modules (Occam's Razor)
CREATE OR REPLACE VIEW v_essential_modules AS
SELECT 
  module_value::TEXT AS value,
  module_label,
  module_icon,
  module_description,
  is_core
FROM (VALUES
  ('tasks', '任務管理', 'ordered-list', '工作項目追蹤與進度管理', true),
  ('diary', '施工日誌', 'file-text', '每日施工記錄與天氣', true),
  ('checklists', '檢查清單', 'check-square', '品質檢查與巡檢清單', true),
  ('issues', '問題追蹤', 'warning', '施工問題登記與追蹤', true),
  ('files', '檔案管理', 'folder', '專案文件與圖面管理', true),
  ('financial', '財務管理', 'dollar', '合約、費用與請款管理', true),
  ('acceptance', '品質驗收', 'audit', '工程驗收與簽核', false)
) AS t(module_value, module_label, module_icon, module_description, is_core);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON VIEW v_essential_modules IS '
Essential modules view following Occam''s Razor principle.
只保留工地施工管理系統的核心模組：

Core modules (核心模組 - 建議啟用):
- tasks: 任務管理 - 工作項目追蹤
- diary: 施工日誌 - 每日記錄
- checklists: 檢查清單 - 品質巡檢
- issues: 問題追蹤 - 缺失管理
- files: 檔案管理 - 文件圖面
- financial: 財務管理 - 合約費用

Optional modules (選用模組):
- acceptance: 品質驗收 - 工程驗收

Deprecated modules (保留但不推薦):
- dashboard: 不是模組，是視圖
- bot_workflow: 進階功能，之後再加
- todos: 與 tasks 重複
';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- Note: PostgreSQL does not support removing ENUM values directly.
-- To fully rollback, you would need to recreate the type.
-- DROP VIEW IF EXISTS v_essential_modules;
