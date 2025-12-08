---
goal: Implement Blueprint (藍圖/工作區) Module with Full CRUD Operations
version: 1.0
date_created: 2025-12-01
last_updated: 2025-12-01
owner: 7Spade
status: 'Completed'
tags: ['feature', 'blueprint', 'workspace', 'angular', 'supabase']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This implementation plan documents the complete Blueprint (藍圖/工作區) module implementation for the GigHub application. The blueprint module serves as a logical container for various business modules including Tasks, Diary, Dashboard, Files, Todos, Checklists, Issues, and Bot Workflow.

## 1. Requirements & Constraints

- **REQ-001**: Blueprint types must match PostgreSQL enums and table definitions in init.sql
- **REQ-002**: Blueprint repository must follow existing OrganizationRepository pattern
- **REQ-003**: Blueprint service must integrate with Supabase RPC functions (create_blueprint)
- **REQ-004**: Blueprint facade must extend BaseAccountCrudFacade for consistent error handling
- **REQ-005**: Blueprint routes must be lazy-loaded for performance optimization
- **CON-001**: Must use Angular 20+ with standalone components
- **CON-002**: Must follow existing project structure conventions
- **GUD-001**: Follow existing code patterns from account/organization modules
- **PAT-001**: Use NgRx Signal Store patterns for state management

## 2. Implementation Steps

### Implementation Phase 1: Type Definitions

- GOAL-001: Define TypeScript types matching database schema

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create BlueprintRole enum (viewer, contributor, maintainer)| ✅        | 2025-12-01 |
| TASK-002 | Create BlueprintTeamAccess enum (read, write, admin)       | ✅        | 2025-12-01 |
| TASK-003 | Create ModuleType enum for enabled modules                 | ✅        | 2025-12-01 |
| TASK-004 | Create Blueprint interface                                 | ✅        | 2025-12-01 |
| TASK-005 | Create BlueprintMember interface                           | ✅        | 2025-12-01 |
| TASK-006 | Create BlueprintTeamRole interface                         | ✅        | 2025-12-01 |
| TASK-007 | Export types from core/infra/types index                   | ✅        | 2025-12-01 |

### Implementation Phase 2: Repository Layer

- GOAL-002: Create data access layer for blueprint entities

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-008 | Create BlueprintRepository with CRUD operations            | ✅        | 2025-12-01 |
| TASK-009 | Create BlueprintMemberRepository for member management     | ✅        | 2025-12-01 |
| TASK-010 | Export repositories from core/infra/repositories index     | ✅        | 2025-12-01 |

### Implementation Phase 3: Business Models

- GOAL-003: Define business layer models and request types

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-011 | Create BlueprintBusinessModel interface                    | ✅        | 2025-12-01 |
| TASK-012 | Create BlueprintMemberDetail interface                     | ✅        | 2025-12-01 |
| TASK-013 | Create CreateBlueprintRequest interface                    | ✅        | 2025-12-01 |
| TASK-014 | Create UpdateBlueprintRequest interface                    | ✅        | 2025-12-01 |
| TASK-015 | Export models from shared/models index                     | ✅        | 2025-12-01 |

### Implementation Phase 4: Service Layer

- GOAL-004: Implement business logic service

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-016 | Create BlueprintService with state signals                 | ✅        | 2025-12-01 |
| TASK-017 | Implement createBlueprint using RPC function               | ✅        | 2025-12-01 |
| TASK-018 | Implement updateBlueprint and deleteBlueprint              | ✅        | 2025-12-01 |
| TASK-019 | Implement member management methods                        | ✅        | 2025-12-01 |
| TASK-020 | Export service from shared/services index                  | ✅        | 2025-12-01 |

### Implementation Phase 5: Facade Layer

- GOAL-005: Create unified business interface

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-021 | Create BlueprintFacade extending BaseAccountCrudFacade     | ✅        | 2025-12-01 |
| TASK-022 | Implement facade methods delegating to service             | ✅        | 2025-12-01 |
| TASK-023 | Export facade from core/facades index                      | ✅        | 2025-12-01 |

### Implementation Phase 6: UI Components

- GOAL-006: Implement route components for blueprint management

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-024 | Create BlueprintListComponent with grid layout             | ✅        | 2025-12-01 |
| TASK-025 | Create CreateBlueprintComponent modal form                 | ✅        | 2025-12-01 |
| TASK-026 | Create BlueprintMembersComponent table view                | ✅        | 2025-12-01 |
| TASK-027 | Configure blueprint routes with lazy loading               | ✅        | 2025-12-01 |
| TASK-028 | Register blueprint route in main routes.ts                 | ✅        | 2025-12-01 |

## 3. Alternatives

- **ALT-001**: Could use NgRx Store instead of Signal Store - not chosen to follow existing patterns
- **ALT-002**: Could implement all components in single file - not chosen for maintainability

## 4. Dependencies

- **DEP-001**: @angular/core ^20.3.0
- **DEP-002**: @supabase/supabase-js ^2.86.0
- **DEP-003**: ng-zorro-antd ^20.3.1
- **DEP-004**: Existing SupabaseService from core/supabase
- **DEP-005**: WorkspaceContextService from shared/services/account

## 5. Files

- **FILE-001**: `src/app/core/infra/types/blueprint/index.ts` - Type definitions
- **FILE-002**: `src/app/core/infra/repositories/blueprint/blueprint.repository.ts` - Blueprint repository
- **FILE-003**: `src/app/core/infra/repositories/blueprint/blueprint-member.repository.ts` - Member repository
- **FILE-004**: `src/app/shared/models/blueprint/blueprint.models.ts` - Business models
- **FILE-005**: `src/app/shared/services/blueprint/blueprint.service.ts` - Blueprint service
- **FILE-006**: `src/app/core/facades/blueprint/blueprint.facade.ts` - Blueprint facade
- **FILE-007**: `src/app/routes/blueprint/list/list.component.ts` - List component
- **FILE-008**: `src/app/routes/blueprint/create-blueprint/create-blueprint.component.ts` - Create modal
- **FILE-009**: `src/app/routes/blueprint/members/members.component.ts` - Members component
- **FILE-010**: `src/app/routes/blueprint/routes.ts` - Route configuration

## 6. Testing

- **TEST-001**: Build verification - Application builds successfully with no errors
- **TEST-002**: Type checking - TypeScript compilation passes
- **TEST-003**: Integration - Blueprint routes accessible at /blueprint path

## 7. Risks & Assumptions

- **RISK-001**: RPC function `create_blueprint` must exist in Supabase database
- **ASSUMPTION-001**: User will be authenticated before accessing blueprint routes
- **ASSUMPTION-002**: WorkspaceContextService will have currentUser populated

## 8. Related Specifications / Further Reading

- [supabase/seeds/init.sql](../supabase/seeds/init.sql) - Database schema definitions
- [PART 4: BLUEPRINT TABLES](../supabase/seeds/init.sql#L200) - Blueprint table definitions
- [PART 12: BLUEPRINT API](../supabase/seeds/init.sql#L400) - Blueprint RPC functions
