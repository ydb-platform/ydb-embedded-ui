import type {FetchData} from '../../../components/PaginatedTable';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue, isSortableNodesProperty} from '../../../utils/nodes';

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

    const response = await window.api.getNodes({
        type,
        storage,
        limit,
        offset,
        sort,
        filter: searchValue,
        uptime: getUptimeParamValue(nodesUptimeFilter),
        with: visibleEntities,
        database,
        node_id: nodeId,
        group_id: groupId,
        filter_group: filterGroup,
        filter_group_by: filterGroupBy,
    });
    const preparedResponse = prepareStorageNodesResponse(response);
    return {
        data: preparedResponse.nodes || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
