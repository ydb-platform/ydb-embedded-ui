// TEST FOR MANY ENTITIES

import type {FetchData} from '../../../components/PaginatedTable';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue, isSortableNodesProperty} from '../../../utils/nodes';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageNodes|offset${offset}|limit${limit}`;
};

export const getStorageNodes: FetchData<
    PreparedStorageNode,
    PreparedStorageNodeFilters,
    Pick<NodesRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {type = 'static', storage = true, limit, offset, sortParams, filters} = params;
    const {
        searchValue,
        nodesUptimeFilter,
        visibleEntities,
        database,
        nodeId,
        groupId,
        filterGroup,
        filterGroupBy,
    } = filters ?? {};
    const {sortOrder, columnId} = sortParams ?? {};

    const sort = isSortableNodesProperty(columnId)
        ? prepareSortValue(columnId, sortOrder)
        : undefined;

    const response = await window.api.getNodes(
        {
            type,
            storage,
            limit,
            offset: 0,
            sort,
            filter: searchValue,
            uptime: getUptimeParamValue(nodesUptimeFilter),
            with: visibleEntities,
            database,
            node_id: nodeId,
            group_id: groupId,
            filter_group: filterGroup,
            filter_group_by: filterGroupBy,
        },
        {concurrentId: getConcurrentId(limit, offset), signal: params.signal},
    );
    const preparedResponse = prepareStorageNodesResponse(response);

    let mockedData = preparedResponse.nodes?.slice();

    for (let i = 0; i < 1000; i++) {
        mockedData = mockedData?.concat(
            preparedResponse.nodes?.map((data, j) => ({
                ...data,
                NodeId: data.NodeId + i + j,
                Host: data.Host || String(i) + j,
            })) || [],
        );
    }
    const paginatedData = mockedData?.slice(offset, offset + limit);

    return {
        data: paginatedData || [],
        found: mockedData?.length || 0,
        total: mockedData?.length || 0,
    };
};
