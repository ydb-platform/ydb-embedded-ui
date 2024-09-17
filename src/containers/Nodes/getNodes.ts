import type {FetchData} from '../../components/PaginatedTable';
import type {NodesFilters, NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {prepareNodesData} from '../../store/reducers/nodes/utils';
import type {NodesRequestParams, NodesSort} from '../../types/api/nodes';
import {prepareSortValue} from '../../utils/filters';
import {getProblemParamValue, getUptimeParamValue} from '../../utils/nodes';

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
    } = params;

    const {sortOrder, columnId} = sortParams ?? {};
    const {path, database, searchValue, problemFilter, uptimeFilter} = filters ?? {};

    const sort = prepareSortValue(columnId, sortOrder) as NodesSort;

    const response = await window.api.getNodes(
        {
            type,
            storage,
            tablets,
            limit,
            offset,
            sort,
            path,
            database,
            filter: searchValue,
            problems_only: getProblemParamValue(problemFilter),
            uptime: getUptimeParamValue(uptimeFilter),
        },
        {concurrentId: getConcurrentId(limit, offset), signal: params.signal},
    );
    const preparedResponse = prepareNodesData(response);

    return {
        data: preparedResponse.Nodes || [],
        found: preparedResponse.FoundNodes || 0,
        total: preparedResponse.TotalNodes || 0,
    };
};
