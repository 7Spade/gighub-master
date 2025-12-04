-- ============================================================================
-- Migration: Fix Blueprint Business Role Enum
-- Description: 確保 blueprint_business_role enum 包含所有必要的值
-- Created: 2024-12-05
-- 
-- Problem Analysis:
-- 當數據庫中已存在舊版本的 blueprint_business_role enum 時，
-- 使用 DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$; 
-- 創建 enum 的語法會跳過整個創建過程，導致缺少新的 enum 值。
-- 
-- Solution:
-- 使用 ALTER TYPE ... ADD VALUE IF NOT EXISTS 來添加可能缺失的 enum 值
-- 
-- Note: PostgreSQL 9.1+ 支持 ADD VALUE IF NOT EXISTS 語法
-- 這些語句必須在 autocommit 模式下執行（不能在交易塊內）
-- Supabase migrations 會自動處理這一點
-- ============================================================================

-- ############################################################################
-- PART 1: 確保 enum 存在
-- ############################################################################

-- 先檢查 enum 是否存在，如果不存在則創建
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_business_role') THEN
    CREATE TYPE blueprint_business_role AS ENUM (
      'project_manager',
      'site_director',
      'site_supervisor',
      'worker',
      'qa_staff',
      'safety_health',
      'finance',
      'observer'
    );
  END IF;
END $$;

-- ############################################################################
-- PART 2: 添加可能缺失的 enum 值
-- ############################################################################

-- 使用 ADD VALUE IF NOT EXISTS 語法（PostgreSQL 9.1+ 支持）
-- 這些語句會安全地添加缺失的值，如果值已存在則不做任何操作

-- 添加 project_manager
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'project_manager';

-- 添加 site_director
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'site_director';

-- 添加 site_supervisor (這是錯誤訊息中報告缺失的值)
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'site_supervisor';

-- 添加 worker
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'worker';

-- 添加 qa_staff
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'qa_staff';

-- 添加 safety_health
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'safety_health';

-- 添加 finance
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'finance';

-- 添加 observer
ALTER TYPE blueprint_business_role ADD VALUE IF NOT EXISTS 'observer';

-- ############################################################################
-- PART 3: 驗證 enum 值
-- ############################################################################

-- 驗證所有必要的 enum 值都存在
DO $$
DECLARE
  missing_values TEXT[];
  expected_values TEXT[] := ARRAY['project_manager', 'site_director', 'site_supervisor', 'worker', 'qa_staff', 'safety_health', 'finance', 'observer'];
  val TEXT;
BEGIN
  missing_values := ARRAY[]::TEXT[];
  
  FOREACH val IN ARRAY expected_values
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'blueprint_business_role'::regtype 
      AND enumlabel = val
    ) THEN
      missing_values := array_append(missing_values, val);
    END IF;
  END LOOP;
  
  IF array_length(missing_values, 1) > 0 THEN
    RAISE WARNING 'blueprint_business_role enum is missing values: %', missing_values;
  ELSE
    RAISE NOTICE 'All blueprint_business_role enum values are present';
  END IF;
END $$;

-- ============================================================================
-- Documentation Comments
-- ============================================================================
COMMENT ON TYPE blueprint_business_role IS '藍圖業務角色枚舉 - 定義用戶在藍圖中的業務角色類型：project_manager(專案經理), site_director(工地主任), site_supervisor(現場監督), worker(施工人員), qa_staff(品管人員), safety_health(公共安全衛生), finance(財務), observer(觀察者)';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- 注意：PostgreSQL 不支持從 enum 中移除值
-- 如果需要回滾，需要重新創建整個 enum（這是破壞性操作）
-- DROP TYPE IF EXISTS blueprint_business_role;
