# YDB Embedded UI - Actionable Development Guidelines

Based on analysis of 435 PR comments

## Quick Reference Card

### Before You Code:

- [ ] Check if similar component exists in `src/components/`
- [ ] Verify Gravity UI has the component you need
- [ ] Look for existing API patterns in `src/services/api/`

### While Coding:

- [ ] All strings use i18n: `i18n('context_text')`
- [ ] API calls use `window.api.module.method()`
- [ ] Types prefixed with 'T' for API types
- [ ] Components use `const b = cn('component-name')`
- [ ] Loading states handled with `<Loader />`
- [ ] Error states show `<ResponseError error={error} />`

### Before Committing:

- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Add tests for new features
- [ ] PR title: `fix:`, `feat:`, `chore:`

## Detailed Guidelines by Category

### CodeImprovements

- 1. **CSS Variable Addition** (src/containers/App/App.scss:33-37)
  ```css
  --diagnostics-section-title-margin: 20px;
  --diagnostics-section-margin: 30px;
  --diagnostics-section-table-width: 100%;
  ```
  These new CSS variables are added but I don't see them being used in the changed files. Consider removing if unused or documenting their purpose.

2. (1 occurrences)

- 3. **Performance Considerations**
  - All tables continue to use `ResizeableDataTable` which supports virtual scrolling ✅
  - Proper use of `React.useMemo` for column definitions in TopTables.tsx:56 ✅
  - Auto-refresh patterns maintained correctly

4. (1 occurrences)

- 1. **Branch targeting**: Both workflows will run on all PR branches. Consider restricting to specific branches if needed:
  ```yaml
  on:
    pull_request:
      branches: [main, develop] (1 occurrences)
  ```
- 1. **Typo in constant name** (src/utils/hooks/useScrollPosition.ts:6):
  ```typescript
  const DEBAUNCE_DELAY = 100; // Should be DEBOUNCE_DELAY
  ```

2. (1 occurrences)

- 3. **Console warnings not internationalized** (src/utils/hooks/useScrollPosition.ts:27,39,59):
  - Console warnings are developer-facing and don't need i18n, but consider if these should be in production code at all.

4. (1 occurrences)

### NamingConventions

- these should be in (1 occurrences)
- `DEBAUNCE_DELAY` → `DEBOUNCE_DELAY` (1 occurrences)
- warnings should be in (1 occurrences)
- and should be avoided (1 occurrences)
- it should be named (1 occurrences)

### ReactPatterns

- React hooks (55 occurrences)

### TestingPatterns

- storage-label')
  : i18n('context_storage-groups', {count: storageGroupCount})
  }

```

### ✅ Code Standards Compliance

- **TypeScript**: Type safety is maintained throughout the changes
- **i18n**: All user-facing strings use the i18n system correctly
- **API Patterns**: Follows the RTK Query pattern with proper hooks
- **React Patterns**: Uses hooks appropriately and maintains component purity
- **BEM Naming**: CSS classes follow the BEM convention with cn() utility

### 📋 Testing Recommendations

While the code changes look good, consider adding tests for:
1 (1 occurrences)
-

### Review Tasks:
- [x] Read modified files and understand changes
- [x] Review for TypeScript type safety and patterns
- [x] Check critical requirements (i18n, API calls, state mutations)
- [x] Assess performance and security implications
- [x] Evaluate testing considerations
- [x] Provide comprehensive review feedback

---

## Summary of Changes

The PR makes two simple but effective changes:
1 (1 occurrences)
- md)
- [x] Review TypeScript type safety and interfaces
- [x] Check React patterns and Gravity UI usage
- [x] Verify i18n implementation
- [x] Review API patterns and Redux usage
- [x] Check BEM naming conventions
- [x] Assess performance considerations
- [x] Review testing patterns
- [x] Provide comprehensive feedback

## Review Summary

Overall, this PR makes good improvements to the versions handling system (1 occurrences)
- ts` | New sorting function using indices with comprehensive test coverage |
| `src/utils/versions/parseNodesToVersionsValues (1 occurrences)
- md file
- [x] Check code quality and best practices
- [x] Identify potential bugs or issues
- [x] Evaluate security concerns
- [x] Assess performance considerations
- [x] Check for proper test coverage approach
- [x] Provide constructive feedback

---

### Comprehensive Review Feedback

#### ✅ **Strengths**

1 (1 occurrences)

### PerformancePatterns

- api usage)
- [x] Validate performance and security considerations
- [x] Review BEM naming convention usage
- [x] Provide comprehensive review feedback

## Code Review

This PR removes tabs functionality from the TenantOverview component, simplifying the UI structure (1 occurrences)
- ## Pull Request Overview

This PR refactors the TenantOverview component to remove tab-based interfaces and display all sections directly. The changes eliminate complex tabbed navigation in favor of a (1 occurrences)
-  **Performance Consideration** (src/containers/Tenant/Diagnostics/TenantOverview/MetricsTabs/MetricsTabs (1 occurrences)
-

### ⚡ Performance & Security

- **Performance**: No performance concerns (1 occurrences)
-
> can we check somehow that this actually works?

Yes! I've added comprehensive validation to verify the workflow fix works correctly:

**Automatic Validation (commit 7040bdf):**
- Both workflows now (1 occurrences)

### UiPatterns

-  100% should be displayed only once and always in a green color (1 occurrences)
-  **Adding debug logging** to help understand the actual API response structure

The table should now display data regardless of the specific field naming convention used by the blobindexstat API endpoint (1 occurrences)
-

The table should now display data correctly with the actual API response structure shown in your screenshots (1 occurrences)
-  Both should consistently use `currentData` for accurate and synchronized metric display (1 occurrences)
- tsx                | Replaced the isActive prop with shouldRender and shouldFetch, updating skip conditions and display settings accordingly (1 occurrences)

### ApiPatterns

- ts` | New hook to detect chart API availability without rendering components |
| `src/components/QueriesActivityBar/QueriesActivitySkeleton (2 occurrences)
- ts**: Evaluated as low risk
* **src/services/api/index (2 occurrences)
- com/ydb-platform/ydb-embedded-ui/actions/runs/16672561285)

---
### Todo List:
- [x] Gather context and understand the changes
- [x] Review TypeScript type safety and interface usage
- [x] Check React best practices and Gravity UI component usage
- [x] Verify Redux Toolkit patterns with RTK Query
- [x] Ensure i18n compliance (no hardcoded strings)
- [x] Check API call patterns (window.api usage)
- [x] Validate performance and security considerations
- [x] Review BEM naming convention usage
- [x] Provide comprehensive review feedback

## Code Review

This PR removes tabs functionality from the TenantOverview component, simplifying the UI structure (1 occurrences)
-  **Proper API Usage**: The fix correctly uses the storage API with RTK Query to fetch the actual storage group count instead of relying on the array length
2 (1 occurrences)
- StorageGroups` from the API response instead of deriving counts from storage statistics
2 (1 occurrences)

### BuildPatterns

- general (14 occurrences)

```
