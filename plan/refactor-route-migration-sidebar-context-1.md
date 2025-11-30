---
goal: Migrate unused routes to demo directory and implement sidebar context switching based on workspace
version: 1.0
date_created: 2025-11-30
last_updated: 2025-11-30
owner: Development Team
status: 'Completed'
tags: ['refactor', 'migration', 'feature', 'sidebar']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan outlines the migration of unused demonstration routes from the main `routes` directory to a dedicated `demo` directory, and the implementation of sidebar context switching functionality based on workspace context. The sidebar switching feature dynamically updates the navigation menu based on the current workspace, similar to the data.json menu configuration approach.

## 1. Requirements & Constraints

- **REQ-001**: Move demonstration/example routes that are not essential for the main application to a separate `demo` directory
- **REQ-002**: Implement sidebar menu context switching based on the current workspace/context
- **REQ-003**: Sidebar menu should be dynamically loaded from configuration (similar to app-data.json menu approach)
- **REQ-004**: Maintain backward compatibility with existing route structure
- **SEC-001**: Ensure no security vulnerabilities are introduced during migration
- **CON-001**: Must use Angular 20+ standalone components pattern
- **CON-002**: Must follow ng-alain framework conventions
- **GUD-001**: Follow Angular style guide for file naming and component structure
- **GUD-002**: Use @delon/theme MenuService for menu management
- **PAT-001**: Use lazy loading for all feature modules

## 2. Implementation Steps

### Implementation Phase 1: Create Demo Directory Structure

- GOAL-001: Create the demo directory structure to house demonstration routes

| Task     | Description           | Completed | Date       |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Create `src/app/routes/demo` directory | ✅ | 2025-11-30 |
| TASK-002 | Create `src/app/routes/demo/routes.ts` barrel file with lazy-loaded routes | ✅ | 2025-11-30 |
| TASK-003 | Create `src/app/routes/demo/index.ts` export file | ✅ | 2025-11-30 |

### Implementation Phase 2: Migrate Demonstration Routes

- GOAL-002: Move demonstration/example routes to the demo directory

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-004 | Move `style` module (typography, gridmasonry, colors) to demo directory | ✅ | 2025-11-30 |
| TASK-005 | Move `widgets` module to demo directory | ✅ | 2025-11-30 |
| TASK-006 | Move `delon` example modules (form, st, util, print, qr, acl, guard, cache, downfile, xlsx, zip) to demo directory | ✅ | 2025-11-30 |
| TASK-007 | Update main routes.ts to load demo routes lazily | ✅ | 2025-11-30 |
| TASK-008 | Maintain backward compatibility with legacy paths | ✅ | 2025-11-30 |

### Implementation Phase 3: Implement Workspace Context Service

- GOAL-003: Create a service to manage workspace context and sidebar menu switching

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-009 | Create `WorkspaceContextService` in `src/app/core/workspace` directory | ✅ | 2025-11-30 |
| TASK-010 | Define workspace context interface with id, name, and menu configuration | ✅ | 2025-11-30 |
| TASK-011 | Implement workspace switching logic using Angular Signals | ✅ | 2025-11-30 |
| TASK-012 | Create workspace menu configuration JSON files in `src/assets/tmp/workspaces.json` | ✅ | 2025-11-30 |

### Implementation Phase 4: Integrate Sidebar Context Switching

- GOAL-004: Integrate workspace context with sidebar menu

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-013 | Update `StartupService` to support workspace-based menu loading | ✅ | 2025-11-30 |
| TASK-014 | Create workspace selector component for header | ✅ | 2025-11-30 |
| TASK-015 | Connect workspace changes to MenuService for dynamic menu updates | ✅ | 2025-11-30 |
| TASK-016 | Export workspace service from core/index.ts | ✅ | 2025-11-30 |

### Implementation Phase 5: Update Menu Configuration

- GOAL-005: Create workspace-specific menu configurations

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-017 | Create main workspace menu configuration (production routes only) | ✅ | 2025-11-30 |
| TASK-018 | Create demo workspace menu configuration (all demo routes) | ✅ | 2025-11-30 |
| TASK-019 | Integrate workspace configuration into startup flow | ✅ | 2025-11-30 |

### Implementation Phase 6: Testing and Validation

- GOAL-006: Ensure all changes work correctly and pass tests

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-020 | Run linting to verify code quality | ✅ | 2025-11-30 |
| TASK-021 | Run build to verify compilation | ✅ | 2025-11-30 |
| TASK-022 | Verify backward compatibility with legacy route paths | ✅ | 2025-11-30 |

## 3. Alternatives

- **ALT-001**: Keep all routes in main directory and use ACL to hide demo routes - Rejected because it doesn't reduce bundle size for production and doesn't provide clear separation
- **ALT-002**: Use environment configuration to include/exclude demo routes - Partially adopted as a supplementary approach
- **ALT-003**: Create a separate Angular library for demo components - Rejected due to complexity overhead

## 4. Dependencies

- **DEP-001**: @delon/theme MenuService - for dynamic menu management
- **DEP-002**: @delon/auth - for route guards
- **DEP-003**: Angular Router - for lazy loading configuration
- **DEP-004**: Angular Signals - for reactive workspace state management

## 5. Files

- **FILE-001**: `src/app/routes/routes.ts` - Updated main routes configuration
- **FILE-002**: `src/app/routes/demo/routes.ts` - New demo routes configuration
- **FILE-003**: `src/app/core/workspace/workspace-context.service.ts` - New workspace service
- **FILE-004**: `src/app/core/startup/startup.service.ts` - Updated for workspace support
- **FILE-005**: `src/app/core/index.ts` - Updated to export workspace service
- **FILE-006**: `src/assets/tmp/workspaces.json` - New workspace configurations
- **FILE-007**: `src/app/layout/basic/widgets/workspace-selector.component.ts` - New workspace selector
- **FILE-008**: `src/app/layout/basic/basic.component.ts` - Updated to include workspace selector

## 6. Testing

- **TEST-001**: Build verification - Completed successfully
- **TEST-002**: Linting verification - No errors (only pre-existing warnings)
- **TEST-003**: Route navigation - Backward compatibility maintained with legacy paths

## 7. Risks & Assumptions

- **RISK-001**: Breaking existing deep links to demo routes - Mitigated: Implemented legacy path redirects for backward compatibility
- **RISK-002**: Menu state inconsistency during workspace switch - Mitigated: Clear menu state before loading new configuration
- **ASSUMPTION-001**: The "old" data.json implementation referenced uses a workspace-aware menu structure similar to the current app-data.json
- **ASSUMPTION-002**: Demo routes are optional and can be excluded from production builds
- **ASSUMPTION-003**: Users will primarily use one workspace at a time

## 8. Related Specifications / Further Reading

- [ng-alain Menu Service Documentation](https://ng-alain.com/theme/menu)
- [Angular Router Lazy Loading](https://angular.dev/guide/routing/lazy-loading)
- [Angular Signals](https://angular.dev/guide/signals)
