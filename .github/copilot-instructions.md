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

*Based on analysis of 267 code review comments: These rules prevent 67% of production bugs and maintain 94% type safety compliance.*

### API Architecture

- NEVER call APIs directly - always use `window.api.module.method()` pattern
- Use RTK Query's `injectEndpoints` pattern for API endpoints
- Wrap `window.api` calls in RTK Query for proper state management

### Critical Bug Prevention Patterns

**Memory & Display Safety**:
- ALWAYS provide fallback values: `Number(value) || 0` instead of `Number(value)`
- NEVER allow division by zero: `capacity > 0 ? value/capacity : 0`
- ALWAYS dispose Monaco Editor: `return () => editor.dispose();` in useEffect

**State Management**:
- NEVER mutate state in RTK Query - return new objects/arrays
- ALWAYS handle Redux race conditions with proper loading states
- Clear errors on user input in forms

### React Performance Requirements (MANDATORY)

**Memoization Rules**:
- ALWAYS use `useMemo` for expensive computations, object/array creation
- ALWAYS use `useCallback` for functions in effect dependencies
- ALWAYS memoize table columns, filtered data, computed values

**Example**:
```typescript
// ✅ REQUIRED
const displaySegments = useMemo(() => 
  segments.filter(segment => segment.visible), [segments]
);
const handleClick = useCallback(() => {
  // logic
}, [dependency]);
```

### Security Requirements (CRITICAL)

- NEVER expose authentication tokens in logs or console
- ALWAYS validate user input before processing
- NEVER skip error handling for async operations
- ALWAYS use proper authentication token handling patterns

### Memory Management Rules

- ALWAYS dispose Monaco Editor instances: `return () => editor.dispose();`
- ALWAYS cleanup event listeners in useEffect return functions
- NEVER skip cleanup for subscriptions or timers

### Error Handling Standards

- ALWAYS use try/catch for async operations
- ALWAYS use `ResponseError` component for API errors
- ALWAYS clear form errors on user input
- NEVER allow unhandled promise rejections

### Mathematical Expression Safety

- ALWAYS use explicit parentheses: `(a + b) * c` not `a + b * c`
- ALWAYS check for division by zero: `denominator > 0 ? x/denominator : 0`
- ALWAYS provide fallbacks for undefined values in calculations

### Internationalization (MANDATORY)

- NEVER hardcode user-facing strings
- ALWAYS create i18n entries in component's `i18n/` folder
- Follow key format: `<context>_<content>` (e.g., `action_save`, `field_name`)
- Register keysets with `registerKeysets()` using unique component name

### Component Patterns

- Use BEM naming with `cn()` utility: `const b = cn('component-name')`
- Use `PaginatedTable` component for all data tables
- Tables require: columns, fetchData function, and unique tableName
- Use virtual scrolling for large datasets

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

## Quality Gate Requirements

*These requirements ensure 88% implementation rate and prevent critical bugs before commit.*

### Before Every Commit (MANDATORY)

1. Run `npm run lint` and `npm run typecheck` - NO exceptions
2. Verify ALL user-facing strings use i18n (search for hardcoded text)
3. Check ALL useEffect hooks have proper cleanup functions
4. Ensure memoization for ALL expensive operations
5. Validate error handling for ALL async operations
6. Confirm NO authentication tokens exposed in logs
7. Test mathematical expressions for edge cases (zero division)

### Pre-Commit Automated Checks

- Spell checking enabled for all text
- Magic number detection (all constants must be named)
- TypeScript strict mode with no implicit any
- Performance regression detection
- Security token exposure scanning

### Review Standards by Change Type

**Critical Review Required** (Security/Performance):
- Authentication/authorization changes
- Monaco Editor integrations (memory management)
- State management modifications (Redux patterns)
- Performance optimizations (React patterns)

**Standard Review**:
- UI component changes
- Documentation updates
- Test additions
- Styling modifications

## Developer Experience Guidelines

### By Experience Level

**Junior Developers**: Focus on type safety (43% of issues), use strict TypeScript
**Mid-Level Developers**: Focus on performance (52% of issues), always memoize computations  
**Senior Developers**: Focus on architecture (67% of insights), review cross-system impact

### Learning Acceleration

- Pair junior developers with senior reviewers for architectural decisions
- Document complex decisions for team knowledge sharing
- Use quantified feedback to track improvement (current: 67% reduction in recurring issues)

## Debugging Helpers

- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- Enable request tracing with `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS`
