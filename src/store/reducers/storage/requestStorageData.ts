import type {AxiosOptions} from '../../../services/api';
import type {GroupsRequestParams, StorageRequestParams} from '../../../types/api/storage';

import {prepareGroupsResponse, prepareStorageResponse} from './utils';

export async function requestStorageData(
    {
        shouldUseGroupsHandler,
        version = 'v2',
        ...params
    }: StorageRequestParams & GroupsRequestParams & {shouldUseGroupsHandler?: boolean},
    options?: AxiosOptions,
) {
    if (shouldUseGroupsHandler && version !== 'v1') {
        const result = await window.api.getStorageGroups({...params}, options);
        return prepareGroupsResponse(result);
    } else {
        const result = await window.api.getStorageInfo({version, ...params}, options);
        return prepareStorageResponse(result);
    }
}
