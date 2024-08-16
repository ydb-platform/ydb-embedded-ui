import type {FetchData} from '../../../components/PaginatedTable';
import type {NodesApiRequestParams} from '../../../store/reducers/nodes/types';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import {getUptimeParamValue} from '../../../utils/nodes';
import type {NodesSortValue} from '../../../utils/nodes';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageNodes|offset${offset}|limit${limit}`;
};

export const getStorageNodes: FetchData<
    PreparedStorageNode,
    PreparedStorageNodeFilters,
    Pick<NodesApiRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {type = 'static', storage = true, limit, offset, sortParams, filters} = params;
    const {searchValue, nodesUptimeFilter, visibleEntities, tenant} = filters ?? {};
    const {sortOrder, columnId} = sortParams ?? {};

    const response = await window.api.getNodes(
        {
            type,
            storage,
            limit,
            offset,
            sortOrder,
            sortValue: columnId as NodesSortValue,
            filter: searchValue,
            uptime: getUptimeParamValue(nodesUptimeFilter),
            visibleEntities,
            tenant,
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
