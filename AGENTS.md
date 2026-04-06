# AGENTS.md

This file provides guidance to AI coding assistants when working with this codebase. Designed for OpenAI Codex, GitHub Copilot, Claude, Cursor, and other AI development tools.

## Project Overview

YDB Embedded UI is a web-based monitoring and management interface for YDB (Yet another DataBase) clusters. It provides comprehensive tools for viewing database diagnostics, managing storage/nodes/tablets, executing queries, and monitoring cluster health.

The project serves dual purposes:

- **Standalone application**: Built and deployed as a web UI (embedded into YDB servers or served independently)
- **Distributable library**: Published as an npm package (`src/lib.ts` exports) for embedding into other applications via `npm run package`

### Editing Agent Docs

- Before changing `AGENTS.md`, Copilot instructions, or related agent docs, read the current file first and compare it against actual repository conventions.
- Do not regenerate agent docs from a generic template when a project-specific file already exists.
- Keep repo-specific rules in repo docs; keep global tool/runtime preferences out of repo docs.

## Tech Stack

- **Framework**: React 18.3 with TypeScript 5.x
- **State Management**: Redux Toolkit 2.x with RTK Query
- **UI Components**: Gravity UI (`@gravity-ui/uikit` 7.x, `@gravity-ui/components`, `@gravity-ui/navigation`, `@gravity-ui/table`)
- **Routing**: React Router v5 (not v6)
- **Build Tool**: Rsbuild (`@rsbuild/core`) — configured in `rsbuild.config.ts`
- **Code Editor**: Monaco Editor 0.52 with `@ydb-platform/monaco-ghost` for ghost text
- **Syntax Highlighting**: Shiki (for non-editor code highlighting)
- **Charts**: `@gravity-ui/chartkit`
- **Forms**: `react-hook-form` with `@hookform/resolvers` and Zod for complex forms; Gravity UI form components for simple forms
- **Tables**: Custom `PaginatedTable` component (virtual scrolling); `@gravity-ui/table` + `@tanstack/react-table` for specialized tables
- **Keyboard Shortcuts**: `hotkeys-js`
- **Split Panes**: `react-split`
- **Testing**: Jest 30 + React Testing Library (unit), Playwright 1.x (E2E)
- **Package Manager**: npm
- **Node Version**: 24+ required (`engines` field enforces `>=24.0`)

## Essential Development Commands

### Quick Start

```bash
npm ci              # Install dependencies
npm run dev         # Start development server (port 3000)
```

### Build Commands

```bash
npm run build                   # Standard production build
npm run build:embedded          # Build for embedding in YDB servers
npm run build:embedded:archive  # Build embedded version + create zip
npm run build:embedded-mc       # Build multi-cluster embedded version
npm run analyze                 # Analyze bundle size with source-map-explorer
npm run package                 # Build library distribution (output: dist/)
```

### Code Quality (Run these before committing!)

```bash
npm run lint        # Run all linters (JS/TS + CSS + Prettier)
npm run typecheck   # TypeScript type checking
npm run unused      # Find unused code (uses knip)
```

### Testing

```bash
npm test                                     # Run unit tests (Jest 30)
npm test -- --watch                          # Run tests in watch mode
npm test -- path/to/file                     # Run a single test file
npm run test:e2e                             # Run Playwright E2E tests
npm run test:e2e:update-snapshots            # Update E2E snapshots (local browsers)
npm run test:e2e:docker                      # Run E2E tests in Docker
npm run test:e2e:docker:update-snapshots     # Update E2E snapshots in Docker
npm run test:e2e:local                       # Run E2E against local dev server
```

### Local Verification Chain (run before committing)

```bash
npm run typecheck && npm run lint && npm test
```

## Architecture Overview

### State Management

- Uses Redux Toolkit with RTK Query for API calls
- State organized by feature domains in `src/store/reducers/`
- API endpoints injected using RTK Query's `injectEndpoints` pattern
- Each domain has its reducer file (e.g., `cluster.ts`, `tenant.ts`)
- Base RTK Query API created in `src/store/reducers/api.ts` with `fakeBaseQuery` (all endpoints use `queryFn`)

### API Architecture

Modular API service pattern with domain-specific modules:

- `YdbEmbeddedAPI` is the main API class (`src/services/api/index.ts`)
- **Modules**: `AuthAPI`, `CodeAssistAPI`, `MetaAPI`, `MetaSettingsAPI`, `OperationAPI`, `PDiskAPI`, `SchemeAPI`, `StorageAPI`, `StreamingAPI`, `TabletsAPI`, `VDiskAPI`, `ViewerAPI`
- API services in `src/services/api/` directory
- All API calls go through `window.api` global object with domain-specific modules

### Component Organization

```
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components (~110 components)
├── containers/     # Feature-specific containers (App, Cluster, Tenant, Node, Storage, etc.)
├── services/       # API services and parsers
│   ├── api/        # API module classes
│   └── parsers/    # Response data parsers
├── store/          # Redux store and reducers
│   └── reducers/   # Feature-domain reducers with RTK Query endpoints
├── styles/         # Global styles and theme variables
├── types/          # TypeScript definitions
│   └── api/        # API response types (prefixed with 'T')
├── uiFactory/      # UIFactory pattern for extensibility
└── utils/          # Utility functions, hooks, formatters
    ├── hooks/      # Custom React hooks
    ├── i18n/       # Internationalization setup
    ├── dataFormatters/ # Data formatting utilities
    └── monaco/     # Monaco Editor utilities
```

### Key Architectural Patterns

1. **Component Registry Pattern**: Runtime registration of extensible components via `componentsRegistry`
2. **Slots Pattern**: Component composition with extensibility points (`AppSlots`)
3. **UIFactory Pattern**: `configureUIFactory()` in `src/uiFactory/uiFactory.ts` allows customizing monitoring links, healthcheck views, feature flags, and more when using the library
4. **Feature-based Organization**: Features grouped with their state, API, and components
5. **Separation of Concerns**: Clear separation between UI and business logic
6. **Library Export Pattern**: `src/lib.ts` exports key components, utilities, and configuration functions for use as an npm package

## Critical Bug Prevention Patterns

### Memory Management

- **ALWAYS** dispose Monaco Editor instances: `return () => editor.dispose();` in useEffect
- **NEVER** allow memory leaks in long-running components
- Clear timeouts and intervals in cleanup functions

### React Performance (MANDATORY)

- **ALWAYS** use `useMemo` for expensive computations and object/array creation
- **ALWAYS** use `useCallback` for functions passed to dependencies
- **ALWAYS** memoize table columns, filtered data, and computed values
- **AVOID** `useEffect` when possible - prefer direct approaches with `useCallback`
- **PREFER** direct event handlers and callbacks over useEffect for user interactions

```typescript
// ✅ Memoize computed data
const columns = React.useMemo(
  () => getColumns(columnsIds, overrideColumns),
  [columnsIds, overrideColumns],
);

// ✅ Direct callback instead of useEffect to clear error on input
const handleTitleChange = React.useCallback((value: string) => {
  setNextTitle(value);
  setErrorMessage(undefined);
}, []);
```

### Display Safety

- **ALWAYS** provide fallback values: `Number(value) || 0`
- **NEVER** allow division by zero: `capacity > 0 ? value/capacity : 0`
- **ALWAYS** handle null/undefined data gracefully

### Data Edge Cases

- **ALWAYS** use `EMPTY_DATA_PLACEHOLDER` for empty UI values. Do not hardcode em dashes `—` or en dashes `–` as placeholders. Hyphen `-` and dashes may be used as separators in titles/ranges. Before submitting, grep the code for `—`/`–` and ensure placeholders use `EMPTY_DATA_PLACEHOLDER` from `src/utils/constants.ts`.
- Treat empty strings `''` as missing UI values unless the feature explicitly distinguishes empty string from absence.
- Keep `''`, `null`, and `undefined` behavior consistent across table cells, drawers, detail lists, and badges.
- Do not pass unchecked values into date/time formatters. Guard against `''`, invalid parse results, and `NaN` before formatting.
- When a value is absent, either omit the field or render the shared placeholder consistently with nearby UI.

### Security & Input Validation

- **NEVER** expose authentication tokens in logs or console output
- **ALWAYS** validate user input before processing
- **NEVER** skip error handling for async operations
- Sanitize data before displaying in UI components

## Important Development Notes

### Testing Backend Connection

To test with a local YDB instance:

```bash
# Pull and run YDB docker (use specific version or nightly)
docker pull ghcr.io/ydb-platform/local-ydb:nightly
docker run -dp 8765:8765 ghcr.io/ydb-platform/local-ydb:nightly

# Start the UI
npm run dev

# View Swagger API documentation
# Navigate to: http://localhost:8765/viewer/api/
```

### Environment Configuration

Create `.env` file for custom backend:

```
REACT_APP_BACKEND=http://your-cluster:8765  # Single cluster mode
```

### Before Committing

- The project uses Husky pre-commit hooks that automatically run `lint-staged`
- Commit messages must follow conventional commit format (enforced by commitlint)
- PR titles must also follow conventional commit format with lowercase subjects, max 72 characters (e.g., `fix: update api endpoints`, `feat: add new component`)
- Always run `npm run lint` and `npm run typecheck` to catch issues early

### CI and Workflow Edits

- Do not introduce runtime installs of unpinned latest tool versions in CI when another job or the lockfile defines the expected version.
- Prefer deriving tool versions from `package-lock.json` or `package.json` when reproducibility matters.
- Avoid commands that may rewrite repo-tracked manifests or lockfiles in CI unless that is the explicit goal.

### CI Pipeline

The following checks run on every PR and merge group (`ci.yml`):

**Job: Verify Files** — runs sequentially:

1. `npm run typecheck` — TypeScript type checking
2. `npm run lint` — All linters (ESLint + Stylelint + Prettier)
3. `npm run build:embedded` — Verify embedded build works
4. `npm run package` — Verify library package build works

**Job: Unit Tests** — runs in parallel with Verify Files:

5. `npm test` — Unit tests (Jest 30)

Additional quality checks (`quality.yml`) — run on PRs and pushes to main:

- Playwright E2E tests (against a `local-ydb:nightly` Docker service, sharded across 8 parallel runners)
- Bundle size comparison (current branch vs. main, on PRs only)
- Test report deployment to GitHub Pages
- Automatic PR description updates with test results and bundle size diff

### UI Framework

The project uses Gravity UI (`@gravity-ui/uikit`) as the primary component library. When adding new UI components, prefer using Gravity UI components over custom implementations. Additional Gravity UI packages are available: `@gravity-ui/components`, `@gravity-ui/navigation`, `@gravity-ui/table`, `@gravity-ui/date-components`.

### Linting & Formatting

- **ESLint**: Flat config (`eslint.config.mjs`) based on `@gravity-ui/eslint-config`, plus `src/.eslintrc` for source-specific rules (React.FC ban, axios import restrictions, lib import restrictions)
- **Stylelint**: Based on `@gravity-ui/stylelint-config` with order and prettier plugins
- **Prettier**: Uses `@gravity-ui/prettier-config`

### Import Conventions (ESLint-enforced)

- **TypeScript `import type`**: Must use separate top-level type imports (`consistent-type-imports` with `separate-type-imports` style)
- **React imports**: Must use `import React from 'react'` — named imports, namespace imports, and non-`React` default names are forbidden
- **Fragments**: Must use `React.Fragment` — JSX fragment shorthand (`<></>`) is forbidden
- **React.FC**: Forbidden — do not use `React.FC` for component typing
- **isAxiosError**: Must import from `utils/response`, not directly from `axios`
- **lib imports**: Direct imports from `.*/**/lib` paths are forbidden — use direct component imports instead

```typescript
// ✅ Correct — real pattern from the codebase (src/components/SplitPane/SplitPane.tsx)
import React from 'react';

import type {SplitProps} from 'react-split';

// Hooks are accessed via React.* inside component bodies
function SplitPane(props: SplitPaneProps) {
  const [innerSizes, setInnerSizes] = React.useState<number[]>();

  React.useEffect(() => {
    return () => {
      saveSizesStringDebounced.cancel();
    };
  }, [saveSizesStringDebounced]);

  const defaultSizePane = React.useMemo(() => {
    /* ... */
  }, [initialSizes, defaultSizesProp]);
}

// ❌ Wrong — named value imports from 'react' are forbidden by ESLint
import {useState, useEffect} from 'react';
import * as React from 'react';
```

### Testing Patterns

- Unit tests are colocated with source files in `__test__` directories
- Unit tests use Jest 30 with `babel-jest` transform and `jsdom` environment
- E2E tests use Playwright with page objects pattern in `tests/` directory
  - Page models in `tests/models/` (`BaseModel.ts`, `PageModel.ts`)
  - Test suites in `tests/suites/`
- E2E tests run against both **Chromium** and **Safari** projects
- The `data-qa` attribute is used for test element selection (configured via Playwright's `testIdAttribute`)
- When writing tests, follow existing patterns in the codebase
- Test artifacts are stored in `./playwright-artifacts/` directory
- Environment variables for E2E tests:
  - `PLAYWRIGHT_BASE_URL` - Override test URL
  - `PLAYWRIGHT_APP_BACKEND` - Specify backend for tests

### Routing

- Uses React Router v5 (not v6)
- Route definitions in `src/routes.ts`
- Supports both single-cluster and multi-cluster modes

## Critical Implementation Patterns

### API Calls

All API calls go through `window.api` global object with domain-specific modules (e.g., `window.api.viewer`, `window.api.storage`, `window.api.tablets`).

### Table Implementation

Use `PaginatedTable` component for data grids with virtual scrolling. Tables require columns, fetchData function, and a unique tableName. For specialized use cases, `@gravity-ui/table` with `@tanstack/react-table` is also available.

### Redux Toolkit Query Pattern

API endpoints are injected using RTK Query's `injectEndpoints` pattern. Queries wrap `window.api` calls and provide hooks with loading states, error handling, and caching. The base API uses `fakeBaseQuery` — all endpoints must use `queryFn`.

### Query Safety and Compatibility

- Do not interpolate raw user input into SQL/YQL without escaping.
- Parenthesize mixed `OR` expressions before combining them with `AND` conditions.
- When backend schema differs across YDB versions, prefer compatibility-safe query shapes and normalize the response in code.
- If a feature depends on newly added backend fields, verify behavior on older clusters and keep a clear fallback path.

### Common UI Components

- **Notifications**: Use `createToast` utility for user notifications
- **Error Display**: Use `ResponseError` component for API errors; `PageError` for full-page errors; `AccessDenied` (`src/components/Errors/403`) for access denied
- **Loading States**: Use `Loader` and `TableSkeleton` components

### Class Names Convention

Uses BEM naming convention with `cn()` utility from `utils/cn` (wraps `@bem-react/classname`). Create a block function with component name and use it for element and modifier classes.

- **ALWAYS** prefix new SCSS root blocks and new `cn()` block names with `ydb-` (for example, `cn('ydb-query-editor')`) unless the surrounding feature already uses an established local naming convention that must be preserved for compatibility.
- Do not reuse semantically narrow BEM element names for unrelated content just to share visual styles; introduce a generic element or modifier instead.

### Type Naming Convention

- API Types: Prefixed with 'T' (e.g., `TTenantInfo`, `TClusterInfo`)
- Located in `src/types/api/` directory

### Common Utilities

- **Formatters**: `src/utils/dataFormatters/` - `formatBytes()`, `formatDateTime()`
- **Parsers**: `src/utils/bytesParsers/` - Byte value parsing utilities; `src/utils/timeParsers/` - Time/duration parsing utilities
- **Query Utils**: `src/utils/query.ts` - SQL/YQL query helpers
- **Hooks**: `src/utils/hooks/` - `useTypedSelector`, `useTypedDispatch`, `useSetting`, `useSearchQuery`, `useTableSort`, `useSelectedColumns`, etc.

### Internationalization (i18n)

See `i18n-naming-ruleset.md` in the repo root for all i18n conventions (naming and usage).

The i18n system uses `@gravity-ui/i18n`. Each component with user-facing strings has an `i18n/` subdirectory containing:

- `en.json` — English translations
- `index.ts` — Registers the keyset using `registerKeysets()` from `src/utils/i18n`

```typescript
// Real example: src/components/StorageGroupInfo/i18n/index.ts
import {registerKeysets} from '../../../utils/i18n';

import en from './en.json';

const COMPONENT = 'storage-group-info';

export const storageGroupInfoKeyset = registerKeysets(COMPONENT, {en});
```

### Performance Considerations

- Tables use virtual scrolling for large datasets
- Monaco Editor is lazy loaded
- Use `React.memo` for expensive renders
- Batch API requests when possible

### Form Handling Pattern

- **Simple forms**: Use controlled Gravity UI form components with validation. Clear errors on user input and validate before submission.
- **Complex forms**: Use `react-hook-form` with `@hookform/resolvers` and Zod schemas for validation (e.g., `QuerySettingsDialog`, `ManagePartitioningDialog`).

### Dialog/Modal Pattern

Complex modals use `@ebay/nice-modal-react` library. Simple dialogs use Gravity UI `Dialog` component with proper loading states.

### Navigation (React Router v5)

Uses React Router v5 hooks (`useHistory`, `useParams`, etc.). Always validate route params exist before using them.

### URL Parameter Management

- **PREFER** `use-query-params` over `redux-location-state` for new development
- **ALWAYS** use Zod schemas for URL parameter validation with fallbacks
- Use custom `QueryParamConfig` objects for encoding/decoding complex parameters
- Use `z.enum([...]).catch(defaultValue)` pattern for safe parsing with fallbacks

### Table Change Propagation

- When adding or changing table columns, filters, or sorting, update all connected surfaces:
  - URL/query-param schema
  - sort whitelist and persistence
  - shareable links and restored state
  - drawer/details rendering
  - i18n keys
  - unit and E2E coverage where behavior is user-visible

```typescript
// ✅ Zod schema with fallback (src/containers/Versions/Versions.tsx)
const groupByValueSchema = z.nativeEnum(GroupByValue).catch(GroupByValue.VERSION);

// ✅ Custom QueryParamConfig (src/containers/Tenant/Diagnostics/TopQueries/hooks/useSortParam.ts)
const SortOrderParam: QueryParamConfig<SortOrder[]> = {
  encode: (value) => {
    if (value === undefined || value === null || !Array.isArray(value)) {
      return undefined;
    }
    return encodeURIComponent(JSON.stringify(value));
  },
  decode: (value) => {
    if (typeof value !== 'string' || !value) {
      return [];
    }
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      return [];
    }
  },
};

const [urlSortParam, setUrlSortParam] = useQueryParam<SortOrder[]>(paramName, SortOrderParam);
```

### UIFactory Pattern

The `uiFactory` in `src/uiFactory/uiFactory.ts` provides an extensibility layer for customizing the UI when using the project as a library. Use `configureUIFactory()` to override defaults like monitoring links, healthcheck views, feature flags, and access control.

### Debugging Tips

- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- Enable request tracing with `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS`

### Frontend Diagnostics

- For CSS and layout bugs, verify actual DOM ownership, selector specificity, computed sizing, and overflow behavior before explaining the cause.
- Do not attribute layout issues to specificity or style-order conflicts unless the selectors and computed styles confirm it.

## Deployment Configuration

### Production Build

The production build is optimized for embedding in YDB servers:

```bash
# Standard web deployment
npm run build

# Embedded deployment (relative paths, no source maps)
npm run build:embedded

# Multi-cluster embedded deployment
npm run build:embedded-mc
```

Build artifacts are placed in `/build` directory. For embedded deployments, files should be served from `/monitoring` path on YDB cluster hosts.

### Environment Variables

- `REACT_APP_BACKEND` - Backend URL for single-cluster mode
- `REACT_APP_META_BACKEND` - Meta backend URL for multi-cluster mode
- `GENERATE_SOURCEMAP` - Set to `false` for production builds

## Reference Resources

- **Swagger API**: Available at http://localhost:8765/viewer/api/ in development
- **YDB Monitoring Docs**: https://ydb.tech/en/docs/maintenance/embedded_monitoring/ydb_monitoring
- **Gravity UI Components**: https://gravity-ui.com/
- **Project Roadmap**: See ROADMAP.md in repository root
