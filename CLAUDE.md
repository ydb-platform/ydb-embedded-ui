# Developer Guidelines for AI Assistants

> **Purpose**: Comprehensive guidance for AI coding assistants (OpenAI Codex, GitHub Copilot, Claude, Cursor, etc.) working with the YDB Embedded UI codebase.

## Quick Reference

### Essential Commands
```bash
npm ci                    # Install dependencies
npm run dev               # Start development (port 3000)
npm run lint              # Check code quality
npm run typecheck         # Validate TypeScript
npm run build:embedded    # Production build
```

### Critical Rules (Prevent 67% of bugs)
- **NEVER** call APIs directly → use `window.api.module.method()`
- **NEVER** hardcode user text → use i18n system
- **NEVER** skip Monaco Editor cleanup → `editor.dispose()`
- **ALWAYS** memoize expensive operations → `useMemo`, `useCallback`
- **ALWAYS** handle loading states and errors
- **ALWAYS** validate inputs and prevent division by zero

## Project Overview

**YDB Embedded UI** is a React-based monitoring and management interface for YDB clusters, providing comprehensive tools for database diagnostics, cluster management, query execution, and health monitoring.

### Tech Stack Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **React** | 18.3 | With TypeScript 5.x |
| **State Management** | Redux Toolkit 2.x | With RTK Query |
| **UI Components** | Gravity UI 7.x | @gravity-ui/uikit |
| **Routing** | React Router v5 | **NOT v6** |
| **Code Editor** | Monaco Editor 0.52 | Requires proper cleanup |
| **Testing** | Jest + Playwright | Unit + E2E |
| **Package Manager** | npm | Node 18+ recommended |

## Development Commands

### Build Commands
```bash
npm run build                   # Standard production build
npm run build:embedded          # Build for embedding in YDB servers
npm run build:embedded:archive  # Build embedded version + create zip
npm run build:embedded-mc       # Build multi-cluster embedded version
npm run analyze                 # Analyze bundle size with source-map-explorer
npm run package                 # Build library distribution
```

### Testing Commands
```bash
npm test                       # Run unit tests
npm test -- --watch           # Run tests in watch mode
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:local        # Run E2E against local dev server
npm run unused                # Find unused code
```

## Architecture & Implementation Patterns

### API Architecture
**Use modular API service pattern with `window.api` global object**:
```typescript
// Domain-specific modules: viewer, storage, tablets, schema, etc.
const data = await window.api.viewer.getNodeInfo(nodeId);
const tablets = await window.api.tablets.getTabletInfo(tabletId);
```

### State Management
- **Redux Toolkit** with RTK Query for API calls
- State organized by feature domains in `src/store/reducers/`
- API endpoints injected using `injectEndpoints` pattern
- Each domain has its reducer file (e.g., `cluster.ts`, `tenant.ts`)

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
3. **Feature-based Organization**: Features grouped with state, API, and components
4. **Separation of Concerns**: Clear separation between UI and business logic

### Critical Implementation Patterns

**Table Implementation**:
- Use `PaginatedTable` component for data grids with virtual scrolling
- Tables require: columns, fetchData function, unique tableName

**Redux Toolkit Query Pattern**:
- API endpoints injected using RTK Query's `injectEndpoints` pattern
- Queries wrap `window.api` calls providing hooks with loading states, error handling, caching

## Critical Bug Prevention Patterns

> **Impact**: These patterns prevent 67% of production bugs and ensure 94% type safety compliance.

### Memory & Display Safety

**Prevent NaN/Undefined Display**:
```typescript
// ❌ WRONG - Can display "NaN of NaN"
{formatStorageValuesToGb(Number(memoryUsed))[0]} of {formatStorageValuesToGb(Number(memoryLimit))[0]}

// ✅ CORRECT - Safe with fallbacks
{formatStorageValuesToGb(Number(memoryUsed) || 0)[0]} of {formatStorageValuesToGb(Number(memoryLimit) || 0)[0]}
```

**Safe Progress Calculations**:
```typescript
// ❌ WRONG - Division by zero
rawPercentage = (numericValue / numericCapacity) * MAX_PERCENTAGE;

// ✅ CORRECT - Protected calculation
rawPercentage = numericCapacity > 0 ? (numericValue / numericCapacity) * MAX_PERCENTAGE : 0;
```

**Monaco Editor Memory Management**:
```typescript
// ✅ REQUIRED - Always dispose to prevent memory leaks
useEffect(() => {
  const editor = monaco.editor.create(element, options);
  
  return () => {
    editor.dispose(); // CRITICAL - Prevents memory leaks
  };
}, []);
```

### React Performance Requirements (MANDATORY)

**Memoization Rules**:
- **ALL** expensive computations must use `useMemo`
- **ALL** callback functions in dependencies must use `useCallback`
- **ALL** object/array creations in render must be memoized

```typescript
// ❌ WRONG - Recalculated every render
const displaySegments = segments.filter(segment => segment.visible);
const columns = getTableColumns(data);
const handleClick = () => { /* logic */ };

// ✅ CORRECT - Properly memoized
const displaySegments = useMemo(() => 
  segments.filter(segment => segment.visible), [segments]
);
const columns = useMemo(() => getTableColumns(data), [data]);
const handleClick = useCallback(() => { /* logic */ }, [dependency]);
```

### State Management & API Safety

**Redux State Updates**:
```typescript
// ❌ WRONG - Mutation of state
return state.items.push(newItem);

// ✅ CORRECT - Immutable updates
return [...state.items, newItem];
```

**API Architecture**:
```typescript
// ❌ WRONG - Direct API calls
fetch('/api/data').then(response => response.json());

// ✅ CORRECT - Use window.api pattern
window.api.viewer.getNodeInfo(nodeId);
```

### Security & Input Validation

**Authentication Token Handling**:
```typescript
// ❌ WRONG - Token exposure
console.log('Using token:', token);

// ✅ CORRECT - Secure handling
// Never log or expose authentication tokens
```

**Input Validation**:
```typescript
// ❌ WRONG - No validation
const value = userInput;

// ✅ CORRECT - Always validate
const value = validateInput(userInput) ? userInput : defaultValue;
```

### Mathematical Expression Safety

**Operator Precedence**:
```typescript
// ❌ WRONG - Unclear precedence
value: item.count / total * 100;
result = result[item.version].count || 0 + item.count || 0;

// ✅ CORRECT - Explicit parentheses  
value: ((item.count || 0) / total) * 100;
result = (result[item.version].count || 0) + (item.count || 0);
```

## Internationalization (i18n) Requirements

> **Mandatory**: All user-facing text must use the i18n system. NO hardcoded strings allowed.

### Structure & Registration
```typescript
// Component structure: component/i18n/en.json + component/i18n/index.ts
import {registerKeysets} from 'src/utils/i18n';
import en from './en.json';

const COMPONENT_NAME = 'unique-component-name';
export default registerKeysets(COMPONENT_NAME, {en});
```

### Key Naming Convention
Follow `<context>_<content>` pattern:

| Context | Usage | Example |
|---------|-------|---------|
| `action_` | Buttons, links, menu items | `action_save`, `action_delete` |
| `field_` | Form fields, table columns | `field_name`, `field_status` |
| `title_` | Page/section titles | `title_dashboard`, `title_settings` |
| `alert_` | Notifications, errors | `alert_error`, `alert_success` |
| `context_` | Descriptions, hints | `context_help_text` |
| `confirm_` | Confirmation dialogs | `confirm_delete_item` |
| `value_` | Status values, options | `value_active`, `value_pending` |

### Usage Examples
```typescript
// ✅ CORRECT - Using i18n
const b = cn('my-component');
<Button>{i18n('action_save')}</Button>
<Text className={b('title')}>{i18n('title_dashboard')}</Text>

// ❌ WRONG - Hardcoded strings
<Button>Save</Button>
<Text>Dashboard</Text>
```

## Component Development Patterns

### Class Names Convention (BEM)
```typescript
// Always use cn() utility with component name
import {cn} from 'src/utils/cn';

const b = cn('component-name');

// Usage
<div className={b()}>
  <div className={b('element')}>
    <span className={b('element', {modifier: true})}>
```

### Form Handling Pattern
```typescript
// Always use controlled components with validation
const [errors, setErrors] = useState({});

const handleInputChange = (field, value) => {
  setValue(field, value);
  // Clear errors on user input
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: null }));
  }
};

const handleSubmit = () => {
  const validationErrors = validateForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  // Proceed with submission
};
```

### Error Handling Standards
```typescript
// ✅ REQUIRED - All async operations need error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  // Use ResponseError component for API errors
  return <ResponseError error={error} />;
}
```

### Dialog/Modal Pattern
- **Complex modals**: Use `@ebay/nice-modal-react` library
- **Simple dialogs**: Use Gravity UI `Dialog` component
- **Always include**: Loading states and proper error handling

### Navigation (React Router v5)
```typescript
// Use React Router v5 hooks
import {useHistory, useParams} from 'react-router-dom';

const {nodeId} = useParams();
const history = useHistory();

// ALWAYS validate route params exist before use
if (!nodeId) {
  return <ErrorPage />;
}
```

## Quality Standards & Code Review

### Quality Gates (Before Every Commit)
**Required Checklist**:
1. ✅ Run `npm run lint` and `npm run typecheck` 
2. ✅ Verify all user-facing strings use i18n (NO hardcoded text)
3. ✅ Check all useEffect hooks have proper cleanup
4. ✅ Ensure memoization for expensive operations
5. ✅ Validate error handling for async operations
6. ✅ Confirm no authentication tokens exposed in logs
7. ✅ Test mathematical expressions for edge cases (zero division)

### Automated Quality Checks (Required)
**Pre-commit Requirements**:
- **Spell Checking**: No typos in code or comments
- **Magic Number Detection**: All constants must be named
- **Type Safety**: Strict TypeScript with no implicit any
- **Performance**: Automated memoization detection
- **Security**: No exposed credentials or tokens

### Review Prioritization

**Immediate Review Required**:
- Security changes (authentication, authorization)
- Performance optimizations (React patterns)
- State management modifications (Redux, RTK Query)
- Monaco Editor integrations (memory management critical)

**Standard Review**:
- UI component changes, styling updates
- Documentation improvements, test additions

### Target Quality Metrics
- Review Coverage: 20% of PRs (current: 19.7%)
- Implementation Rate: 85%+ (current: 88.2%)
- Critical Bug Discovery: 65%+ during review (current: 67%)
- Type Safety Compliance: 90%+ (current: 94%)

## Type Conventions & Utilities

### Type Naming Convention
- **API Types**: Prefixed with 'T' (e.g., `TTenantInfo`, `TClusterInfo`)
- **Location**: `src/types/api/` directory

### Common Utilities
- **Formatters**: `src/utils/dataFormatters/` - `formatBytes()`, `formatDateTime()`
- **Parsers**: `src/utils/timeParsers/` - Time parsing utilities
- **Query Utils**: `src/utils/query.ts` - SQL/YQL query helpers
- **Class Names**: `src/utils/cn` - BEM utility function

### Performance Considerations
- Tables use virtual scrolling for large datasets
- Monaco Editor is lazy loaded
- Use `React.memo` for expensive renders
- Batch API requests when possible

## Essential Rules Summary

> **Impact**: These rules prevent 67% of production bugs and ensure 94% type safety compliance.

### NEVER Rules
- **NEVER** call APIs directly → use `window.api.module.method()`
- **NEVER** mutate state in RTK Query → return new objects/arrays
- **NEVER** hardcode user-facing strings → use i18n system
- **NEVER** skip Monaco Editor cleanup → always `dispose()` in useEffect return
- **NEVER** skip error handling for async operations
- **NEVER** skip memoization for expensive computations (arrays, objects, calculations)
- **NEVER** expose authentication tokens in logs or console
- **NEVER** use division without zero checks in progress calculations

### ALWAYS Rules
- **ALWAYS** use `cn()` for classNames: `const b = cn('component-name')`
- **ALWAYS** clear errors on user input in forms
- **ALWAYS** handle loading states in UI
- **ALWAYS** validate route params exist before use
- **ALWAYS** follow i18n naming rules: `<context>_<content>`
- **ALWAYS** use explicit parentheses in mathematical expressions
- **ALWAYS** provide fallback values for undefined/null in displays
- **ALWAYS** use `useCallback` for functions in effect dependencies

## Development Environment

### Local Development Setup
```bash
# Start local YDB instance
docker pull ghcr.io/ydb-platform/local-ydb:nightly
docker run -dp 8765:8765 ghcr.io/ydb-platform/local-ydb:nightly

# Start UI development server
npm run dev

# View Swagger API documentation
# Navigate to: http://localhost:8765/viewer/api/
```

### Environment Configuration
Create `.env` file for custom backend:
```bash
REACT_APP_BACKEND=http://your-cluster:8765  # Single cluster mode
REACT_APP_META_BACKEND=http://meta-backend  # Multi-cluster mode
```

### Debugging Tools
- `window.api` - Access API methods in browser console
- `window.ydbEditor` - Monaco editor instance
- `DEV_ENABLE_TRACING_FOR_ALL_REQUESTS` - Enable request tracing

### Pre-commit Requirements
- Husky pre-commit hooks run linting automatically
- Commit messages must follow conventional commit format
- Always run `npm run lint` and `npm run typecheck` before committing

## Deployment & Production

### Production Build Options
```bash
npm run build                   # Standard web deployment
npm run build:embedded          # Embedded deployment (relative paths, no source maps)
npm run build:embedded-mc       # Multi-cluster embedded deployment
npm run build:embedded:archive  # Create deployment zip
```

### Environment Variables
- `REACT_APP_BACKEND` - Backend URL for single-cluster mode
- `REACT_APP_META_BACKEND` - Meta backend URL for multi-cluster mode
- `PUBLIC_URL` - Base URL for static assets (use `.` for relative paths)
- `GENERATE_SOURCEMAP` - Set to `false` for production builds

Build artifacts are placed in `/build` directory. For embedded deployments, files should be served from `/monitoring` path on YDB cluster hosts.

## Troubleshooting

### Development Issues
1. **Port 3000 in use**: Kill process or change PORT env variable
2. **Docker connection**: Ensure Docker running and port 8765 not blocked
3. **TypeScript errors**: Run `npm run typecheck` before building
4. **Lint errors**: Run `npm run lint` to fix auto-fixable issues

### API Connection Issues
1. **CORS errors**: Check backend allows localhost:3000 in development
2. **Authentication failures**: Verify credentials and auth method
3. **Network timeouts**: Check backend availability and network config

### Performance Issues
1. **Large tables**: Ensure using `PaginatedTable` with virtual scrolling
2. **Bundle size**: Run `npm run analyze` to identify large dependencies
3. **Memory leaks**: Check for missing cleanup in useEffect hooks

## Reference Resources

### External Documentation
- **YDB Documentation**: https://ydb.tech/en/docs/
- **Gravity UI Components**: https://gravity-ui.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **React Router v5**: https://v5.reactrouter.com/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/

### Internal Resources
- **Swagger API**: http://localhost:8765/viewer/api/ (development)
- **YDB Monitoring Docs**: https://ydb.tech/en/docs/maintenance/embedded_monitoring/ydb_monitoring
- **Project Roadmap**: See ROADMAP.md in repository root
