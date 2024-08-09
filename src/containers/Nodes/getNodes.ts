import type {NodesApiRequestParams} from '../../store/reducers/nodes/types';
import {prepareNodesData} from '../../store/reducers/nodes/utils';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getNodes|offset${offset}|limit${limit}`;
};

export const getNodes = async (
    {
        type = 'any',
        storage = false,
        tablets = true,
        limit,
        offset,
        ...params
    }: NodesApiRequestParams,
    signal?: AbortSignal,
) => {
    const response = await window.api.getNodes(
        {type, storage, tablets, limit, offset, ...params},
        {concurrentId: getConcurrentId(limit, offset), signal},
    );
    const preparedResponse = prepareNodesData(response);

    return {
        data: preparedResponse.Nodes || [],
        found: preparedResponse.FoundNodes || 0,
        total: preparedResponse.TotalNodes || 0,
    };
};
