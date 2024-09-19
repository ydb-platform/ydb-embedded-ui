import type {OrderType} from '@gravity-ui/react-data-table';
import {DESCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';
import escapeRegExp from 'lodash/escapeRegExp';

import type {BackendSortParam} from '../types/api/common';

export const prepareSortValue = <T extends string>(
    sortValue: T,
    sortOrder: OrderType = DESCENDING,
): BackendSortParam<T> => {
    if (sortOrder === DESCENDING) {
        return `-${sortValue}`;
    }

    return sortValue;
};

export const prepareSearchValue = (searchValue = '') => {
    return new RegExp(escapeRegExp(searchValue), 'i');
};
