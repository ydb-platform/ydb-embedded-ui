import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {ITabletPreparedHistoryItem} from '../../../types/store/tablet';
import {calcUptime} from '../../../utils';

const columns: Column<ITabletPreparedHistoryItem>[] = [
    {
        name: 'Generation',
        align: DataTable.RIGHT,
        render: ({row}) => row.generation,
    },
    {
        name: 'Node ID',
        align: DataTable.RIGHT,
        sortable: false,
        render: ({row}) => row.nodeId,
    },
    {
        name: 'Change time',
        align: DataTable.RIGHT,
        sortable: false,
        render: ({row}) => calcUptime(row.changeTime),
    },
    {
        name: 'State',
        sortable: false,
        render: ({row}) => row.state,
    },
    {
        name: 'Follower ID',
        sortable: false,
        render: ({row}) => {
            return row.leader ? 'leader' : row.followerId;
        },
    },
];

const TABLE_SETTINGS = {
    displayIndices: false,
};

interface TabletTableProps {
    history: ITabletPreparedHistoryItem[];
}

export const TabletTable = ({history}: TabletTableProps) => {
    return (
        <DataTable
            theme="yandex-cloud"
            data={history}
            columns={columns}
            settings={TABLE_SETTINGS}
            initialSortOrder={{
                columnId: 'Generation',
                order: DataTable.DESCENDING,
            }}
        />
    );
};
