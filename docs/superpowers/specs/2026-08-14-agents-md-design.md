# Compact `AGENTS.md` design

## Goal

Replace the 505-line root `AGENTS.md` with a concise, repository-specific guide that helps coding agents navigate, change, and verify YDB Embedded UI without repeating generic frontend advice.

## Constraints

- Base the change on `origin/main` commit `8ca43b168f95fb77a53628d417dcb21185516e22`.
- Update only the root `AGENTS.md`; keep `.github/copilot-instructions.md` unchanged, but check the two files for contradictions.
- Preserve project-specific contracts that are not obvious from filenames or standard React/TypeScript knowledge.
- Document only commands and paths verified against the repository.
- Keep the result around 100-150 lines and below Codex's default combined project-instruction limit.
- Do not add generated markers, compatibility symlinks, nested instruction files, dependencies, or CI changes in this task.

## Proposed structure

1. Repository purpose and instruction scope.
2. Verified setup, development, focused-test, and full verification commands.
3. Compact file map with the main entry points and extension surfaces.
4. Golden references for API/RTK Query, UI composition, URL state, i18n, tests, and styling.
5. Non-obvious engineering rules grouped by boundary: architecture, data compatibility, UI consistency, and test propagation.
6. Completion checklist covering affected consumers, focused checks, full checks when warranted, and final diff review.

## Content to preserve

- Node 24/npm 11 and React Router v5 constraints.
- `window.api` plus RTK Query `injectEndpoints`/`queryFn` API path.
- `configureUIFactory()` for package-consumer leaf extensions and `componentsRegistry` for whole structural replacement.
- React import, `import type`, fragment, and `React.FC` lint constraints.
- Component-local i18n keysets and `i18n-naming-ruleset.md`.
- `EMPTY_DATA_PLACEHOLDER` and empty/date value handling.
- URL-param validation and the connected-surface checklist for tables, filters, sorting, drawers, persisted links, i18n, and tests.
- Compatibility-safe YQL/SQL construction and older-cluster fallback expectations.
- Gravity UI, semantic `ydb-` BEM roots, colocated Jest tests, and Playwright page-object/data-qa conventions.
- CI reproducibility rules and exact verification commands.

## Content to remove or compress

- Generic security, error-handling, memoization, and clean-code advice already supplied by the agent or enforced by tools.
- Tutorials and long code examples that can be replaced by links to canonical repository files.
- Repeated descriptions of build scripts, deployment modes, libraries, and directory contents that are directly discoverable.
- Absolute wording that is broader than the actual repository contract, such as memoizing every object or array creation.
- Duplicated rules already represented more compactly in `.github/copilot-instructions.md`, retaining only the root-level contract needed by all agents.

## Verification

- Compare every documented command with `package.json` and the relevant GitHub Actions workflows.
- Verify every referenced path and canonical example exists on the branch.
- Run the `agent-rules` structure, content, command, and quality checks in non-mutating mode where supported.
- Run the repository Markdown/Prettier check for the changed files using the existing dependency installation from the parent checkout.
- Review `git diff --check`, the complete diff, branch status, and the final line/byte count.
- Record any verifier incompatibility separately from a real documentation defect.

## Rollback

The implementation is a single-file documentation change on `codex/update-agents-md`; rollback is the deletion of the branch/worktree or reverting the eventual `AGENTS.md` commit. No runtime behavior or external state is affected.
