import React from 'react';

import type {OrderType, SortOrder} from '@gravity-ui/react-data-table';
import isEqual from 'lodash/isEqual';

type HandleSort = (rawValue: SortOrder | SortOrder[] | undefined) => void;

interface TableSortProps {
    initialSortColumn?: string;
    initialSortOrder?: OrderType;
    multiple?: boolean;
    fixedOrderType?: OrderType;
    onSort?: (params: SortOrder[] | undefined) => void;
}

export function useTableSort({
    initialSortColumn,
    initialSortOrder = -1,
    fixedOrderType,
    multiple,
    onSort,
}: TableSortProps): [SortOrder[] | undefined, HandleSort] {
    const [sortOrder, setSortOrder] = React.useState<SortOrder[] | undefined>(() => {
        if (!initialSortColumn) {
            return undefined;
        }
        return [
            {
                columnId: initialSortColumn,
                order: fixedOrderType ? fixedOrderType : initialSortOrder,
            },
        ];
    });

    const handleTableSort: HandleSort = React.useCallback(
        (rawValue) => {
            if (!rawValue || (Array.isArray(rawValue) && !rawValue.length)) {
                // In case we have fixedOrderType, we should not reset table sort to undefined, but use previously set order
                if (!fixedOrderType) {
                    onSort?.(undefined);
                    setSortOrder(undefined);
                }
                return;
            }

            let newSortOrder: SortOrder[] = Array.isArray(rawValue) ? rawValue : [rawValue];

            if (fixedOrderType) {
                newSortOrder = newSortOrder.map((value) => {
                    return {
                        columnId: value.columnId,
                        order: fixedOrderType,
                    };
                });
            }

            if (!multiple) {
                newSortOrder = newSortOrder.slice(0, 1);
            }

            setSortOrder((currentSortOrder) => {
                if (newSortOrder && !isEqual(currentSortOrder, newSortOrder)) {
                    onSort?.(newSortOrder);

                    return newSortOrder;
                }

                return currentSortOrder;
            });
        },
        [fixedOrderType, multiple, onSort],
    );

    return [sortOrder, handleTableSort];
}

export function prepareBackendSortFieldsFromTableSort(
    sortOrder: SortOrder[] = [],
    getSortFieldFromColumnId: (columnId: string) => string | undefined,
): SortOrder[] | undefined {
    const preparedSort = sortOrder
        .map((value) => {
            return {
                columnId: getSortFieldFromColumnId(value.columnId),
                order: value.order,
            };
        })
        .filter((value): value is SortOrder => Boolean(value.columnId));

    if (preparedSort.length) {
        return preparedSort;
    }
    return undefined;
}

function formatSortOrderToQuerySort({columnId, order}: SortOrder) {
    const queryOrder = order === -1 ? 'DESC' : 'ASC';

    return `${columnId} ${queryOrder}`;
}

export function prepareOrderByFromTableSort(sortOrder?: SortOrder[]) {
    return sortOrder ? `ORDER BY ${sortOrder.map(formatSortOrderToQuerySort).join(', ')}` : '';
}
