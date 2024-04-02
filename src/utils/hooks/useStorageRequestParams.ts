import React from 'react';

import type {StorageSortAndFilterParams} from '../../store/reducers/storage/types';
import {EVersion} from '../../types/api/storage';
import {USE_BACKEND_PARAMS_FOR_TABLES_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useStorageRequestParams = ({
    filter,
    sortOrder,
    sortValue,
}: StorageSortAndFilterParams) => {
    const [useBackendParamsForTables] = useSetting<boolean>(USE_BACKEND_PARAMS_FOR_TABLES_KEY);

    // If backend params are enabled, update params value to use them in fetch request
    // Otherwise no params will be updated, no hooks that depend on requestParams will be triggered
    return React.useMemo(() => {
        if (useBackendParamsForTables) {
            return {
                version: EVersion.v2,
                filter,
                sortOrder,
                sortValue,
            };
        }
        return undefined;
    }, [useBackendParamsForTables, filter, sortOrder, sortValue]);
};
