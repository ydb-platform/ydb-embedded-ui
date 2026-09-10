import type {AxiosOptions} from '../../../services/api/base';
import type {GroupsRequestParams} from '../../../types/api/storage';

import {prepareGroupsResponse} from './utils';

export async function requestStorageData(params: GroupsRequestParams, options?: AxiosOptions) {
    const result = await window.api.storage.getStorageGroups(params, options);
    return prepareGroupsResponse(result);
}
