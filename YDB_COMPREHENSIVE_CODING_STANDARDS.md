# YDB Embedded UI - Comprehensive Coding Standards & Guidelines

_Compiled from 435 code reviews across 361 PRs (Feb 2025 - Aug 2025)_

## Executive Summary

This document represents the definitive coding standards for the YDB Embedded UI project, derived from actual code review patterns. The most common issues found were:

1. **Hardcoded strings** (42 occurrences) - Always use i18n
2. **Missing tests** (39 occurrences) - All features need tests
3. **Improper state management** (16 occurrences) - Use selectors
4. **Missing loading states** (12 occurrences) - Always handle loading
5. **Poor error handling** (9 occurrences) - Implement proper error UI

---

## 1. Commit & PR Standards

### Conventional Commits (REQUIRED)

Based on feedback from @adameat and @astandrik:

```
feat: add new feature
fix: resolve bug
chore: update dependencies
docs: update documentation
test: add tests
refactor: code improvements
```

**Real Example from PR #2625:**

> "change title according to commitLint: https://github.com/conventional-changelog/commitlint/#what-is-commitlint" - @adameat

### PR Requirements

- Title must follow conventional commits format
- Keep PR description minimal and focused
- Remove test/debug files before merging
- Test with real backend, not mock data

---

## 2. TypeScript & Type Safety

### API Type Naming Convention

**CRITICAL:** All API types must be prefixed with 'T'

**From PR review:**

```
❌ Bad:
interface VersionValue { ... }
interface VersionWithColorIndexes { ... }

✅ Good:
interface TVersionValue { ... }
interface TVersionWithColorIndexes { ... }
```

### Type Safety Rules

1. Never use `any` - use `unknown` or specific types
2. Define interfaces for all props
3. Use proper generics for reusable components
4. Type all function parameters and return values

---

## 3. Backend Integration

### Critical Requirements from Reviews

**From PR #2599 by @adameat:**

> "we need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fields_required=-1"

### API Call Pattern

```typescript
// ALWAYS use window.api
const response = await window.api.viewer.getSysInfo({
  nodeId: nodeId,
  fields_required: -1, // Required for threads information
});

// NEVER direct fetch or axios
```

### Common Backend Issues

1. **Double API calls** - Check for duplicate requests on refresh
2. **Missing parameters** - Always verify backend documentation
3. **Mock data in production** - Remove all mock data before merging

**Real feedback from PR #2599:**

> "1. the page now calls sysinfo handler twice for every refresh 2. there is no data on threads page, even when the data exists in the response" - @adameat

---

## 4. UI/UX Standards

### Table Implementation Requirements

**From PR #2577 by @Raubzeug:**

> "please add sticky header for the table, and also let the table be resizable and sortable"

### Common UI Issues from Reviews

1. **Alignment Problems**
   From PR #2588: "values in tooltip don't look like others - wrong alignment"
2. **Color Usage**
   From PR #2588: "replication progress shows red color. but it should be green always"

3. **Data Display**
   - Show "–" for empty values, not empty string
   - Percentages: Show "7%" not "7% / 100%"
   - Conditional fields based on state (e.g., show replication only when Replicated=false)

### Loading & Error States

```typescript
// REQUIRED pattern for all components
if (isLoading) {
    return <Loader />;
}

if (error) {
    return <ResponseError error={error} />;
}

// Main render
return <YourComponent />;
```

---

## 5. Component Patterns

### Standard Component Structure

Based on codebase analysis and review feedback:

```typescript
const b = cn('component-name'); // BEM naming

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
    // 1. Hooks (at the top)
    const { data, isLoading, error } = useData();
    const [state, setState] = React.useState();

    // 2. Memoized values
    const expensiveValue = React.useMemo(() =>
        computeValue(data), [data]
    );

    // 3. Handlers
    const handleAction = React.useCallback(() => {
        // implementation
    }, [dependencies]);

    // 4. Early returns (loading/error)
    if (isLoading) return <Loader />;
    if (error) return <ResponseError error={error} />;

    // 5. Main render
    return (
        <div className={b()}>
            <div className={b('element', { modifier: true })}>
                {content}
            </div>
        </div>
    );
}
```

### Common Component Mistakes

From PR #2577: "the last commit is awful. Look through the project and use common patterns and components that were used in other places" - @Raubzeug

---

## 6. i18n Requirements (MOST COMMON ISSUE)

### Naming Convention

```typescript
// Pattern: <context>_<content>
action_save; // Buttons, links
field_username; // Form fields
title_dashboard; // Page/section titles
alert_error; // Notifications
context_help; // Descriptions
confirm_delete; // Confirmations
value_active; // Status values
```

### Implementation

```typescript
// Component structure
src/components/MyComponent/
├── i18n/
│   ├── en.json
│   └── index.ts
└── MyComponent.tsx

// Usage
import i18n from './i18n';
const i18n = registerKeysets('MyComponent', {en});

<Button>{i18n('action_save')}</Button>
```

---

## 7. Testing Requirements

### Test Coverage Rules

From review analysis: "Add tests for new functionality and bug fixes" (39 occurrences)

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should handle loading state', () => {
    // Test loading indicator appears
  });

  it('should handle errors gracefully', () => {
    // Test error display
  });

  it('should display data correctly', () => {
    // Test main functionality
  });
});
```

### E2E Testing

- Use Playwright for critical user flows
- Test with real backend when possible
- Remove skip() before merging

---

## 8. Performance Guidelines

### Virtual Scrolling

Required for tables with large datasets:

```typescript
<PaginatedTable
    virtualScroll
    columns={columns}
    fetchData={fetchData}
    tableName="unique-name"
/>
```

### Memoization

Use for expensive computations and callbacks:

```typescript
const memoizedValue = React.useMemo(() => expensiveOperation(data), [data]);

const stableCallback = React.useCallback(
  (id: string) => {
    // handle action
  },
  [dependency],
);
```

---

## 9. Redux & State Management

### Selector Usage (16 occurrences in reviews)

```typescript
// ALWAYS use selectors
const tenantInfo = useSelector(selectTenantInfo);

// NEVER access state directly
const tenantInfo = state.tenant.info; // ❌
```

### State Updates

```typescript
// ALWAYS return new objects/arrays
return {
  ...state,
  items: [...state.items, newItem],
};

// NEVER mutate
state.items.push(newItem); // ❌
```

---

## 10. Pre-Commit Checklist

Before submitting any PR, verify:

- [ ] **Conventional commit** format for PR title
- [ ] **No hardcoded strings** - all text uses i18n
- [ ] **Tests added** for new features/fixes
- [ ] **No TypeScript errors**: `npm run typecheck`
- [ ] **No lint errors**: `npm run lint`
- [ ] **Loading states** implemented
- [ ] **Error handling** in place
- [ ] **Real backend tested** (no mock data)
- [ ] **API types** prefixed with 'T'
- [ ] **BEM naming** with cn() utility
- [ ] **No debug/test files** in PR

---

## Reviewer-Specific Focus Areas

Based on 435 reviews analyzed:

- **@astandrik** (129 reviews): Focus on hooks, commit conventions, workflow optimization
- **@adameat** (18 reviews): Backend integration, real data usage, UI alignment
- **@artemmufazalov** (14 reviews): Table functionality, query parameters, test cleanup
- **@Raubzeug** (27 reviews): Component patterns, table features, package management

---

## Quick Reference Card

```typescript
// Imports
import {cn} from 'utils/cn';
import i18n from './i18n';
import {Loader} from 'components/Loader';
import {ResponseError} from 'components/Errors';

// BEM
const b = cn('component-name');

// API
await window.api.module.method(params);

// i18n
{i18n('action_save')}

// Loading/Error
if (isLoading) return <Loader />;
if (error) return <ResponseError error={error} />;
```

---

_This document is based on actual code reviews and should be treated as the authoritative guide for YDB Embedded UI development._
