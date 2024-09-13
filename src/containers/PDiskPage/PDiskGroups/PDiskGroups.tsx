import React from 'react';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../components/TableSkeleton/TableSkeleton';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../store/reducers/storage/storage';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY} from '../../Storage/StorageGroups/columns/getStorageGroupsColumns';
import {useGetDiskStorageColumns} from '../../Storage/StorageGroups/columns/hooks';

import {preparePDiskStorageResponse} from './utils';

interface PDiskGroupsProps {
    nodeId: string | number;
    pDiskId: string | number;
}

export function PDiskGroups({pDiskId, nodeId}: PDiskGroupsProps) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching} = storageApi.useGetStorageGroupsInfoQuery(
        {pDiskId, nodeId, shouldUseGroupsHandler: groupsHandlerAvailable},
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );
    const loading = isFetching && currentData === undefined;

    const preparedGroups = React.useMemo(() => {
        return preparePDiskStorageResponse(currentData, pDiskId, nodeId) || [];
    }, [currentData, pDiskId, nodeId]);

    const pDiskStorageColumns = useGetDiskStorageColumns();

    if (loading || !capabilitiesLoaded) {
        return <TableSkeleton />;
    }

    return (
        <ResizeableDataTable
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            data={preparedGroups}
            columns={pDiskStorageColumns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
}
