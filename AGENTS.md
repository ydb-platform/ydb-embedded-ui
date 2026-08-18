# AGENTS.md

Repository instructions for coding agents working on YDB Embedded UI.

## Scope

- These rules apply to the whole repository; a more specific nested `AGENTS.md` overrides them for its subtree.
- Prefer the smallest reversible change that preserves existing behavior and follows the closest working feature slice.
- Verify repository facts from tracked source, package scripts, and CI configuration; do not copy generic templates into this file.
- The project is both a standalone React application and the `src/lib.ts` npm library. Treat exported package behavior as a compatibility boundary.
- `AGENTS.md` is the primary repository-wide instruction set; `.github/copilot-instructions.md` is a short subset. Keep them non-contradictory without duplicating every rule. Put personal tool preferences in user configuration and repeatable workflows in skills.

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

Before committing ordinary code changes, run `npm run typecheck && npm run lint && npm test`. CI also runs `npm run build:embedded` and `npm run package`. By default, direct Playwright runs start the frontend and expect a reachable YDB backend at `localhost:8765`; override it with `PLAYWRIGHT_APP_BACKEND`. Docker E2E commands require that variable; see `scripts/playwright-docker.sh`.

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
| `src/types/api/`                     | Backend response types; follow the owning file's naming    |
| `src/routes.ts`                      | React Router v5 routes                                     |
| `src/lib.ts`                         | Public npm-package exports                                 |
| `tests/models/`, `tests/suites/`     | Playwright page objects and E2E suites                     |

## Golden references

| Need                       | Follow                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------ |
| RTK Query endpoint         | `src/store/reducers/nodesList.ts` and `src/store/reducers/api.ts`                    |
| Runtime routing/identity   | `src/routes.ts`, `src/services/api/base.ts`, and `src/routes.test.ts`                |
| Package-consumer extension | `src/uiFactory/uiFactory.ts`, `src/uiFactory/types.ts`, and `src/lib.ts`             |
| Typed URL state            | `src/containers/Versions/Versions.tsx`                                               |
| Custom query-param codec   | `src/containers/Tenant/Diagnostics/TopQueries/hooks/useSortParam.ts`                 |
| Component i18n keyset      | `src/components/StorageGroupInfo/i18n/` and `i18n-naming-ruleset.md`                 |
| React/import conventions   | `src/components/SplitPane/SplitPane.tsx` and `eslint.config.mjs`                     |
| Playwright page object     | `tests/models/BaseModel.ts`, `tests/models/PageModel.ts`, and `playwright.config.ts` |

## Engineering rules

### Architecture and APIs

- This repository uses React 18, TypeScript, Redux Toolkit, RTK Query, Gravity UI, Rsbuild, Jest, Playwright, and React Router v5. Do not introduce v6 routing APIs.
- Product API calls go through the appropriate `window.api` module. RTK Query domains extend the shared API with `injectEndpoints()` and use `queryFn`; the base API intentionally uses `fakeBaseQuery`.
- Add package-consumer callbacks, options, configuration, and optional leaf renderers/actions through `configureUIFactory()`. Use `componentsRegistry` only to replace a whole existing structural component; do not add a registry slot or `additionalProps` for a leaf unless `uiFactory` cannot express it, and do not migrate legacy extension surfaces as incidental cleanup.
- When changing a public symbol, shared utility, route contract, API type, or `src/lib.ts` export, search affected consumers and preserve compatibility or document an explicit migration.
- Follow nearby feature ownership. Do not move logic across layers solely to reuse a private implementation; use an existing public helper, add the smallest justified public adapter, or keep feature-local logic local.

### React, UI, and styling

- `eslint.config.mjs` is the active lint source; do not infer enforcement from legacy `src/.eslintrc`. In TSX/component files, use `import React from 'react'` when React is a runtime value or `import type React from 'react'` when only its types are needed, and keep other type imports in separate top-level `import type` declarations. Use `React.Fragment`, not fragment shorthand, and do not introduce new `React.FC` component types.
- Import `isAxiosError` from `utils/response` (`src/utils/response.ts`), not directly from Axios. Prefer the owning component/module export over internal `lib` paths; preserve intentional legacy exceptions unless changing them is in scope.
- Prefer Gravity UI components and existing loading/error/notification primitives over custom equivalents.
- Prefer `PaginatedTable` for standard virtualized data grids; use specialized Gravity UI/TanStack table stacks only when the feature requires them.
- Give repeated controls unique localized accessible names, preserve visible keyboard focus, do not nest interactive controls, and ensure status meaning remains exposed when ARIA roles make descendants presentational.
- Put user-facing strings in the narrowest appropriate system, section, page, or component keyset and follow `i18n-naming-ruleset.md`. A component keyset may contain one or many keys; do not merge it into a broader keyset solely because it is small.
- Create class names with `cn()`. Prefix new SCSS root blocks and new `cn()` block names with `ydb-` unless an established local name must remain compatible; keep BEM element names semantic.
- Render absent UI values with `EMPTY_DATA_PLACEHOLDER` from `src/utils/constants.ts`. Treat `''` as missing unless the feature explicitly distinguishes it, and guard invalid/empty date values before formatting.
- Prefer direct event handlers and derived state over effect-driven interaction synchronization. Use effects for external synchronization and clean up subscriptions, timers, editor/model instances, and other resources they own.
- Memoize expensive derived values, table columns, and dependency-sensitive callbacks when it stabilizes real work; do not add memoization mechanically.
- For embedded layout changes, verify actual provider/portal ownership, containing-block and viewport boundaries, overflow, fullscreen behavior, and host siblings in both standalone and package-consumer contexts.
- For design-driven UI work, read linked implementation/design issues, their latest decisions, the exact Figma node, and the live stand when available. Cover requested themes, modes, responsive breakpoints, and loading/empty/error/disabled states; produce visual/stand evidence and surface conflicts instead of silently choosing one source.

### Data, URLs, and compatibility

- Prefer `use-query-params` for new URL state. Validate decoded values with Zod fallbacks such as `.catch(defaultValue)` and make custom codecs tolerate missing, malformed, and non-string values.
- Where present, treat `environment`, `clusterName`, `database`, `schema/path`, and `backend` as one runtime identity. Preserve the applicable scope across API and RTK Query arguments/selectors, links, drawers/actions/downloads, callbacks/context, async continuations, and tests; reset or revalidate stale state when scope changes, and use `src/routes.ts` helpers so basename, query state, and legacy/shared deep links survive.
- When changing table columns, filters, grouping, or sorting, update every connected surface: URL schema, sort whitelist, persisted/shareable state, restored links, drawer/details output, i18n, and relevant tests.
- Never interpolate raw user input into SQL/YQL. Use or extend the closest tested query builder or escaper for the exact syntactic context (identifier versus string literal), add regression coverage, and parenthesize mixed `OR` expressions before combining them with `AND`.
- Backend fields and enum/status values vary across YDB versions. Prefer compatibility-safe query shapes, normalize unknown values before lookup or rendering, use capability/version checks where available, and keep a tested fallback for newer fields or endpoints.
- Gate only the feature slice that actually requires a capability or permission. Canonicalize stale URL/persisted selections to an available mode, and cover restricted roles plus older capability versions.
- Cross-repository contracts are independently owned and versioned: YDB owns `/viewer/*` handlers, proto schemas, and capabilities; YDB EM/meta owns `/meta/*`, proxy behavior, and its assets; downstream wrappers may pin a different UI package version and add auth, proxy, or extension behavior. For changes crossing these boundaries, verify the owning source and affected consumer version—this checkout alone does not prove deployed behavior.
- Keep `undefined`, `null`, empty string, zero, and invalid numeric/date cases consistent across tables, drawers, badges, and formatters. Guard division by zero explicitly.

### Tests and CI

- Keep Jest tests colocated with the owning source and follow the nearby file/directory convention. For bug fixes, add a focused regression or contract test when practical and assert corrected output/state rather than only no-throw behavior.
- Playwright uses page-object models under `tests/models/` and `tests/suites/`, plus `data-qa` selectors (`testIdAttribute` in `playwright.config.ts`). For UI/SCSS changes, run the affected spec in Chromium and Safari, wait for the affected product state, assert the exact entity, and update platform snapshots intentionally. For flaky fixes, validate with retries disabled; do not mask drift by raising timeouts, retries, skips, or the global screenshot threshold.
- For route/state/persistence/API wiring, verify the integration path, not only a new helper or component in isolation.
- CI workflow changes must not install unpinned latest tools when the lockfile or another job defines the version. Do not let verification jobs rewrite tracked manifests or lockfiles unless that is the task.
- Use Conventional Commit headers for commits and PR titles, with a lowercase subject and a maximum of 72 characters; CI enforces this for PR titles via `.github/workflows/pr-title.yml`.
- If a deterministic check fails before reaching product code because of sandbox, credentials, dependencies, or runner setup, report the exact environment blocker and rerun in a suitable environment before changing product code.

## Done when

- The requested behavior and affected consumers are covered, with no unrelated cleanup or generated drift.
- Focused tests pass; ordinary TypeScript changes also pass typecheck, lint, and unit tests. Run embedded/package builds for shared or public-library changes, and E2E for affected visible integration paths.
- New UI values handle missing and invalid inputs consistently, and user-facing text is localized.
- `git diff --check`, the final diff, and `git status --short` show only intended changes.
- The completion report names changed files, commands run, pass/fail evidence, and any bounded verification limits.
