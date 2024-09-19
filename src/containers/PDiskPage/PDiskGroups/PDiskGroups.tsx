import React from 'react';

import {TableColumnSetup} from '@gravity-ui/uikit';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../store/reducers/storage/storage';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY} from '../../Storage/StorageGroups/columns/constants';
import {useStorageGroupsSelectedColumns} from '../../Storage/StorageGroups/columns/hooks';

import {preparePDiskStorageResponse} from './utils';

interface PDiskGroupsProps {
    nodeId: string | number;
    pDiskId: string | number;
}

export function PDiskGroups({pDiskId, nodeId}: PDiskGroupsProps) {
    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns();

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

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <TableColumnSetup
                    popupWidth={200}
                    items={columnsToSelect}
                    showStatus
                    onUpdate={setColumns}
                    sortable={false}
                />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={loading || !capabilitiesLoaded}>
                <ResizeableDataTable
                    columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
                    data={preparedGroups}
                    columns={columnsToShow}
                    settings={DEFAULT_TABLE_SETTINGS}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
