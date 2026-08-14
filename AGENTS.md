# AGENTS.md

Repository instructions for coding agents working on YDB Embedded UI.

## Scope

- These rules apply to the whole repository; a more specific nested `AGENTS.md` overrides them for its subtree.
- Prefer the smallest reversible change that preserves existing behavior and follows the closest working feature slice.
- Verify repository facts from tracked source, package scripts, and CI configuration; do not copy generic templates into this file.
- The project is both a standalone React application and the `src/lib.ts` npm library. Treat exported package behavior as a compatibility boundary.
- Keep durable repository rules here. Put personal tool preferences in user configuration and repeatable workflows in skills.

## Commands

Node `>=24.0` and npm `^11.0.0` are required by `package.json`.

| Purpose                                | Command                    |
| -------------------------------------- | -------------------------- |
| Install exact dependencies             | `npm ci`                   |
| Fast local UI against `localhost:8765` | `npm run dev`              |
| Dev server using `.env` values         | `npm run start`            |
| TypeScript                             | `npm run typecheck`        |
| ESLint, Stylelint, and Prettier        | `npm run lint`             |
| Unit tests                             | `npm test`                 |
| Focused Jest file                      | `npm test -- path/to/file` |
| Embedded production build              | `npm run build:embedded`   |
| Library package build                  | `npm run package`          |
| Playwright                             | `npm run test:e2e`         |

Before committing ordinary code changes, run `npm run typecheck && npm run lint && npm test`. CI also runs `npm run build:embedded` and `npm run package`. Docker E2E commands require `PLAYWRIGHT_APP_BACKEND`; see `scripts/playwright-docker.sh`.

## Repository map

| Path                                 | Responsibility                                             |
| ------------------------------------ | ---------------------------------------------------------- |
| `src/components/`                    | Reusable UI and colocated unit tests                       |
| `src/containers/`                    | Feature screens and feature-local state/UI                 |
| `src/services/api/`                  | `window.api` domain modules                                |
| `src/store/reducers/`                | Redux Toolkit and RTK Query endpoints                      |
| `src/uiFactory/`                     | Package-consumer configuration and leaf extensions         |
| `src/components/ComponentsProvider/` | Whole structural component replacement registry            |
| `src/utils/`                         | Shared hooks, formatters, parsers, i18n, and query helpers |
| `src/types/api/`                     | Backend response types, conventionally prefixed with `T`   |
| `src/routes.ts`                      | React Router v5 routes                                     |
| `src/lib.ts`                         | Public npm-package exports                                 |
| `tests/models/`, `tests/suites/`     | Playwright page objects and E2E suites                     |

## Golden references

| Need                       | Follow                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------ |
| RTK Query endpoint         | `src/store/reducers/nodesList.ts` and `src/store/reducers/api.ts`                    |
| Package-consumer extension | `src/uiFactory/uiFactory.ts`, `src/uiFactory/types.ts`, and `src/lib.ts`             |
| Typed URL state            | `src/containers/Versions/Versions.tsx`                                               |
| Custom query-param codec   | `src/containers/Tenant/Diagnostics/TopQueries/hooks/useSortParam.ts`                 |
| Component i18n keyset      | `src/components/StorageGroupInfo/i18n/` and `i18n-naming-ruleset.md`                 |
| React/import conventions   | `src/components/SplitPane/SplitPane.tsx` and `src/.eslintrc`                         |
| Playwright page object     | `tests/models/BaseModel.ts`, `tests/models/PageModel.ts`, and `playwright.config.ts` |

## Engineering rules

### Architecture and APIs

- This repository uses React 18, TypeScript, Redux Toolkit, RTK Query, Gravity UI, Rsbuild, Jest, Playwright, and React Router v5. Do not introduce v6 routing APIs.
- Product API calls go through the appropriate `window.api` module. RTK Query domains extend the shared API with `injectEndpoints()` and use `queryFn`; the base API intentionally uses `fakeBaseQuery`.
- Add package-consumer callbacks, options, configuration, and optional leaf renderers/actions through `configureUIFactory()`. Use `componentsRegistry` only to replace a whole existing structural component; do not add a registry slot or `additionalProps` for a leaf unless `uiFactory` cannot express it, and do not migrate legacy extension surfaces as incidental cleanup.
- When changing a public symbol, shared utility, route contract, API type, or `src/lib.ts` export, search affected consumers and preserve compatibility or document an explicit migration.
- Follow nearby feature ownership. Do not move logic across layers solely to reuse a private implementation; use an existing public helper, add the smallest justified public adapter, or keep feature-local logic local.

### React, UI, and styling

- In TSX/component files use `import React from 'react'`; keep type imports in separate top-level `import type` declarations. Use `React.Fragment`, not fragment shorthand, and do not type components with `React.FC`.
- Import `isAxiosError` from `utils/response` (`src/utils/response.ts`), not directly from Axios. Avoid direct imports through internal `lib` paths; use the owning component/module export.
- Prefer Gravity UI components and existing loading/error/notification primitives over custom equivalents.
- Prefer `PaginatedTable` for standard virtualized data grids; use specialized Gravity UI/TanStack table stacks only when the feature requires them.
- Put user-facing strings in a component-local i18n keyset and follow `i18n-naming-ruleset.md`; do not merge a small keyset into an unrelated broader one.
- Create class names with `cn()`. Prefix new SCSS root blocks and new `cn()` block names with `ydb-` unless an established local name must remain compatible; keep BEM element names semantic.
- Render absent UI values with `EMPTY_DATA_PLACEHOLDER` from `src/utils/constants.ts`. Treat `''` as missing unless the feature explicitly distinguishes it, and guard invalid/empty date values before formatting.
- Memoize expensive derived values, table columns, and dependency-sensitive callbacks when it stabilizes real work; do not add memoization mechanically.

### Data, URLs, and compatibility

- Prefer `use-query-params` for new URL state. Validate decoded values with Zod fallbacks such as `.catch(defaultValue)` and make custom codecs tolerate missing, malformed, and non-string values.
- When changing table columns, filters, grouping, or sorting, update every connected surface: URL schema, sort whitelist, persisted/shareable state, restored links, drawer/details output, i18n, and relevant tests.
- Never interpolate raw user input into SQL/YQL without the repository's escaping path. Parenthesize mixed `OR` expressions before combining them with `AND`.
- Backend fields vary across YDB versions. Prefer compatibility-safe query shapes, normalize responses in code, and keep a tested fallback when a feature depends on newer fields.
- Keep `undefined`, `null`, empty string, zero, and invalid numeric/date cases consistent across tables, drawers, badges, and formatters. Guard division by zero explicitly.

### Tests and CI

- Put Jest tests beside source in `__test__` directories. For bug fixes, add a focused regression or contract test when practical and assert corrected output/state rather than only no-throw behavior.
- Playwright uses page objects from `tests/models/` and `data-qa` selectors (`testIdAttribute` in `playwright.config.ts`). User-visible integration paths must account for both Chromium and Safari projects.
- For route/state/persistence/API wiring, verify the integration path, not only a new helper or component in isolation.
- CI workflow changes must not install unpinned latest tools when the lockfile or another job defines the version. Do not let verification jobs rewrite tracked manifests or lockfiles unless that is the task.
- If a deterministic check fails before reaching product code because of sandbox, credentials, dependencies, or runner setup, report the exact environment blocker and rerun in a suitable environment before changing product code.

## Done when

- The requested behavior and affected consumers are covered, with no unrelated cleanup or generated drift.
- Focused tests pass; ordinary TypeScript changes also pass typecheck, lint, and unit tests. Run embedded/package builds for shared or public-library changes, and E2E for affected visible integration paths.
- New UI values handle missing and invalid inputs consistently, and user-facing text is localized.
- `git diff --check`, the final diff, and `git status --short` show only intended changes.
- The completion report names changed files, commands run, pass/fail evidence, and any bounded verification limits.
