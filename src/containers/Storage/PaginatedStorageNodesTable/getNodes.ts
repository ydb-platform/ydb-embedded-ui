import type {FetchData} from '../../../components/PaginatedTable';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    getNodesColumnSortField,
} from '../../../components/nodesColumns/constants';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue} from '../../../utils/nodes';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';

import {generateNodes} from './nodes';

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

    const sortField = getNodesColumnSortField(columnId);
    const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);
    let response;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mocks')) {
        // Get mock configuration from URL parameters or use defaults
        const pdisks = parseInt(urlParams.get('pdisks') || '10', 10);
        const vdisksPerPDisk = parseInt(urlParams.get('vdisksPerPDisk') || '2', 10);
        const totalNodes = parseInt(urlParams.get('totalNodes') || '50', 10);
        response = generateNodes(totalNodes, {
            maxVdisksPerPDisk: vdisksPerPDisk,
            maxPdisks: pdisks,
            offset,
            limit,
        });
    } else {
        response = await window.api.viewer.getNodes({
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
    }
    const preparedResponse = prepareStorageNodesResponse(response);
    return {
        data: preparedResponse.nodes || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
        columnsSettings: preparedResponse.columnsSettings,
    };
};
