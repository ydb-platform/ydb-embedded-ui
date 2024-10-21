import type {FetchData} from '../../../components/PaginatedTable';
import {NODES_COLUMNS_TO_DATA_FIELDS} from '../../../components/nodesColumns/constants';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue, isSortableNodesProperty} from '../../../utils/nodes';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';

export const getStorageNodes: FetchData<
    PreparedStorageNode,
    PreparedStorageNodeFilters,
    Pick<NodesRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {
        type = 'static',
        storage = true,
        limit,
        offset,
        sortParams,
        filters,
        columnsIds,
    } = params;
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

    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

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
        fieldsRequired: dataFieldsRequired,
    });
    const preparedResponse = prepareStorageNodesResponse(response);
    return {
        data: preparedResponse.nodes || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
