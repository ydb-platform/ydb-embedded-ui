# Claude AI Assistant Instructions for YDB Embedded UI

This file provides specific guidance for Claude AI assistant when working with the YDB Embedded UI codebase.

## Project Context

YDB Embedded UI is a React-based monitoring and management interface for YDB clusters. The codebase follows strict patterns and conventions that must be maintained for consistency and reliability.

## Core Requirements for Claude

### Critical Rules (NEVER VIOLATE)

1. **API Architecture**: ALWAYS use `window.api.module.method()` pattern - NEVER make direct API calls
2. **Internationalization**: NEVER hardcode user-facing strings - ALWAYS use i18n keys
3. **State Management**: Use RTK Query with injectEndpoints pattern for all API interactions
4. **Component Naming**: Use BEM naming with `cn()` utility: `const b = cn('component-name')`
5. **Router Version**: Use React Router v5 (NOT v6) - use `useHistory`, `useParams`

### Code Analysis Patterns (Based on Historical Reviews)

#### TypeScript Excellence
- Use proper TypeScript types instead of any
- Define interfaces for API responses
- Use strict type checking
- Avoid type assertions, use type guards

#### React Best Practices
- Use React.memo for performance optimization
- Implement proper error boundaries
- Use useCallback and useMemo appropriately
- Follow React hooks rules

#### State Management Excellence
- Use RTK Query for API calls instead of direct fetch
- Implement proper loading states
- Handle errors in Redux slices
- Use injectEndpoints pattern

#### UI Component Standards
- Use Gravity UI components exclusively
- Implement `PaginatedTable` for all data tables
- Use `Loader` and `TableSkeleton` for loading states
- Use `ResponseError` component for API errors

### Common Anti-Patterns to Avoid
- ❌ Direct API calls instead of window.api pattern
- ❌ Hardcoded strings instead of i18n
- ❌ Mutating Redux state directly
- ❌ Using React Router v6 patterns (project uses v5)
- ❌ Missing loading states in UI
- ❌ Not handling error cases
- ❌ Inconsistent naming conventions
- ❌ Missing TypeScript types

### Claude-Specific Guidelines

#### When Suggesting Code Changes:
1. Always provide complete, working examples
2. Include proper TypeScript types
3. Show i18n key creation and registration
4. Include error handling and loading states
5. Demonstrate proper testing approaches

#### When Reviewing Code:
1. Check for hardcoded strings (suggest i18n alternatives)
2. Verify API calls use window.api pattern
3. Ensure Redux state is not mutated
4. Confirm proper TypeScript typing
5. Validate component naming conventions

#### When Creating New Components:
1. Use Gravity UI components as base
2. Implement proper prop interfaces
3. Add i18n keyset registration
4. Include loading and error states
5. Follow BEM naming conventions

### Testing Requirements
- Add unit tests for new components
- Use testing-library best practices
- Test error scenarios
- Mock external dependencies properly

### Development Workflow for Claude

1. **Before Suggesting Changes**:
   - Understand the existing code patterns
   - Check for similar implementations in codebase
   - Verify compatibility with project dependencies

2. **When Implementing Features**:
   - Start with TypeScript interfaces
   - Implement API integration using RTK Query
   - Create UI components with Gravity UI
   - Add internationalization support
   - Include comprehensive error handling

3. **Before Finalizing**:
   - Ensure all strings are internationalized
   - Verify API patterns are correct
   - Check TypeScript compilation
   - Validate against anti-patterns list

### File Organization Patterns

```
src/
  components/
    ComponentName/
      ComponentName.tsx          # Main component
      ComponentName.scss         # Styles (if needed)
      i18n/
        index.ts                 # i18n keyset
        en.json                  # English translations
        ru.json                  # Russian translations
      __tests__/
        ComponentName.test.tsx   # Unit tests
```

### Performance Considerations

- Use React.memo for expensive renders
- Implement virtual scrolling for large datasets
- Lazy load Monaco Editor
- Use useCallback/useMemo appropriately
- Batch API requests when possible

### Security Guidelines

- Never commit sensitive data
- Validate all user inputs
- Use proper error boundaries
- Implement proper authentication checks

## Quick Reference Commands

```bash
npm run dev         # Start development server
npm run lint        # Run linters
npm run typecheck   # TypeScript validation
npm run test        # Run unit tests
npm run build       # Production build
```

Remember: The goal is to maintain code quality, consistency, and reliability while following established patterns that have proven effective for this complex monitoring application.
