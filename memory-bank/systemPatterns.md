# System Patterns: Pagination Implementation

## Scroll-Based Chunk Virtualization

The YDB Embedded UI implements a scroll-based chunk virtualization pattern for table pagination, which is a common approach for efficiently rendering large datasets in web applications. The implementation is based on the following key concepts:

### 1. Chunking

The data is divided into "chunks" of rows (e.g., 20 rows per chunk by default), and only the chunks that are currently visible or near the viewport are rendered. This approach significantly reduces the DOM size and improves performance for large datasets.

### 2. Scroll Position Tracking

The system tracks the user's scroll position to determine which chunks should be rendered. As the user scrolls, new chunks come into view and are rendered, while chunks that move far from the viewport are unmounted to conserve memory and improve performance.

### 3. Virtual Height Calculation

To maintain proper scrollbar behavior, the system calculates the total virtual height of all rows (including those not currently rendered) and applies it to container elements. This provides a consistent scrolling experience without actually rendering all rows.

### 4. Chunk Loading Pattern

The chunk loading mechanism is sophisticated and includes several key features:

- **On-demand loading**: Each chunk loads its data only when it becomes "active" (visible in the viewport or within the overscan area)
- **Debounced fetching**: Data fetching has a default timeout of 200ms to avoid unnecessary requests during rapid scrolling
- **Loading placeholders**: While a chunk is loading, it displays skeleton loaders through the `LoadingTableRow` component to maintain correct layout and provide visual feedback
- **Error handling**: Each chunk independently handles and displays errors using the `EmptyTableRow` with either a custom error renderer or a default `ResponseError` component, ensuring errors in one chunk don't affect others
- **RTK Query integration**: Uses Redux Toolkit Query for data fetching, caching, and auto-refresh capabilities

### 5. Chunk-Level Rendering

Unlike some virtualization implementations that virtualize at the row level, this system virtualizes at the chunk level. When a chunk is active, all rows within that chunk are rendered. This approach simplifies the implementation while still providing good performance for reasonably sized chunks.

## Component Communication Pattern

The pagination implementation follows a hierarchical component communication pattern:

1. **PaginatedTable** (Parent Component)

   - Manages the overall state and configuration
   - Provides context and props to child components
   - Uses useScrollBasedChunks to determine which chunks are active

2. **TableChunk** (Container Component)

   - Receives a subset of data to render
   - Manages loading states and data fetching
   - Only renders content when isActive is true
   - Maintains proper height to ensure correct scrollbar behavior

3. **TableRow Components** (Presentational Components)
   - **TableRow**: Renders a single row of data with actual content
   - **LoadingTableRow**: Renders skeleton placeholders using the Skeleton UI component with consistent dimensions
   - **EmptyTableRow**: Renders a message or error state with full table width (colSpan)
   - All variants maintain consistent layout and height for smooth transitions

## Performance Optimization Patterns

1. **Throttled Scroll Handling**

   - Scroll events are throttled to avoid excessive calculations
   - Default throttle delay of 100ms balances responsiveness and performance

2. **Debounced Data Fetching**

   - Data fetching is debounced to prevent unnecessary API calls during rapid scrolling
   - Default debounce timeout of 200ms

3. **Memoization**

   - Components use React.useMemo and typedMemo to prevent unnecessary re-renders
   - Particularly important for TableChunk to avoid performance issues with large tables

4. **Overscan**

   - The system renders additional chunks beyond the visible area (overscan)
   - This provides smoother scrolling by having content ready before it comes into view

5. **Display Strategy**
   - Non-active chunks use display: block to maintain proper height without rendering content
   - Active chunks use display: table-row-group for proper table layout

[2025-04-27 13:35:00] - Initial documentation of pagination system patterns
