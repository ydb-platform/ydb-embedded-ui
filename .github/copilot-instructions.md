# GitHub Copilot Instructions for YDB Embedded UI

Use existing repository patterns and prefer minimal, behavior-preserving changes.

## Core Rules

- Do not invent new abstractions when an established local pattern already exists.
- When changing user-visible behavior, update all connected surfaces, not only the primary component.
- Keep suggestions consistent with `AGENTS.md`; this file is the short Copilot-specific subset.

## React and TypeScript

- Use `import React from 'react'`.
- Use `React.Fragment` instead of fragment shorthand.
- Use separate top-level `import type`.
- Do not use `React.FC`.
- This repo uses React Router v5, not v6; prefer v5 hooks such as `useHistory` and `useParams`.
- Avoid unnecessary `useEffect`; prefer direct handlers and derived state when possible.
- Keep BEM names semantic. Prefix new SCSS root blocks and new `cn()` block names with `ydb-` unless the surrounding feature already uses an established local convention.

## API and State

- Never call APIs directly; use `window.api.module.method()`.
- RTK Query endpoints must use `injectEndpoints()` and `queryFn`.
- Do not mutate RTK Query state.
- Clear form errors on user input and always handle loading states.

## Tables and URL Params

- Prefer `PaginatedTable` for standard virtualized data grids; use specialized table stacks only when the use case requires them.
- When changing columns, filters, or sorting, also update URL/query-param schema, sort whitelist, persisted or shareable state, drawer or details rendering, i18n keys, and tests.
- Prefer `use-query-params` over `redux-location-state` for new work.
- Validate URL params with Zod fallbacks.

## i18n and Display

- Never hardcode user-facing strings.
- Use component keysets and follow `i18n-naming-ruleset.md`.
- Use `EMPTY_DATA_PLACEHOLDER` for empty UI values.
- Treat empty strings `''` as missing unless the feature explicitly requires otherwise.
- Do not format dates or times from unchecked values; guard against `''`, invalid dates, and `NaN`.

## Query Safety and Compatibility

- Do not interpolate raw user input into SQL or YQL without escaping.
- Parenthesize mixed `OR` expressions before combining them with `AND`.
- When backend field availability differs by YDB version, prefer compatibility-safe query shapes and normalize the response in code.

## UI and Styling

- Prefer Gravity UI components over custom implementations.
- Keep BEM element names semantic; do not reuse narrow names for unrelated content only to share styles.
- When behavior depends on UI kit defaults and visual hierarchy matters, set the critical prop explicitly.

## CI and Workflow Changes

- Do not introduce unpinned runtime installs of latest tool versions in workflows when compatibility depends on a specific version.
- Prefer versions derived from `package-lock.json` or `package.json`.

## Verification Reminders

- For layout bugs, check actual DOM ownership, selector specificity, computed styles, and overflow behavior before explaining the cause.
- For review suggestions, prefer the latest head and diff and avoid stale PR state assumptions.
