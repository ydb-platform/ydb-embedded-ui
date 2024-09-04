import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../components/TableSkeleton/TableSkeleton';
import {pDiskApi} from '../../../store/reducers/pdisk/pdisk';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY} from '../../Storage/StorageGroups/columns/getStorageGroupsColumns';
import {useGetDiskStorageColumns} from '../../Storage/StorageGroups/columns/hooks';

interface PDiskGroupsProps {
    nodeId: string | number;
    pDiskId: string | number;
}

export function PDiskGroups({pDiskId, nodeId}: PDiskGroupsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const pDiskStorageQuery = pDiskApi.useGetStorageInfoQuery(
        {pDiskId, nodeId},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = pDiskStorageQuery.isFetching && pDiskStorageQuery.currentData === undefined;
    const data = pDiskStorageQuery.currentData ?? [];

    const pDiskStorageColumns = useGetDiskStorageColumns();

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
