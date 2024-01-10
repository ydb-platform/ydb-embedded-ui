import type {NodesApiRequestParams} from '../../../store/reducers/nodes/types';
import {prepareStorageNodesResponse} from '../../../store/reducers/storage/utils';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageNodes|offset${offset}|limit${limit}`;
};

export const getStorageNodes = async ({
    type = 'static',
    storage = true,
    limit,
    offset,
    ...params
}: NodesApiRequestParams) => {
    const response = await window.api.getNodes(
        {type, storage, limit, offset, ...params},
        {concurrentId: getConcurrentId(limit, offset)},
    );
    const preparedResponse = prepareStorageNodesResponse(response);

    return {
        data: preparedResponse.nodes || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
