import React from 'react';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../components/TableSkeleton/TableSkeleton';
import {selectNodesMap} from '../../../store/reducers/nodesList';
import {pDiskApi} from '../../../store/reducers/pdisk/pdisk';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval, useTypedSelector} from '../../../utils/hooks';
import {
    STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY,
    getPDiskStorageColumns,
} from '../../Storage/StorageGroups/getStorageGroupsColumns';

interface PDiskGroupsProps {
    nodeId: string | number;
    pDiskId: string | number;
}

export function PDiskGroups({pDiskId, nodeId}: PDiskGroupsProps) {
    const nodesMap = useTypedSelector(selectNodesMap);
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const pDiskStorageQuery = pDiskApi.useGetStorageInfoQuery(
        {pDiskId, nodeId},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = pDiskStorageQuery.isFetching && pDiskStorageQuery.currentData === undefined;
    const data = pDiskStorageQuery.currentData ?? [];

    const pDiskStorageColumns = React.useMemo(() => {
        return getPDiskStorageColumns(nodesMap);
    }, [nodesMap]);

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <ResizeableDataTable
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            data={data}
            columns={pDiskStorageColumns}
            settings={DEFAULT_TABLE_SETTINGS}
        />
    );
}
