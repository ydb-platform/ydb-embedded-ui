import type {AxiosOptions} from '../../../services/api';
import type {StorageRequestParams} from '../../../types/api/storage';

import {prepareGroupsResponse, prepareStorageResponse} from './utils';

export async function requestStorageData(
    {
        version = 'v2',
        useGroupsHandler,
        ...params
    }: StorageRequestParams & {useGroupsHandler?: boolean},
    options: AxiosOptions,
) {
    if (useGroupsHandler && version !== 'v1') {
        const result = await window.api.getStorageGroups({...params}, options);
        return prepareGroupsResponse(result);
    } else {
        const result = await window.api.getStorageInfo({version, ...params}, options);
        return prepareStorageResponse(result);
    }
}
