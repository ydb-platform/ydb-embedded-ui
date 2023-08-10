import {useMemo} from 'react';

import {OrderType, SortOrder} from '@gravity-ui/react-data-table';
import {DESCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

interface SortParams {
    sortValue: string | undefined;
    sortOrder: OrderType | undefined;
}

type HandleSort = (rawValue: SortOrder | SortOrder[] | undefined) => void;

export const useTableSort = (
    {sortValue, sortOrder = DESCENDING}: SortParams,
    onSort: (params: SortParams) => void,
): [SortOrder | undefined, HandleSort] => {
    const sort: SortOrder | undefined = useMemo(() => {
        if (!sortValue) {
            return undefined;
        }

        return {
            columnId: sortValue,
            order: sortOrder,
        };
    }, [sortValue, sortOrder]);

    const handleSort: HandleSort = (rawValue) => {
        const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        onSort({
            sortValue: value?.columnId,
            sortOrder: value?.order,
        });
    };

    return [sort, handleSort];
};
