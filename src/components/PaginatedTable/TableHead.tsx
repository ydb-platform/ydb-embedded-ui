import React from 'react';

import {ResizeHandler} from './ResizeHandler';
import {
    ASCENDING,
    DEFAULT_RESIZEABLE,
    DEFAULT_SORT_ORDER,
    DEFAULT_TABLE_ROW_HEIGHT,
    DESCENDING,
} from './constants';
import {b} from './shared';
import type {Column, HandleTableColumnsResize, OnSort, SortOrderType, SortParams} from './types';

// Icon similar to original DataTable icons to keep the same tables across diferent pages and tabs
const SortIcon = ({order}: {order?: SortOrderType}) => {
    return (
        <svg
            className={b('sort-icon', {desc: order === DESCENDING})}
            viewBox="0 0 10 6"
            width="10"
            height="6"
        >
            <path fill="currentColor" d="M0 5h10l-5 -5z" />
        </svg>
    );
};

interface ColumnSortIconProps {
    sortOrder?: SortOrderType;
    sortable?: boolean;
    defaultSortOrder: SortOrderType;
}

const ColumnSortIcon = ({sortOrder, sortable, defaultSortOrder}: ColumnSortIconProps) => {
    if (sortable) {
        return (
            <span className={b('sort-icon-container', {shadow: !sortOrder})}>
                <SortIcon order={sortOrder || defaultSortOrder} />
            </span>
        );
    } else {
        return null;
    }
};

interface TableHeadCellProps<T> {
    column: Column<T>;
    resizeable?: boolean;
    sortOrder?: SortOrderType;
    defaultSortOrder: SortOrderType;
    onSort?: (columnName: string) => void;
    rowHeight: number;
    onCellMount?: (element: Element) => void;
    onCellUnMount?: (element: Element) => void;
    onColumnsResize?: HandleTableColumnsResize;
}

export const TableHeadCell = <T,>({
    column,
    resizeable,
    sortOrder,
    defaultSortOrder,
    onSort,
    rowHeight,
    onCellMount,
    onCellUnMount,
    onColumnsResize,
}: TableHeadCellProps<T>) => {
    const cellWrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const cellWrapper = cellWrapperRef.current;
        if (cellWrapper) {
            onCellMount?.(cellWrapper);
        }
        return () => {
            if (cellWrapper) {
                onCellUnMount?.(cellWrapper);
            }
        };
    }, [onCellMount, onCellUnMount]);

    const getCurrentColumnWidth = React.useCallback(() => {
        return cellWrapperRef.current?.getBoundingClientRect().width;
    }, []);

    const handleResize = React.useCallback(
        (newWidth: number) => {
            onColumnsResize?.(column.name, newWidth);
        },
        [onColumnsResize, column.name],
    );

    const content = column.header ?? column.name;

    return (
        <th>
            <div
                ref={cellWrapperRef}
                className={b('head-cell-wrapper')}
                style={{
                    height: `${rowHeight}px`,
                    width: `${column.width}px`,
                }}
            >
                <div
                    className={b(
                        'head-cell',
                        {align: column.align, sortable: column.sortable},
                        column.className,
                    )}
                    onClick={() => {
                        if (column.sortable) {
                            onSort?.(column.name);
                        }
                    }}
                >
                    <div className={b('head-cell-content')}>{content}</div>
                    <ColumnSortIcon
                        sortOrder={sortOrder}
                        sortable={column.sortable}
                        defaultSortOrder={defaultSortOrder}
                    />
                </div>
                {resizeable ? (
                    <ResizeHandler
                        maxWidth={column.resizeMaxWidth}
                        minWidth={column.resizeMinWidth}
                        getCurrentColumnWidth={getCurrentColumnWidth}
                        onResize={handleResize}
                    />
                ) : null}
            </div>
        </th>
    );
};

interface TableHeadProps<T> {
    columns: Column<T>[];
    onSort?: OnSort;
    onColumnsResize?: HandleTableColumnsResize;
    defaultSortOrder?: SortOrderType;
    rowHeight?: number;
}

export const TableHead = <T,>({
    columns,
    onSort,
    onColumnsResize,
    defaultSortOrder = DEFAULT_SORT_ORDER,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
}: TableHeadProps<T>) => {
    const [sortParams, setSortParams] = React.useState<SortParams>({});

    const handleSort = (columnId: string) => {
        let newSortParams: SortParams = {};

        // Order is changed in following order:
        // 1. Inactive Sort Order - grey icon of default order
        // 2. Active default order
        // 3. Active not default order
        if (columnId === sortParams.columnId) {
            if (sortParams.sortOrder && sortParams.sortOrder !== defaultSortOrder) {
                setSortParams(newSortParams);
                onSort?.(newSortParams);
                return;
            }
            const newSortOrder = sortParams.sortOrder === ASCENDING ? DESCENDING : ASCENDING;
            newSortParams = {
                sortOrder: newSortOrder,
                columnId: columnId,
            };
        } else {
            newSortParams = {
                sortOrder: defaultSortOrder,
                columnId: columnId,
            };
        }

        onSort?.(newSortParams);
        setSortParams(newSortParams);
    };

    const renderTableColGroups = () => {
        return (
            <colgroup>
                {columns.map((column) => {
                    return <col key={column.name} style={{width: `${column.width}px`}} />;
                })}
            </colgroup>
        );
    };

    const renderTableHead = () => {
        return (
            <thead className={b('head')}>
                <tr>
                    {columns.map((column) => {
                        const sortOrder =
                            sortParams.columnId === column.name ? sortParams.sortOrder : undefined;

                        const resizeable =
                            onColumnsResize && (column.resizeable ?? DEFAULT_RESIZEABLE);

                        return (
                            <TableHeadCell
                                key={column.name}
                                column={column}
                                resizeable={resizeable}
                                sortOrder={sortOrder}
                                defaultSortOrder={defaultSortOrder}
                                onSort={handleSort}
                                rowHeight={rowHeight}
                                onColumnsResize={onColumnsResize}
                            />
                        );
                    })}
                </tr>
            </thead>
        );
    };

    return (
        <React.Fragment>
            {renderTableColGroups()}
            {renderTableHead()}
        </React.Fragment>
    );
};
