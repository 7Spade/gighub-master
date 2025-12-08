---
goal: Implement Organization Switcher with Multi-Tenant Database Schema
version: 1.0
date_created: 2025-11-30
last_updated: 2025-11-30
owner: Development Team
status: 'Planned'
tags: ['feature', 'organization', 'multi-tenant', 'supabase', 'angular']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan establishes the organization switcher feature for the Angular application, enabling users to switch between personal accounts, organizations, and teams. The implementation follows the reference architecture from `/old` directory, including multi-tenant database schema, services, and UI components.

## 1. Requirements & Constraints

### Core Requirements
- **REQ-001**: Create multi-tenant database schema with accounts, organizations, organization_members, teams, and team_members tables
- **REQ-002**: Implement context switcher UI component in the application header
- **REQ-003**: Support three context types: USER (personal), ORGANIZATION, and TEAM
- **REQ-004**: Persist selected context across sessions using localStorage
- **REQ-005**: Automatically reload workspace data after creating/updating organizations or teams
- **REQ-006**: Support role-based access control (owner, admin, member) for organizations
- **REQ-007**: Support team roles (leader, member) within organizations

### Security Requirements
- **SEC-001**: Enable Row Level Security (RLS) on all tables
- **SEC-002**: Use SECURITY DEFINER functions for operations requiring elevated privileges
- **SEC-003**: Validate user permissions before context switching
- **SEC-004**: Prevent unauthorized access to organization/team resources

### Constraints
- **CON-001**: Must integrate with existing ng-alain/delon architecture
- **CON-002**: Must use Angular Signals for reactive state management
- **CON-003**: Must follow the Clean Architecture pattern (Core → Shared → Routes)
- **CON-004**: Must maintain backward compatibility with existing SupabaseService

### Guidelines
- **GUD-001**: Follow Angular standalone component patterns
- **GUD-002**: Use TypeScript strict mode
- **GUD-003**: Implement bilingual comments (Chinese/English)

### Patterns to Follow (from /old reference)
- **PAT-001**: Use BehaviorSubject/Signal for context state management
- **PAT-002**: Use Facade pattern for cross-service coordination
- **PAT-003**: Use Repository pattern for data access
- **PAT-004**: Use Service pattern for business logic

## 2. Implementation Steps

### Phase 1: Database Schema Setup

- GOAL-001: Create Supabase database schema with multi-tenant support

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Create enum types: account_type, account_status, organization_role, team_role | | |
| TASK-002 | Create `accounts` table with auth_user_id, type, status, name, email, avatar_url columns | | |
| TASK-003 | Create `organizations` table with account_id (FK), name, slug, description, logo_url, created_by columns | | |
| TASK-004 | Create `organization_members` table with organization_id, account_id, role columns | | |
| TASK-005 | Create `teams` table with organization_id, name, description, metadata columns | | |
| TASK-006 | Create `team_members` table with team_id, account_id, role columns | | |
| TASK-007 | Create helper functions in `private` schema: get_user_account_id, is_organization_member, is_organization_admin, is_team_member | | |
| TASK-008 | Create trigger function `handle_new_organization` to auto-add creator as owner | | |
| TASK-009 | Create `create_organization` RPC function with SECURITY DEFINER | | |
| TASK-010 | Create `create_team` RPC function with SECURITY DEFINER | | |
| TASK-011 | Enable RLS on all tables with appropriate policies | | |

### Phase 2: Core Services & Types

- GOAL-002: Implement core services and type definitions

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-012 | Create `src/app/core/infra/types/context.types.ts` with ContextType enum and ContextState interface | | |
| TASK-013 | Create `src/app/core/infra/types/account.types.ts` with Account, Organization, Team interfaces | | |
| TASK-014 | Create `src/app/core/infra/repositories/account.repository.ts` for account data access | | |
| TASK-015 | Create `src/app/core/infra/repositories/organization.repository.ts` for organization data access | | |
| TASK-016 | Create `src/app/core/infra/repositories/organization-member.repository.ts` for membership data access | | |
| TASK-017 | Create `src/app/core/infra/repositories/team.repository.ts` for team data access | | |
| TASK-018 | Update `src/app/core/index.ts` to export new types and repositories | | |

### Phase 3: Shared Services

- GOAL-003: Implement shared business services

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-019 | Create `src/app/shared/models/account/organization.models.ts` with business models | | |
| TASK-020 | Create `src/app/shared/services/account/account.service.ts` for account operations | | |
| TASK-021 | Create `src/app/shared/services/account/organization.service.ts` for organization operations | | |
| TASK-022 | Create `src/app/shared/services/account/team.service.ts` for team operations | | |
| TASK-023 | Create `src/app/shared/services/account/workspace-context.service.ts` for context management | | |
| TASK-024 | Update `src/app/shared/index.ts` to export new services | | |

### Phase 4: Context Switcher UI Component

- GOAL-004: Implement the header context switcher component

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-025 | Create `src/app/layout/basic/widgets/context-switcher.component.ts` with dropdown menu UI | | |
| TASK-026 | Add context switcher to header layout component | | |
| TASK-027 | Implement personal account display in context menu | | |
| TASK-028 | Implement organization list with nested teams in context menu | | |
| TASK-029 | Add visual indicator for currently selected context | | |
| TASK-030 | Add loading state during context switching | | |

### Phase 5: Integration & Testing

- GOAL-005: Integrate components and verify functionality

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-031 | Run Supabase migrations to create database schema | | |
| TASK-032 | Test user registration and automatic account creation | | |
| TASK-033 | Test organization creation via RPC function | | |
| TASK-034 | Test team creation within organizations | | |
| TASK-035 | Test context switching between user/org/team | | |
| TASK-036 | Verify context persistence across sessions | | |
| TASK-037 | Build verification - Angular build must succeed | | |

## 3. Alternatives

- **ALT-001**: Could use NgRx for state management instead of Angular Signals - not chosen as project already uses Signals pattern
- **ALT-002**: Could implement organization switching via URL routing - not chosen to maintain cleaner URL structure
- **ALT-003**: Could store context in HTTP-only cookie instead of localStorage - not chosen for simplicity and offline support

## 4. Dependencies

### External Dependencies
- **DEP-001**: @supabase/supabase-js - Already installed for Supabase client
- **DEP-002**: ng-zorro-antd - For UI components (dropdown, menu, icons)
- **DEP-003**: @delon/auth - For authentication token management

### Internal Dependencies
- **DEP-004**: SupabaseService - Already implemented in src/app/core/supabase/
- **DEP-005**: Environment configuration with Supabase credentials

## 5. Files

### New Files to Create

#### Supabase Schema
- **FILE-001**: `supabase/migrations/YYYYMMDD_init_multi_tenant_schema.sql` - Complete database schema
- **FILE-002**: `supabase/seeds/init.sql` - Seed data and helper functions

#### Core Layer (src/app/core/)
- **FILE-003**: `src/app/core/infra/types/context.types.ts` - Context type definitions
- **FILE-004**: `src/app/core/infra/types/account.types.ts` - Account type definitions
- **FILE-005**: `src/app/core/infra/repositories/account.repository.ts` - Account repository
- **FILE-006**: `src/app/core/infra/repositories/organization.repository.ts` - Organization repository
- **FILE-007**: `src/app/core/infra/repositories/organization-member.repository.ts` - Membership repository
- **FILE-008**: `src/app/core/infra/repositories/team.repository.ts` - Team repository
- **FILE-009**: `src/app/core/services/auth-context.service.ts` - Auth context management

#### Shared Layer (src/app/shared/)
- **FILE-010**: `src/app/shared/models/account/organization.models.ts` - Business models
- **FILE-011**: `src/app/shared/services/account/account.service.ts` - Account service
- **FILE-012**: `src/app/shared/services/account/organization.service.ts` - Organization service
- **FILE-013**: `src/app/shared/services/account/team.service.ts` - Team service
- **FILE-014**: `src/app/shared/services/account/workspace-context.service.ts` - Context service

#### Layout Components
- **FILE-015**: `src/app/layout/basic/widgets/context-switcher.component.ts` - Context switcher UI

### Files to Modify
- **FILE-016**: `src/app/core/index.ts` - Export new modules
- **FILE-017**: `src/app/shared/index.ts` - Export new services
- **FILE-018**: `src/app/layout/basic/basic.component.ts` - Add context switcher to header

## 6. Testing

### Unit Tests
- **TEST-001**: Test ContextType enum values match expected strings
- **TEST-002**: Test AccountService.findByAuthUserId returns correct account
- **TEST-003**: Test OrganizationService.createOrganization creates account and organization
- **TEST-004**: Test WorkspaceContextService.switchContext updates state correctly
- **TEST-005**: Test WorkspaceContextService.persistContext saves to localStorage

### Integration Tests
- **TEST-006**: Test organization creation flow end-to-end
- **TEST-007**: Test context switching updates menu correctly
- **TEST-008**: Test RLS policies prevent unauthorized access

### Build Verification
- **TEST-009**: Angular build must succeed without errors
- **TEST-010**: Supabase migrations must apply successfully

## 7. Risks & Assumptions

### Risks
- **RISK-001**: Database migration might fail on existing Supabase project - Mitigation: Test on development project first
- **RISK-002**: RLS policies might be too restrictive - Mitigation: Comprehensive testing with multiple user roles
- **RISK-003**: Context switching might cause data leakage - Mitigation: Clear component state on context switch

### Assumptions
- **ASSUMPTION-001**: Supabase project is properly configured with Auth enabled
- **ASSUMPTION-002**: Users will authenticate before accessing organization features
- **ASSUMPTION-003**: Each user can belong to multiple organizations with different roles
- **ASSUMPTION-004**: Teams are always nested under organizations

## 8. Database Schema Reference

### Core Tables Structure

```sql
-- Enum Types
CREATE TYPE account_type AS ENUM ('user', 'org', 'bot');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE team_role AS ENUM ('leader', 'member');

-- Accounts Table (Unified identity for users, orgs, bots)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,  -- Links to auth.users for 'user' type
  type account_type NOT NULL DEFAULT 'user',
  status account_status NOT NULL DEFAULT 'active',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),  -- Org's identity account
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Organization Members Table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, account_id)
);

-- Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name)
);

-- Team Members Table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, account_id)
);
```

### Key RPC Functions

```sql
-- Create Organization (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name VARCHAR(255),
  p_email VARCHAR(255) DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_slug VARCHAR(100) DEFAULT NULL
) RETURNS TABLE (account_id UUID, organization_id UUID)
LANGUAGE plpgsql SECURITY DEFINER;

-- Create Team (SECURITY DEFINER)  
CREATE OR REPLACE FUNCTION public.create_team(
  p_organization_id UUID,
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL
) RETURNS TABLE (team_id UUID)
LANGUAGE plpgsql SECURITY DEFINER;
```

## 9. Related Specifications / Further Reading

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular Signals](https://angular.dev/guide/signals)
- [ng-alain Framework](https://ng-alain.com/)
- [Reference Implementation: /old/src/app/layout/basic/widgets/context-switcher.component.ts]
- [Reference SQL: /old/supabase/seeds/init.sql]
