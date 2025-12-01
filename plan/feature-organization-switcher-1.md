---
goal: Implement Organization Switcher with Multi-Tenant Database Schema
version: 1.0
date_created: 2025-11-30
last_updated: 2025-12-01
owner: Development Team
status: 'Completed'
tags: ['feature', 'organization', 'multi-tenant', 'supabase', 'angular']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan implements the organization switcher feature with multi-tenant database schema support. Users can switch between personal account, organizations, and teams with persistent context management.

## 1. Requirements & Constraints

### Functional Requirements
- **REQ-001**: Create database schema supporting accounts, organizations, organization_members, teams, and team_members tables ✅
- **REQ-002**: Implement context switcher UI component in the application header ✅
- **REQ-003**: Support three context types: USER (personal), ORGANIZATION, and TEAM ✅
- **REQ-004**: Persist selected context across sessions using localStorage ✅
- **REQ-005**: Automatically reload workspace data after creating/updating organizations or teams ✅
- **REQ-006**: Support role-based access control (owner, admin, member) for organizations ✅
- **REQ-007**: Support team roles (leader, member) within organizations ✅

### Security Requirements
- **SEC-001**: Enable Row Level Security (RLS) on all tables ✅
- **SEC-002**: Use SECURITY DEFINER functions for operations requiring elevated privileges ✅
- **SEC-003**: Validate user permissions before context switching ✅
- **SEC-004**: Prevent unauthorized access to organization/team resources ✅

## 2. Implementation Steps

### Phase 1: Database Schema Setup ✅

- GOAL-001: Create Supabase database schema with multi-tenant support

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Create enum types: account_type, account_status, organization_role, team_role | ✅ | 2025-11-30 |
| TASK-002 | Create `accounts` table with auth_user_id, type, status, name, email, avatar_url columns | ✅ | 2025-11-30 |
| TASK-003 | Create `organizations` table with account_id (FK), name, slug, description, logo_url, created_by columns | ✅ | 2025-11-30 |
| TASK-004 | Create `organization_members` table with organization_id, account_id, role columns | ✅ | 2025-11-30 |
| TASK-005 | Create `teams` table with organization_id, name, description, metadata columns | ✅ | 2025-11-30 |
| TASK-006 | Create `team_members` table with team_id, account_id, role columns | ✅ | 2025-11-30 |
| TASK-007 | Create helper functions in `private` schema | ✅ | 2025-11-30 |
| TASK-008 | Create trigger function `handle_new_organization` | ✅ | 2025-11-30 |
| TASK-009 | Create `create_organization` RPC function with SECURITY DEFINER | ✅ | 2025-11-30 |
| TASK-010 | Create `create_team` RPC function with SECURITY DEFINER | ✅ | 2025-11-30 |
| TASK-011 | Enable RLS on all tables with appropriate policies | ✅ | 2025-11-30 |

### Phase 2: Core Services & Types ✅

- GOAL-002: Implement core services and type definitions

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-012 | Create context types in account types module | ✅ | 2025-11-30 |
| TASK-013 | Create Account, Organization, Team interfaces | ✅ | 2025-11-30 |
| TASK-014 | Create `account.repository.ts` for account data access | ✅ | 2025-11-30 |
| TASK-015 | Create `organization.repository.ts` for organization data access | ✅ | 2025-11-30 |
| TASK-016 | Create `organization-member.repository.ts` for membership data access | ✅ | 2025-11-30 |
| TASK-017 | Create `team.repository.ts` for team data access | ✅ | 2025-11-30 |
| TASK-018 | Update core/index.ts to export new types and repositories | ✅ | 2025-11-30 |

### Phase 3: Shared Services ✅

- GOAL-003: Implement shared business services

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-019 | Create organization.models.ts with business models | ✅ | 2025-11-30 |
| TASK-020 | Create account.service.ts for account operations | ✅ | 2025-11-30 |
| TASK-021 | Create organization.service.ts for organization operations | ✅ | 2025-11-30 |
| TASK-022 | Create team.service.ts for team operations | ✅ | 2025-11-30 |
| TASK-023 | Create workspace-context.service.ts for context management | ✅ | 2025-11-30 |
| TASK-024 | Update shared/index.ts to export new services | ✅ | 2025-11-30 |

### Phase 4: Context Switcher UI Component ✅

- GOAL-004: Implement the header context switcher component

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-025 | Create context-switcher.component.ts with dropdown menu UI | ✅ | 2025-11-30 |
| TASK-026 | Add context switcher to header layout component | ✅ | 2025-11-30 |
| TASK-027 | Implement personal account display in context menu | ✅ | 2025-11-30 |
| TASK-028 | Implement organization list with nested teams in context menu | ✅ | 2025-11-30 |
| TASK-029 | Add visual indicator for currently selected context | ✅ | 2025-11-30 |
| TASK-030 | Add loading state during context switching | ✅ | 2025-11-30 |

### Phase 5: Integration & Testing ✅

- GOAL-005: Integrate components and verify functionality

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-031 | Supabase schema in seeds/init.sql | ✅ | 2025-11-30 |
| TASK-032 | User registration and automatic account creation trigger | ✅ | 2025-11-30 |
| TASK-033 | Organization creation via RPC function | ✅ | 2025-11-30 |
| TASK-034 | Team creation within organizations | ✅ | 2025-11-30 |
| TASK-035 | Context switching implementation | ✅ | 2025-11-30 |
| TASK-036 | Context persistence with localStorage | ✅ | 2025-11-30 |
| TASK-037 | Build verification - Angular build succeeds | ✅ | 2025-12-01 |

## 3. Alternatives

- **ALT-001**: Could use NgRx for state management - not chosen as project already uses Signals pattern
- **ALT-002**: Could implement organization switching via URL routing - not chosen to maintain cleaner URL structure
- **ALT-003**: Could store context in HTTP-only cookie - not chosen for simplicity and offline support

## 4. Dependencies

### External Dependencies
- **DEP-001**: @supabase/supabase-js - Already installed ✅
- **DEP-002**: ng-zorro-antd - For UI components ✅
- **DEP-003**: @delon/auth - For authentication token management ✅

### Internal Dependencies
- **DEP-004**: SupabaseService - Implemented ✅
- **DEP-005**: Environment configuration with Supabase credentials ✅

## 5. Files

### New Files Created ✅
- `supabase/seeds/init.sql` - Complete database schema
- `src/app/core/infra/types/account/index.ts` - Account type definitions
- `src/app/core/infra/repositories/account/*.ts` - All repositories
- `src/app/shared/models/account/organization.models.ts` - Business models
- `src/app/shared/services/account/*.ts` - All services
- `src/app/layout/basic/widgets/context-switcher.component.ts` - Context switcher UI

### Files Modified ✅
- `src/app/core/index.ts` - Export new modules
- `src/app/shared/index.ts` - Export new services
- `src/app/layout/basic/basic.component.ts` - Add context switcher to header

## 6. Testing

### Build Verification ✅
- **TEST-009**: Angular build must succeed without errors ✅

## 7. Related Specifications

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular Signals](https://angular.dev/guide/signals)
- [ng-alain Framework](https://ng-alain.com/)
