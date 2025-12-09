-- ============================================================================
-- Migration: Enable FILES Module for All Blueprints
-- Description: 為所有現有藍圖啟用檔案管理模組
-- Category: Blueprint Configuration
-- Date: 2025-12-08
-- Issue: Users cannot upload files in blueprints due to FILES module not enabled
-- ============================================================================

-- Migration Overview:
-- This migration addresses the issue where legacy blueprints created before
-- the FILES module was added to DEFAULT_ENABLED_MODULES lack access to file
-- upload functionality. The moduleEnabledGuard blocks access when
-- ModuleType.FILES is not in the blueprint's enabled_modules array.

-- Step 1: Add 'files' module to all active blueprints that don't already have it
-- Uses array_append to safely add the module without duplicates
-- Only updates blueprints where:
--   1. deleted_at IS NULL (active blueprints only)
--   2. 'files' is NOT already in enabled_modules array
UPDATE blueprints
SET 
  enabled_modules = array_append(enabled_modules, 'files'::module_type),
  updated_at = NOW()
WHERE 
  deleted_at IS NULL
  AND NOT ('files'::module_type = ANY(enabled_modules));

-- Step 2: Verify the migration results
-- This query will be useful for post-migration validation
-- SELECT 
--   id, 
--   name, 
--   enabled_modules,
--   CASE 
--     WHEN 'files' = ANY(enabled_modules) THEN '✓ Files Enabled'
--     ELSE '✗ Files Not Enabled'
--   END as files_status,
--   created_at,
--   updated_at
-- FROM blueprints
-- WHERE deleted_at IS NULL
-- ORDER BY created_at DESC;

-- Migration Notes:
-- 1. This migration is idempotent - safe to run multiple times
-- 2. Only active blueprints (deleted_at IS NULL) are updated
-- 3. The array_append function safely prevents duplicate entries
-- 4. Updated_at timestamp is refreshed to track when module was enabled
-- 5. No data is lost - only the enabled_modules array is modified

-- Expected Impact:
-- - All active blueprints will have FILES module enabled
-- - Users will be able to navigate to /blueprint/:id/files
-- - File upload functionality will be immediately accessible
-- - No application code changes required

-- Rollback Strategy (if needed):
-- To rollback this migration, execute:
-- UPDATE blueprints
-- SET enabled_modules = array_remove(enabled_modules, 'files'::module_type)
-- WHERE 'files'::module_type = ANY(enabled_modules);
