import {ShieldKeyhole} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import {Flex, Icon, Label, Popover} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../../../components/CellWithPopover/CellWithPopover';
import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {StatusIcon} from '../../../../components/StatusIcon/StatusIcon';
import {UsageLabel} from '../../../../components/UsageLabel/UsageLabel';
import {getStorageGroupPath} from '../../../../routes';
import {valueIsDefined} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER, YDB_POPOVER_CLASS_NAME} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {getUsageSeverity} from '../../../../utils/generateEvaluator';
import {formatToMs} from '../../../../utils/timeParsers';
import {bytesToGB, bytesToSpeed} from '../../../../utils/utils';
import {Disks} from '../../Disks/Disks';
import {VDisks} from '../../VDisks/VDisks';
import {getDegradedSeverity} from '../../utils';
import i18n from '../i18n';

import {
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    isSortableStorageGroupsColumn,
} from './constants';
import type {GetStorageColumnsData, StorageColumnsGetter, StorageGroupsColumn} from './types';

import './StorageGroupsColumns.scss';

const b = cn('ydb-storage-groups-columns');

const poolNameColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.PoolName,
    header: STORAGE_GROUPS_COLUMNS_TITLES.PoolName,
    width: 250,
    render: ({row}) => {
        return row.PoolName ? (
            <CellWithPopover
                content={row.PoolName}
                placement={['right']}
                openDelay={0}
                className={b('pool-name-wrapper')}
            >
                <span className={b('pool-name')}>{row.PoolName}</span>
            </CellWithPopover>
        ) : (
            EMPTY_DATA_PLACEHOLDER
        );
    },
    align: DataTable.LEFT,
};

const typeColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.MediaType,
    header: STORAGE_GROUPS_COLUMNS_TITLES.MediaType,
    width: 100,
    resizeMinWidth: 100,
    align: DataTable.LEFT,
    render: ({row}) => (
        <Flex>
            <Label>{row.MediaType || '—'}</Label>
            {'\u00a0'}
            {row.Encryption && (
                <Popover
                    content={i18n('encrypted')}
                    placement="right"
                    openDelay={0}
                    className={YDB_POPOVER_CLASS_NAME}
                >
                    <Label>
                        <Icon data={ShieldKeyhole} size={18} />
                    </Label>
                </Popover>
            )}
        </Flex>
    ),
    sortable: false,
};

const erasureColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Erasure,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Erasure,
    width: 100,
    sortAccessor: (row) => row.ErasureSpecies,
    render: ({row}) => (row.ErasureSpecies ? row.ErasureSpecies : '-'),
    align: DataTable.LEFT,
};

const degradedColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Degraded,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Degraded,
    width: 110,
    resizeMinWidth: 110,
    render: ({row}) =>
        row.Degraded ? (
            <Label theme={getDegradedSeverity(row)}>Degraded: {row.Degraded}</Label>
        ) : (
            '-'
        ),
    align: DataTable.LEFT,
    defaultOrder: DataTable.DESCENDING,
};
const stateColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.State,
    header: STORAGE_GROUPS_COLUMNS_TITLES.State,
    width: 150,
    render: ({row}) => row.State ?? EMPTY_DATA_PLACEHOLDER,
    align: DataTable.LEFT,
    defaultOrder: DataTable.DESCENDING,
};

const usageColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Usage,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Usage,
    width: 85,
    resizeMinWidth: 75,
    render: ({row}) => {
        return valueIsDefined(row.Usage) ? (
            <UsageLabel value={Math.floor(row.Usage)} theme={getUsageSeverity(row.Usage)} />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        );
    },
    align: DataTable.LEFT,
};
const diskSpaceUsageColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.DiskSpaceUsage,
    header: STORAGE_GROUPS_COLUMNS_TITLES.DiskSpaceUsage,
    width: 115,
    resizeMinWidth: 75,
    render: ({row}) => {
        return valueIsDefined(row.DiskSpaceUsage) ? (
            <UsageLabel
                value={Math.floor(row.DiskSpaceUsage)}
                theme={getUsageSeverity(row.DiskSpaceUsage)}
            />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        );
    },
    align: DataTable.LEFT,
};

const groupIdColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.GroupId,
    header: STORAGE_GROUPS_COLUMNS_TITLES.GroupId,
    width: 140,
    render: ({row}) => {
        return row.GroupId ? (
            <EntityStatus
                name={String(row.GroupId)}
                path={getStorageGroupPath(row.GroupId)}
                hasClipboardButton
                showStatus={false}
            />
        ) : (
            '-'
        );
    },
    sortAccessor: (row) => Number(row.GroupId),
    align: DataTable.LEFT,
};

const usedColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Used,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Used,
    width: 100,
    render: ({row}) => {
        return bytesToGB(row.Used, true);
    },
    align: DataTable.RIGHT,
};

const limitColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Limit,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Limit,
    width: 100,
    render: ({row}) => {
        return bytesToGB(row.Limit);
    },
    align: DataTable.RIGHT,
};

const usedSpaceFlagColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.DiskSpace,
    header: STORAGE_GROUPS_COLUMNS_TITLES.DiskSpace,
    width: 70,
    render: ({row}) => {
        return <StatusIcon status={row.DiskSpace} />;
    },
    align: DataTable.CENTER,
};

const readColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Read,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Read,
    width: 100,
    render: ({row}) => {
        return row.Read ? bytesToSpeed(row.Read) : '-';
    },
    align: DataTable.RIGHT,
};

const writeColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Write,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Write,
    width: 100,
    render: ({row}) => {
        return row.Write ? bytesToSpeed(row.Write) : '-';
    },
    align: DataTable.RIGHT,
};

const latencyColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Latency,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Latency,
    width: 100,
    render: ({row}) => {
        return valueIsDefined(row.LatencyPutTabletLogMs)
            ? formatToMs(row.LatencyPutTabletLogMs)
            : EMPTY_DATA_PLACEHOLDER;
    },
    align: DataTable.RIGHT,
};

const allocationUnitsColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.AllocationUnits,
    header: STORAGE_GROUPS_COLUMNS_TITLES.AllocationUnits,
    width: 150,
    render: ({row}) => {
        return valueIsDefined(row.AllocationUnits)
            ? formatNumber(row.AllocationUnits)
            : EMPTY_DATA_PLACEHOLDER;
    },
    align: DataTable.RIGHT,
};

const getVDisksColumn = (data?: GetStorageColumnsData): StorageGroupsColumn => ({
    name: STORAGE_GROUPS_COLUMNS_IDS.VDisks,
    header: STORAGE_GROUPS_COLUMNS_TITLES.VDisks,
    className: b('vdisks-column'),
    render: ({row}) => (
        <VDisks vDisks={row.VDisks} viewContext={data?.viewContext} erasure={row.ErasureSpecies} />
    ),
    align: DataTable.CENTER,
    width: 780, // usually 8-9 vdisks, this width corresponds to 8 vdisks, column is expanded if more
    resizeable: false,
    sortable: false,
});

const getDisksColumn = (data?: GetStorageColumnsData): StorageGroupsColumn => ({
    name: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
    header: STORAGE_GROUPS_COLUMNS_TITLES.VDisksPDisks,
    className: b('disks-column'),
    render: ({row}) => {
        return (
            <Disks
                vDisks={row.VDisks}
                viewContext={data?.viewContext}
                erasure={row.ErasureSpecies}
            />
        );
    },
    align: DataTable.CENTER,
    width: 900,
    resizeable: false,
    sortable: false,
});

export const getStorageTopGroupsColumns: StorageColumnsGetter = () => {
    return [groupIdColumn, typeColumn, erasureColumn, usageColumn, usedColumn, limitColumn];
};

export const getStorageGroupsColumns: StorageColumnsGetter = (data) => {
    const columns = [
        groupIdColumn,
        poolNameColumn,
        typeColumn,
        erasureColumn,
        degradedColumn,
        stateColumn,
        usageColumn,
        diskSpaceUsageColumn,
        usedColumn,
        limitColumn,
        usedSpaceFlagColumn,
        readColumn,
        writeColumn,
        latencyColumn,
        allocationUnitsColumn,
        getVDisksColumn(data),
        getDisksColumn(data),
    ];

    return columns.map((column) => ({
        ...column,
        sortable: isSortableStorageGroupsColumn(column.name),
    }));
};
