import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import type {
    HandleTableColumnsResize,
    TableColumnsWidthSetup,
} from '../../utils/hooks/useTableResize';

import type {Column, OnSort, SortOrderType, SortParams} from './types';
import {
    ASCENDING,
    DEFAULT_RESIZEABLE,
    DEFAULT_SORT_ORDER,
    DEFAULT_TABLE_ROW_HEIGHT,
    DESCENDING,
} from './constants';
import {b} from './shared';

const COLUMN_NAME_HTML_ATTRIBUTE = 'data-columnname';

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
}: TableHeadCellProps<T>) => {
    const cellWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

    const content = column.header ?? column.name;

    return (
        <th>
            <div
                ref={cellWrapperRef}
                className={b('head-cell-wrapper', {resizeable})}
                style={{
                    height: `${rowHeight}px`,
                    width: `${column.width}px`,
                }}
                {...{
                    [COLUMN_NAME_HTML_ATTRIBUTE]: column.name,
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
    const [sortParams, setSortParams] = useState<SortParams>({});

    const isTableResizeable = Boolean(onColumnsResize);

    const resizeObserver: ResizeObserver | undefined = useMemo(() => {
        if (!isTableResizeable) {
            return undefined;
        }

        return new ResizeObserver((entries) => {
            const columnsWidth: TableColumnsWidthSetup = {};
            entries.forEach((entry) => {
                // @ts-expect-error ignore custrom property usage
                const id = entry.target.attributes[COLUMN_NAME_HTML_ATTRIBUTE]?.value;
                columnsWidth[id] = entry.contentRect.width;
            });

            onColumnsResize?.(columnsWidth);
        });
    }, [onColumnsResize, isTableResizeable]);

    const handleCellMount = useCallback(
        (element: Element) => {
            resizeObserver?.observe(element);
        },
        [resizeObserver],
    );
    const handleCellUnMount = useCallback(
        (element: Element) => {
            resizeObserver?.unobserve(element);
        },
        [resizeObserver],
    );

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
                                onCellMount={handleCellMount}
                                onCellUnMount={handleCellUnMount}
                            />
                        );
                    })}
                </tr>
            </thead>
        );
    };

    return (
        <>
            {renderTableColGroups()}
            {renderTableHead()}
        </>
    );
};
