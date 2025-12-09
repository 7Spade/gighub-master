-- ============================================================================
-- Verification Query: Check FILES Module Status Before/After Migration
-- Description: 驗證 FILES 模組遷移狀態
-- Usage: Run this query before and after applying the migration
-- ============================================================================

-- Query 1: Count blueprints by FILES module status (BEFORE migration)
SELECT 
  CASE 
    WHEN 'files' = ANY(enabled_modules) THEN 'Files Enabled'
    ELSE 'Files NOT Enabled'
  END as status,
  COUNT(*) as blueprint_count
FROM blueprints
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY status;

-- Query 2: List all blueprints with FILES module status
SELECT 
  id, 
  name,
  slug,
  enabled_modules,
  CASE 
    WHEN 'files' = ANY(enabled_modules) THEN '✓ Enabled'
    ELSE '✗ Not Enabled'
  END as files_status,
  array_length(enabled_modules, 1) as module_count,
  created_at,
  updated_at
FROM blueprints
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Query 3: Show which blueprints will be affected by the migration
SELECT 
  id,
  name,
  slug,
  enabled_modules as current_modules,
  array_append(enabled_modules, 'files'::module_type) as new_modules
FROM blueprints
WHERE 
  deleted_at IS NULL
  AND NOT ('files'::module_type = ANY(enabled_modules));

-- Query 4: Verify migration was successful (AFTER migration)
-- All active blueprints should have 'files' in enabled_modules
SELECT 
  COUNT(*) as blueprints_without_files
FROM blueprints
WHERE 
  deleted_at IS NULL
  AND NOT ('files'::module_type = ANY(enabled_modules));
-- Expected result: 0

-- Query 5: Show the module distribution after migration
SELECT 
  unnest(enabled_modules) as module,
  COUNT(*) as blueprint_count
FROM blueprints
WHERE deleted_at IS NULL
GROUP BY module
ORDER BY blueprint_count DESC;
