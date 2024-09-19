import React from 'react';

import type {FetchData} from '../../../components/PaginatedTable';
import {requestStorageData} from '../../../store/reducers/storage/requestStorageData';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import {prepareSortValue} from '../../../utils/filters';
import {isSortableStorageProperty} from '../../../utils/storage';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageGroups|offset${offset}|limit${limit}`;
};

type GetStorageGroups = FetchData<PreparedStorageGroup, PreparedStorageGroupFilters>;

export function useGroupsGetter(shouldUseGroupsHandler: boolean) {
    const fetchData: GetStorageGroups = React.useCallback(
        async (params) => {
            const {limit, offset, sortParams, filters} = params;
            const {sortOrder, columnId} = sortParams ?? {};
            const {searchValue, visibleEntities, database, nodeId} = filters ?? {};

            const sort = isSortableStorageProperty(columnId)
                ? prepareSortValue(columnId, sortOrder)
                : undefined;

            const {groups, found, total} = await requestStorageData(
                {
                    limit,
                    offset,
                    sort,
                    filter: searchValue,
                    with: visibleEntities,
                    database,
                    nodeId,
                    shouldUseGroupsHandler,
                },
                {concurrentId: getConcurrentId(limit, offset)},
            );

            return {
                data: groups || [],
                found: found || 0,
                total: total || 0,
            };
        },
        [shouldUseGroupsHandler],
    );

    return fetchData;
}
