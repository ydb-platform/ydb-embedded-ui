# YDB Embedded UI - Deep Code Review Analysis

_Analyzed 435 comments from 361 PRs_

## Executive Summary

### Most Active Reviewers:

- **copilot-pull-request-reviewer**: 163 reviews (Focus: hooks)
- **astandrik**: 129 reviews (Focus: hooks)
- **cursor**: 45 reviews (Focus: hooks)
- **Raubzeug**: 27 reviews (Focus: general)
- **copilot-swe-agent**: 25 reviews (Focus: general)
- **adameat**: 18 reviews (Focus: general)
- **artemmufazalov**: 14 reviews (Focus: general)

## Detailed Technical Patterns

### API Call Patterns

#### Pattern: `)

- No new API calls needed
- Follows window.api pattern implicitly through existing code

### 🔍 Minor Observations

1. **Line 182-184** in `
   Found in 1 reviews

Example from PR #2653:

```inline
)
- No new API calls needed
- Follows window.api pattern implicitly through existing code

### 🔍 Minor Observations

1. **Line 182-184** in
```

#### Pattern: `https://api.github.com/repos/ydb-platform/ydb-embedded-ui/pulls/2643`

Found in 1 reviews

Example from PR #2643:

```text
https://api.github.com/repos/ydb-platform/ydb-embedded-ui/pulls/2643
```

#### Pattern: `

https://api.github.com/repos/ydb-platform/ydb-embedded-ui/pulls/2643
`
Found in 1 reviews

Example from PR #2643:

```inline

https://api.github.com/repos/ydb-platform/ydb-embedded-ui/pulls/2643

```

### Component Structure Patterns

#### Functional Component Patterns

From PR #2642:

```typescript
const handleShowAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
// Can be simplified to: React.MouseEvent<HTMLButtonElement>
```

From PR #2642:

```typescript
typescript
const handleShowAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
// Can be simplified to: React.MouseEvent<HTMLButtonElement>

```

### Error Handling Requirements

#### Error Handling (33 occurrences)

- PR #2655: "- Proper error handling maintained in all components"
  ```css
  --diagnostics-section-title-margin: 20px;
  --diagnostics-section-margin: 30px;
  --diagnostics-section-table-width: 100%;
  ```
- PR #2652: "- Fails with clear error if wrong commit is used"
  ```inline
  ✅ SUCCESS: Checked out correct PR head commit
  ```
- PR #2652: "1. **Error Handling**: The PR details step could benefit from error handling. If the GitHub API call fails, the workflow would continue with an empty `pr_head_sha`:"
  ```yaml
  PR_HEAD_SHA=$(echo "$PR_DATA" | jq -r '.head.sha')
  if [ -z "$PR_HEAD_SHA" ] || [ "$PR_HEAD_SHA" = "null" ]; then
  echo "Failed to get PR head SHA"
  exit 1
  fi
  ```

#### Loading States (17 occurrences)

- PR #2633: "- ✅ Proper loading states and error handling"
  ```typescript
  const DEBAUNCE_DELAY = 100; // Should be DEBOUNCE_DELAY
  ```
- PR #2630: "ActivityBar component to support different display modes based on chart availability and add proper loading states."
- PR #2630: "- Added skeleton loading states and alert-style fallback components"
  ```inline
  src/store/reducers/query/__test__/tabPersistence.test.tsx
  ```

## Specific Technical Requirements

### Backend Parameter Requirements

- **PR #2655** (copilot-pull-request-reviewer): parameter handling
  Context: "## Pull Request Overview

This PR refactors the TenantOverview component to remove tab-based interfaces and display all sections directly. The changes eliminate complex tabbed navigation in favor of a..."

- **PR #2653** (claude): parameters validation
  Context: "**Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16671737438)

---

## PR Review: Fix incorrect storage group count

I've reviewed the ch..."

- **PR #2652** (claude): parameter correctly
  Context: "**Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16671584511)

---

## Code Review

### Todo List:

- [x] Read changed workflow files to u..."

- **PR #2642** (copilot-pull-request-reviewer): parameter types
  Context: "## Pull Request Overview

This PR reworks the versions progress bar by adding majorIndex and minorIndex to version data for proper sorting, and creates a new `VersionsBar` component. The changes refac..."

- **PR #2635** (copilot-pull-request-reviewer): parameters for
  Context: "## Pull Request Overview

This PR adds a network section to the tenant diagnostics interface, providing visibility into network statistics such as ping times and clock skew across nodes. This enhancem..."

- **PR #2621** (copilot-pull-request-reviewer): parameter or
  Context: "## Pull Request Overview

This PR adds a new Network section to the tenant diagnostics page, implementing network monitoring capabilities. The Network section provides two tabs for viewing nodes by pi..."

- **PR #2608** (copilot-pull-request-reviewer): parameters and
  Context: "## Pull Request Overview

This PR redesigns the Storage section of the tenant overview page by introducing tabbed navigation to better organize storage-related information. The changes add state manag..."

- **PR #2608** (copilot-pull-request-reviewer): parameter handling
  Context: "## Pull Request Overview

This PR redesigns the Storage section of the tenant overview page by introducing a tabbed interface to better organize storage-related information. The changes move from disp..."

- **PR #2608** (copilot-pull-request-reviewer): parameter management
  Context: "## Pull Request Overview

This PR redesigns the Storage section of the tenant overview page by restructuring the UI to use tabs for different storage views and modernizing the progress visualization c..."

- **PR #2604** (copilot-pull-request-reviewer): parameter to
  Context: "## Pull Request Overview

This PR adds CSRF protection support to the YdbEmbeddedAPI by introducing a configurable token getter function. The changes enable CSRF tokens to be set across all API servic..."

- **PR #2599** (adameat): parameters for
  Context: "I forgot to tell you, that we need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fields_required=-1 - so it will return Threads information...."

- **PR #2599** (copilot-swe-agent): parameters for
  Context: "
  > I forgot to tell you, that we need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fields_required=-1 - so it will return Threads information.

..."

- **PR #2588** (adameat): parameters are
  Context: "<img width="583" height="457" alt="image" src="https://github.com/user-attachments/assets/2091a95e-2b7b-42af-90d1-295dee684a1a" />

change list of donors to show hyperlink for every donor to corresp..."

- **PR #2588** (copilot-swe-agent): parameters and
  Context: "

  > <img width="583" height="457" alt="image" src="https://github.com/user-attachments/assets/2091a95e-2b7b-42af-90d1-295dee684a1a" />
  >
  > change list of donors to show hyperlink for every donor to ..."

- **PR #2549** (copilot-pull-request-reviewer): parameter to
  Context: "## Pull Request Overview

This PR adds a real-time Queries Activity banner to the Tenant diagnostics page, introduces a reusable TimeFrameDropdown component, and enhances MetricChart with a timeframe ..."

- **PR #2549** (cursor): parameters change
Context: "<details open>
<summary><h3>Bug: RTK Query Hook Data Inconsistency</h3></summary>

Inconsistent destructuring of RTK Query hook results: `queriesPerSecData` (line 56) uses `data` while `latencyData` (..."

- **PR #2549** (copilot-pull-request-reviewer): parameter and
  Context: "## Pull Request Overview

Adds a new Queries Activity banner to the Tenant Overview page to display live query metrics and charts.

- Introduces a `queryMode` route parameter and updates navigation to..."

- **PR #2549** (copilot-pull-request-reviewer): parameter to
  Context: "## Pull Request Overview

This PR introduces a new Queries Activity banner and related utilities to the tenant diagnostics view, along with a generic timeframe dropdown component and support for dropd..."

- **PR #2474** (copilot-pull-request-reviewer): parameter to
  Context: "## Pull Request Overview

This PR adds a new user setting for selecting the ACL syntax format and integrates the selection (via a dialect/ACL syntax parameter) throughout the ACL-related API calls, se..."

- **PR #2473** (copilot-pull-request-reviewer): parameter to
  Context: "## Pull Request Overview

This PR updates the Tablets table view to remove host fqdn and node id columns when a nodeId is provided, addressing the issue reported in #1578.

- Updated the getColumns fun..."

- **PR #2462** (copilot-pull-request-reviewer): parameter contains
  Context: "## Pull Request Overview

This PR introduces a temporary mechanism to disable query streaming when the URL `backend` parameter contains “oidc”.

- Adds `useQueryParams` checks for an `oidc` substring ..."

- **PR #2435** (copilot-pull-request-reviewer): parameters and
  Context: "## Pull Request Overview

This PR enhances the Operations tab by making page size required, introducing infinite scrolling with auto-load and manual refresh, and extending table columns and loading UI..."

- **PR #2435** (copilot-pull-request-reviewer): parameter required
  Context: "## Pull Request Overview

This PR addresses fixes and enhancements for the Operations tab while improving test coverage and UI behavior. Key changes include:

- Skipping and marking tests that are impa..."

- **PR #2435** (copilot-pull-request-reviewer): parameter is
  Context: "## Pull Request Overview

This PR implements and fixes the Operations tab by adding infinite scrolling, mock backends for Playwright tests, and updating the API/store to support paginated operation li..."

- **PR #2347** (copilot-pull-request-reviewer): parameters in
  Context: "## Pull Request Overview

This PR ensures that tables reset their scroll position to the top when a sort action occurs, and it gives each grouped/paginated table its own independent sort state.

- Add..."

- **PR #2347** (copilot-pull-request-reviewer): parameter naming
  Context: "## Pull Request Overview

This PR aims to fix the bug where tables do not scroll to the top when sorting. It introduces independent sort state per table/group and renames/updates props (from tableProp..."

- **PR #2335** (copilot-pull-request-reviewer): parameters but
  Context: "## Pull Request Overview

This PR aims to optimize scrolling performance for the table component by refining the way visible and fetchable chunks are determined. Key changes include replacing the over..."

- **PR #2321** (copilot-pull-request-reviewer): parameter name
  Context: "## Pull Request Overview

This PR adds mock node data generation, enables a mock mode in `getStorageNodes` based on URL parameters, and removes initial sort and entity initialization from the paginate..."

- **PR #2281** (copilot-pull-request-reviewer): parameter and
  Context: "## Pull Request Overview

This PR refactors the diagnostics functionality by splitting CDC and its implementation, aiming to fix the Tablets tab bug and simplify the underlying logic. Key changes incl..."

- **PR #2248** (copilot-pull-request-reviewer): parameter flags
  Context: "## Pull Request Overview

This PR fixes the paginated table’s visible range calculation on window resize by updating the scroll and resize handling logic and adding mock node generation support.

- I..."

- **PR #2234** (copilot-pull-request-reviewer): parameters with
  Context: "## Pull Request Overview

This pull request refactors how sorting columns are handled in queries by extracting sorting hooks into dedicated files and syncing sort parameters with the URL. Key changes ..."

- **PR #2214** (copilot-pull-request-reviewer): parameter and
  Context: "## Pull Request Overview

This PR fixes the counting of pdisk-vdisk column widths by changing the types and conversions for maximumSlotsPerDisk and maximumDisksPerNode from strings to numbers, and pro..."

- **PR #2214** (copilot-pull-request-reviewer): parameter types
  Context: "## Pull Request Overview

This pull request updates the storage utilities to count PDisk–VDisk column widths more accurately by converting maximum slot and disk values from strings to numbers. It also..."

- **PR #2198** (copilot-pull-request-reviewer): parameter for
  Context: "## Pull Request Overview

This PR adds a new endpoint for connecting to DB code snippets and updates various API calls to use an object parameter for the endpoint and tenant queries. Key changes inclu..."

- **PR #2134** (copilot-pull-request-reviewer): parameter and
  Context: "## Pull Request Overview

This PR introduces a side panel ("refrigerator") to display detailed query text and related information in the Top Queries view. Key changes include:

- Updating sorting behav..."

- **PR #2059** (copilot-pull-request-reviewer): parameter and
  Context: "## Pull Request Overview

This PR addresses an issue with test execution in Safari by removing a browser-specific skip and introducing a style workaround to mitigate rendering problems when handling l..."

- **PR #2054** (copilot-pull-request-reviewer): parameter in
  Context: "## Pull Request Overview

This pull request implements updates to the tablet family by changing the tablet API call, adjusting data filtering, and updating UI components related to tablets. Key change..."

- **PR #2036** (copilot-pull-request-reviewer): parameter instead
  Context: "## Pull Request Overview

This PR adds a new function to parse logging links as default values and refactors related components to use the logging parameter instead of a previously used clusterName. K..."

- **PR #2030** (copilot-pull-request-reviewer): parameters hook
  Context: "## Pull Request Overview

This PR updates the export operation kind identifier from "export" to "export/s3" for better specificity and consistency.

- Changed the operation kind in the constants file..."

## Common Anti-Patterns to Avoid

### "avoid confusion." (mentioned 3 times)

```text
import React from 'react';
```

### "don't see any changes from the original version." (mentioned 2 times)

### "don't see them being used in the changed files." (mentioned 1 times)

```css
--diagnostics-section-title-margin: 20px;
--diagnostics-section-margin: 30px;
--diagnostics-section-table-width: 100%;
```

### "don't follow this convention:

- `versionvalue` → should be `tversionvalue`
- `versionwithcolorindexes` → should be `tversionwithcolorindexes`
- `preparedversion` → should be `tpreparedversion`
- `preparedversions` → should be `tpreparedversions`

### 2." (mentioned 1 times)

```typescript
import i18n from './i18n';

// Missing: registerKeysets() call
// Should be: const i18n = registerKeysets(COMPONENT, {en});
```

### "never assigned back to the result object." (mentioned 1 times)

```typescript
import i18n from './i18n';

// Missing: registerKeysets() call
// Should be: const i18n = registerKeysets(COMPONENT, {en});
```

### "don't need i18n, but consider if these should be in production code at all." (mentioned 1 times)

```typescript
const DEBAUNCE_DELAY = 100; // Should be DEBOUNCE_DELAY
```

### "don't block the functionality." (mentioned 1 times)

```typescript
const DEBAUNCE_DELAY = 100; // Should be DEBOUNCE_DELAY
```

### "don't need i18n

- consider if these warnings should be in production code at all

### 📊 overall assessment

the pr successfully improves the tenant diagnostics cpu section with:

- better architectural patterns (statswrapper, queriestablewithdrawer)
- proper i18n for new components
- cleaner code structure without the complex tabbed interface
- good adherence to the codebase conventions

the remaining issues are minor and don't affect the functionality." (mentioned 1 times)

```typescript
{
  row.UserSID || '–';
}
{
  row.ApplicationName || '–';
}
```

### "avoided." (mentioned 1 times)

```text
})),
```

### "don't look like others - wrong alignment

> <img width="418" height="442" alt="image" src="https://github." (mentioned 1 times)

```inline
inverseColorize={true}
```

### "don't look like others - wrong alignment

<img width="418" height="442" alt="image" src="https://github." (mentioned 1 times)

### "never called." (mentioned 1 times)

### "never the user selects a new partition." (mentioned 1 times)

```text
handlePartitionChange?: (value: string[]) => void;
```

### "avoid potential runtime errors when it's not passed." (mentioned 1 times)

```text
handlePartitionChange?: (value: string[]) => void;
```

### "avoid typos and improve consistency." (mentioned 1 times)

```text
[TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
```

### "never updated or used; consider removing them to simplify the component." (mentioned 1 times)

```text
import {ChevronDown} from '@gravity-ui/icons';
```

### "never load or become visible." (mentioned 1 times)

```inline
width > maxDataPoints
```

### "avoid duplicate toasters." (mentioned 1 times)

```text
const toaster = new Toaster();
```

### "avoid breaking the title display logic." (mentioned 1 times)

```text
},
```

### "never used." (mentioned 1 times)

```text
const drawerRef = React.useRef<HTMLDivElement>(null);
```

### "never used in the component." (mentioned 1 times)

```text
active?: boolean;
```

### "avoid duplication and ease future updates." (mentioned 1 times)

```text
function StorageNodesControlsWithTableState({
```

### "don't have a good decision." (mentioned 1 times)

### "avoid potential confusion with types or class names." (mentioned 1 times)

```text
poolNames.slice(0, count).map((Name) => ({
```

### "avoid styling issues in the rendered table." (mentioned 1 times)

```text
setTableStyle({ [MAX_SLOTS_CSS_VAR]: maxSlotsPerDisk, [MAX_DISKS_CSS_VAR]: maxDisksPerNode });
```

### "avoid runtime issues." (mentioned 1 times)

```text
{withBasename: isExternalLink},
```

### "avoid accidental double slashes." (mentioned 1 times)

```text
if (window.meta_backend) {
```

### "avoid unintended data processing." (mentioned 1 times)

```text
});
```

### "avoid potential runtime errors." (mentioned 1 times)

```text
cancelQueryResponse.reset();
```
