# GitHub Copilot Instructions for YDB Embedded UI

> **Note**: This file contains project-specific instructions for GitHub Copilot code review and assistance.
> These instructions are derived from AGENTS.md but formatted specifically for Copilot's consumption.
> When updating project conventions, update both AGENTS.md (for human developers) and this file (for Copilot).

## Project Overview

This is a React-based monitoring and management interface for YDB clusters. The codebase follows specific patterns and conventions that must be maintained.

## Tech Stack Requirements

- Use React 18.3 with TypeScript 5.x
- Use Redux Toolkit 2.x with RTK Query for state management
- Use Gravity UI (@gravity-ui/uikit) 7.x for UI components
- Use React Router v5 (NOT v6) for routing
- Use Monaco Editor 0.52 for code editing features

## Critical Coding Rules

### API Architecture

- NEVER call APIs directly - always use `window.api.module.method()` pattern
- Use RTK Query's `injectEndpoints` pattern for API endpoints
- Wrap `window.api` calls in RTK Query for proper state management

### Component Patterns

- Use BEM naming with `cn()` utility: `const b = cn('component-name')`
- Use `PaginatedTable` component for all data tables
- Tables require: columns, fetchData function, and unique tableName
- Use virtual scrolling for large datasets

### Internationalization (MANDATORY)

- NEVER hardcode user-facing strings
- ALWAYS create i18n entries in component's `i18n/` folder
- Follow key format: `<context>_<content>` (e.g., `action_save`, `field_name`)
- Register keysets with `registerKeysets()` using unique component name

### State Management

- Use Redux Toolkit with domain-based organization
- NEVER mutate state in RTK Query - return new objects/arrays
- Clear errors on user input in forms
- Always handle loading states in UI

### UI Components

- Prefer Gravity UI components over custom implementations
- Use `createToast` for notifications
- Use `ResponseError` component for API errors
- Use `Loader` and `TableSkeleton` for loading states

### Form Handling

- Always use controlled components with validation
- Clear errors on user input
- Validate before submission
- Use Gravity UI form components with error states

### Dialog/Modal Patterns

- Use `@ebay/nice-modal-react` for complex modals
- Use Gravity UI `Dialog` for simple dialogs
- Always include loading states

### Type Conventions

- API types prefixed with 'T' (e.g., `TTenantInfo`, `TClusterInfo`)
- Types located in `src/types/api/` directory

### Performance Requirements

- Use React.memo for expensive renders
- Lazy load Monaco Editor
- Batch API requests when possible
- Use virtual scrolling for tables

### Testing Patterns

- Unit tests colocated in `__test__` directories
- E2E tests use Playwright with page objects pattern
- Use CSS class selectors for E2E element selection

### Navigation (React Router v5)

- Use React Router v5 hooks (`useHistory`, `useParams`)
- Always validate route params exist before use

## Common Utilities

- Formatters: `formatBytes()`, `formatDateTime()` from `src/utils/dataFormatters/`
- Time parsing: utilities in `src/utils/timeParsers/`
- Query utilities: `src/utils/query.ts` for SQL/YQL helpers

## Before Making Changes

- Run `npm run lint` and `npm run typecheck` before committing
- Follow conventional commit message format
- Use conventional commit format for PR titles with lowercase subjects (e.g., "fix: update api endpoints", "feat: add new component", "chore: update dependencies")
- PR title subjects must be lowercase (no proper nouns, sentence-case, start-case, pascal-case, or upper-case)
- Ensure all user-facing text is internationalized
- Test with a local YDB instance when possible

## Debugging Helpers

- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- Enable request tracing with `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS`
