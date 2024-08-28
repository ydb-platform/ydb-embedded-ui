import React from 'react';

import {selectNodesMap} from '../../../store/reducers/nodesList';
import type {VisibleEntities} from '../../../store/reducers/storage/types';
import {USE_ADVANCED_STORAGE_KEY} from '../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../utils/hooks';

import {
    getDiskPageStorageColumns,
    getPreparedStorageGroupsColumns,
} from './getStorageGroupsColumns';

export const useGetStorageColumns = (visibleEntities: VisibleEntities) => {
    const [useAdvancedStorage] = useSetting(USE_ADVANCED_STORAGE_KEY, false);
    const nodes = useTypedSelector(selectNodesMap);

    return React.useMemo(() => {
        return getPreparedStorageGroupsColumns({nodes}, {visibleEntities, useAdvancedStorage});
    }, [visibleEntities, useAdvancedStorage, nodes]);
};

export const useGetDiskStorageColumns = () => {
    const [useAdvancedStorage] = useSetting(USE_ADVANCED_STORAGE_KEY, false);
    const nodes = useTypedSelector(selectNodesMap);

    return React.useMemo(() => {
        return getDiskPageStorageColumns({nodes}, {useAdvancedStorage});
    }, [useAdvancedStorage, nodes]);
};
