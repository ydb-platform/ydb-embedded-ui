import type {StorageApiRequestParams} from '../../../store/reducers/storage/types';
import {prepareStorageGroupsResponse} from '../../../store/reducers/storage/utils';
import {EVersion} from '../../../types/api/storage';

const getConcurrentId = (limit?: number, offset?: number) => {
    return `getStorageGroups|offset${offset}|limit${limit}`;
};

export const getStorageGroups = async ({limit, offset, ...params}: StorageApiRequestParams) => {
    const response = await window.api.getStorageInfo(
        {version: EVersion.v2, limit, offset, ...params},
        {concurrentId: getConcurrentId(limit, offset)},
    );
    const preparedResponse = prepareStorageGroupsResponse(response);

    return {
        data: preparedResponse.groups || [],
        found: preparedResponse.found || 0,
        total: preparedResponse.total || 0,
    };
};
