# PaginatedTable Layout Fix Plan: Resolving Header-Body Alignment Issues

## Problem Analysis

### Root Cause

The current virtualization implementation uses `position: absolute` for table rows with `transform: translateY()` positioning. This approach breaks the fundamental table layout model:

1. **Absolutely positioned rows are removed from document flow** - This breaks the natural table layout algorithm
2. **Header-body column alignment is lost** - `<thead>` and `<tbody>` are no longer synchronized for column widths
3. **Table structure becomes invalid** - Absolutely positioned `<tr>` elements violate HTML table semantics
4. **Column resizing breaks** - Headers and body cells are disconnected from each other

### Current Implementation Issues

```scss
// Current problematic approach in PaginatedTable.scss
&__row {
  position: absolute; // ❌ Breaks table layout
  top: 0;
  left: 0;
  right: 0;
  transform: translateY(${top}px); // ❌ Disconnects from table flow
}
```

## Solution Architecture

### Strategy 1: Hybrid Table-Div Virtualization (Recommended)

Replace the current table structure with a hybrid approach that maintains proper header-body alignment while enabling virtualization.

#### Key Components:

1. **Fixed Header Table** - Real `<table>` for headers with proper column widths
2. **Virtualized Body Container** - Scrollable div container for virtualized content
3. **Synchronized Column Widths** - Shared width state between header and body
4. **Virtual Row Positioning** - Absolute positioning within the body container (not within table)

#### Architecture:

```
┌─────────────────────────────────────┐
│ Fixed Header Table (<table>)        │
│ ┌─────────┬─────────┬─────────┐    │
│ │ Header1 │ Header2 │ Header3 │    │
│ └─────────┴─────────┴─────────┘    │
├─────────────────────────────────────┤
│ Virtualized Body Container (<div>)  │
│ ┌─────────────────────────────────┐ │
│ │ Virtual Row 1 (absolute)        │ │
│ │ Virtual Row 2 (absolute)        │ │
│ │ Virtual Row 3 (absolute)        │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Strategy 2: CSS Grid Virtualization (Alternative)

Use CSS Grid to maintain proper column alignment while enabling row virtualization.

#### Key Components:

1. **Grid Container** - CSS Grid with fixed column definitions
2. **Header Row** - Sticky positioned grid items
3. **Virtual Body Rows** - Absolutely positioned grid rows
4. **Column Synchronization** - Shared grid template columns

## Implementation Plan

### Phase 1: Hybrid Table-Div Architecture (Primary Solution)

#### 1.1 Create New Components

**VirtualizedTableContainer.tsx**

```typescript
interface VirtualizedTableContainerProps<T> {
  columns: Column<T>[];
  dataMap: Map<number, T>;
  virtualRows: {index: number; top: number}[];
  totalHeight: number;
  rowHeight: number;
  // ... other props
}
```

**FixedTableHeader.tsx**

```typescript
interface FixedTableHeaderProps<T> {
  columns: Column<T>[];
  onSort?: OnSort;
  onColumnsResize?: HandleTableColumnsResize;
  // Synchronized column widths
  columnWidths: Record<string, number>;
  onColumnWidthChange: (columnName: string, width: number) => void;
}
```

**VirtualizedTableBody.tsx**

```typescript
interface VirtualizedTableBodyProps<T> {
  columns: Column<T>[];
  dataMap: Map<number, T>;
  virtualRows: {index: number; top: number}[];
  totalHeight: number;
  rowHeight: number;
  // Synchronized column widths
  columnWidths: Record<string, number>;
}
```

#### 1.2 Column Width Synchronization Hook

**useColumnWidthSync.ts**

```typescript
interface UseColumnWidthSyncProps<T> {
  columns: Column<T>[];
  onColumnsResize?: HandleTableColumnsResize;
}

interface UseColumnWidthSyncResult {
  columnWidths: Record<string, number>;
  updateColumnWidth: (columnName: string, width: number) => void;
  headerRef: RefObject<HTMLTableElement>;
  bodyRef: RefObject<HTMLDivElement>;
}
```

#### 1.3 Virtual Row Component Updates

**VirtualizedBodyRow.tsx** (New component for body rows)

```typescript
interface VirtualizedBodyRowProps<T> {
  row: T;
  index: number;
  top: number;
  columns: Column<T>[];
  columnWidths: Record<string, number>;
  rowHeight: number;
  getRowClassName?: GetRowClassName<T>;
}
```

### Phase 2: CSS Styling Updates

#### 2.1 New SCSS Structure

```scss
.ydb-paginated-table {
  &__container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__header-table {
    // Fixed header table styles
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--g-color-base-background);
    border-bottom: 1px solid var(--paginated-table-border-color);
  }

  &__body-container {
    // Scrollable body container
    position: relative;
    flex: 1;
    overflow: auto;
  }

  &__virtual-row {
    // Virtual row positioning within body container
    position: absolute;
    left: 0;
    right: 0;
    display: flex; // Use flexbox for column alignment

    // GPU acceleration
    will-change: transform;
    transform: translateZ(0);
  }

  &__virtual-cell {
    // Individual cell styling with synchronized widths
    display: flex;
    align-items: center;
    padding: var(--paginated-table-cell-vertical-padding)
      var(--paginated-table-cell-horizontal-padding);
    border-bottom: 1px solid var(--paginated-table-border-color);

    // Width will be set dynamically via style prop
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

### Phase 3: Migration Strategy

#### 3.1 Backward Compatibility

- Maintain existing PaginatedTable API
- Internal implementation changes only
- Gradual rollout with feature flags

#### 3.2 Testing Strategy

- Unit tests for column width synchronization
- Integration tests for header-body alignment
- Visual regression tests for layout consistency
- Performance benchmarks for scrolling

### Phase 4: Performance Optimizations

#### 4.1 Column Width Caching

- Cache column width calculations
- Debounce resize operations
- Minimize layout recalculations

#### 4.2 Virtual Row Optimizations

- Maintain existing GPU acceleration
- Optimize transform calculations
- Implement efficient row recycling

## Benefits of This Approach

### 1. Maintains Table Semantics

- Proper `<table>` structure for headers
- Accessible table markup
- Screen reader compatibility

### 2. Fixes Layout Issues

- Perfect header-body column alignment
- Proper column resizing behavior
- Consistent column widths

### 3. Preserves Performance

- GPU-accelerated row positioning
- Efficient virtualization
- Minimal layout recalculations

### 4. Backward Compatibility

- Same API surface
- No breaking changes
- Gradual migration path

## Implementation Timeline

### Week 1: Core Architecture

- [ ] Create new component structure
- [ ] Implement column width synchronization
- [ ] Basic hybrid table-div layout

### Week 2: Virtualization Integration

- [ ] Integrate with existing useVirtualRows
- [ ] Update VirtualizedTableContent
- [ ] Implement virtual body rows

### Week 3: Styling and Polish

- [ ] Update SCSS for new structure
- [ ] Fix visual inconsistencies
- [ ] Performance optimizations

### Week 4: Testing and Migration

- [ ] Comprehensive testing
- [ ] Migration of existing usage
- [ ] Documentation updates

## Alternative Solutions Considered

### 1. CSS Table-Cell Virtualization

**Pros**: Maintains table structure
**Cons**: Limited browser support, complex implementation

### 2. Flexbox Table Simulation

**Pros**: Full control over layout
**Cons**: Loses table semantics, accessibility issues

### 3. CSS Grid Table

**Pros**: Modern layout approach
**Cons**: Browser compatibility, complex column resizing

## Risk Assessment

### Low Risk

- Column width synchronization
- Basic layout implementation
- SCSS updates

### Medium Risk

- Performance impact of dual structure
- Complex resize handling
- Browser compatibility edge cases

### High Risk

- Breaking existing functionality
- Performance regression
- Migration complexity

## Success Metrics

### Functional

- [ ] Perfect header-body alignment
- [ ] Working column resize
- [ ] Maintained virtualization performance

### Performance

- [ ] 60fps scrolling maintained
- [ ] Memory usage within 10% of current
- [ ] No layout thrashing

### Quality

- [ ] Zero visual regressions
- [ ] Maintained accessibility
- [ ] Clean code architecture

---

**Next Steps**: Begin implementation with Phase 1 - Core Architecture, starting with the column width synchronization hook and basic hybrid layout structure.
