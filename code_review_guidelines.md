# YDB Embedded UI Code Review Guidelines

_Generated from 361 pull requests (01/02/2025 - 01/08/2025)_

These guidelines are compiled from recurring patterns and feedback in code reviews. They represent the team's coding standards and best practices.

---

## Table of Contents

- [TypeScript & Type Safety](#typescript-type-safety)
- [Naming Conventions & Code Organization](#naming-conventions-code-organization)
- [Testing Requirements](#testing-requirements)
- [Performance & Optimization](#performance-optimization)
- [API Usage & Backend Communication](#api-usage-backend-communication)
- [State Management (Redux/RTK Query)](#state-management-redux-rtk-query-)
- [React Patterns & Best Practices](#react-patterns-best-practices)
- [Internationalization (i18n)](#internationalization-i18n-)
- [UI Components & Gravity UI](#ui-components-gravity-ui)
- [General Code Quality](#general-code-quality)

---

## TypeScript & Type Safety

**1. Maintain proper type safety throughout the codebase**

- _Mentioned in 4 reviews_

---

## Naming Conventions & Code Organization

**1. Use cn() utility for BEM class names**

- _Mentioned in 4 reviews_
- Example:
  ```
  const b = cn('kv-navigation');

````

**2. Use camelCase for variable and function names**
   - *Mentioned in 3 reviews*

**3. Use BEM naming convention with cn() utility for CSS classes**
   - *Mentioned in 3 reviews*

**4. Use PascalCase for React components and TypeScript interfaces**

---

## Testing Requirements

**1. Add tests for new functionality and bug fixes**
   - *Mentioned in 39 reviews*

**2. Include E2E tests for critical user flows using Playwright**
   - *Mentioned in 4 reviews*

---

## Performance & Optimization

**1. Use useMemo and useCallback to prevent unnecessary re-renders**
   - *Mentioned in 2 reviews*

**2. Use virtual scrolling for large lists and tables**

---

## API Usage & Backend Communication

**1. Implement proper polling/auto-refresh with configurable intervals**
   - *Mentioned in 7 reviews*

**2. Use RTK Query for API state management with proper caching**
   - *Mentioned in 6 reviews*

---

## State Management (Redux/RTK Query)

**1. Use selectors to access state data**
   - *Mentioned in 16 reviews*

---

## React Patterns & Best Practices

**1. Always provide unique and stable keys for list items**
   - *Mentioned in 6 reviews*

**2. Use controlled components for form inputs**

---

## Internationalization (i18n)

**1. Never use hardcoded strings in UI - always use i18n system**
   - *Mentioned in 42 reviews*

---

## UI Components & Gravity UI

**1. Always handle loading states in UI components**
   - *Mentioned in 12 reviews*

**2. Implement proper error states and user feedback**
   - *Mentioned in 9 reviews*

**3. Prefer Gravity UI components over custom implementations**
   - *Mentioned in 3 reviews*

---

## General Code Quality

---

## Project-Specific Standards

### File Organization
- Components go in `src/components/` (reusable) or `src/containers/` (feature-specific)
- API services in `src/services/api/`
- Redux reducers in `src/store/reducers/`
- TypeScript types in `src/types/` with 'T' prefix for API types

### Required Checks Before Commit
1. Run `npm run lint` - Fix all linting issues
2. Run `npm run typecheck` - Ensure no TypeScript errors
3. Test your changes with `npm test` for affected components
4. Verify no hardcoded strings (use i18n)

### API Integration Pattern
```typescript
// Always use window.api
const data = await window.api.tenant.getTenantInfo(tenantName);

// With RTK Query
const { data, isLoading, error } = tenantApi.useGetTenantInfoQuery(tenantName);
````

### Component Pattern

```typescript
// BEM naming with cn utility
const b = cn('component-name');

// Component structure
export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
    // hooks first
    const { data, isLoading } = useData();

    // handlers
    const handleClick = React.useCallback(() => {
        // implementation
    }, [dependencies]);

    // render
    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className={b()}>
            <div className={b('element')}>{data}</div>
        </div>
    );
}
```

### i18n Pattern

```typescript
// In component
import i18n from './i18n';

// Usage
<Button>{i18n('action_save')}</Button>

// Key naming: <context>_<content>
// Contexts: action_, field_, title_, alert_, context_, confirm_, value_
```

---

## Summary

These guidelines reflect the YDB Embedded UI team's commitment to code quality, maintainability, and consistency. Following these patterns ensures that the codebase remains clean, performant, and accessible to all team members.

For more details, refer to:

- `CLAUDE.md` - AI assistant instructions and detailed patterns
- `i18n-naming-ruleset.md` - Complete i18n naming conventions
- Project README - Setup and development instructions
