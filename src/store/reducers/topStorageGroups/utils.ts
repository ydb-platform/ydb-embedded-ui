import type {TStorageInfo} from '../../../types/api/storage';
import {prepareStorageGroups} from '../storage/utils';
import type {PreparedTopStorageGroupsResponse} from './types';

export const prepareTopStorageGroupsResponse = (
    data: TStorageInfo,
): PreparedTopStorageGroupsResponse => {
    const {StoragePools, StorageGroups} = data;

    const preparedGroups = prepareStorageGroups(StorageGroups, StoragePools);

    let sortedGroups = preparedGroups;

    if (StoragePools) {
        sortedGroups = preparedGroups.sort((a, b) => b.Usage - a.Usage);
    }

    return {
        groups: sortedGroups.slice(0, 5),
    };
};
