---
goal: Migrate unused routes to demo folder and implement workspace context switching
version: 1.0
date_created: 2025-11-30
last_updated: 2025-11-30
owner: Development Team
status: 'Completed'
tags: ['refactor', 'migration', 'workspace', 'angular']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan implements the route migration and workspace context switching feature for the Angular application. The implementation follows the reference architecture from `/old` directory, including dynamic menu switching based on workspace context (user/organization/team/bot).

## 1. Requirements & Constraints

- **REQ-001**: Move unused demo routes (dashboard, delon, style, widgets, extras, data-v) to demo folder
- **REQ-002**: Implement workspace context switching with dynamic sidebar menu
- **REQ-003**: Support four context types: USER, ORGANIZATION, TEAM, BOT
- **REQ-004**: Use app-data.json for menu configuration (following old implementation)
- **SEC-001**: Use SECURITY DEFINER functions for Supabase operations to avoid RLS recursion
- **SEC-002**: Add private schema helper functions for permission checking
- **CON-001**: Must not break backward compatibility (existing routes still work)
- **CON-002**: Must ensure Supabase permissions work correctly
- **GUD-001**: Follow Angular Signals pattern for state management
- **PAT-001**: Reference old/src/app/shared/services/menu/menu-management.service.ts for menu implementation

## 2. Implementation Steps

### Implementation Phase 1: Route Migration

- GOAL-001: Move unused demo routes to dedicated demo folder

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Create src/app/routes/demo directory | ✅ | 2025-11-30 |
| TASK-002 | Move dashboard routes to demo folder | ✅ | 2025-11-30 |
| TASK-003 | Move delon routes to demo folder | ✅ | 2025-11-30 |
| TASK-004 | Move style routes to demo folder | ✅ | 2025-11-30 |
| TASK-005 | Move widgets routes to demo folder | ✅ | 2025-11-30 |
| TASK-006 | Move extras routes to demo folder | ✅ | 2025-11-30 |
| TASK-007 | Move data-v routes to demo folder | ✅ | 2025-11-30 |
| TASK-008 | Update routes.ts to import from demo folder | ✅ | 2025-11-30 |

### Implementation Phase 2: Workspace Context Menu Switching

- GOAL-002: Implement dynamic menu switching based on workspace context

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-009 | Create MenuManagementService in src/app/shared/services/menu/ | ✅ | 2025-11-30 |
| TASK-010 | Update app-data.json with menus configuration (user, organization, team, bot) | ✅ | 2025-11-30 |
| TASK-011 | Update StartupService to integrate with MenuManagementService | ✅ | 2025-11-30 |
| TASK-012 | Update LayoutBasicComponent to sync menu on context change | ✅ | 2025-11-30 |
| TASK-013 | Export MenuManagementService from shared services index | ✅ | 2025-11-30 |

### Implementation Phase 3: Supabase SECURITY DEFINER Functions

- GOAL-003: Add SECURITY DEFINER helper functions to avoid RLS permission issues

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-014 | Add private schema creation to supabase/seeds/init.sql | ✅ | 2025-11-30 |
| TASK-015 | Add private.get_user_account_id() function | ✅ | 2025-11-30 |
| TASK-016 | Add private.is_account_owner() function | ✅ | 2025-11-30 |
| TASK-017 | Add private.is_organization_member() function | ✅ | 2025-11-30 |
| TASK-018 | Add private.get_organization_role() function | ✅ | 2025-11-30 |
| TASK-019 | Add private.is_organization_admin() function | ✅ | 2025-11-30 |
| TASK-020 | Add private.is_team_member() function | ✅ | 2025-11-30 |
| TASK-021 | Add private.is_team_leader() function | ✅ | 2025-11-30 |
| TASK-022 | Add private.is_blueprint_owner() function | ✅ | 2025-11-30 |
| TASK-023 | Add private.has_blueprint_access() function | ✅ | 2025-11-30 |
| TASK-024 | Add private.can_write_blueprint() function | ✅ | 2025-11-30 |
| TASK-025 | Grant execute permissions to authenticated users | ✅ | 2025-11-30 |

## 3. Alternatives

- **ALT-001**: Keep routes in original location - Not chosen because it clutters the main routes with demo content
- **ALT-002**: Use database-stored menus instead of JSON file - Not chosen for simplicity and following existing pattern
- **ALT-003**: Use RLS policies without SECURITY DEFINER - Not chosen due to RLS recursion issues

## 4. Dependencies

- **DEP-001**: @angular/core ^20.3.0
- **DEP-002**: @delon/theme ^20.1.0
- **DEP-003**: Supabase with RLS enabled
- **DEP-004**: Existing WorkspaceContextService

## 5. Files

- **FILE-001**: src/app/routes/routes.ts - Updated to import from demo folder
- **FILE-002**: src/app/routes/demo/* - New folder containing moved routes
- **FILE-003**: src/app/shared/services/menu/menu-management.service.ts - New service for menu management
- **FILE-004**: src/app/shared/services/menu/index.ts - New index file for menu services
- **FILE-005**: src/app/shared/services/index.ts - Updated to export menu services
- **FILE-006**: src/app/core/startup/startup.service.ts - Updated to integrate with MenuManagementService
- **FILE-007**: src/app/layout/basic/basic.component.ts - Updated to sync menu on context change
- **FILE-008**: src/assets/tmp/app-data.json - Updated with menus configuration
- **FILE-009**: supabase/seeds/init.sql - Updated with SECURITY DEFINER helper functions

## 6. Testing

- **TEST-001**: Build verification - Application builds successfully without errors
- **TEST-002**: Routes work - Demo routes accessible via /dashboard, /delon, /style etc.
- **TEST-003**: Menu switching - Menu changes when switching workspace context

## 7. Risks & Assumptions

- **RISK-001**: Menu configuration changes require app-data.json update (mitigated by JSON format)
- **ASSUMPTION-001**: Supabase database schema already exists with required tables
- **ASSUMPTION-002**: WorkspaceContextService is already implemented and functional

## 8. Related Specifications / Further Reading

- [plan/feature-organization-switcher-1.md](/plan/feature-organization-switcher-1.md)
- [plan/feature-supabase-infrastructure-1.md](/plan/feature-supabase-infrastructure-1.md)
- [old/src/app/shared/services/menu/menu-management.service.ts](/old/src/app/shared/services/menu/menu-management.service.ts)
