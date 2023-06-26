import _ from 'lodash';
import cn from 'bem-cn-lite';
import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import {Icon, Label, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import type {NodesMap} from '../../../types/store/nodesList';

import shieldIcon from '../../../assets/icons/shield.svg';

import {Stack} from '../../../components/Stack/Stack';
//@ts-ignore
import EntityStatus from '../../../components/EntityStatus/EntityStatus';

import {TVDiskStateInfo} from '../../../types/api/vdisk';
//@ts-ignore
import {VisibleEntities} from '../../../store/reducers/storage/storage';
//@ts-ignore
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
//@ts-ignore
import {stringifyVdiskId} from '../../../utils';
import {getUsage, isFullVDiskData} from '../../../utils/storage';

import {EmptyFilter} from '../EmptyFilter/EmptyFilter';
import {VDisk} from '../VDisk';
import {getDegradedSeverity, getUsageSeverityForStorageGroup} from '../utils';

import i18n from './i18n';
import './StorageGroups.scss';

enum TableColumnsIds {
    PoolName = 'PoolName',
    Type = 'Type',
    ErasureSpecies = 'ErasureSpecies',
    GroupID = 'GroupID',
    Used = 'Used',
    Limit = 'Limit',
    UsedPercents = 'UsedPercents',
    UsedSpaceFlag = 'UsedSpaceFlag',
    Read = 'Read',
    Write = 'Write',
    VDisks = 'VDisks',
    Missing = 'Missing',
}

type TableColumnsIdsKeys = keyof typeof TableColumnsIds;
type TableColumnsIdsValues = typeof TableColumnsIds[TableColumnsIdsKeys];

interface StorageGroupsProps {
    data: any;
    nodes: NodesMap;
    tableSettings: Settings;
    visibleEntities: keyof typeof VisibleEntities;
    onShowAll?: VoidFunction;
}

const tableColumnsNames: Record<TableColumnsIdsValues, string> = {
    PoolName: 'Pool Name',
    Type: 'Type',
    ErasureSpecies: 'Erasure',
    GroupID: 'Group ID',
    Used: 'Used',
    Limit: 'Limit',
    UsedSpaceFlag: 'Space',
    UsedPercents: 'Usage',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Missing: 'Degraded',
};

const b = cn('global-storage-groups');

function setSortOrder(visibleEntities: keyof typeof VisibleEntities): SortOrder | undefined {
    switch (visibleEntities) {
        case VisibleEntities.All: {
            return {
                columnId: TableColumnsIds.PoolName,
                order: DataTable.ASCENDING,
            };
        }
        case VisibleEntities.Missing: {
            return {
                columnId: TableColumnsIds.Missing,
                order: DataTable.DESCENDING,
            };
        }
        case VisibleEntities.Space: {
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

function StorageGroups({
    data,
    tableSettings,
    visibleEntities,
    nodes,
    onShowAll,
}: StorageGroupsProps) {
    const allColumns: Column<any>[] = [
        {
            name: TableColumnsIds.PoolName,
            header: tableColumnsNames[TableColumnsIds.PoolName],
            width: 250,
            render: ({value}) => {
                const splitted = (value as string)?.split('/');
                return (
                    <div className={b('pool-name-wrapper')}>
                        {splitted && (
                            <Popover
                                content={value as string}
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
            name: TableColumnsIds.Type,
            header: tableColumnsNames[TableColumnsIds.Type],
            // prettier-ignore
            render: ({value, row}) => (
                <>
                    <Label>{(value as string) || '—'}</Label>
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
            name: TableColumnsIds.ErasureSpecies,
            header: tableColumnsNames[TableColumnsIds.ErasureSpecies],
            render: ({row}) => (row.ErasureSpecies ? row.ErasureSpecies : '-'),
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.Missing,
            header: tableColumnsNames[TableColumnsIds.Missing],
            width: 100,
            render: ({value, row}) =>
                value ? <Label theme={getDegradedSeverity(row)}>Degraded: {value}</Label> : '-',
            align: DataTable.LEFT,
            defaultOrder: DataTable.DESCENDING,
        },
        {
            name: TableColumnsIds.UsedPercents,
            header: tableColumnsNames[TableColumnsIds.UsedPercents],
            width: 100,
            render: ({row}) => {
                const usage = getUsage(row, 5);
                // without a limit the usage can be evaluated as 0,
                // but the absence of a value is more clear
                return row.Limit ? (
                    <Label
                        theme={getUsageSeverityForStorageGroup(usage)}
                        className={b('usage-label', {overload: usage >= 90})}
                    >
                        {usage}%
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
            name: TableColumnsIds.GroupID,
            header: tableColumnsNames[TableColumnsIds.GroupID],
            width: 130,
            render: ({value}) => {
                return <span className={b('group-id')}>{value as number}</span>;
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Used,
            header: tableColumnsNames[TableColumnsIds.Used],
            width: 100,
            render: ({value}) => {
                return bytesToGB(value, true);
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Limit,
            header: tableColumnsNames[TableColumnsIds.Limit],
            width: 100,
            render: ({value}) => {
                return bytesToGB(value);
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.UsedSpaceFlag,
            header: tableColumnsNames[TableColumnsIds.UsedSpaceFlag],
            width: 110,
            render: ({value}) => {
                const val = value as number;
                let color = 'Red';
                if (val < 100) {
                    color = 'Green';
                } else if (val < 10000) {
                    color = 'Yellow';
                } else if (val < 1000000) {
                    value = 'Orange';
                }
                return <EntityStatus status={color} />;
            },
            align: DataTable.CENTER,
        },

        {
            name: TableColumnsIds.Read,
            header: tableColumnsNames[TableColumnsIds.Read],
            width: 100,
            render: ({value}) => {
                return value ? bytesToSpeed(value) : '-';
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.Write,
            header: tableColumnsNames[TableColumnsIds.Write],
            width: 100,
            render: ({value}) => {
                return value ? bytesToSpeed(value) : '-';
            },
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.VDisks,
            className: b('vdisks-column'),
            header: tableColumnsNames[TableColumnsIds.VDisks],
            render: ({value}) => (
                <div className={b('vdisks-wrapper')}>
                    {_.map(value as TVDiskStateInfo[], (el) => {
                        const donors = el.Donors;

                        return donors && donors.length > 0 ? (
                            <Stack className={b('vdisks-item')} key={stringifyVdiskId(el.VDiskId)}>
                                <VDisk data={el} nodes={nodes} />
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
                            <div className={b('vdisks-item')} key={stringifyVdiskId(el.VDiskId)}>
                                <VDisk data={el} nodes={nodes} />
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

    let columns = allColumns;

    if (visibleEntities === VisibleEntities.All) {
        columns = allColumns.filter((col) => {
            return (
                col.name !== TableColumnsIds.Missing && col.name !== TableColumnsIds.UsedSpaceFlag
            );
        });
    }

    if (visibleEntities === VisibleEntities.Space) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.Missing);

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

    if (visibleEntities === VisibleEntities.Missing) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.UsedSpaceFlag);

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
            key={visibleEntities as string}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={tableSettings}
            initialSortOrder={setSortOrder(visibleEntities)}
            emptyDataMessage={i18n('empty.default')}
        />
    ) : null;
}

export default StorageGroups;
