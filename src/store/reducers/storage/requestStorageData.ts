import type {AxiosOptions} from '../../../services/api';
import type {StorageRequestParams} from '../../../types/api/storage';

import {prepareGroupsResponse, prepareStorageResponse} from './utils';

export async function requestStorageData(
    {
        version = 'v2',
        shouldUseGroupsHandler,
        ...params
    }: StorageRequestParams & {shouldUseGroupsHandler?: boolean},
    options: AxiosOptions,
) {
    if (shouldUseGroupsHandler && version !== 'v1') {
        const result = await window.api.getStorageGroups({...params}, options);
        return prepareGroupsResponse(result);
    } else {
        const result = await window.api.getStorageInfo({version, ...params}, options);
        return prepareStorageResponse(result);
    }
}
