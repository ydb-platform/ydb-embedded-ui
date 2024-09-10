import React from 'react';

import type {FetchData} from '../../../components/PaginatedTable';
import {requestStorageData} from '../../../store/reducers/storage/requestStorageData';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import type {StorageV2Sort} from '../../../types/api/storage';
import {prepareSortValue} from '../../../utils/filters';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageGroups|offset${offset}|limit${limit}`;
};

type GetStorageGroups = FetchData<PreparedStorageGroup, PreparedStorageGroupFilters>;

export function useGroupsGetter(useGroupsHandler: boolean) {
    const fetchData: GetStorageGroups = React.useCallback(
        async (params) => {
            const {limit, offset, sortParams, filters} = params;
            const {sortOrder, columnId} = sortParams ?? {};
            const {searchValue, visibleEntities, database, nodeId} = filters ?? {};

            const sort = prepareSortValue(columnId, sortOrder) as StorageV2Sort;

            const {groups, found, total} = await requestStorageData(
                {
                    limit,
                    offset,
                    sort,
                    filter: searchValue,
                    with: visibleEntities,
                    database,
                    nodeId,
                    useGroupsHandler,
                },
                {concurrentId: getConcurrentId(limit, offset)},
            );

            return {
                data: groups || [],
                found: found || 0,
                total: total || 0,
            };
        },
        [useGroupsHandler],
    );

    return fetchData;
}
