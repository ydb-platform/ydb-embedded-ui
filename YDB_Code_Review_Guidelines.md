# YDB Embedded UI Code Review Guidelines

_Generated from 361 pull requests (Feb 2025 - Aug 2025)_

These guidelines are compiled from recurring patterns and feedback in code reviews by the YDB Embedded UI team. They represent our coding standards and best practices.

---

## Table of Contents

- [1. Internationalization (i18n)](#1-internationalization-i18n)
- [2. Testing Requirements](#2-testing-requirements)
- [3. TypeScript & Type Safety](#3-typescript--type-safety)
- [4. API Usage & Backend Communication](#4-api-usage--backend-communication)
- [5. UI Components & User Experience](#5-ui-components--user-experience)
- [6. State Management](#6-state-management)
- [7. React Best Practices](#7-react-best-practices)
- [8. Code Organization & Naming](#8-code-organization--naming)
- [9. Performance Optimization](#9-performance-optimization)
- [10. Git & PR Conventions](#10-git--pr-conventions)

---

## 1. Internationalization (i18n)

**⚠️ Most common issue: 42 occurrences**

### Rules:

1. **NEVER use hardcoded strings in UI** - All user-facing text must use the i18n system
2. **Follow i18n naming conventions**: `<context>_<content>` format
   - Contexts: `action_`, `field_`, `title_`, `alert_`, `context_`, `confirm_`, `value_`
   - Examples: `action_save`, `field_name`, `title_dashboard`, `alert_error`
3. **Create i18n entries in component's `i18n/` folder** with `en.json` and proper registration

### ✅ Good Example:

```typescript
// src/components/MyComponent/i18n/en.json
{
    "action_save": "Save",
    "field_username": "Username",
    "alert_success": "Operation completed successfully"
}

// src/components/MyComponent/MyComponent.tsx
import i18n from './i18n';

<Button>{i18n('action_save')}</Button>
<TextField label={i18n('field_username')} />
```

### ❌ Bad Example:

```typescript
// Never do this!
<Button>Save</Button>
<TextField label="Username" />
<Alert>Operation completed successfully</Alert>
```

---

## 2. Testing Requirements

**⚠️ Second most common issue: 39 occurrences**

### Rules:

1. **Add tests for all new functionality and bug fixes**
2. **Include E2E tests for critical user flows** using Playwright
3. **Place unit tests in `__test__` directories** colocated with source files
4. **Test edge cases and error scenarios**

### Testing Checklist:

- [ ] Unit tests for new functions/components
- [ ] Integration tests for API calls
- [ ] E2E tests for user workflows
- [ ] Error handling tests
- [ ] Loading state tests

### Example Test Structure:

```typescript
// src/components/MyComponent/__test__/MyComponent.test.tsx
describe('MyComponent', () => {
  it('should render with loading state', () => {
    // Test implementation
  });

  it('should handle API errors gracefully', () => {
    // Test error scenario
  });
});
```

---

## 3. TypeScript & Type Safety

### Rules:

1. **Maintain proper type safety** - No implicit `any` types
2. **API types must be prefixed with 'T'**: `TTenantInfo`, `TClusterInfo`, `TStorageGroup`
3. **Avoid using `any`** - Use `unknown` or specific types instead
4. **Define proper interfaces** for component props and function parameters

### ✅ Good Example:

```typescript
// API types with T prefix
interface TTenantInfo {
  name: string;
  status: TEntityStatus;
  resources: TResourceUsage;
}

// Component props
interface MyComponentProps {
  tenant: TTenantInfo;
  onUpdate: (data: TTenantInfo) => void;
}

// Avoid any
function processData(data: unknown): ProcessedData {
  // Type guard or validation
  if (isValidData(data)) {
    return transformData(data);
  }
  throw new Error('Invalid data');
}
```

---

## 4. API Usage & Backend Communication

### Rules:

1. **ALWAYS use `window.api` for API calls** - Never call APIs directly
2. **Use RTK Query for API state management** with proper caching
3. **Implement proper polling/auto-refresh** with configurable intervals
4. **Handle loading and error states** in all API calls

### ✅ Correct API Usage:

```typescript
// Using window.api directly
const data = await window.api.tenant.getTenantInfo(tenantName);

// Using RTK Query (preferred)
const { data, isLoading, error } = tenantApi.useGetTenantInfoQuery(tenantName, {
    pollingInterval: autoRefreshInterval
});

// With error handling
if (error) {
    return <ResponseError error={error} />;
}
if (isLoading) {
    return <Loader />;
}
```

### ❌ Never Do This:

```typescript
// Direct fetch - NOT ALLOWED
const response = await fetch('/api/tenant/info');

// axios without window.api - NOT ALLOWED
const {data} = await axios.get('/tenant/info');
```

---

## 5. UI Components & User Experience

### Rules:

1. **Always handle loading states** (12 occurrences in reviews)
2. **Implement proper error states and user feedback** (9 occurrences)
3. **Prefer Gravity UI components** over custom implementations
4. **Use virtual scrolling** for large lists/tables
5. **Clear errors on user input**

### Component Pattern:

```typescript
function MyComponent() {
    const { data, isLoading, error } = useData();

    if (isLoading) {
        return <Loader />; // Always show loading state
    }

    if (error) {
        return <ResponseError error={error} />; // Handle errors
    }

    return (
        <div className={b()}>
            {/* Component content */}
        </div>
    );
}
```

### Table Implementation:

```typescript
// Always use PaginatedTable for large datasets
<PaginatedTable
    columns={columns}
    fetchData={fetchTableData}
    tableName="unique-table-name"
    virtualScroll // Enable for performance
/>
```

---

## 6. State Management

### Rules:

1. **Use selectors to access state data** (16 occurrences)
2. **Never mutate state directly** - Always return new objects/arrays
3. **Use Redux Toolkit and RTK Query** patterns
4. **Organize reducers by feature domain**

### ✅ Correct State Management:

```typescript
// In reducer - always return new state
return {
  ...state,
  items: [...state.items, newItem], // New array
};

// Using selectors
const tenantInfo = useSelector(selectTenantInfo);

// RTK Query
const [updateTenant] = tenantApi.useUpdateTenantMutation();
```

---

## 7. React Best Practices

### Rules:

1. **Always provide unique and stable keys** for list items (6 occurrences)
2. **Use controlled components** for form inputs
3. **Clean up effects** in useEffect to prevent memory leaks
4. **Use React.memo** for expensive renders
5. **Place hooks at the top** of components

### ✅ Good Practices:

```typescript
// Unique keys for lists
items.map(item => (
    <ListItem key={item.id} data={item} />
));

// Cleanup in useEffect
useEffect(() => {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer); // Cleanup
}, [callback, delay]);

// Controlled input
<TextInput
    value={value}
    onChange={(e) => setValue(e.target.value)}
/>
```

---

## 8. Code Organization & Naming

### Rules:

1. **Use BEM naming with `cn()` utility** for CSS classes
2. **Follow file organization structure**:
   - Reusable components: `src/components/`
   - Feature containers: `src/containers/`
   - API services: `src/services/api/`
   - Types: `src/types/` (with 'T' prefix for API types)
3. **Use conventional naming**:
   - camelCase for variables/functions
   - PascalCase for components/interfaces
   - UPPER_CASE for constants

### BEM Example:

```typescript
const b = cn('tenant-overview');

<div className={b()}>
    <div className={b('header', { active: isActive })}>
        <span className={b('title')}>{title}</span>
    </div>
</div>
```

---

## 9. Performance Optimization

### Rules:

1. **Use `useMemo` and `useCallback`** to prevent unnecessary re-renders
2. **Implement virtual scrolling** for large lists
3. **Lazy load heavy components** (e.g., Monaco Editor)
4. **Batch API requests** when possible

### Example:

```typescript
const expensiveValue = React.useMemo(() => computeExpensiveValue(data), [data]);

const handleClick = React.useCallback(
  (id: string) => {
    // Handle click
  },
  [dependency],
);
```

---

## 10. Git & PR Conventions

### Rules:

1. **Follow conventional commits**: `fix:`, `feat:`, `chore:`, `docs:`, etc.
2. **PR titles must pass commitlint** validation
3. **Run checks before committing**:
   ```bash
   npm run lint
   npm run typecheck
   ```
4. **Test with real backend** (not mock data)
5. **Remove debug/test files** before merging

### Commit Examples:

```
feat: add dark mode toggle to settings
fix: resolve memory leak in table component
chore: update dependencies
docs: add API usage examples
```

---

## Pre-Commit Checklist

Before submitting your PR, ensure:

- [ ] No hardcoded strings (all text uses i18n)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Tests added for new functionality
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Using `window.api` for all API calls
- [ ] Following BEM naming convention
- [ ] PR title follows conventional commits

---

## Quick Reference

### Common Imports:

```typescript
import {cn} from 'utils/cn'; // BEM utility
import i18n from './i18n'; // Internationalization
import {createToast} from 'utils/createToast'; // Notifications
import {Loader} from 'components/Loader'; // Loading state
import {ResponseError} from 'components/Errors'; // Error display
```

### API Pattern:

```typescript
// Always through window.api
await window.api.module.method(params);
```

### Component Structure:

```typescript
const b = cn('component-name');

export function ComponentName({prop}: Props) {
    // 1. Hooks
    const {data, isLoading} = useData();

    // 2. Handlers
    const handleAction = React.useCallback(() => {}, []);

    // 3. Early returns (loading/error)
    if (isLoading) return <Loader />;

    // 4. Main render
    return <div className={b()}>{/* content */}</div>;
}
```

---

_For detailed patterns and examples, refer to `CLAUDE.md` and `i18n-naming-ruleset.md` in the repository._
