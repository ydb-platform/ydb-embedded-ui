import type {FetchData} from '../../../components/PaginatedTable';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    getNodesColumnSortField,
} from '../../../components/nodesColumns/constants';
import {generateNodes} from '../../../mocks/storage/nodes';
import type {
    PreparedStorageNode,
    PreparedStorageNodeFilters,
} from '../../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../../types/api/nodes';
import {prepareSortValue} from '../../../utils/filters';
import {getUptimeParamValue} from '../../../utils/nodes';
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

    const sortField = getNodesColumnSortField(columnId);
    const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    let response;
    if (process.env.NODE_ENV === 'development') {
        // Get mock configuration from URL parameters or use defaults
        const urlParams = new URLSearchParams(window.location.search);
        const pdisks = parseInt(urlParams.get('pdisks') || '10', 10);
        const vdisksPerPDisk = parseInt(urlParams.get('vdisksPerPDisk') || '2', 10);
        response = generateNodes(5, {vdisksCount: pdisks * vdisksPerPDisk, pdisksCount: pdisks});
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
    };
};
