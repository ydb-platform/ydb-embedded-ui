# Infinite Scrolling Pagination - Technical Overview

## Architecture Overview

The implementation transforms a traditional paginated table into an infinite scrolling experience by leveraging token-based pagination provided by the YDB API. The solution accumulates data from multiple API responses while maintaining seamless user experience through scroll-based loading triggers.

## Technology Stack

### Core Libraries

1. **@gravity-ui/table**

   - Provides the base table component with built-in virtualization support
   - Offers React hooks for table state management
   - Integrates seamlessly with @tanstack/react-table for advanced features

2. **@tanstack/react-table (v8)**

   - Powers the table logic including sorting, filtering, and column management
   - Provides TypeScript-first API with strong type safety
   - Offers flexible column definitions and cell rendering capabilities

3. **RTK Query (Redux Toolkit Query)**

   - Manages API calls through the existing `operationsApi` service
   - Provides caching, polling, and request lifecycle management
   - Enables conditional query execution through the `skip` parameter

4. **React Hooks**
   - Custom hooks pattern for encapsulating infinite scroll logic
   - Leverages useState, useEffect, useCallback, and useMemo for state management
   - Provides clean separation of concerns between UI and business logic

## Technical Design Decisions

### Token-Based Pagination Strategy

The implementation uses a token-based pagination approach rather than offset/limit pagination:

- **Advantages**: Consistent results even with concurrent data modifications, no missed or duplicate records
- **Token Management**: Maintains a single `currentPageToken` state that updates with each API response
- **End Detection**: Determines end of data when API returns no `next_page_token`

### Data Accumulation Pattern

Instead of replacing data on each page load, the system accumulates operations:

- **Memory Considerations**: All loaded operations remain in memory until filter/search changes
- **Performance Trade-offs**: Faster perceived performance vs. increased memory usage
- **Reset Triggers**: Search term changes and operation kind filter changes clear accumulated data

### Scroll Detection Mechanism

The scroll handler uses a threshold-based approach:

- **Threshold**: 100 pixels from bottom of scrollable area
- **Debouncing**: Natural debouncing through loading state checks
- **Event Delegation**: Scroll events attached to table container via enhanced TableWithControlsLayout

## State Management Architecture

### Local State Management

The `useInfiniteOperations` hook manages four key pieces of state:

1. **allOperations**: Accumulated array of operations from all loaded pages
2. **currentPageToken**: Token for fetching the next page
3. **hasNextPage**: Boolean flag indicating data availability
4. **isLoadingMore**: Loading state for subsequent pages (not initial load)

### API Integration Pattern

The implementation integrates with existing RTK Query infrastructure:

- **Query Reuse**: Uses existing `useGetOperationListQuery` endpoint
- **Conditional Fetching**: Skips queries when no more pages available
- **Polling Support**: Maintains auto-refresh functionality with `pollingInterval`

## Migration Strategy

### From @gravity-ui/react-data-table to @tanstack/react-table

The migration involved several architectural changes:

1. **Column Definition Format**

   - Changed from proprietary column format to ColumnDef interface
   - Migrated render functions to cell accessor pattern
   - Updated sorting functions to use row.original data access

2. **Table Instance Management**

   - Replaced imperative API with declarative hook-based approach
   - Moved from direct data manipulation to reactive state updates
   - Integrated with @gravity-ui/table wrapper for consistent styling

3. **Feature Preservation**
   - Maintained all existing sorting capabilities
   - Preserved custom cell renderers and formatters
   - Kept action buttons and confirmation dialogs intact

## Performance Characteristics

### Network Efficiency

- **Lazy Loading**: Data fetched only when user scrolls near bottom
- **Request Deduplication**: Loading state prevents concurrent requests
- **Optimal Page Size**: Configurable through existing pageSize parameter

### Memory Management

- **Linear Growth**: Memory usage grows linearly with scrolled content
- **No Virtualization**: Current implementation renders all loaded rows
- **Reset Mechanism**: Filter changes clear accumulated data

### User Experience Optimizations

- **Smooth Scrolling**: No scroll position jumps during data loading
- **Loading Indicators**: Separate indicators for initial load vs. loading more
- **Error Boundaries**: Graceful error handling without losing loaded data

## Integration Points

### Component Hierarchy

The implementation maintains clean separation of concerns:

1. **Operations Component**: Orchestrates table setup and scroll handling
2. **useInfiniteOperations Hook**: Manages data fetching and accumulation
3. **TableWithControlsLayout**: Enhanced with scroll event propagation
4. **Table Component**: Renders accumulated data with @gravity-ui styling

### API Contract

The implementation relies on specific API response structure:

- **operations**: Array of operation objects
- **next_page_token**: String token for next page (optional)
- **Pagination Parameters**: page_size and page_token query parameters

## Backward Compatibility

### Preserved Interfaces

- All public component props remain unchanged
- Existing column definitions work with minor syntax updates
- Search and filter functionality operates identically

### Internal Changes

- Table rendering engine switched to @tanstack/react-table
- Pagination state management moved to custom hook
- Scroll event handling added to table container

## Scalability Considerations

### Current Limitations

- All data held in memory (no virtual scrolling)
- Client-side search across accumulated data
- No server-side cursor management

### Future Enhancement Paths

1. **Virtual Scrolling**: Implement for datasets exceeding 1000 rows
2. **Intelligent Prefetching**: Load next page before user reaches threshold
3. **Memory Management**: Implement sliding window or LRU cache
4. **Server-Side Search**: Optimize search to work with pagination

## Testing Strategy

### Unit Testing Approach

- Hook testing with React Testing Library
- Mocked API responses for pagination scenarios
- Scroll event simulation for trigger testing

### Integration Testing

- Full component rendering with mock data
- User interaction flows including scroll and search
- Error scenario handling and recovery

### Performance Testing

- Memory profiling with large datasets
- Scroll performance metrics
- Network request optimization validation
