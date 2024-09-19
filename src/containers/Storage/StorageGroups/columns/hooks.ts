import React from 'react';

import {selectNodesMap} from '../../../../store/reducers/nodesList';
import type {VisibleEntities} from '../../../../store/reducers/storage/types';
import {USE_ADVANCED_STORAGE_KEY} from '../../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';

import {getDiskPageStorageColumns, getPreparedStorageGroupsColumns} from './columns';
import type {StorageColumnsGetter} from './types';

const useGetStorageColumns = (
    columnsGetter: StorageColumnsGetter,
    visibleEntities?: VisibleEntities,
) => {
    const [useAdvancedStorage] = useSetting(USE_ADVANCED_STORAGE_KEY, false);
    const nodes = useTypedSelector(selectNodesMap);

    return React.useMemo(() => {
        return columnsGetter({nodes}, {useAdvancedStorage, visibleEntities});
    }, [columnsGetter, nodes, useAdvancedStorage, visibleEntities]);
};

export const useGetStorageGroupsColumns = (visibleEntities?: VisibleEntities) => {
    return useGetStorageColumns(getPreparedStorageGroupsColumns, visibleEntities);
};

export const useGetDiskStorageColumns = () => {
    return useGetStorageColumns(getDiskPageStorageColumns);
};
