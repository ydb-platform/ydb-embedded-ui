import React from 'react';

import {ShieldKeyhole} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Icon, Label, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../../components/CellWithPopover/CellWithPopover';
import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';
import type {Column as PaginatedTableColumn} from '../../../components/PaginatedTable';
import {UsageLabel} from '../../../components/UsageLabel/UsageLabel';
import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';
import {EFlag} from '../../../types/api/enums';
import type {NodesMap} from '../../../types/store/nodesList';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {isSortableStorageProperty} from '../../../utils/storage';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
import {getDegradedSeverity, getUsageSeverityForStorageGroup} from '../utils';

import i18n from './i18n';

import './StorageGroups.scss';

const b = cn('global-storage-groups');

export const STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY = 'storageGroupsColumnsWidth';

type StorageGroupsColumn = PaginatedTableColumn<PreparedStorageGroup> &
    DataTableColumn<PreparedStorageGroup>;

export const GROUPS_COLUMNS_IDS = {
    PoolName: 'PoolName',
    MediaType: 'MediaType',
    Erasure: 'Erasure',
    GroupId: 'GroupId',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    UsedSpaceFlag: 'UsedSpaceFlag',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Degraded: 'Degraded',
} as const;

const poolNameColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.PoolName,
    header: 'Pool Name',
    width: 250,
    render: ({row}) => {
        const splitted = row.PoolName?.split('/');
        return (
            splitted && (
                <CellWithPopover
                    wrapperClassName={b('pool-name-wrapper')}
                    content={row.PoolName}
                    placement={['right']}
                    behavior={PopoverBehavior.Immediate}
                >
                    {splitted[splitted.length - 1]}
                </CellWithPopover>
            )
        );
    },
    align: DataTable.LEFT,
};

const typeColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.MediaType,
    header: 'Type',
    width: 100,
    resizeMinWidth: 100,
    align: DataTable.LEFT,
    render: ({row}) => (
        <React.Fragment>
            <Label>{row.MediaType || '—'}</Label>
            {'\u00a0'}
            {row.Encryption && (
                <Popover
                    content={i18n('encrypted')}
                    placement="right"
                    behavior={PopoverBehavior.Immediate}
                >
                    <Label>
                        <Icon data={ShieldKeyhole} size={18} />
                    </Label>
                </Popover>
            )}
        </React.Fragment>
    ),
    sortable: false,
};

const erasureColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Erasure,
    header: 'Erasure',
    width: 100,
    sortAccessor: (row) => row.ErasureSpecies,
    render: ({row}) => (row.ErasureSpecies ? row.ErasureSpecies : '-'),
    align: DataTable.LEFT,
};

const degradedColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Degraded,
    header: 'Degraded',
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

const usageColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Usage,
    header: 'Usage',
    width: 75,
    resizeMinWidth: 75,
    render: ({row}) => {
        // without a limit the usage can be evaluated as 0,
        // but the absence of a value is more clear
        return row.Limit ? (
            <UsageLabel value={row.Usage} theme={getUsageSeverityForStorageGroup(row.Usage)} />
        ) : (
            '-'
        );
    },
    // without a limit exclude usage from sort to display at the bottom
    sortAccessor: (row) => (row.Limit ? row.Usage : null),
    align: DataTable.LEFT,
};

const groupIdColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.GroupId,
    header: 'Group ID',
    width: 130,
    render: ({row}) => {
        return <span className={b('group-id')}>{row.GroupID}</span>;
    },
    sortAccessor: (row) => Number(row.GroupID),
    align: DataTable.RIGHT,
};

const usedColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Used,
    header: 'Used',
    width: 100,
    render: ({row}) => {
        return bytesToGB(row.Used, true);
    },
    align: DataTable.RIGHT,
};

const limitColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Limit,
    header: 'Limit',
    width: 100,
    render: ({row}) => {
        return bytesToGB(row.Limit);
    },
    align: DataTable.RIGHT,
};

const usedSpaceFlagColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.UsedSpaceFlag,
    header: 'Space',
    width: 110,
    render: ({row}) => {
        const value = row.UsedSpaceFlag;

        let color = EFlag.Red;

        if (value < 100) {
            color = EFlag.Green;
        } else if (value < 10000) {
            color = EFlag.Yellow;
        } else if (value < 1000000) {
            color = EFlag.Orange;
        }
        return <EntityStatus status={color} />;
    },
    align: DataTable.CENTER,
};

const readColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Read,
    header: 'Read',
    width: 100,
    render: ({row}) => {
        return row.Read ? bytesToSpeed(row.Read) : '-';
    },
    align: DataTable.RIGHT,
};

const writeColumn: StorageGroupsColumn = {
    name: GROUPS_COLUMNS_IDS.Write,
    header: 'Write',
    width: 100,
    render: ({row}) => {
        return row.Write ? bytesToSpeed(row.Write) : '-';
    },
    align: DataTable.RIGHT,
};

const getVDisksColumn = (nodes?: NodesMap): StorageGroupsColumn => ({
    name: GROUPS_COLUMNS_IDS.VDisks,
    className: b('vdisks-column'),
    header: 'VDisks',
    render: ({row}) => (
        <div className={b('vdisks-wrapper')}>
            {row.VDisks?.map((vDisk) => {
                return (
                    <VDiskWithDonorsStack
                        key={stringifyVdiskId(vDisk.VDiskId)}
                        data={vDisk}
                        nodes={nodes}
                        className={b('vdisks-item')}
                    />
                );
            })}
        </div>
    ),
    align: DataTable.CENTER,
    width: 900,
    resizeable: false,
    sortable: false,
});

export const getStorageTopGroupsColumns = (): StorageGroupsColumn[] => {
    const columns = [
        groupIdColumn,
        typeColumn,
        erasureColumn,
        usageColumn,
        usedColumn,
        limitColumn,
    ];

    return columns.map((column) => {
        return {
            ...column,
            sortable: false,
        };
    });
};

export const getPDiskStorageColumns = (nodes?: NodesMap): StorageGroupsColumn[] => {
    return [
        poolNameColumn,
        typeColumn,
        erasureColumn,
        degradedColumn,
        groupIdColumn,
        usageColumn,
        usedColumn,
        getVDisksColumn(nodes),
    ];
};

const getStorageGroupsColumns = (nodes?: NodesMap): StorageGroupsColumn[] => {
    return [
        poolNameColumn,
        typeColumn,
        erasureColumn,
        degradedColumn,
        usageColumn,
        groupIdColumn,
        usedColumn,
        limitColumn,
        usedSpaceFlagColumn,
        readColumn,
        writeColumn,
        getVDisksColumn(nodes),
    ];
};

const filterStorageGroupsColumns = (
    columns: StorageGroupsColumn[],
    visibleEntities: VisibleEntities,
) => {
    if (visibleEntities === VISIBLE_ENTITIES.space) {
        return columns.filter((col) => col.name !== GROUPS_COLUMNS_IDS.Degraded);
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        return columns.filter((col) => col.name !== GROUPS_COLUMNS_IDS.UsedSpaceFlag);
    }

    return columns.filter((col) => {
        return (
            col.name !== GROUPS_COLUMNS_IDS.Degraded &&
            col.name !== GROUPS_COLUMNS_IDS.UsedSpaceFlag
        );
    });
};

export const getPreparedStorageGroupsColumns = (
    nodesMap: NodesMap | undefined,
    visibleEntities: VisibleEntities,
) => {
    const rawColumns = getStorageGroupsColumns(nodesMap);

    const filteredColumns = filterStorageGroupsColumns(rawColumns, visibleEntities);

    return filteredColumns.map((column) => ({
        ...column,
        sortable: isSortableStorageProperty(column.name),
    }));
};
