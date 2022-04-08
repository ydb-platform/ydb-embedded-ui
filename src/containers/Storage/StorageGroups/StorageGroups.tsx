import _ from 'lodash';
import cn from 'bem-cn-lite';
import DataTable, {Column, Settings, SortOrder} from '@yandex-cloud/react-data-table';
import {Tooltip, TooltipBehavior} from '@yandex-cloud/uikit';

import Vdisk from '../Vdisk/Vdisk';
//@ts-ignore
import EntityStatus from '../../../components/EntityStatus/EntityStatus';
//@ts-ignore
import {VisibleEntities} from '../../../store/reducers/storage';
//@ts-ignore
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
//@ts-ignore
import {stringifyVdiskId} from '../../../utils';

import './StorageGroups.scss';

enum TableColumnsIds {
    PoolName = 'PoolName',
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
    nodes: any;
    tableSettings: Settings;
    visibleEntities: keyof typeof VisibleEntities;
}

const tableColumnsNames: Record<TableColumnsIdsValues, string> = {
    PoolName: 'Pool Name',
    GroupID: 'Group ID',
    Used: 'Used',
    Limit: 'Limit',
    UsedSpaceFlag: 'Space',
    UsedPercents: 'Used percents',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Missing: 'Missing',
};

const b = cn('global-storage-groups');

function setSortOrder(visibleEntities: keyof typeof VisibleEntities): SortOrder | undefined {
    switch (visibleEntities) {
        case VisibleEntities.All: {
            return {
                columnId: TableColumnsIds.GroupID,
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
                order: DataTable.ASCENDING,
            };
        }
        default: {
            return undefined;
        }
    }
}

function StorageGroups({data, tableSettings, visibleEntities, nodes}: StorageGroupsProps) {
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
                            <Tooltip
                                content={<span className={b('tooltip')}>{value as string}</span>}
                                placement={['right']}
                                behavior={TooltipBehavior.Immediate}
                            >
                                <span className={b('pool-name')}>
                                    {splitted[splitted.length - 1]}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                );
            },
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
        // {
        //     name: tableColumnsIds.UsedPercents,
        //     header: tableColumnsNames[tableColumnsIds.UsedPercents],
        //     width: '100px',
        //     render: ({row}) => {
        //         return (
        //             Math.round((row[tableColumnsIds.Used] * 100) / row[tableColumnsIds.Limit]) +
        //             '%'
        //         );
        //     },
        //     align: DataTable.RIGHT,
        // },
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
            name: TableColumnsIds.Missing,
            header: tableColumnsNames[TableColumnsIds.Missing],
            width: 100,
            align: DataTable.CENTER,
            defaultOrder: DataTable.DESCENDING,
        },
        {
            name: TableColumnsIds.VDisks,
            header: tableColumnsNames[TableColumnsIds.VDisks],
            render: ({value, row}) => (
                <div className={b('vdisks-wrapper')}>
                    {_.map(value as any, (el) => (
                        <Vdisk
                            key={stringifyVdiskId(el.VDiskId)}
                            {...el}
                            PoolName={row[TableColumnsIds.PoolName]}
                            nodes={nodes}
                        />
                    ))}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    let columns = allColumns;
    let emptyMessage = 'No such groups.';

    if (visibleEntities === VisibleEntities.Space) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.Missing);
        emptyMessage = 'No groups with out of space errors.';
    }

    if (visibleEntities === VisibleEntities.Missing) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.UsedSpaceFlag);
        emptyMessage = 'No degraded groups.';
    }
    return data ? (
        <DataTable
            key={visibleEntities as string}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={tableSettings}
            initialSortOrder={setSortOrder(visibleEntities)}
            emptyDataMessage={emptyMessage}
        />
    ) : null;
}

export default StorageGroups;
