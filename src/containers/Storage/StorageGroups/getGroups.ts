import type {FetchData} from '../../../components/PaginatedTable';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageResponse} from '../../../store/reducers/storage/utils';
import type {StorageV2Sort} from '../../../types/api/storage';
import {prepareSortValue} from '../../../utils/filters';

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

    const sort = prepareSortValue(columnId, sortOrder) as StorageV2Sort;

    const response = await window.api.getStorageInfo(
        {
            version: 'v2',
            limit,
            offset,
            sort,
            filter: searchValue,
            with: visibleEntities,
            database,
            nodeId,
        },
        {concurrentId: getConcurrentId(limit, offset)},
    );
    const preparedResponse = prepareStorageResponse(response);

    return {
        data: preparedResponse.groups || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
