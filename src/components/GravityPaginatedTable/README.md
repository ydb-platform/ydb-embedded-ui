# GravityPaginatedTable

A high-performance table component with virtualization, pagination, and dynamic data loading.

## Dependencies

Built on top of:

- `@gravity-ui/table` (^1.7.0) - Core table functionality and virtualization
- `@tanstack/react-table` (^8.19.3) - Table state management and features
- `@bem-react/classname` (^1.6.0) - BEM class naming

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│    API      │     │  useTableData│     │ Virtual Rows │
│  50 rows    │────>│  Data Store  │────>│ Only visible │
└─────────────┘     └──────────────┘     └──────────────┘
      ▲                    │                     │
      │                    │                     │
      └──────────────────  │  ──────────────────┘
                     Scroll near bottom
                     Load more data
```

```
┌────────────────────────────────────────┐
│           GravityPaginatedTable        │
│  ┌─────────────┐    ┌───────────────┐  │
│  │  Controls   │    │ VirtualContent│  │
│  │  Optional   │    │  Scrollable   │  │
│  └─────────────┘    └───────┬───────┘  │
│                            │          │
│         ┌─────────────┐    │          │
│         │  TableHead  │    │          │
│         │   Sticky    │    │          │
│         └─────────────┘    │          │
│              ▲             │          │
│              │      ┌──────▼──────┐   │
│         useTable    │ VirtualRows │   │
│         Columns     │ Visible only│   │
│                     └─────────────┘   │
└────────────────────────────────────────┘
```

## How it works

### 1. Data Loading (useTableData)

```
Initial Load:
1. Uses RTK Query to fetch first 50 rows
2. Stores total count and data
3. Creates loading placeholders

Scroll Loading:
1. Detects scroll near bottom
2. Fetches next 50 rows
3. Deduplicates by ID
4. Appends unique rows

Features:
- Auto-refresh with configurable interval
- State reset on filter changes
- Duplicate prevention
- Loading states and error handling
```

### 2. Row Virtualization (useVirtualization)

```
For 1000 total rows:
1. Creates array of virtual rows:
   [
     { type: 'data', data: row1 },     // Loaded data
     { type: 'data', data: row2 },
     ...
     { type: 'loading' },              // Next 5 rows being loaded
     { type: 'loading' },
     { type: 'empty' },                // Remaining rows
     { type: 'empty' }
   ]

2. Renders efficiently:
   - Shows ~10 rows in viewport
   - Keeps 5 rows above and below (overscan)
   - Uses overscan for smooth scrolling
   - Adds padding for invisible rows
   - Shows loading state for next chunk
```

### 3. Table Structure

```
<TableWithControlsLayout>           // Optional controls wrapper
    <TableWithControlsLayout.Controls>
        {/* Custom controls */}
    </TableWithControlsLayout.Controls>
    <TableWithControlsLayout.Table>
        <div className="virtualized-content">  // Scrollable container
            <div>                              // Content wrapper
                <table>
                    <TableHead>                // Sticky header
                        <th>...</th>           // Column headers
                    </TableHead>
                    <tbody>
                        <VirtualRows>          // Only visible rows + overscan
                            <tr>...</tr>       // Data rows
                            <tr>...</tr>       // Loading rows
                        </VirtualRows>
                    </tbody>
                </table>
            </div>
        </div>
    </TableWithControlsLayout.Table>
</TableWithControlsLayout>
```

### 4. Column Management (@gravity-ui/table)

```
1. Column Configuration:
   {
     name: 'id',              // Column identifier
     header: 'ID',            // Display name
     width: 100,             // Initial width
     sortable: true,         // Enable sorting
     resizeable: true,       // Default: true
     align: 'left'           // Default: 'left'
   }

2. Features:
   - Resizable columns (enabled by default)
   - Column sorting (optional)
   - Custom cell rendering
   - Left/center/right alignment
```

### 5. Visual Features

```
Layout:
├── Flex-based table layout
│   ├── Consistent column sizing
│   └── Proper alignment control
│
├── Header
│   ├── Sticky positioning (z-index: 1)
│   ├── Background color for overlap
│   └── Gap between header cells
│
├── Content
│   ├── Text ellipsis for overflow
│   ├── Consistent padding (8px 16px)
│   └── Vertical centering
│
└── Loading States
    ├── Opacity transitions (0.2s ease)
    ├── Pulse animation (1.5s)
    └── Centered loading indicators
```

## Configuration

```typescript
// Required props
{
    columnsWidthLSKey: string;      // Local storage key for column widths
    columns: Column[];              // Column definitions
    fetchData: (params) => {        // Data fetching function
        data: T[];
        total: number;
    };
    parentRef: RefObject;           // Container ref
    getRowId: (row: T) => string | number;  // Function to extract unique row identifier
}

// Optional props
{
    filters?: any;                  // Data filters
    tableName?: string;             // Table identifier
    rowHeight?: number;             // Default: 51px
    maxVisibleRows?: number;        // Default: 10
    minHeight?: number;             // Default: rowHeight * 3
    autoRefreshInterval?: number;   // Auto-refresh interval in ms

    // Customization
    getRowClassName?: (row) => string;
    renderControls?: (props) => ReactNode;
    renderErrorMessage?: (error) => ReactNode;
    renderEmptyDataMessage?: () => ReactNode;
}
```

## Data Requirements

The table requires a way to uniquely identify each row. This is handled through the required `getRowId` prop, which is a function that extracts a unique identifier from each data item:

```typescript
// Example with id field
<GravityPaginatedTable
    getRowId={(row) => row.id}
    // ... other props
/>

// Example with custom field
<GravityPaginatedTable
    getRowId={(row) => row.NodeId}
    // ... other props
/>
```

The extracted identifier must be either a string or number and should be unique within the dataset.

## Customization

```typescript
// Control rendering
renderControls?: (props: {
    inited: boolean;           // Table is initialized
    totalEntities: number;     // Total rows count
    foundEntities: number;     // Filtered rows count
}) => ReactNode;

// Error handling
renderErrorMessage?: (error: {
    status?: number;          // HTTP status
    message?: string;         // Error message
}) => ReactNode;

// Empty state
renderEmptyDataMessage?: () => ReactNode;

// Row styling
getRowClassName?: (row: T) => string;
```

## Exported Components and Hooks

```typescript
// Main component
import {GravityPaginatedTable} from '@/components/GravityPaginatedTable';

// Independent data loading hook
import {useTableData} from '@/components/GravityPaginatedTable';
const {
  data, // Current data array
  isLoading, // Initial loading state
  isLoadingMore, // Loading next chunk
  hasNextPage, // More data available
  totalEntities, // Total count
  foundEntities, // Filtered count
  loadMoreData, // Load next chunk
} = useTableData({
  fetchData, // Data fetching function
  getRowId, // Row identifier function
  // ... other props
});
```

## Controls Integration

The table uses TableWithControlsLayout for consistent controls placement:

```typescript
// When renderControls prop is provided:
<GravityPaginatedTable
    renderControls={({inited, totalEntities, foundEntities}) => (
        <YourControls
            inited={inited}
            total={totalEntities}
            found={foundEntities}
        />
    )}
    // ... other props
/>

// Controls will be automatically placed above the table
// in a consistent layout using TableWithControlsLayout
```

## Key Points

1. **Performance & Flexibility**

   - Only renders visible rows + overscan
   - Uses 5-row overscan buffer
   - Reuses DOM elements
   - Loads data as needed
   - Prevents duplicate data
   - Flexible row identification through getRowId

2. **Memory**

   - Keeps all loaded data in memory
   - Virtual rows for unloaded data
   - Efficient DOM updates

3. **User Experience**
   - Smooth scrolling with overscan
   - Responsive loading with animations
   - No layout shifts
   - Auto-refresh support
