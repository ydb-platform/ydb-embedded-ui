import _ from 'lodash';
import cn from 'bem-cn-lite';
import DataTable, {Column, Settings, SortOrder} from '@yandex-cloud/react-data-table';
import {Tooltip, TooltipBehavior} from '@yandex-cloud/uikit';
//@ts-ignore
import {VisibleEntities} from '../../../store/reducers/storage';
import Pdisk from '../Pdisk/Pdisk';

import './StorageNodes.scss';

enum TableColumnsIds {
    NodeId = 'NodeId',
    FQDN = 'FQDN',
    uptime = 'uptime',
    PDisks = 'PDisks',
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
    NodeId: 'Node ID',
    FQDN: 'FQDN',
    uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
};

const b = cn('global-storage-groups');

function setSortOrder(visibleEntities: keyof typeof VisibleEntities): SortOrder | undefined {
    switch (visibleEntities) {
        case VisibleEntities.All: {
            return {
                columnId: TableColumnsIds.NodeId,
                order: DataTable.ASCENDING,
            };
        }
        case VisibleEntities.Missing: {
            return {
                columnId: TableColumnsIds.Missing,
                order: DataTable.DESCENDING,
            };
        }
        default: {
            return undefined;
        }
    }
}

function StorageNodes({data, tableSettings, visibleEntities}: StorageGroupsProps) {
    const allColumns: Column<any>[] = [
        {
            name: TableColumnsIds.NodeId,
            header: tableColumnsNames[TableColumnsIds.NodeId],
            width: 100,
            align: DataTable.RIGHT,
        },
        {
            name: TableColumnsIds.FQDN,
            header: tableColumnsNames[TableColumnsIds.FQDN],
            width: 350,
            render: ({value}) => {
                return (
                    <div className={b('tooltip-wrapper')}>
                        <Tooltip
                            content={<span className={b('tooltip')}>{value as string}</span>}
                            placement={['right']}
                            behavior={TooltipBehavior.Immediate}
                        >
                            <span className={b('pool-name')}>{value as string}</span>
                        </Tooltip>
                    </div>
                );
            },
            align: DataTable.LEFT,
        },
        {
            name: TableColumnsIds.uptime,
            header: tableColumnsNames[TableColumnsIds.uptime],
            width: 130,
            sortAccessor: ({StartTime}) => -StartTime,
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
            name: TableColumnsIds.PDisks,
            header: tableColumnsNames[TableColumnsIds.PDisks],
            render: ({value, row}) => (
                <div className={b('pdisks-wrapper')}>
                    {_.map(value as any, (el) => (
                        <Pdisk key={el.PDiskId} {...el} NodeId={row.NodeId} />
                    ))}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    let columns = allColumns;

    if (visibleEntities === VisibleEntities.Space) {
        columns = allColumns.filter((col) => col.name !== TableColumnsIds.Missing);
    }

    return data ? (
        <DataTable
            key={visibleEntities as string}
            theme="internal"
            data={data}
            columns={columns}
            settings={tableSettings}
            initialSortOrder={setSortOrder(visibleEntities)}
            emptyDataMessage="No such nodes."
        />
    ) : null;
}

export default StorageNodes;
