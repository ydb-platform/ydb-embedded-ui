# YDB Embedded UI - Code Patterns and Examples

## Actual Code Patterns from Reviews

## Components Patterns

### From PR #2642

\*Context: **Claude finished @artemmufazalov's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16651811661)

---

### Code Review for PR #2642: feat(Clusters): rework versions pr...\*

```typescript
const handleShowAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
// Can be simplified to: React.MouseEvent<HTMLButtonElement>
```

### From PR #2566

\*Context: ## Pull Request Overview

This PR customizes the default query streaming setting based on cluster backend, disabling streaming for legacy clusters.

- Introduced `useQueryStreamingSetting` hook to pic...\*

```
export const useQueryStreamingSetting = (): [boolean, (value: boolean) => void] => {
```

### From PR #2566

\*Context: ## Pull Request Overview

This PR customizes the default query streaming setting based on cluster backend, disabling streaming for legacy clusters.

- Introduced `useQueryStreamingSetting` hook to pic...\*

```
export function applyClusterSpecificQueryStreamingSetting(
```

## Hooks Patterns

### From PR #2642

\*Context: **Claude finished @artemmufazalov's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16651811661)

---

### Code Review for PR #2642: feat(Clusters): rework versions pr...\*

```typescript
const handleShowAllVersions = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
// Can be simplified to: React.MouseEvent<HTMLButtonElement>
```

### From PR #2633

\*Context: **Claude finished @Raubzeug's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16649719386)

---

## Code Review Summary

I've completed my review of this PR that refac...\*

```typescript
{
  row.UserSID || '–';
} // Should use i18n for the dash
{
  row.ApplicationName || '–';
} // Should use i18n for the dash
```

### From PR #2633

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16650126023)

---

Thanks for the clarification @astandrik! I've checked the current sta...\*

```typescript
{
  row.UserSID || '–';
}
{
  row.ApplicationName || '–';
}
```

## Api Patterns

### From PR #2643

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16654765327)

---

**Claude finished @astandrik's task** —— [View job](https://github.co...\*

```
https://api.github.com/repos/ydb-platform/ydb-embedded-ui/pulls/2643
```

### From PR #2643

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16654765327)

---

**Claude finished @astandrik's task** —— [View job](https://github.co...\*

```bash
gh api repos/ydb-platform/ydb-embedded-ui/pulls/2643 --jq '.author_association'
```

### From PR #1998

\*Context: > That only for good-looking purposes? Couldnt' really find reasonable matter

> Just asking =D Maybe missing something

When I create Api in embedded ui, I use function `createApi` with some de...\*

```js
// defaults
const api = createApi();
// with my values
const api = createApi({webVersion: false, withCredentials: false});
```

## Types Patterns

### From PR #2653

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16671737438)

---

## PR Review: Fix incorrect storage group count

I've reviewed the ch...\*

```typescript
text={
    storageGroupCount === undefined
        ? i18n('cards.storage-label')
        : i18n('context_storage-groups', {count: storageGroupCount})
}
```

### From PR #2653

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16672343140)

---

## PR Review: Fix incorrect storage group count

I've reviewed the ch...\*

```typescript
storageGroupsCount === undefined
  ? i18n('cards.storage-label')
  : i18n('context_storage-groups', {count: storageGroupsCount});
```

### From PR #2653

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16672343140)

---

## PR Review: Fix incorrect storage group count

I've reviewed the ch...\*

```typescript
   storageGroupsCount={tenantData.StorageGroups ? Number(tenantData.StorageGroups) : undefined}
```

## Tests Patterns

### From PR #2641

\*Context: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16648892532)

---

### PR Review: Claude Code GitHub Workflow

#### Todo List:

- [x] Rea...\*

```yaml
# allowed_tools: "Bash(npm run lint),Bash(npm run typecheck),Bash(npm run test),Bash(npm run build)"
```

### From PR #2514

\*Context: ## Pull Request Overview

This PR re-enables previously skipped end-to-end tests for the Diagnostics UI and enhances the Queries tab test by generating real query data.

- Re-enabled the TopShards his...\*

```
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
```

### From PR #2514

\*Context: ## Pull Request Overview

This PR re-enables previously skipped end-to-end tests for the Diagnostics UI and enhances the Queries tab test by generating real query data.

- Re-enabled the TopShards his...\*

```
    test('TopShards tab first row has values for all columns in History mode', async ({page}) => {
```

## Styles Patterns

### From PR #2655

\*Context: **Claude finished @Raubzeug's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16672561285)

---

### Todo List:

- [x] Gather context and understand the changes
- [x] R...\*

```css
--diagnostics-section-title-margin: 20px;
--diagnostics-section-margin: 30px;
--diagnostics-section-table-width: 100%;
```

### From PR #2214

\*Context: ## Pull Request Overview

This PR fixes the counting of pdisk-vdisk column widths by changing the types and conversions for maximumSlotsPerDisk and maximumDisksPerNode from strings to numbers, and pro...\*

```
const MAX_SLOTS_CSS_VAR = '--maximum-slots';
```

### From PR #2214

\*Context: ## Pull Request Overview

This pull request updates the storage utilities to count PDisk–VDisk column widths more accurately by converting maximum slot and disk values from strings to numbers. It also...\*

```
setTableStyle({ [MAX_SLOTS_CSS_VAR]: maxSlotsPerDisk, [MAX_DISKS_CSS_VAR]: maxDisksPerNode });
```
