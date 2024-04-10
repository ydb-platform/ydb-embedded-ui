import type {TStorageInfo} from '../../../../types/api/storage';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {prepareStorageGroups} from '../../storage/utils';

import type {PreparedTopStorageGroupsResponse} from './types';

export const prepareTopStorageGroupsResponse = (
    data: TStorageInfo,
): PreparedTopStorageGroupsResponse => {
    const {StoragePools, StorageGroups} = data;

    const preparedGroups = prepareStorageGroups(StorageGroups, StoragePools);

    if (StoragePools) {
        preparedGroups.sort((a, b) => b.Usage - a.Usage);
    }

    return {
        groups: preparedGroups.slice(0, TENANT_OVERVIEW_TABLES_LIMIT),
    };
};
