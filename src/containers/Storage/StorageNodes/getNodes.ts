import type {FetchData} from '../../../components/PaginatedTable';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams, NodesSort} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue} from '../../../utils/nodes';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageNodes|offset${offset}|limit${limit}`;
};

export const getStorageNodes: FetchData<
    PreparedStorageNode,
    PreparedStorageNodeFilters,
    Pick<NodesRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {type = 'static', storage = true, limit, offset, sortParams, filters} = params;
    const {searchValue, nodesUptimeFilter, visibleEntities, database} = filters ?? {};
    const {sortOrder, columnId} = sortParams ?? {};

    const sort = prepareSortValue(columnId, sortOrder) as NodesSort;

    const response = await window.api.getNodes(
        {
            type,
            storage,
            limit,
            offset,
            sort,
            filter: searchValue,
            uptime: getUptimeParamValue(nodesUptimeFilter),
            with: visibleEntities,
            database,
        },
        {concurrentId: getConcurrentId(limit, offset)},
    );
    const preparedResponse = prepareStorageNodesResponse(response);
    return {
        data: preparedResponse.nodes || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
