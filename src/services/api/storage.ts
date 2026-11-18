import type {NbsListParams, NbsListResponse, NbsTabletResponse} from '../../types/api/nbs';
import type {GroupsRequestParams, StorageGroupsResponse} from '../../types/api/storage';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class StorageAPI extends BaseYdbAPI {
    getNbsStorageConfiguration({signal}: AxiosOptions = {}) {
        return this.get<{Configured: boolean | null}>(
            this.getPath('/storage/nbs'),
            {},
            {requestConfig: {signal}},
        );
    }

    async getNbsStorage(
        view: 'tablets' | 'disks',
        params: NbsListParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const result = await this.get<NbsListResponse>(
            this.getPath(`/cms/api/json/ddisk/${view}`),
            params,
            {concurrentId, requestConfig: {signal}},
        );
        if (result.Status?.Code !== 'OK') {
            throw new Error(result.Status?.Reason || result.Status?.Code || 'Invalid CMS response');
        }
        if ((params.inventory || params.groups_only) && result.UnfilteredCount === undefined) {
            throw new Error('CMS does not support the requested NBS storage view');
        }
        return result;
    }

    async getNbsTablet(tabletId: string, {concurrentId, signal}: AxiosOptions = {}) {
        const result = await this.get<NbsTabletResponse>(
            this.getPath('/cms/api/json/ddisk/tablet'),
            {tablet_id: tabletId, include_health: true},
            {concurrentId, requestConfig: {signal}},
        );
        if (result.Status !== 'OK') {
            throw new Error(result.ErrorReason || result.Status || 'Invalid CMS response');
        }
        if (result.Groups?.some((group) => group.MonitoredQuorum === undefined)) {
            throw new Error('CMS does not support NBS tablet health');
        }
        return result;
    }

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
