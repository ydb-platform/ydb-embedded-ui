import {escapeRegExp} from 'lodash';

import type {OrderType} from '@gravity-ui/react-data-table';
import {DESCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

export const prepareSortValue = (
    sortValue: string | undefined,
    sortOrder: OrderType = DESCENDING,
) => {
    if (!sortValue) {
        return '';
    }

    if (sortOrder === DESCENDING) {
        return '-' + sortValue;
    }

    return sortValue;
};

export const prepareSearchValue = (searchValue = '') => {
    return new RegExp(escapeRegExp(searchValue), 'i');
};
