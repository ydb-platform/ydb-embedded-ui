# Copilot Instructions

## Internationalization (i18n)

- Do NOT hardcode user-facing strings.
- ALWAYS use the component i18n keysets.
- For key naming, see `i18n-naming-ruleset.md` in the repo root.

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

## Critical Bug Prevention Patterns

### React Performance (MANDATORY)

- **ALWAYS** use `useMemo` for expensive computations, object/array creation
- **ALWAYS** use `useCallback` for functions in effect dependencies
- **ALWAYS** memoize table columns, filtered data, computed values
- **AVOID** `useEffect` when possible - prefer direct approaches with `useCallback`
- **PREFER** direct event handlers and callbacks over useEffect for user interactions

```typescript
// ✅ REQUIRED patterns
const displaySegments = useMemo(() => segments.filter((segment) => segment.visible), [segments]);
const handleClick = useCallback(() => {
  // logic
}, [dependency]);

// ✅ PREFER direct callbacks over useEffect
const handleInputChange = useCallback(
  (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  },
  [onSearchChange],
);

// ❌ AVOID unnecessary useEffect
// useEffect(() => {
//   onSearchChange?.(searchTerm);
// }, [searchTerm, onSearchChange]);
```

### Memory & Display Safety

- **ALWAYS** provide fallback values: `Number(value) || 0`
- **NEVER** allow division by zero: `capacity > 0 ? value/capacity : 0`
- **ALWAYS** dispose Monaco Editor: `return () => editor.dispose();` in useEffect

### Security & Input Validation

- **NEVER** expose authentication tokens in logs or console
- **ALWAYS** validate user input before processing
- **NEVER** skip error handling for async operations

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

### Display Placeholders (MANDATORY)

- ALWAYS use `EMPTY_DATA_PLACEHOLDER` for empty UI values. Do not hardcode em or en dashes (`—`, `–`) as placeholders. Hyphen `-`/dashes may be used as separators in titles/ranges. Before submitting a PR, grep for `—` and `–` and ensure placeholder usages use `EMPTY_DATA_PLACEHOLDER` from `src/utils/constants.ts`.

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

### URL Parameter Management (MANDATORY)

- **PREFER** `use-query-params` over `redux-location-state` for new development
- **ALWAYS** use Zod schemas for URL parameter validation with fallbacks
- **ALWAYS** use `z.enum([...]).catch(defaultValue)` pattern for safe parsing
- Use custom `QueryParamConfig` objects for encoding/decoding complex parameters

```typescript
// ✅ REQUIRED pattern for URL parameters
const sortColumnSchema = z.enum(['column1', 'column2', 'column3']).catch('column1');

const SortOrderParam: QueryParamConfig<SortOrder[]> = {
  encode: (value) => (value ? encodeURIComponent(JSON.stringify(value)) : undefined),
  decode: (value) => {
    try {
      return value ? JSON.parse(decodeURIComponent(value)) : [];
    } catch {
      return [];
    }
  },
};
```

## Common Utilities

- Formatters: `formatBytes()`, `formatDateTime()` from `src/utils/dataFormatters/`
- Time parsing: utilities in `src/utils/timeParsers/`
- Query utilities: `src/utils/query.ts` for SQL/YQL helpers

## Development Commands

```bash
npm run lint        # Run all linters before committing
npm run typecheck   # TypeScript type checking
npm run unused      # Find unused code
```

## Before Making Changes

- Run `npm run lint` and `npm run typecheck` before committing
- Follow conventional commit message format
- Use conventional commit format for PR titles with lowercase subjects (e.g., "fix: update api endpoints", "feat: add new component", "chore: update dependencies")
- PR title subjects must be lowercase (no proper nouns, sentence-case, start-case, pascal-case, or upper-case)
- PR title must not exceed 72 characters (keep them concise and descriptive)
- Ensure all user-facing text is internationalized
- Test with a local YDB instance when possible

## Debugging Helpers

- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- Enable request tracing with `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS`

## Environment Variables

- `REACT_APP_BACKEND` - Backend URL for single-cluster mode
- `REACT_APP_META_BACKEND` - Meta backend URL for multi-cluster mode
- `GENERATE_SOURCEMAP` - Set to `false` for production builds
