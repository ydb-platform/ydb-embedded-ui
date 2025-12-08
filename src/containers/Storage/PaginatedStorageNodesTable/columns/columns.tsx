import DataTable from '@gravity-ui/react-data-table';

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
import {PDisk} from '../../PDisk/PDisk';
import {isTopLevelStorageContext} from '../../utils';

import type {GetStorageNodesColumnsParams} from './types';

import './StorageNodesColumns.scss';

const b = cn('ydb-storage-nodes-columns');

export const getPDisksColumn = ({
    viewContext,
    columnsSettings,
    highlightedDisk,
    setHighlightedDisk,
}: GetStorageNodesColumnsParams): NodesColumn => {
    const highlightEnabled = isTopLevelStorageContext(viewContext);
    const coloredDisk = highlightEnabled ? highlightedDisk : undefined;
    const setColoredDisk = highlightEnabled ? setHighlightedDisk : undefined;

    return {
        name: NODES_COLUMNS_IDS.PDisks,
        header: NODES_COLUMNS_TITLES.PDisks,
        className: b('pdisks-column', {highlighted: highlightEnabled}),
        width: columnsSettings?.pDiskContainerWidth,
        render: ({row}) => {
            return (
                <div className={b('pdisks-wrapper')}>
                    {row.PDisks?.map((pDisk) => {
                        const vDisks = row.VDisks?.filter(
                            (vdisk) => vdisk.PDiskId === pDisk.PDiskId,
                        );

                        const id = `${row.NodeId}-${pDisk.PDiskId}`;

                        const highlighted = coloredDisk === id;
                        const darkened = Boolean(coloredDisk && coloredDisk !== id);

                        return (
                            <div className={b('pdisks-item')} key={pDisk.PDiskId}>
                                <PDisk
                                    data={pDisk}
                                    vDisks={vDisks}
                                    viewContext={viewContext}
                                    width={columnsSettings?.pDiskWidth}
                                    showPopup={highlighted}
                                    onShowPopup={() => setColoredDisk?.(id)}
                                    onHidePopup={() => setColoredDisk?.(undefined)}
                                    highlighted={highlighted}
                                    darkened={darkened}
                                    highlightedDisk={coloredDisk}
                                    setHighlightedDisk={setColoredDisk}
                                />
                            </div>
                        );
                    })}
                </div>
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
    highlightedDisk,
    setHighlightedDisk,
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
        getPDisksColumn({viewContext, columnsSettings, highlightedDisk, setHighlightedDisk}),
        getTabletsColumn({database}),
    ];

    const sortableColumns = columns.map((column) => ({
        ...column,
        sortable: isSortableNodesColumn(column.name),
    }));

    return sortableColumns;
};
