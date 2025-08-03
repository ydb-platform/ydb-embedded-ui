# GitHub Copilot Instructions for YDB Embedded UI

> **Purpose**: Optimized guidance for GitHub Copilot when assisting with YDB Embedded UI development.
> Derived from AGENTS.md but structured for Copilot's code suggestion patterns.

## Quick Context

**Project**: React-based monitoring interface for YDB clusters
**Key Tech**: React 18.3 + TypeScript 5.x + Redux Toolkit 2.x + Gravity UI 7.x + React Router v5

## Critical Rules (Prevent 67% of Bugs)

> Based on analysis of 267 code review comments - these prevent production issues.

### API & State Management
- **NEVER** call APIs directly → use `window.api.module.method()` pattern
- **NEVER** mutate Redux state → return new objects/arrays  
- **ALWAYS** wrap `window.api` calls in RTK Query with `injectEndpoints`

### React Performance (MANDATORY)
- **ALWAYS** use `useMemo` for expensive computations, object/array creation
- **ALWAYS** use `useCallback` for functions in effect dependencies
- **ALWAYS** memoize table columns, filtered data, computed values

```typescript
// ✅ REQUIRED patterns
const displaySegments = useMemo(() => 
  segments.filter(segment => segment.visible), [segments]
);
const handleClick = useCallback(() => {
  // logic
}, [dependency]);
```

### Memory & Display Safety
- **ALWAYS** provide fallback values: `Number(value) || 0`
- **NEVER** allow division by zero: `capacity > 0 ? value/capacity : 0`
- **ALWAYS** dispose Monaco Editor: `return () => editor.dispose();` in useEffect

### Security & Input Validation
- **NEVER** expose authentication tokens in logs or console
- **ALWAYS** validate user input before processing
- **NEVER** skip error handling for async operations
## Internationalization (MANDATORY)

- **NEVER** hardcode user-facing strings
- **ALWAYS** create i18n entries in component's `i18n/` folder
- Follow key format: `<context>_<content>` (e.g., `action_save`, `field_name`)
- Register keysets with `registerKeysets()` using unique component name

```typescript
// ✅ CORRECT
const b = cn('component-name');
<Button>{i18n('action_save')}</Button>

// ❌ WRONG
<Button>Save</Button>
```

## Component Patterns

### Class Names (BEM)
```typescript
const b = cn('component-name');
<div className={b()}>
  <div className={b('element')}>
    <span className={b('element', {modifier: true})}>
```

### Tables & Data Display
- Use `PaginatedTable` component for all data tables
- Tables require: columns, fetchData function, and unique tableName
- Use virtual scrolling for large datasets

### Error Handling
```typescript
// ✅ REQUIRED - All async operations
try {
  const result = await apiCall();
  return result;
} catch (error) {
  return <ResponseError error={error} />;
}
```

### Forms
```typescript
// ✅ REQUIRED - Clear errors on input, validate before submit
const handleInputChange = (field, value) => {
  setValue(field, value);
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: null }));
  }
};
```

## Quality Gates (Before Every Commit)

1. ✅ Run `npm run lint` and `npm run typecheck` - NO exceptions
2. ✅ Verify ALL user-facing strings use i18n (search for hardcoded text)
3. ✅ Check ALL useEffect hooks have proper cleanup functions
4. ✅ Ensure memoization for ALL expensive operations
5. ✅ Validate error handling for ALL async operations
6. ✅ Confirm NO authentication tokens exposed in logs
7. ✅ Test mathematical expressions for edge cases (zero division)

## Code Suggestions Context

### Common Patterns to Suggest
- `const b = cn('component-name')` for new components
- `useMemo` for any array/object creation or filtering
- `useCallback` for event handlers in dependencies
- `i18n('key_name')` instead of hardcoded strings
- `Number(value) || 0` instead of `Number(value)`
- `condition > 0 ? calculation : 0` for divisions

### Avoid Suggesting
- Direct API calls (suggest `window.api` instead)
- Hardcoded strings (suggest i18n keys)
- State mutations (suggest immutable returns)
- Missing cleanup in useEffect
- Missing error boundaries for async operations

### Type Conventions
- API types: `TTenantInfo`, `TClusterInfo` (T prefix)
- Located in `src/types/api/`
- Use strict TypeScript, avoid `any`

### Navigation (React Router v5)
- Use `useHistory`, `useParams` (NOT v6 hooks)
- Always validate route params exist before use

## Common Utilities for Suggestions

- **Formatters**: `formatBytes()`, `formatDateTime()` from `src/utils/dataFormatters/`
- **Class Names**: `cn()` from `src/utils/cn`
- **Time Parsing**: utilities in `src/utils/timeParsers/`
- **Query Helpers**: `src/utils/query.ts` for SQL/YQL

## Performance Requirements

When suggesting code changes:
- Always consider React performance impact
- Suggest memoization for expensive operations
- Consider rendering performance for large datasets
- Prefer Gravity UI components over custom implementations
