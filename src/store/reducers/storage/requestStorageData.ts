import type {AxiosOptions} from '../../../services/api/base';
import type {GroupsRequestParams, StorageRequestParams} from '../../../types/api/storage';

import {createMockStorageGroupsResponse} from './mockStorageGroups';
import {prepareGroupsResponse, prepareStorageResponse} from './utils';

export async function requestStorageData(
    {
        version = 'v2',
        shouldUseGroupsHandler,
        ...params
    }: StorageRequestParams & GroupsRequestParams & {shouldUseGroupsHandler?: boolean},
    options?: AxiosOptions,
) {
    if (shouldUseGroupsHandler && version !== 'v1') {
        return prepareGroupsResponse(createMockStorageGroupsResponse());
    } else {
        const result = await window.api.viewer.getStorageInfo({version, ...params}, options);
        return prepareStorageResponse(result);
    }
}
