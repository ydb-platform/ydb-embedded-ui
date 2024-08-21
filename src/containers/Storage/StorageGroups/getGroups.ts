import type {FetchData} from '../../../components/PaginatedTable';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageGroupsResponse} from '../../../store/reducers/storage/utils';
import {EVersion} from '../../../types/api/storage';
import type {StorageSortValue} from '../../../utils/storage';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageGroups|offset${offset}|limit${limit}`;
};

export const getStorageGroups: FetchData<
    PreparedStorageGroup,
    PreparedStorageGroupFilters
> = async (params) => {
    const {limit, offset, sortParams, filters} = params;
    const {sortOrder, columnId} = sortParams ?? {};
    const {searchValue, visibleEntities, database, nodeId} = filters ?? {};

    const response = await window.api.getStorageInfo(
        {
            version: EVersion.v2,
            limit,
            offset,
            sortOrder,
            sortValue: columnId as StorageSortValue,
            filter: searchValue,
            visibleEntities,
            database,
            nodeId,
        },
        {concurrentId: getConcurrentId(limit, offset)},
    );
    const preparedResponse = prepareStorageGroupsResponse(response);

    return {
        data: preparedResponse.groups || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
