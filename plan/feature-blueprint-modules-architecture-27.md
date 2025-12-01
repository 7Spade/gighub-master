---
goal: Architecture analysis for Blueprint & Modules system (Issue #27)
version: 1.0
date_created: 2025-12-01
last_updated: 2025-12-01
owner: 7Spade
status: 'Completed'
tags: ['feature', 'architecture', 'blueprint', 'modules', 'angular']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This implementation plan documents the Blueprint & Modules system architecture analysis and implementation for the GigHub application, based on Issue #27. The architecture follows a three-layer design (Foundation / Container / Business) with vertical slice feature architecture.

## 1. Requirements & Constraints

- **REQ-001**: Follow the three-layer architecture (Foundation/Container/Business)
- **REQ-002**: Implement vertical slice feature architecture for Blueprint module
- **REQ-003**: Blueprint Shell must serve as the logical container for all business modules
- **REQ-004**: Use Angular Signals for state management
- **REQ-005**: Follow Repository pattern for data access
- **REQ-006**: Support Task, Diary, Todo modules as core business modules
- **CON-001**: Must use Angular 20+ with standalone components
- **CON-002**: Must integrate with existing Supabase backend
- **CON-003**: Must follow ng-alain UI patterns
- **GUD-001**: Follow Occam's Razor principle - minimal implementation
- **PAT-001**: Use Signal Store patterns for state management

## 2. Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        基礎層 (Foundation Layer)                         │
│   帳戶體系 │ 認證授權 │ 組織管理 │ 團隊管理 │ Bot 管理                   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        容器層 (Container Layer)                          │
│   藍圖系統 │ 權限控制 │ 事件總線 │ 搜尋引擎 │ 通知中心                   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        業務層 (Business Layer)                           │
│   任務模組 │ 日誌模組 │ 待辦模組 │ 檔案模組 │ 問題追蹤                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Feature Folder Structure (Vertical Slice)

```
src/app/features/blueprint/
├── blueprint.routes.ts           # Feature routes
├── index.ts                      # Public API
├── domain/                       # Domain layer
│   ├── enums/                    # Business enums
│   │   ├── blueprint-status.enum.ts
│   │   ├── task-status.enum.ts
│   │   ├── task-priority.enum.ts
│   │   └── weather-type.enum.ts
│   └── interfaces/               # Business interfaces
│       ├── task.interface.ts
│       ├── diary.interface.ts
│       └── todo.interface.ts
├── data-access/                  # Data access layer
│   ├── repositories/             # Supabase data access
│   │   ├── task.repository.ts
│   │   ├── diary.repository.ts
│   │   └── todo.repository.ts
│   └── stores/                   # Signal stores
│       ├── task.store.ts
│       ├── diary.store.ts
│       └── todo.store.ts
├── shell/                        # Container shell
│   └── blueprint-shell.component.ts
└── ui/                           # UI components
    ├── dashboard/
    ├── task/
    ├── diary/
    └── todo/
```

## 3. Implementation Steps

### Implementation Phase 1: Documentation Setup

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Copy comprehensive docs from old/ folder to root           | ✅        | 2025-12-01 |
| TASK-002 | Verify docs include PRD, architecture, and spec documents  | ✅        | 2025-12-01 |

### Implementation Phase 2: Domain Layer

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-003 | Create BlueprintStatus enum                                | ✅        | 2025-12-01 |
| TASK-004 | Create TaskStatus enum with labels and colors              | ✅        | 2025-12-01 |
| TASK-005 | Create TaskPriority enum with labels and colors            | ✅        | 2025-12-01 |
| TASK-006 | Create WeatherType enum with labels and icons              | ✅        | 2025-12-01 |
| TASK-007 | Create Task interface and related types                    | ✅        | 2025-12-01 |
| TASK-008 | Create Diary interface and related types                   | ✅        | 2025-12-01 |
| TASK-009 | Create Todo interface and related types                    | ✅        | 2025-12-01 |

### Implementation Phase 3: Data Access Layer

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-010 | Create TaskRepository with CRUD operations                 | ✅        | 2025-12-01 |
| TASK-011 | Create DiaryRepository with CRUD operations                | ✅        | 2025-12-01 |
| TASK-012 | Create TodoRepository with CRUD operations                 | ✅        | 2025-12-01 |
| TASK-013 | Create TaskStore with Signal state management              | ✅        | 2025-12-01 |
| TASK-014 | Create DiaryStore with Signal state management             | ✅        | 2025-12-01 |
| TASK-015 | Create TodoStore with Signal state management              | ✅        | 2025-12-01 |

### Implementation Phase 4: Blueprint Shell Component

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-016 | Create BlueprintShellComponent as logical container        | ✅        | 2025-12-01 |
| TASK-017 | Implement sidebar navigation with module menu              | ✅        | 2025-12-01 |
| TASK-018 | Implement context loading and error handling               | ✅        | 2025-12-01 |
| TASK-019 | Integrate with WorkspaceContextService                     | ✅        | 2025-12-01 |

### Implementation Phase 5: UI Components

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-020 | Create BlueprintDashboardComponent with statistics         | ✅        | 2025-12-01 |
| TASK-021 | Create TaskListComponent with filtering                    | ✅        | 2025-12-01 |
| TASK-022 | Create DiaryListComponent with date filtering              | ✅        | 2025-12-01 |
| TASK-023 | Create TodoListComponent with completion tracking          | ✅        | 2025-12-01 |

### Implementation Phase 6: Routing Configuration

| Task     | Description                                                | Completed | Date       |
| -------- | ---------------------------------------------------------- | --------- | ---------- |
| TASK-024 | Create blueprint.routes.ts with lazy loading               | ✅        | 2025-12-01 |
| TASK-025 | Update main blueprint routes to use feature routes         | ✅        | 2025-12-01 |
| TASK-026 | Verify build and routing works correctly                   | ✅        | 2025-12-01 |

## 4. Core Components

### Blueprint Shell Component

The Blueprint Shell serves as the logical container for all business modules:

- **Responsibilities**:
  - Establish blueprint context from route params
  - Load and cache blueprint data
  - Manage sidebar navigation
  - Provide router outlet for child modules
  - Handle loading and error states

### Signal Stores

Each store follows the same pattern:
- Private writable signals for state
- Public readonly signals for consumers
- Computed signals for derived state
- Async methods for data operations
- Reset method for cleanup

### Repositories

Each repository follows the pattern:
- Inject SupabaseService
- Provide CRUD operations
- Handle errors consistently
- Return typed data

## 5. Files Created

### Domain Layer
- `src/app/features/blueprint/domain/enums/blueprint-status.enum.ts`
- `src/app/features/blueprint/domain/enums/task-status.enum.ts`
- `src/app/features/blueprint/domain/enums/task-priority.enum.ts`
- `src/app/features/blueprint/domain/enums/weather-type.enum.ts`
- `src/app/features/blueprint/domain/interfaces/task.interface.ts`
- `src/app/features/blueprint/domain/interfaces/diary.interface.ts`
- `src/app/features/blueprint/domain/interfaces/todo.interface.ts`

### Data Access Layer
- `src/app/features/blueprint/data-access/repositories/task.repository.ts`
- `src/app/features/blueprint/data-access/repositories/diary.repository.ts`
- `src/app/features/blueprint/data-access/repositories/todo.repository.ts`
- `src/app/features/blueprint/data-access/stores/task.store.ts`
- `src/app/features/blueprint/data-access/stores/diary.store.ts`
- `src/app/features/blueprint/data-access/stores/todo.store.ts`

### Shell & UI Layer
- `src/app/features/blueprint/shell/blueprint-shell.component.ts`
- `src/app/features/blueprint/ui/dashboard/blueprint-dashboard.component.ts`
- `src/app/features/blueprint/ui/task/task-list.component.ts`
- `src/app/features/blueprint/ui/diary/diary-list.component.ts`
- `src/app/features/blueprint/ui/todo/todo-list.component.ts`

### Routing
- `src/app/features/blueprint/blueprint.routes.ts`
- `src/app/routes/blueprint/routes.ts` (updated)

### Documentation
- `docs/` - Complete documentation from old/ folder

## 6. Testing

- **TEST-001**: Build verification - Application builds successfully ✅
- **TEST-002**: TypeScript compilation passes ✅
- **TEST-003**: Routes accessible at /blueprint/:id/* paths

## 7. Risks & Assumptions

- **RISK-001**: RLS policies must be properly configured in Supabase
- **ASSUMPTION-001**: User will be authenticated before accessing blueprint routes
- **ASSUMPTION-002**: Blueprint data exists in database

## 8. Next Steps (Future Work)

1. **Task CRUD Forms**: Implement create/edit modals for tasks
2. **Diary CRUD Forms**: Implement create/edit modals for diaries
3. **File Module**: Implement file upload and management
4. **Issue Module**: Implement issue tracking
5. **Checklist Module**: Implement quality acceptance checklists
6. **Notification System**: Implement real-time notifications

## 9. Related Specifications

- [Architecture Rules](../.github/copilot/architecture-rules.md)
- [Domain Glossary](../.github/copilot/domain-glossary.md)
- [PRD Document](../docs/prd/construction-site-management.md)
- [System Architecture](../docs/architecture/system-architecture.md)
