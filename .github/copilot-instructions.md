# Copilot Instructions for ng-alain

This document provides repository-wide instructions for GitHub Copilot to ensure consistent, high-quality contributions to the ng-alain project.

## Project Overview

ng-alain is an out-of-box UI solution for enterprise Angular applications built on top of ng-zorro-antd (Ant Design for Angular). It provides an admin panel front-end framework with features like responsive layout, i18n, lazy loading, and theming support.

## Technology Stack

- **Framework**: Angular 20+ with standalone components
- **UI Library**: ng-zorro-antd (Ant Design)
- **State Management**: Angular Signals + RxJS
- **Styling**: Less preprocessor
- **Build Tool**: Angular CLI
- **Package Manager**: Yarn 4
- **Testing**: Jasmine + Karma
- **Linting**: ESLint with Angular plugin + Stylelint for styles
- **Code Formatting**: Prettier

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server with live reload
yarn start

# Build for production
yarn build

# Run linting (TypeScript and styles)
yarn lint

# Run TypeScript linting only
yarn lint:ts

# Run style linting only
yarn lint:style

# Run tests with watch mode
yarn test

# Run tests with coverage (CI mode)
yarn test-coverage
```

## Project Structure

```
src/
├── app/
│   ├── core/           # Core services, guards, i18n, startup logic
│   ├── layout/         # Application layouts (header, sidebar, footer)
│   ├── routes/         # Feature modules with lazy-loaded routes
│   └── shared/         # Shared components, directives, pipes
├── assets/             # Static assets
├── environments/       # Environment configuration
└── styles/             # Global styles
```

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:
- `@shared` → `src/app/shared/index`
- `@core` → `src/app/core/index`
- `@env/*` → `src/environments/*`
- `@_mock` → `_mock/index`

## Coding Standards

### Angular Components

- Use **standalone components** by default (Angular 20+)
- Use `input()`, `output()`, `viewChild()`, `viewChildren()` signals instead of decorators
- Follow the `OnPush` change detection strategy for performance
- Keep templates clean; move complex logic to component classes or services
- Use the `inject()` function for dependency injection

### TypeScript

- Enable and maintain strict mode in `tsconfig.json`
- Define clear interfaces and types
- Use proper error handling with RxJS operators (`catchError`)
- Avoid `any` types when possible

### File Naming

- Components: `feature.component.ts`
- Services: `feature.service.ts`
- Directives: `feature.directive.ts`
- Pipes: `feature.pipe.ts`
- Models/Interfaces: `feature.model.ts` or `feature.types.ts`

### Styling

- Use **Less** preprocessor (not SCSS/SASS)
- Component-specific styles should be in `.less` files
- Follow ng-zorro-antd theming conventions
- Use Angular CDK utilities for responsive layouts

### Imports

Imports should be ordered (enforced by ESLint):
1. External packages (Angular, ng-zorro-antd, @delon/*)
2. Internal project modules
3. Parent/sibling/index imports

### Commit Messages

Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `style`, `test`

## Testing Guidelines

- Write unit tests for all new components, services, and pipes
- Use Angular's `TestBed` for component testing
- Mock HTTP requests using `provideHttpClientTesting`
- Test signal-based state updates
- Run tests before submitting PRs: `yarn test`

## Key Dependencies

### @delon packages
- `@delon/abc` - Business components
- `@delon/acl` - Access Control List
- `@delon/auth` - Authentication module
- `@delon/cache` - Caching service
- `@delon/chart` - Chart components
- `@delon/form` - Dynamic forms
- `@delon/mock` - Mock data service
- `@delon/theme` - Theme and layout
- `@delon/util` - Utilities

### ng-zorro-antd
Use ng-zorro-antd components for UI elements. Refer to [ng-zorro documentation](https://ng.ant.design/).

## Common Tasks

### Creating a New Feature Module

1. Create a new directory under `src/app/routes/`
2. Add standalone components for the feature
3. Configure lazy-loaded routes
4. Export components/services through an `index.ts` barrel file

### Adding a New Service

1. Create service in appropriate directory (`core/` or feature module)
2. Use `@Injectable({ providedIn: 'root' })` for singleton services
3. Use Angular's `inject()` function for dependency injection
4. Add proper typing for all methods

### Working with i18n

- Translation files are in `src/app/core/i18n/`
- Use the translation service for all user-facing text
- Support both English and Chinese locales

## CI/CD

The project uses GitHub Actions for CI:
- **Lint**: Runs ESLint and Stylelint
- **Test**: Runs Jasmine tests with ChromeHeadless
- **Build**: Builds the production bundle
- **Deploy**: Deploys preview to Surge.sh for PRs

## Important Notes

- Always run `yarn lint` before committing
- Ensure all tests pass with `yarn test`
- Follow the existing code style and patterns
- Document complex business logic with comments
- Keep bundle size in mind - use lazy loading for feature modules
