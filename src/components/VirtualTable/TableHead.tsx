import {useState} from 'react';

import type {Column, OnSort, SortOrderType, SortParams} from './types';
import {ASCENDING, DEFAULT_SORT_ORDER, DEFAULT_TABLE_ROW_HEIGHT, DESCENDING} from './constants';
import {b} from './shared';

// Icon similar to original DataTable icons to keep the same tables across diferent pages and tabs
const SortIcon = ({order}: {order?: SortOrderType}) => {
    return (
        <svg
            className={b('icon', {desc: order === DESCENDING})}
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
            <span className={b('sort-icon', {shadow: !sortOrder})}>
                <SortIcon order={sortOrder || defaultSortOrder} />
            </span>
        );
    } else {
        return null;
    }
};

interface TableHeadProps<T> {
    columns: Column<T>[];
    onSort?: OnSort;
    defaultSortOrder?: SortOrderType;
    rowHeight?: number;
}

export const TableHead = <T,>({
    columns,
    onSort,
    defaultSortOrder = DEFAULT_SORT_ORDER,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
}: TableHeadProps<T>) => {
    const [sortParams, setSortParams] = useState<SortParams>({});

    const handleSort = (columnId: string) => {
        let newSortParams: SortParams = {};

        // Order is changed in following order:
        // 1. Inactive Sort Order - gray icon of default order
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
                        const content = column.header ?? column.name;
                        const sortOrder =
                            sortParams.columnId === column.name ? sortParams.sortOrder : undefined;

                        return (
                            <th
                                key={column.name}
                                className={b(
                                    'th',
                                    {align: column.align, sortable: column.sortable},
                                    column.className,
                                )}
                                style={{
                                    height: `${rowHeight}px`,
                                }}
                                onClick={() => {
                                    handleSort(column.name);
                                }}
                            >
                                <div className={b('head-cell')}>
                                    {content}
                                    <ColumnSortIcon
                                        sortOrder={sortOrder}
                                        sortable={column.sortable}
                                        defaultSortOrder={defaultSortOrder}
                                    />
                                </div>
                            </th>
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
