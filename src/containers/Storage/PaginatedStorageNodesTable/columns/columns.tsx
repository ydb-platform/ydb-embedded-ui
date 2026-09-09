import DataTable from '@gravity-ui/react-data-table';

import {
    getCapacityAlertColumn,
    getPDiskUsageColumn,
    getVDiskRawUsageColumn,
    getVDiskSlotUsageColumn,
} from '../../../../components/capacityMetricsColumns/columns';
import {
    getCpuColumn,
    getDataCenterColumn,
    getDiskSpaceUsageColumn,
    getHostColumn,
    getMemoryColumn,
    getMissingDisksColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPileNameColumn,
    getPoolsColumn,
    getRAMColumn,
    getRackColumn,
    getTabletsColumn,
    getUptimeColumn,
    getVersionColumn,
} from '../../../../components/nodesColumns/columns';
import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
    isSortableNodesColumn,
} from '../../../../components/nodesColumns/constants';
import type {NodesColumn} from '../../../../components/nodesColumns/types';
import {cn} from '../../../../utils/cn';
import {PDisksCompact} from '../../PDisks/PDisksCompact';

import type {GetStorageNodesColumnsParams} from './types';

import './StorageNodesColumns.scss';

const b = cn('ydb-storage-nodes-columns');

export const getPDisksColumn = ({
    viewContext,
    columnsSettings,
    scrollContainerRef,
    invertedDisks,
}: GetStorageNodesColumnsParams): NodesColumn => {
    return {
        name: NODES_COLUMNS_IDS.PDisks,
        header: NODES_COLUMNS_TITLES.PDisks,
        className: b('pdisks-column'),
        width: columnsSettings?.pDiskContainerWidth,
        render: ({row}) => {
            return (
                <PDisksCompact
                    pDisks={row.PDisks}
                    vDisks={row.VDisks}
                    viewContext={viewContext}
                    pDiskWidth={columnsSettings?.pDiskWidth}
                    scrollContainerRef={scrollContainerRef}
                    inverted={invertedDisks}
                />
            );
        },
        align: DataTable.CENTER,
        sortable: false,
        resizeable: false,
    };
};

export const getStorageNodesColumns = ({
    database,
    viewContext,
    columnsSettings,
    scrollContainerRef,
    invertedDisks,
}: GetStorageNodesColumnsParams): NodesColumn[] => {
    const columns: NodesColumn[] = [
        getNodeIdColumn(),
        getHostColumn({database}),
        getNodeNameColumn(),
        getDataCenterColumn(),
        getPileNameColumn(),
        getRackColumn(),
        getUptimeColumn(),
        getCpuColumn(),
        getPoolsColumn(),
        getRAMColumn(),
        getMemoryColumn(),
        getDiskSpaceUsageColumn(),
        getVersionColumn(),
        getMissingDisksColumn(),
        getPDisksColumn({viewContext, columnsSettings, scrollContainerRef, invertedDisks}),
        getTabletsColumn({database}),
        getPDiskUsageColumn(),
        getVDiskSlotUsageColumn(),
        getVDiskRawUsageColumn(),
        getCapacityAlertColumn(),
    ];

    const sortableColumns = columns.map((column) => ({
        ...column,
        sortable: isSortableNodesColumn(column.name),
    }));

    return sortableColumns;
};
