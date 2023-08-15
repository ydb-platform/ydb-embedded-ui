import cn from 'bem-cn-lite';

import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import {Icon, Label, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import type {ValueOf} from '../../../types/common';
import type {NodesMap} from '../../../types/store/nodesList';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';

import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
import {stringifyVdiskId} from '../../../utils';
import {getUsage, isFullVDiskData, isSortableStorageProperty} from '../../../utils/storage';

import shieldIcon from '../../../assets/icons/shield.svg';
import {Stack} from '../../../components/Stack/Stack';
import EntityStatus from '../../../components/EntityStatus/EntityStatus';

import {EmptyFilter} from '../EmptyFilter/EmptyFilter';
import {VDisk} from '../VDisk';
import {getDegradedSeverity, getUsageSeverityForStorageGroup} from '../utils';

import i18n from './i18n';
import './StorageGroups.scss';

const TableColumnsIds = {
    PoolName: 'PoolName',
    Kind: 'Kind',
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

type TableColumnId = ValueOf<typeof TableColumnsIds>;

interface StorageGroupsProps {
    data: PreparedStorageGroup[];
    nodes?: NodesMap;
    tableSettings: Settings;
    visibleEntities: VisibleEntities;
    onShowAll?: VoidFunction;
}

const tableColumnsNames: Record<TableColumnId, string> = {
    PoolName: 'Pool Name',
    Kind: 'Type',
    Erasure: 'Erasure',
    GroupId: 'Group ID',
    Used: 'Used',
    Limit: 'Limit',
    UsedSpaceFlag: 'Space',
    Usage: 'Usage',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Degraded: 'Degraded',
};

const b = cn('global-storage-groups');

function setSortOrder(visibleEntities: VisibleEntities): SortOrder | undefined {
    switch (visibleEntities) {
        case VISIBLE_ENTITIES.all: {
            return {
                columnId: TableColumnsIds.PoolName,
                order: DataTable.ASCENDING,
            };
        }
        case VISIBLE_ENTITIES.missing: {
            return {
                columnId: TableColumnsIds.Degraded,
                order: DataTable.DESCENDING,
            };
        }
        case VISIBLE_ENTITIES.space: {
            return {
                columnId: TableColumnsIds.UsedSpaceFlag,
                order: DataTable.DESCENDING,
            };
        }
        default: {
            return undefined;
        }
    }
}

export function StorageGroups({
    data,
    tableSettings,
    visibleEntities,
    nodes,
    onShowAll,
}: StorageGroupsProps) {
    const rawColumns: Column<PreparedStorageGroup>[] = [
        {
            name: TableColumnsIds.PoolName,
            header: tableColumnsNames[TableColumnsIds.PoolName],
            width: 250,
            render: ({row}) => {
                const splitted = row.PoolName?.split('/');
                return (
                    <div className={b('pool-name-wrapper')}>
                        {splitted && (
                            <Popover
                                content={row.PoolName}
                                placement={['right']}
                                behavior={PopoverBehavior.Immediate}
                            >
                                <span className={b('pool-name')}>
                                    {splitted[splitted.length - 1]}
                                </span>
                            </Popover>
                        )}
                    </div>
                );
            },
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.Kind,
            header: tableColumnsNames[TableColumnsIds.Kind],
            // prettier-ignore
            render: ({row}) => (
                <>
                    <Label>{row.Kind || '—'}</Label>
                    {' '}
                    {row.Encryption && (
                        <Popover
                            content={i18n('encrypted')}
                            placement="right"
                            behavior={PopoverBehavior.Immediate}
                        >
                            <Label>
                                <Icon data={shieldIcon} />
                            </Label>
                        </Popover>
                    )}
                </>
            ),
        },
        {
            name: TableColumnsIds.Erasure,
            header: tableColumnsNames[TableColumnsIds.Erasure],
            render: ({row}) => (row.ErasureSpecies ? row.ErasureSpecies : '-'),
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.Degraded,
            header: tableColumnsNames[TableColumnsIds.Degraded],
            width: 100,
            render: ({row}) =>
                row.Degraded ? (
                    <Label theme={getDegradedSeverity(row)}>Degraded: {row.Degraded}</Label>
                ) : (
                    '-'
                ),
            align: DataTable.LEFT,
            defaultOrder: DataTable.DESCENDING,
        },
        {
            name: TableColumnsIds.Usage,
            header: tableColumnsNames[TableColumnsIds.Usage],
            width: 100,
            render: ({row}) => {
                // without a limit the usage can be evaluated as 0,
                // but the absence of a value is more clear
                return row.Limit ? (
                    <Label
                        theme={getUsageSeverityForStorageGroup(row.Usage)}
                        className={b('usage-label', {overload: row.Usage >= 90})}
                    >
                        {row.Usage}%
                    </Label>
                ) : (
                    '-'
                );
            },
            // without a limit exclude usage from sort to display at the bottom
            sortAccessor: (row) => (row.Limit ? getUsage(row) : null),
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.GroupId,
            header: tableColumnsNames[TableColumnsIds.GroupId],
            width: 130,
            render: ({row}) => {
                return <span className={b('group-id')}>{row.GroupID}</span>;
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Used,
            header: tableColumnsNames[TableColumnsIds.Used],
            width: 100,
            render: ({row}) => {
                return bytesToGB(row.Used, true);
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Limit,
            header: tableColumnsNames[TableColumnsIds.Limit],
            width: 100,
            render: ({row}) => {
                return bytesToGB(row.Limit);
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.UsedSpaceFlag,
            header: tableColumnsNames[TableColumnsIds.UsedSpaceFlag],
            width: 110,
            render: ({row}) => {
                const value = row.UsedSpaceFlag;

                let color = 'Red';

                if (value < 100) {
                    color = 'Green';
                } else if (value < 10000) {
                    color = 'Yellow';
                } else if (value < 1000000) {
                    color = 'Orange';
                }
                return <EntityStatus status={color} />;
            },
            align: DataTable.CENTER,
        },

        {
            name: TableColumnsIds.Read,
            header: tableColumnsNames[TableColumnsIds.Read],
            width: 100,
            render: ({row}) => {
                return row.Read ? bytesToSpeed(row.Read) : '-';
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Write,
            header: tableColumnsNames[TableColumnsIds.Write],
            width: 100,
            render: ({row}) => {
                return row.Write ? bytesToSpeed(row.Write) : '-';
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.VDisks,
            className: b('vdisks-column'),
            header: tableColumnsNames[TableColumnsIds.VDisks],
            render: ({row}) => (
                <div className={b('vdisks-wrapper')}>
                    {row.VDisks?.map((vDisk) => {
                        const donors = vDisk.Donors;

                        return donors && donors.length > 0 ? (
                            <Stack
                                className={b('vdisks-item')}
                                key={stringifyVdiskId(vDisk.VDiskId)}
                            >
                                <VDisk data={vDisk} nodes={nodes} />
                                {donors.map((donor) => {
                                    const isFullData = isFullVDiskData(donor);

                                    return (
                                        <VDisk
                                            data={isFullData ? donor : {...donor, DonorMode: true}}
                                            // donor and acceptor are always in the same group
                                            nodes={nodes}
                                            key={stringifyVdiskId(
                                                isFullData ? donor.VDiskId : donor,
                                            )}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : (
                            <div className={b('vdisks-item')} key={stringifyVdiskId(vDisk.VDiskId)}>
                                <VDisk data={vDisk} nodes={nodes} />
                            </div>
                        );
                    })}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    let columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableStorageProperty(column.name),
    }));

    if (visibleEntities === VISIBLE_ENTITIES.all) {
        columns = columns.filter((col) => {
            return (
                col.name !== TableColumnsIds.Degraded && col.name !== TableColumnsIds.UsedSpaceFlag
            );
        });
    }

    if (visibleEntities === VISIBLE_ENTITIES.space) {
        columns = columns.filter((col) => col.name !== TableColumnsIds.Degraded);

        if (!data.length) {
            return (
                <EmptyFilter
                    title={i18n('empty.out_of_space')}
                    showAll={i18n('show_all')}
                    onShowAll={onShowAll}
                />
            );
        }
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        columns = columns.filter((col) => col.name !== TableColumnsIds.UsedSpaceFlag);

        if (!data.length) {
            return (
                <EmptyFilter
                    title={i18n('empty.degraded')}
                    showAll={i18n('show_all')}
                    onShowAll={onShowAll}
                />
            );
        }
    }

    return data ? (
        <DataTable
            key={visibleEntities}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={tableSettings}
            initialSortOrder={setSortOrder(visibleEntities)}
            emptyDataMessage={i18n('empty.default')}
        />
    ) : null;
}
