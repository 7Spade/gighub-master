# Blueprint Module Categorization - Implementation Summary

## Overview
This implementation separates blueprint modules into **built-in (core) modules** and **user-selectable (optional) modules**, with audit logs (操作紀錄) categorized as a built-in module.

## Changes Made

### 1. Core Type Definitions (`src/app/core/infra/types/blueprint/index.ts`)
- ✅ Added `AUDIT_LOG = 'audit_log'` to `ModuleType` enum as a core module
- ✅ Updated `ESSENTIAL_MODULES` array to include audit_log with `isCore: true`
- ✅ Updated `MODULES_CONFIG` array with complete audit_log configuration:
  - `routePath: 'activities'` (maps to existing activities route)
  - `componentName: 'BlueprintActivitiesComponent'`
  - `icon: 'history'`
- ✅ Updated `DEFAULT_ENABLED_MODULES` to include `AUDIT_LOG`
- ✅ Enhanced JSDoc comments to clarify core vs optional module distinction

### 2. Settings Component (`src/app/routes/blueprint/settings/settings.component.ts`)
- ✅ Split module display into two sections:
  - **內建模組（核心功能）**: Core modules that cannot be disabled
  - **選用模組（可自主選擇）**: Optional modules that users can toggle
- ✅ Added computed signals for module categorization:
  - `coreModules()`: Filters modules where `isCore === true`
  - `optionalModules()`: Filters modules where `isCore === false`
- ✅ Updated `saveSettings()` to always include all core modules
- ✅ Added visual indicators:
  - Blue background for core modules
  - "內建" (Built-in) tag on core modules
  - Disabled toggle switches for core modules with tooltip explanation
- ✅ Enhanced UI styling for module cards

### 3. Create Blueprint Component (`src/app/routes/blueprint/create-blueprint/create-blueprint.component.ts`)
- ✅ Separated module selection UI into two sections:
  - **內建模組（核心功能，始終啟用）**: Display-only list of core modules
  - **選用模組（可自主選擇）**: Multi-select dropdown for optional modules
- ✅ Updated form initialization:
  - `enabledModules` field now only handles optional modules
  - Core modules are automatically included during submission
- ✅ Updated `submit()` method to merge core and optional modules
- ✅ Added visual indicators:
  - Core modules displayed in a special highlighted container
  - Blue "內建" tags on core module items
- ✅ Enhanced hint text to explain the module categorization

### 4. Route Configuration (`src/app/routes/blueprint/routes.ts`)
- ✅ Added `moduleEnabledGuard` to activities route
- ✅ Set `requiredModule: ModuleType.AUDIT_LOG` in route data
- ✅ This ensures audit log pages require the module to be enabled (even though it's always enabled for core modules)

### 5. Database Migration (`supabase/migrations/20251208000000_add_core_modules.sql`)
- ✅ Added new enum values to `module_type`:
  - `'financial'` - 財務管理模組
  - `'acceptance'` - 品質驗收模組
  - `'audit_log'` - 操作紀錄模組
- ✅ Created migration logic to:
  - Check if each enum value exists before adding (idempotent)
  - Update all existing blueprints to include core modules
  - Handle blueprints with NULL enabled_modules
- ✅ Added comprehensive comments documenting core vs optional modules

### 6. Documentation Updates
- ✅ Updated `supabase/types/custom_types.sql`:
  - Documented core modules: tasks, diary, checklists, issues, files, financial, audit_log
  - Documented optional modules: acceptance
  - Documented deprecated modules: dashboard, bot_workflow, todos
- ✅ Added clear module categorization to enum definition

## Core Modules (內建模組 - 始終啟用)

1. **tasks** (任務管理) - Task management and progress tracking
2. **diary** (施工日誌) - Daily construction diary with weather
3. **checklists** (品質管控) - Quality control and inspection checklists
4. **issues** (問題追蹤) - Issue tracking and problem management
5. **files** (檔案管理) - Document and drawing management
6. **financial** (財務管理) - Contract, expense, and payment management
7. **audit_log** (操作紀錄) - **NEW** - Operation records and activity history

## Optional Modules (選用模組 - 用戶可自主選擇)

1. **acceptance** (品質驗收) - Quality acceptance and sign-off

## Deprecated Modules (保留但不推薦)

1. **dashboard** - Use standalone view instead
2. **bot_workflow** - Advanced feature, not supported yet
3. **todos** - Redundant with tasks

## User Experience Changes

### Creating a New Blueprint
- Users see two distinct sections:
  1. Core modules are displayed as a fixed list (cannot be deselected)
  2. Optional modules are presented in a multi-select dropdown
- Hint text clearly explains: "內建模組提供核心施工管理功能，無法停用。選用模組可依需求啟用。"

### Blueprint Settings
- Module settings tab now shows two distinct sections:
  1. **內建模組（核心功能）**: 7 core modules with disabled toggles
  2. **選用模組（可自主選擇）**: Optional modules with active toggles
- Core modules have:
  - Blue background color
  - "內建" (Built-in) tag
  - Disabled toggle switch
  - Tooltip explaining "內建模組無法停用"

### Activities/Audit Log Access
- Audit log functionality is now formally recognized as a module
- Route guard ensures module is enabled (always true for core modules)
- Consistent with other module-based features

## Backward Compatibility

### Existing Blueprints
- Database migration automatically adds all core modules to existing blueprints
- No data loss or disruption for existing blueprints
- Existing optional module selections are preserved

### API Compatibility
- All existing module type values remain valid
- New module types are added without removing old ones
- Frontend code gracefully handles blueprints with any combination of modules

## Testing Recommendations

1. **Blueprint Creation**
   - ✅ Verify core modules are automatically included
   - ✅ Verify optional modules can be selected/deselected
   - ✅ Verify blueprint is created with correct enabled_modules array

2. **Settings Page**
   - ✅ Verify core modules are displayed separately
   - ✅ Verify core module toggles are disabled
   - ✅ Verify optional module toggles work correctly
   - ✅ Verify save functionality includes all core modules

3. **Module Guards**
   - ✅ Verify audit log route guard works correctly
   - ✅ Verify other module guards still function properly

4. **Database Migration**
   - ✅ Run migration in development environment
   - ✅ Verify all blueprints have core modules
   - ✅ Verify no existing data is lost

## Known Limitations

1. **Angular Version Mismatch**: The project has an Angular version mismatch (Angular 21.0.3 detected but @angular/build supports ^20.0.0). This is unrelated to our changes and needs to be resolved separately.

2. **Enum Values Cannot Be Removed**: PostgreSQL doesn't support removing enum values. Deprecated modules (dashboard, bot_workflow, todos) remain in the database enum but are marked as deprecated in code.

## Future Enhancements

1. Add more optional modules as needed (e.g., equipment tracking, material management)
2. Implement module dependency checks (e.g., Gantt chart depends on tasks)
3. Add module-specific permissions
4. Implement module usage analytics

## Migration Rollback Plan

If needed, the migration can be rolled back by:
1. Restoring the database from before the migration
2. Reverting code changes (git revert)

Note: Since PostgreSQL doesn't support removing enum values, a true rollback would require recreating the enum type with the old values, which would be disruptive.
