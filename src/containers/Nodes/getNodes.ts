import {isNil} from 'lodash';

import type {FetchData} from '../../components/PaginatedTable';
import {
    NODES_COLUMNS_TO_DATA_FIELDS,
    getNodesColumnSortField,
} from '../../components/nodesColumns/constants';
import type {NodesFilters} from '../../store/reducers/nodes/types';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import {prepareStorageNodesResponse} from '../../store/reducers/storage/utils';
import type {NodesRequestParams} from '../../types/api/nodes';
import {prepareSortValue} from '../../utils/filters';
import {getUptimeParamValue} from '../../utils/nodes';
import {getRequiredDataFields} from '../../utils/tableUtils/getRequiredDataFields';

export const getNodes: FetchData<
    PreparedStorageNode,
    NodesFilters,
    Pick<NodesRequestParams, 'type' | 'storage'>
> = async (params) => {
    const {type = 'any', storage, limit, offset, sortParams, filters, columnsIds} = params;

    const {sortOrder, columnId} = sortParams ?? {};
    const {
        path,
        databaseFullPath,
        database,
        searchValue,
        withProblems,
        uptimeFilter,
        peerRoleFilter,
        filterGroup,
        filterGroupBy,
    } = filters ?? {};

    const sortField = getNodesColumnSortField(columnId);
    const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

    const dataFieldsRequired = getRequiredDataFields(
        columnsIds ?? Object.keys(NODES_COLUMNS_TO_DATA_FIELDS),
        NODES_COLUMNS_TO_DATA_FIELDS,
    );

    const schemePathParam =
        !isNil(path) && !isNil(databaseFullPath) ? {path, databaseFullPath} : undefined;

    const response = await window.api.viewer.getNodes({
        type,
        storage,
        limit,
        offset,
        sort,
        path: schemePathParam,
        database,
        filter: searchValue,
        problems_only: withProblems,
        uptime: getUptimeParamValue(uptimeFilter),
        filter_peer_role: peerRoleFilter,
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
