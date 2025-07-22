# AGENTS.md

This file provides guidance to AI coding assistants when working with this codebase. Designed for OpenAI Codex, GitHub Copilot, Claude, Cursor, and other AI development tools.

## Project Overview

YDB Embedded UI is a web-based monitoring and management interface for YDB (Yet another DataBase) clusters. It provides comprehensive tools for viewing database diagnostics, managing storage/nodes/tablets, executing queries, and monitoring cluster health.

## Tech Stack

- **Framework**: React 18.3 with TypeScript 5.x
- **State Management**: Redux Toolkit 2.x with RTK Query
- **UI Components**: Gravity UI (@gravity-ui/uikit) 7.x
- **Routing**: React Router v5 (not v6)
- **Build Tool**: Create React App with react-app-rewired
- **Code Editor**: Monaco Editor 0.52
- **Testing**: Jest + React Testing Library (unit), Playwright (E2E)
- **Package Manager**: npm
- **Node Version**: 18+ recommended

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
npm run package                 # Build library distribution
```

### Code Quality (Run these before committing!)

```bash
npm run lint        # Run all linters (JS/TS + CSS)
npm run typecheck   # TypeScript type checking
npm run unused      # Find unused code
```

### Testing

```bash
npm test                       # Run unit tests
npm test -- --watch           # Run tests in watch mode
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:local        # Run E2E against local dev server
```

## Architecture Overview

### State Management

- Uses Redux Toolkit with RTK Query for API calls
- State organized by feature domains in `src/store/reducers/`
- API endpoints injected using RTK Query's `injectEndpoints` pattern
- Each domain has its reducer file (e.g., `cluster.ts`, `tenant.ts`)

### API Architecture

Modular API service pattern with domain-specific modules:

- `YdbEmbeddedAPI` is the main API class
- Modules: `ViewerAPI`, `StorageAPI`, `TabletsAPI`, `SchemeAPI`, etc.
- API services in `src/services/api/` directory

### Component Organization

```
src/
├── components/     # Reusable UI components
├── containers/     # Feature-specific containers
├── services/       # API services and parsers
├── store/          # Redux store and reducers
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

### Key Architectural Patterns

1. **Component Registry Pattern**: Runtime registration of extensible components
2. **Slots Pattern**: Component composition with extensibility points
3. **Feature-based Organization**: Features grouped with their state, API, and components
4. **Separation of Concerns**: Clear separation between UI and business logic

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

- The project uses Husky pre-commit hooks that automatically run linting
- Commit messages must follow conventional commit format
- Always run `npm run lint` and `npm run typecheck` to catch issues early

### UI Framework

The project uses Gravity UI (@gravity-ui/uikit) as the primary component library. When adding new UI components, prefer using Gravity UI components over custom implementations.

### Testing Patterns

- Unit tests are colocated with source files in `__test__` directories
- E2E tests use Playwright with page objects pattern in `tests/` directory
- When writing tests, follow existing patterns in the codebase
- E2E tests use CSS class selectors for element selection
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

All API calls go through `window.api` global object with domain-specific modules (viewer, schema, storage, etc.)

### Table Implementation

Use `PaginatedTable` component for data grids with virtual scrolling. Tables require columns, fetchData function, and a unique tableName.

### Redux Toolkit Query Pattern

API endpoints are injected using RTK Query's `injectEndpoints` pattern. Queries wrap `window.api` calls and provide hooks with loading states, error handling, and caching.

### Common UI Components

- **Notifications**: Use `createToast` utility for user notifications
- **Error Display**: Use `ResponseError` component for API errors
- **Loading States**: Use `Loader` and `TableSkeleton` components

### Class Names Convention

Uses BEM naming convention with `cn()` utility from `utils/cn`. Create a block function with component name and use it for element and modifier classes.

### Type Naming Convention

- API Types: Prefixed with 'T' (e.g., `TTenantInfo`, `TClusterInfo`)
- Located in `src/types/api/` directory

### Common Utilities

- **Formatters**: `src/utils/dataFormatters/` - `formatBytes()`, `formatDateTime()`
- **Parsers**: `src/utils/timeParsers/` - Time parsing utilities
- **Query Utils**: `src/utils/query.ts` - SQL/YQL query helpers

### Performance Considerations

- Tables use virtual scrolling for large datasets
- Monaco Editor is lazy loaded
- Use `React.memo` for expensive renders
- Batch API requests when possible

### Form Handling Pattern

Always use controlled components with validation. Clear errors on user input and validate before submission. Use Gravity UI form components with proper error states.

### Dialog/Modal Pattern

Complex modals use `@ebay/nice-modal-react` library. Simple dialogs use Gravity UI `Dialog` component with proper loading states.

### Navigation (React Router v5)

Uses React Router v5 hooks (`useHistory`, `useParams`, etc.). Always validate route params exist before using them.

### Critical Rules

- **NEVER** call APIs directly - use `window.api.module.method()`
- **NEVER** mutate state in RTK Query - return new objects/arrays
- **ALWAYS** use `cn()` for classNames: `const b = cn('component-name')`
- **ALWAYS** clear errors on user input
- **ALWAYS** handle loading states in UI
- **ALWAYS** validate route params exist before use

### Debugging Tips

- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- Enable request tracing with `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS`

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
- `PUBLIC_URL` - Base URL for static assets (use `.` for relative paths)
- `GENERATE_SOURCEMAP` - Set to `false` for production builds

## Common Issues & Troubleshooting

### Development Issues

1. **Port 3000 already in use**: Kill the process using the port or change the PORT env variable
2. **Docker connection issues**: Ensure Docker is running and port 8765 is not blocked
3. **TypeScript errors on build**: Run `npm run typecheck` to identify issues before building
4. **Lint errors blocking commit**: Run `npm run lint` to fix auto-fixable issues

### API Connection Issues

1. **CORS errors**: Check if backend allows localhost:3000 origin in development
2. **Authentication failures**: Verify credentials and authentication method
3. **Network timeouts**: Check backend availability and network configuration

### Performance Issues

1. **Large table rendering**: Tables use virtual scrolling - ensure `PaginatedTable` is used
2. **Bundle size**: Run `npm run analyze` to identify large dependencies
3. **Memory leaks**: Check for missing cleanup in useEffect hooks

## Reference Resources

- **YDB Documentation**: https://ydb.tech/en/docs/
- **Gravity UI Components**: https://gravity-ui.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **React Router v5**: https://v5.reactrouter.com/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/

### Internal Resources

- **Swagger API**: Available at http://localhost:8765/viewer/api/ in development
- **YDB Monitoring Docs**: https://ydb.tech/en/docs/maintenance/embedded_monitoring/ydb_monitoring
- **Project Roadmap**: See ROADMAP.md in repository root
