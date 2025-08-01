# YDB Embedded UI - Comprehensive Code Review Analysis

_Deep analysis of 435 comments from 421 human reviews_

## 1. Naming Conventions (Real Examples)

### Specific Naming Rules Found:

- **"these should be in"** (1 times)
  - PR #2633: loper-facing and don't need i18n, but consider if these should be in production code at all.

4. **Column function inconsistency**: As noted by @astan...

- **"`DEBAUNCE_DELAY` → `DEBOUNCE_DELAY`"** (1 times)
  - PR #2633: drik.

### 📋 Recommendations

1. Fix the typo in `DEBAUNCE_DELAY` → `DEBOUNCE_DELAY`.
2. Consider extracting the empty value dash ('–') to a constant...

- **"warnings should be in"** (1 times)
  - PR #2633: rnings and don't need i18n
  - Consider if these warnings should be in production code at all

### 📊 Overall Assessment

The PR successfully improve...

- **"and should be avoided"** (1 times)
  - PR #2621: ype assertion bypasses TypeScript's type checking and should be avoided. Consider properly typing the fieldsRequired parameter or using a more specifi...
- **"it should be named"** (1 times)
  - PR #2608: appears to be for a ProgressWrapper component, so it should be named 'progress-wrapper' or 'tenant-storage-progress' to better reflect its purpose.
    ``...
- **"they should be hidden"** (1 times)
  - PR #2588: k is not replicated (Replicated=false). Otherwise they should be hidden.

2. progress of replication is a good thing. 100% should be displayed only on...

- **"it should be green"** (1 times)
  - PR #2588: />

2. replication progress shows red color. but it should be green always.

<img width="418" height="442" alt="Image" src="https://github.com/user-a...

- **"`undefined` should be replaced"** (1 times)
  - PR #2549: zero values with `0.000001`, where only `null` or `undefined` should be replaced. Nullish coalescing (`??`) is the correct operator.

2.  They perform ...

- **"and should be covered"** (1 times)
  - PR #2369: c for the “Add Cluster” button is new UI behavior and should be covered by component tests to catch potential regressions.

````
if (isClustersPage && i...
- **"issues should be fixed"** (1 times)
  - PR #2291: @Raubzeug as for now all known issues should be fixed (your screencast too)

Stand redeployed...

### Concrete Naming Examples:


## 2. Common Code Issues and Fixes

### Before/After Code Examples:

#### PR #2655 (claude):
**Issue**: **Claude finished @Raubzeug's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16672561285)

---
### Todo List:
- [x]...

**Before**:
```css
   --diagnostics-section-title-margin: 20px;
   --diagnostics-section-margin: 30px;
   --diagnostics-section-table-width: 100%;
````

**After**:

```tsx
   visible: clipboardButtonAlwaysVisible || infoIconHovered,
```

#### PR #2653 (claude):

**Issue**: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16672343140)

---

## PR Review: Fix i...

**Before**:

```typescript
storageGroupsCount === undefined
  ? i18n('cards.storage-label')
  : i18n('context_storage-groups', {count: storageGroupsCount});
```

**After**:

```typescript
   storageGroupsCount={tenantData.StorageGroups ? Number(tenantData.StorageGroups) : undefined}
```

#### PR #2643 (claude):

**Issue**: **Claude finished @astandrik's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16654697984)

---

I found the issue! ...

**Before**:

```yaml
(github.event.pull_request.author_association == 'OWNER' ||
github.event.pull_request.author_association == 'MEMBER' ||
github.event.pull_request.author_association == 'COLLABORATOR')
```

**After**:

```yaml
(github.event.pull_request.author_association == 'OWNER' ||
github.event.pull_request.author_association == 'MEMBER' ||
github.event.pull_request.author_association == 'COLLABORATOR' ||
github.event.pull_request.author_association == 'CONTRIBUTOR')
```

#### PR #2642 (claude):

**Issue**: **Claude finished @artemmufazalov's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16651811661)

---

### Code Revie...

**Before**:

```typescript
import i18n from './i18n';

// Missing: registerKeysets() call
// Should be: const i18n = registerKeysets(COMPONENT, {en});
```

**After**:

```typescript
const TRUNCATION_THRESHOLD = 4;
// One more line for Show more / Hide button
const MAX_DISPLAYED_VERSIONS = TRUNCATION_THRESHOLD - 1;
```

#### PR #2633 (claude):

**Issue**: **Claude finished @Raubzeug's task** —— [View job](https://github.com/ydb-platform/ydb-embedded-ui/actions/runs/16649719386)

---

## Code Review Summa...

**Before**:

```typescript
const DEBAUNCE_DELAY = 100; // Should be DEBOUNCE_DELAY
```

**After**:

```typescript
{
  row.UserSID || '–';
} // Should use i18n for the dash
{
  row.ApplicationName || '–';
} // Should use i18n for the dash
```

## 3. Specific Technical Requirements

### Most Common Requirements:

1. **always initialized.** (2 times)
   - Examples: PR #2649, #2649
2. **should work in case of package?** (2 times)
   - Examples: PR #1997, #1997
3. **should follow conventional commit format.** (1 times)
   - Examples: PR #2652
4. **should be "fix: Claude code review workflows to checkout PR head commit and add validation" since it's fixing a bug in the workflow logic.** (1 times)
   - Examples: PR #2652
5. **always reviewed.** (1 times)
   - Examples: PR #2652
6. **must be lowercase (commit 25e4e79).** (1 times)
   - Examples: PR #2652
7. **always has a valid initial value, preventing navigation failures when the tab state is undefined.** (1 times)
   - Examples: PR #2649
8. \*\*always has a value, this prevents potential navigation failures when the tab state would be undefined

## 3.\*\* (1 times)

- Examples: PR #2649

9. \*\*should improve stability of navigation-related E2E tests

## Additional Observations

1.\*\* (1 times)

- Examples: PR #2649

10. **should have triggered claude code review but it didnt - whats the problem?** (1 times)

- Examples: PR #2643

11. **should allow the workflow to trigger for regular contributors when PRs are moved from draft to ready for review.** (1 times)

- Examples: PR #2643

12. **must be prefixed with 'T'.** (1 times)

- Examples: PR #2642

13. \*\*Should be `TVersionValue`

- `VersionWithColorIndexes` → Should be `TVersionWithColorIndexes`
- `PreparedVersion` → Should be `TPreparedVersion`
- `PreparedVersions` → Should be `TPreparedVersions`

### 2.\*\* (1 times)

- Examples: PR #2642

14. \*\*Should be: const i18n = registerKeysets(COMPONENT, {en});

```

The component imports i18n but doesn't call `registerKeysets()` as required by the guidelines.** (1 times)
   - Examples: PR #2642
15. **should be `handleMouseLeave`

## 🔍 Other Observations

### 6.** (1 times)
   - Examples: PR #2642
16. **should be "first"
- src/utils/versions/clusterVersionColors.** (1 times)
   - Examples: PR #2642
17. **should be "Sum"

### 9.** (1 times)
   - Examples: PR #2642
18. **never assigned back to the result object.** (1 times)
   - Examples: PR #2642
19. **Should be DEBOUNCE_DELAY
```

2.\*\* (1 times)

- Examples: PR #2633

20. **Should use i18n for the dash
    {row.** (1 times)

- Examples: PR #2633

## 4. Reviewer-Specific Patterns

### astandrik (129 reviews)

**Common feedback themes**:

- PR #2652: "1) remove .github/workflows/scripts/test-claude-workflow-fix.sh please - this is unnecessary
  I just wanted you to somehow check that it actually works

2.  I wanted you to add copilot to instruction..."

- PR #2647: "Currently, the issue_comment event can only trigger workflows, if the workflow file is on the default branch (see [docs](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflow..."
- PR #2544: "1. **Unmigrated anchorRef Usage**
  - **File**: `src/containers/ReduxTooltip/ReduxTooltip.js`
  - **Lines**: 49, 62
  - **Issue**: Still using deprecated `anchorRef` prop instead of `anchorEleme..."

### copilot-pull-request-reviewer (163 reviews)

**Common feedback themes**:

- PR #2655: "## Pull Request Overview This PR refactors the TenantOverview component to remove tab-based interfaces and display all sections directly. The changes eliminate complex tabbed navigation in favor of a..."
- PR #2653: "## Pull Request Overview This PR fixes an issue with incorrect storage group count display in the YDB tenant overview. The fix ensures that the storage group count is fetched directly from the storag..."
- PR #2653: "## Pull Request Overview This PR fixes an incorrect storage group count display by passing the actual storage groups count from tenant data instead of calculating it from storage statistics array len..."

### copilot-swe-agent (25 reviews)

**Common feedback themes**:

- PR #2652: " > can we check somehow that this actually works? Yes! I've added comprehensive validation to verify the workflow fix works correctly: **Automatic Validation (commit 7040bdf):** - Both workflows now..."
- PR #2652: " > Can you add some rule to yourself to follow conventional commits in naming pr title?
  > like fix: ..., feat: ..., chore: .... You're absolutely right! The PR title should follow conventional commi..."
- PR #2652: " > 1) remove .github/workflows/scripts/test-claude-workflow-fix.sh please - this is unnecessary
  > I just wanted you to somehow check that it actually works
  >
  > ... 1) Removed the test script `.githu..."

### cursor (45 reviews)

**Common feedback themes**:

- PR #2611: "### ✅ Bugbot reviewed your changes and found no bugs! --- **Bugbot free trial expires on July 29, 2025** Learn more in the [Cursor dashboard](https://cursor.com/dashboard?tab=bugbot). \_Was this r..."
- PR #2608: "<details open> <summary><h3>Bug: Inconsistent Input Validation Across Reducers</h3></summary> The `setStorageTab` reducer directly assigns its payload without validation, unlike similar reducers (`se..."
- PR #2606: "<details open> <summary><h3>Bug: Dashboard Visibility State Initialization Bug</h3></summary> The `isDashboardHidden` state is initialized once based on the initial `graphShardExists` value. If `grap..."

### Raubzeug (27 reviews)

**Common feedback themes**:

- PR #2480: "> Could you provide description please of how (and where) it works now, where it wasn't working and what is #2d2c33 ? Such changes in global index.html looks a bit suspicious to me

  #2d2c33 - backg..."

- PR #2266: "> Hovered selected rows have additional margins around copy buttons
  > <img alt="Screenshot 2025-05-16 at 16 52 46" width="681" src="https://private-user-images.githubusercontent.com/67755036/4445..."
- PR #1974: "1) I'm already in query tab, and it seems no details :( And on Network tab query finished with 200 code.

2.  When results open with an illustration, vertical scroll appears. Lets get rid of it.

..."

### artemmufazalov (14 reviews)

**Common feedback themes**:

- PR #2287: "> <img width="372" alt="image" src="https://github.com/user-attachments/assets/c14093f0-0127-4a98-bbbe-dd083589a585" /> > > I think we can just do this with the same effect Empty string is the reaso..."
- PR #2266: "Hovered selected rows have additional margins around copy buttons

<img width="681" alt="Screenshot 2025-05-16 at 16 52 46" src="https://github.com/user-attachments/assets/2826fe87-8a6d-47ec-b908-b2..."

- PR #2026: "You should also `setIsDirty(false)` on save query

Probably it should be here (but it's better to check): https://github.com/ydb-platform/ydb-embedded-ui/blob/main/src/store/reducers/queryActions/qu..."

### adameat (18 reviews)

**Common feedback themes**:

- PR #2599: "it doesn't use real backend data:

 <img width="1083" height="687" alt="image" src="https://github.com/user-attachments/assets/195b34ab-2478-44c2-b98d-2dcf19ac6ded" />
 
 there is still mock data:
 
..."
- PR #2599: "1. the page now calls sysinfo handler twice for every refresh
 2. there is no data on threads page, even when the data exists in the response from sysinfo.
 
 please, fix and test with the real backen..."
- PR #2588: "that's what you did:
 <img width="1207" height="550" alt="image" src="https://github.com/user-attachments/assets/4271e5ff-0dd9-44a8-a8de-ad9ebb70e1f7" />
 
 
 1. we only need fields with replication p..."

## 5. Common Errors and Solutions

### Fix in Cursor</a> • <a href="https://cursor.

- Found in PRs: #2608, #2608, #2606, #2606, #2600

### error and was unable to review this pull request.

- Found in PRs: #2584, #2584, #2584, #2214, #2214

### fix.

- Found in PRs: #2652, #2652, #2652, #2652

### Fix in Web</a>

</details>

---

**Bugbot free trial expires on July 29, 2025**
Learn more in the [Cursor dashboard](https://cursor.

- Found in PRs: #2608, #2606, #2600, #2580

### errors.

- Found in PRs: #2319, #2319, #2069, #1974
- Solution example:

```
entitiesCountCurrent={found}
```

### Fix in Cursor</a>

</details>

---

**BugBot free trial expires on July 22, 2025**
You have used $0.

- Found in PRs: #2457, #2435, #2366

### fix: .

- Found in PRs: #2652, #2652

### fixed.

- Found in PRs: #2652, #2633
- Solution example:

```yaml
PR_HEAD_SHA=$(echo "$PR_DATA" | jq -r '.head.sha')
if [ -z "$PR_HEAD_SHA" ] || [ "$PR_HEAD_SHA" = "null" ]; then
echo "Failed to get PR head SHA"
exit 1
fi
```

### fix: list of donors can't be seen anymore.

- Found in PRs: #2588, #2588

### fixed, which is very good.

- Found in PRs: #2588, #2588
