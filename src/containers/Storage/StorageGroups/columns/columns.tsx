import React from 'react';

import {ShieldKeyhole} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import {Icon, Label, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../../../components/CellWithPopover/CellWithPopover';
import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../../../components/InternalLink';
import {UsageLabel} from '../../../../components/UsageLabel/UsageLabel';
import {VDiskWithDonorsStack} from '../../../../components/VDisk/VDiskWithDonorsStack';
import {getStorageGroupPath} from '../../../../routes';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../../store/reducers/storage/types';
import type {NodesMap} from '../../../../types/store/nodesList';
import {cn} from '../../../../utils/cn';
import {stringifyVdiskId} from '../../../../utils/dataFormatters/dataFormatters';
import {isSortableStorageProperty} from '../../../../utils/storage';
import {bytesToGB, bytesToSpeed} from '../../../../utils/utils';
import {Disks} from '../../Disks/Disks';
import {getDegradedSeverity, getUsageSeverityForStorageGroup} from '../../utils';
import i18n from '../i18n';

import {STORAGE_GROUPS_COLUMNS_IDS, STORAGE_GROUPS_COLUMNS_TITLES} from './constants';
import type {StorageColumnsGetter, StorageGroupsColumn} from './types';

import './StorageGroupsColumns.scss';

const b = cn('ydb-storage-groups-columns');

const poolNameColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.PoolName,
    header: STORAGE_GROUPS_COLUMNS_TITLES.PoolName,
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
    name: STORAGE_GROUPS_COLUMNS_IDS.MediaType,
    header: STORAGE_GROUPS_COLUMNS_TITLES.MediaType,
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

const usageColumn: StorageGroupsColumn = {
    name: STORAGE_GROUPS_COLUMNS_IDS.Usage,
    header: STORAGE_GROUPS_COLUMNS_TITLES.Usage,
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
    name: STORAGE_GROUPS_COLUMNS_IDS.GroupId,
    header: STORAGE_GROUPS_COLUMNS_TITLES.GroupId,
    width: 130,
    render: ({row}) => {
        return row.GroupId ? (
            <InternalLink className={b('group-id')} to={getStorageGroupPath(row.GroupId)}>
                {row.GroupId}
            </InternalLink>
        ) : (
            '-'
        );
    },
    sortAccessor: (row) => Number(row.GroupId),
    align: DataTable.RIGHT,
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
    width: 110,
    render: ({row}) => {
        return <EntityStatus status={row.DiskSpace} />;
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

const getVDisksColumn = (nodes?: NodesMap): StorageGroupsColumn => ({
    name: STORAGE_GROUPS_COLUMNS_IDS.VDisks,
    header: STORAGE_GROUPS_COLUMNS_TITLES.VDisks,
    className: b('vdisks-column'),
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

const getDisksColumn = (nodes?: NodesMap): StorageGroupsColumn => ({
    name: STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
    header: STORAGE_GROUPS_COLUMNS_TITLES.VDisksPDisks,
    className: b('disks-column'),
    render: ({row}) => {
        return <Disks vDisks={row.VDisks} nodes={nodes} />;
    },
    align: DataTable.CENTER,
    width: 900,
    resizeable: false,
    sortable: false,
});

export const getStorageTopGroupsColumns: StorageColumnsGetter = () => {
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

export const getDiskPageStorageColumns: StorageColumnsGetter = (data, options) => {
    const disksColumn = options?.useAdvancedStorage
        ? getDisksColumn()
        : getVDisksColumn(data?.nodes);

    return [
        poolNameColumn,
        typeColumn,
        erasureColumn,
        degradedColumn,
        groupIdColumn,
        usageColumn,
        usedColumn,
        disksColumn,
    ];
};

const getStorageGroupsColumns: StorageColumnsGetter = (data, options) => {
    const disksColumn = options?.useAdvancedStorage
        ? getDisksColumn()
        : getVDisksColumn(data?.nodes);

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
        disksColumn,
    ];
};

const filterStorageGroupsColumns = (
    columns: StorageGroupsColumn[],
    visibleEntities?: VisibleEntities,
) => {
    if (visibleEntities === VISIBLE_ENTITIES.space) {
        return columns.filter((col) => col.name !== STORAGE_GROUPS_COLUMNS_IDS.Degraded);
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        return columns.filter((col) => col.name !== STORAGE_GROUPS_COLUMNS_IDS.DiskSpace);
    }

    return columns.filter((col) => {
        return (
            col.name !== STORAGE_GROUPS_COLUMNS_IDS.Degraded &&
            col.name !== STORAGE_GROUPS_COLUMNS_IDS.DiskSpace
        );
    });
};

export const getPreparedStorageGroupsColumns: StorageColumnsGetter = (data, options) => {
    const rawColumns = getStorageGroupsColumns(data, options);

    const filteredColumns = filterStorageGroupsColumns(rawColumns, options?.visibleEntities);

    return filteredColumns.map((column) => ({
        ...column,
        sortable: isSortableStorageProperty(column.name),
    }));
};
