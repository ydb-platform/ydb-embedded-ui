import type {GroupsRequestParams, StorageGroupsResponse} from '../../types/api/storage';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class StorageAPI extends BaseYdbAPI {
    getStorageGroups(
        {nodeId, pDiskId, groupId, fieldsRequired, filter, ...params}: GroupsRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const preparedNodeId = Array.isArray(nodeId)
            ? this.prepareArrayRequestParam(nodeId)
            : nodeId;

        const preparedPDiskId = Array.isArray(pDiskId)
            ? this.prepareArrayRequestParam(pDiskId)
            : pDiskId;

        const preparedGroupId = Array.isArray(groupId)
            ? this.prepareArrayRequestParam(groupId)
            : groupId;

        const preparedFieldsRequired = Array.isArray(fieldsRequired)
            ? this.prepareArrayRequestParam(fieldsRequired)
            : fieldsRequired;

        return this.get<StorageGroupsResponse>(
            this.getPath('/storage/groups'),
            {
                node_id: preparedNodeId,
                pdisk_id: preparedPDiskId,
                group_id: preparedGroupId,
                fields_required: preparedFieldsRequired,
                // Do not send empty string
                filter: filter || undefined,
                timeout: 20_000,
                ...params,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
}
