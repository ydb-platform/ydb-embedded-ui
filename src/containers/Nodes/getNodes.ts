import type {FetchData} from '../../components/PaginatedTable';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    getNodesColumnSortField,
} from '../../components/nodesColumns/constants';
import type {NodesFilters, NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {prepareNodesData} from '../../store/reducers/nodes/utils';
import type {NodesRequestParams} from '../../types/api/nodes';
import {prepareSortValue} from '../../utils/filters';
import {getProblemParamValue, getUptimeParamValue} from '../../utils/nodes';
import {getRequiredDataFields} from '../../utils/tableUtils/getRequiredDataFields';

export const getNodes: FetchData<
    NodesPreparedEntity,
    NodesFilters,
    Pick<NodesRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {type = 'any', storage = false, limit, offset, sortParams, filters, columnsIds} = params;

    const {sortOrder, columnId} = sortParams ?? {};
    const {
        path,
        database,
        searchValue,
        problemFilter,
        uptimeFilter,
        peerRoleFilter,
        filterGroup,
        filterGroupBy,
    } = filters ?? {};

    const sortField = getNodesColumnSortField(columnId);
    const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    const response = await window.api.viewer.getNodes({
        type,
        storage,
        limit,
        offset,
        sort,
        path,
        database,
        filter: searchValue,
        problems_only: getProblemParamValue(problemFilter),
        uptime: getUptimeParamValue(uptimeFilter),
        filter_peer_role: peerRoleFilter,
        filter_group: filterGroup,
        filter_group_by: filterGroupBy,
        fieldsRequired: dataFieldsRequired,
    });
    const preparedResponse = prepareNodesData(response);

    return {
        data: preparedResponse.Nodes || [],
        found: preparedResponse.FoundNodes || 0,
        total: preparedResponse.TotalNodes || 0,
    };
};
