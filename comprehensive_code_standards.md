# YDB Embedded UI - Comprehensive Code Review Standards

_Based on actual code reviews from astandrik, artemmufazalov, adameat, Raubzeug and others_

## Table of Contents

1. [Real Code Review Examples](#real-code-review-examples)
2. [Technical Requirements by Reviewer](#technical-requirements-by-reviewer)
3. [Common Issues and Solutions](#common-issues-and-solutions)
4. [Backend Integration Patterns](#backend-integration-patterns)
5. [UI/UX Standards](#uiux-standards)
6. [Performance Guidelines](#performance-guidelines)

---

## Real Code Review Examples

### Critical Technical Feedback

### Reviews by astandrik

#### Example 1 (PR #2652)

```
Can you add some rule to yourself to follow conventional commits in naming pr title?
like fix: ..., feat: ..., chore: ....
```

#### Example 2 (PR #2652)

```
1) remove .github/workflows/scripts/test-claude-workflow-fix.sh please - this is unnecessary
I just wanted you to somehow check that it actually works

2) I wanted you to add copilot to instructions that titles should follow conventional commits
```

#### Example 3 (PR #2652)

```
Validate checkout (verification step) in workflows looks excessive too
```

#### Example 4 (PR #2652)

```
PR Title / Verify Title check fails with current title - find the problem and add adjust rule in copilot instructions
```

#### Example 5 (PR #2647)

```
Currently, the issue_comment event can only trigger workflows, if the workflow file is on the default branch (see [docs](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#issue_comment)).

https://github.com/orgs/community/discussions/59389
```

### Reviews by artemmufazalov

#### Example 1 (PR #2633)

```
Sorting in table is not descending

<img width="1189" height="658" alt="Screenshot 2025-07-29 at 17 11 52" src="https://github.com/user-attachments/assets/29b100f6-7d31-45bd-aafd-4c69a1002392" />

```

#### Example 2 (PR #2625)

```
@copilot remove `src/store/reducers/query/__test__/resultTab.test.ts`, it has the same tests as `src/store/reducers/query/__test__/tabPersistence.test.tsx`
```

#### Example 3 (PR #2287)

```
> <img width="372" alt="image" src="https://github.com/user-attachments/assets/c14093f0-0127-4a98-bbbe-dd083589a585" />
>
> I think we can just do this with the same effect

Empty string is the reason, why we have `search=` in query. If it is `undefined` there is no param, if it is empty string - there will be empty param
```

#### Example 4 (PR #2287)

```
![IMG_20250515_210301_214.jpg](https://github.com/user-attachments/assets/0ff61aca-27c8-4c9a-857e-a777f30aa842)

The problem I solve is `search=` in query
```

#### Example 5 (PR #2266)

```
Hovered selected rows have additional margins around copy buttons

<img width="681" alt="Screenshot 2025-05-16 at 16 52 46" src="https://github.com/user-attachments/assets/2826fe87-8a6d-47ec-b908-b2cbd8969455" />

```

### Reviews by adameat

#### Example 1 (PR #2625)

```
change title according to commitLint: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

#### Example 2 (PR #2615)

```
remove tests file, rename PR according to commitLint rules, reduce PR description to minimum
```

#### Example 3 (PR #2599)

```
I forgot to tell you, that we need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fields_required=-1 - so it will return Threads information.
```

#### Example 4 (PR #2599)

```
it doesn't use real backend data:

<img width="1083" height="687" alt="image" src="https://github.com/user-attachments/assets/195b34ab-2478-44c2-b98d-2dcf19ac6ded" />

there is still mock data:

<img width="1276" height="426" alt="image" src="https://github.com/user-attachments/assets/e9f721d5-da96-4af1-accb-b94f453cce99" />

remove mock data from the PR and always use real data from the backend
```

#### Example 5 (PR #2599)

```
1. the page now calls sysinfo handler twice for every refresh
2. there is no data on threads page, even when the data exists in the response from sysinfo.

please, fix and test with the real backend how it described in AGENTS.md file.
```

### Reviews by Raubzeug

#### Example 1 (PR #2580)

```
Let's stretch content till the end of the visible area (maybe in another issue - up to you).
```

#### Example 2 (PR #2577)

```
please add sticky header for the table, and also let the table be resizable and sortable
```

#### Example 3 (PR #2577)

```
the last commit is awful. Look throught the project and use common patterns and components that were used in other places.
```

#### Example 4 (PR #2544)

```
> * ReduxTooltip

Decided not to fix it right now, cause we want to get rid of this component (https://github.com/ydb-platform/ydb-embedded-ui/issues/2342)
```

#### Example 5 (PR #2483)

```
Are changes in package-lock really needed? maybe add it to package.json also?
```

## Common Technical Issues

### "need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fi" (1 times)

- First seen in PR #2599 by adameat

### "need fields with replication progress and time remaining when disk is not replicated (replicated=false)" (1 times)

- First seen in PR #2588 by adameat

### "should be displayed only once and always in a green color" (1 times)

- First seen in PR #2588 by adameat

### "need to write "7% / 100%" - just "7%" is enough" (1 times)

- First seen in PR #2588 by adameat

### "should be green always" (1 times)

- First seen in PR #2588 by adameat

### "need to write replication progress and remainng time either" (1 times)

- First seen in PR #2588 by adameat

### "should be instead of tablet type (persqueue)" (1 times)

- First seen in PR #2581 by adameat

### "should be instead of word "tablet"" (1 times)

- First seen in PR #2581 by adameat

### "should swap places: "tablet" and tablet type (persqueue)" (1 times)

- First seen in PR #2581 by adameat

### "should be fixed (your screencast too)" (1 times)

- First seen in PR #2291 by astandrik

### "need to leave running queries sorting as it is on prod now" (1 times)

- First seen in PR #2077 by astandrik

### "should also `setisdirty(false)` on save query" (1 times)

- First seen in PR #2026 by artemmufazalov

### "should be here (but it's better to check): https://github" (1 times)

- First seen in PR #2026 by artemmufazalov

## Backend Integration Patterns

### PR #2599 - adameat

**Requirement:** parameters for
**Context:** I forgot to tell you, that we need to change parameters for backend call for handler "sysinfo" for node page - we need to add parameter fields_required=-1 - so it will return Threads information....

### PR #2588 - adameat

**Requirement:** parameters are
**Context:** <img width="583" height="457" alt="image" src="https://github.com/user-attachments/assets/2091a95e-2b7b-42af-90d1-295dee684a1a" />

change list of donors to show hyperlink for every donor to corresp...

## UI/UX Standards from Reviews

### PR #2588 - adameat

_[Contains screenshot]_
that's what you did:
<img width="1207" height="550" alt="image" src="https://github.com/user-attachments/assets/4271e5ff-0dd9-44a8-a8de-ad9ebb70e1f7" />

1. we only need fields with replication progress and time remaining when disk is not replicated (Replicated=false). Otherwise they should be ...

### PR #2588 - adameat

_[Contains screenshot]_

1. values of replication progress and remaining time in tooltip still badly aligned. here is the screenshot:
   <img width="370" height="425" alt="image" src="https://github.com/user-attachments/assets/86a52b13-a7d6-4b99-9e92-ef091c858788" />
   here is an example of backend output:
   [groups.json](https...

### PR #2588 - adameat

_[Contains screenshot]_

1. values in tooltip don't look like others - wrong alignment

<img width="418" height="442" alt="image" src="https://github.com/user-attachments/assets/b133ca5a-e1ff-4e61-93cb-5b23cd1483b6" />

2. replication progress shows red color. but it should be green always.

<img width="418" height="442" al...

### PR #2577 - adameat

the table doesn't display anything. here is attach with example of the data from blobindexstat handler
[blobindexstat.json](https://github.com/user-attachments/files/21293909/blobindexstat.json)
...

### PR #1997 - artemmufazalov

_[Contains screenshot]_

> > Could we give it the last try with import {version} from './package.json'; and if it wont work - proceed with requiring the whole package.json
>
> There is another error `Should not import the named export 'version' (imported as 'version') from default-exporting module (only default export is...
