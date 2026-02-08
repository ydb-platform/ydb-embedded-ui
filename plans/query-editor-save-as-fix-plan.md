# Plan: fix `Save query as...` tab sync and add E2E coverage

## Status

### Done

- all secondary `Save query as...` entry points were rewired to use a shared tab-aware save handler
- post-save tab synchronization now updates both tab title and [`savedQueryName`](../src/store/reducers/query/types.ts:105)
- dirty saved-tab close confirmation now allows saving under the currently bound saved-query name
- E2E coverage was added for save-via-tab-menu and save-via-hotkey in [`tests/suites/tenant/queryEditor/editorTabs.test.ts`](../tests/suites/tenant/queryEditor/editorTabs.test.ts)
- history-selection coverage was split into explicit single-tab and multi-tab scenarios in [`tests/suites/tenant/queryHistory/queryHistory.test.ts`](../tests/suites/tenant/queryHistory/queryHistory.test.ts)

### Remaining

- run targeted Playwright verification for the updated query editor and query history suites

## Goal

Fix the regression where saving through secondary `Save query as...` entry points stores the query but does not sync the active editor tab state, and add explicit E2E coverage for both tab-menu and hotkey save-as flows.

## Scope

- Query editor multi-tab save flows
- Tab title synchronization after successful save
- Saved-query binding synchronization via `savedQueryName`
- E2E coverage in [`tests/suites/tenant/queryEditor/editorTabs.test.ts`](../tests/suites/tenant/queryEditor/editorTabs.test.ts)

## Problem summary

The main save button path goes through [`useSaveQueryHandler()`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:40), which already does all required post-save synchronization:

- renames the active tab via [`renameQueryTab()`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:51)
- binds the tab to the saved query via [`setActiveTabSavedQueryName()`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:53)

But several new `Save query as...` entry points open the dialog with raw [`saveQuery`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:42) instead of the tab-aware handler:

- [`EditorTabs`](../src/containers/Tenant/Query/QueryEditor/EditorTabs/EditorTabs.tsx:40)
- [`YqlEditor`](../src/containers/Tenant/Query/QueryEditor/YqlEditor/YqlEditor.tsx:211)
- [`QueryEditor`](../src/containers/Tenant/Query/QueryEditor/QueryEditor.tsx:176)

Because of that, successful save from these paths updates the saved queries list but does not update the current tab title or state.

## Fix strategy

### 1. Unify save-as behavior behind one tab-aware callback

Status: done

Create a shared callback/hook that encapsulates the full post-save behavior currently living inside [`useSaveQueryHandler()`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:40).

Expected responsibilities of the shared handler:

- call the underlying persistence method
- rename the active tab on successful save
- set [`savedQueryName`](../src/store/reducers/query/types.ts:105) for the active tab
- preserve current single-tab behavior

Preferred implementation direction:

- either extract the common logic from [`useSaveQueryHandler()`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx:40) into a reusable hook
- or expose a dedicated helper from [`SaveQuery.tsx`](../src/containers/Tenant/Query/SaveQuery/SaveQuery.tsx)

Important constraint:

- all save entry points must end up using the same callback so future save-related behavior cannot diverge again

### 2. Rewire all `Save query as...` entry points

Status: done

Replace direct dialog wiring with the shared tab-aware save callback in:

- [`src/containers/Tenant/Query/QueryEditor/EditorTabs/EditorTabs.tsx`](../src/containers/Tenant/Query/QueryEditor/EditorTabs/EditorTabs.tsx)
- [`src/containers/Tenant/Query/QueryEditor/YqlEditor/YqlEditor.tsx`](../src/containers/Tenant/Query/QueryEditor/YqlEditor/YqlEditor.tsx)
- [`src/containers/Tenant/Query/QueryEditor/QueryEditor.tsx`](../src/containers/Tenant/Query/QueryEditor/QueryEditor.tsx)

Verification target after rewiring:

- after successful save, the active tab title becomes the saved query name
- the active tab becomes a saved tab from the UI perspective
- the primary action changes from `Save` to `Edit query`

### 3. Re-check dirty saved-tab close flow after the save unification

Status: done

After the shared save logic is in place, re-evaluate the dirty saved-tab close confirmation in [`useQueryTabsActions()`](../src/containers/Tenant/Query/QueryEditor/hooks/useQueryTabsActions.tsx:47).

Why this step is separate:

- part of the inconsistency may disappear once all save flows use the same handler
- but the close-confirmation path still needs dedicated validation because it currently branches using [`isTitleUserDefined`](../src/store/reducers/query/types.ts:82) rather than [`savedQueryName`](../src/store/reducers/query/types.ts:105)

Decision point for implementation:

- if the close flow still cannot overwrite the current saved query cleanly, make it explicitly reuse the existing edit behavior for saved tabs

## E2E plan

### Test 1. Save via tab menu updates tab state

Status: done

Add a new E2E case to [`tests/suites/tenant/queryEditor/editorTabs.test.ts`](../tests/suites/tenant/queryEditor/editorTabs.test.ts):

Scenario:

1. Open multi-tab query editor
2. Enter query text in the active tab
3. Open tab menu
4. Choose `Save query as...`
5. Save under a unique name
6. Verify active tab title changed to the saved name
7. Verify `Edit query` is visible
8. Verify `Save` is hidden
9. Verify editor content stayed unchanged

This test closes the current gap where [`Save query as action in tab menu opens save dialog with current tab title`](../tests/suites/tenant/queryEditor/editorTabs.test.ts:214) stops before the successful save step.

### Test 2. Save via hotkey updates tab state

Status: done

Add a separate E2E case to [`tests/suites/tenant/queryEditor/editorTabs.test.ts`](../tests/suites/tenant/queryEditor/editorTabs.test.ts):

Scenario:

1. Open multi-tab query editor
2. Enter query text in the active tab
3. Focus the editor hotkeys target or the editor itself, depending on which binding is exercised
4. Trigger the save-as hotkey
5. Save under a unique name
6. Verify active tab title changed to the saved name
7. Verify `Edit query` is visible
8. Verify `Save` is hidden

Purpose:

- explicitly protect the hotkey path, even if it later becomes just another entry into the same shared save callback

### Test 3. History selection is mode-dependent

Status: done

Add explicit mode-separated coverage in [`tests/suites/tenant/queryHistory/queryHistory.test.ts`](../tests/suites/tenant/queryHistory/queryHistory.test.ts):

- single-tab: selecting a history query over dirty editor state must show unsaved-changes confirmation
- multi-tab: selecting a history query over dirty editor state must open a new tab without confirmation and preserve the modified tab content

This replaces the previous ambiguous test that implicitly relied on the default editor mode.

## Validation checklist for implementation mode

- search all dialog openings for `SAVE_QUERY_DIALOG`
- confirm no secondary flow still passes raw persistence callback without tab sync
- verify tab title rename in multi-tab mode
- verify `savedQueryName` is set after save
- verify action button state switches correctly
- verify history selection behavior separately for single-tab and multi-tab modes
- run targeted E2E for [`tests/suites/tenant/queryEditor/editorTabs.test.ts`](../tests/suites/tenant/queryEditor/editorTabs.test.ts)
- run targeted E2E for [`tests/suites/tenant/queryHistory/queryHistory.test.ts`](../tests/suites/tenant/queryHistory/queryHistory.test.ts)
- re-check adjacent saved-query behavior in [`tests/suites/tenant/savedQueries/savedQueries.test.ts`](../tests/suites/tenant/savedQueries/savedQueries.test.ts)

## Minimal implementation order

1. Extract shared tab-aware save handler
2. Rewire tab-menu, editor-hotkey, and global-hotkey save-as entry points
3. Validate dirty saved-tab close flow
4. Add tab-menu E2E
5. Add hotkey E2E
6. Split history-selection coverage by mode
7. Run targeted verification
