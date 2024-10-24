import type {FetchData} from '../../components/PaginatedTable';
import {NODES_COLUMNS_TO_DATA_FIELDS} from '../../components/nodesColumns/constants';
import type {NodesFilters, NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {prepareNodesData} from '../../store/reducers/nodes/utils';
import type {NodesRequestParams} from '../../types/api/nodes';
import {prepareSortValue} from '../../utils/filters';
import {
    getProblemParamValue,
    getUptimeParamValue,
    isSortableNodesProperty,
} from '../../utils/nodes';
import {getRequiredDataFields} from '../../utils/tableUtils/getRequiredDataFields';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getNodes|offset${offset}|limit${limit}`;
};

export const getNodes: FetchData<
    NodesPreparedEntity,
    NodesFilters,
    Pick<NodesRequestParams, 'type' | 'storage' | 'tablets'>
> = async (params) => {
    const {
        type = 'any',
        storage = false,
        tablets = true,
        limit,
        offset,
        sortParams,
        filters,
        columnsIds,
    } = params;

    const {sortOrder, columnId} = sortParams ?? {};
    const {path, database, searchValue, problemFilter, uptimeFilter} = filters ?? {};

    const sort = isSortableNodesProperty(columnId)
        ? prepareSortValue(columnId, sortOrder)
        : undefined;

    const dataFieldsRequired = getRequiredDataFields(columnsIds, NODES_COLUMNS_TO_DATA_FIELDS);

    const response = await window.api.getNodes(
        {
            type,
            storage,
            tablets,
            limit,
            offset: 0,
            sort,
            path,
            database,
            filter: searchValue,
            problems_only: getProblemParamValue(problemFilter),
            uptime: getUptimeParamValue(uptimeFilter),
            fieldsRequired: dataFieldsRequired,
        },
        {concurrentId: getConcurrentId(limit, offset), signal: params.signal},
    );
    const preparedResponse = prepareNodesData(response);

    let mockedData = preparedResponse.Nodes?.slice();

    for (let i = 0; i < 1000; i++) {
        mockedData = mockedData?.concat(
            preparedResponse.Nodes?.map((data, j) => ({
                ...data,
                NodeId: data.NodeId + i * 2000 + j,
                Host: data.Host || String(i) + ',' + j,
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
