import type {PreparedStorageResponse} from '../../../../../store/reducers/storage/types';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';

export const prepareTopStorageGroups = (data?: PreparedStorageResponse) => {
    const {groups = []} = data || {};

    const sortedGroups = [...groups].sort((a, b) => b.Usage - a.Usage);

    return sortedGroups.slice(0, TENANT_OVERVIEW_TABLES_LIMIT);
};
