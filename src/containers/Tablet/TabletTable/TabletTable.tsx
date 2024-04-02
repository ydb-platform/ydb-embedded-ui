import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../../components/InternalLink/InternalLink';
import type {ITabletPreparedHistoryItem} from '../../../types/store/tablet';
import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';
import {getDefaultNodePath} from '../../Node/NodePages';
import {b} from '../Tablet';

const columns: Column<ITabletPreparedHistoryItem>[] = [
    {
        name: 'Generation',
        align: DataTable.RIGHT,
        render: ({row}) => row.generation,
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
    {
        name: 'Node ID',
        align: DataTable.RIGHT,
        sortable: false,
        render: ({row}) => {
            return <InternalLink to={getDefaultNodePath(row.nodeId)}>{row.nodeId}</InternalLink>;
        },
    },
    {
        name: 'Node FQDN',
        sortable: false,
        render: ({row}) => {
            if (!row.fqdn) {
                return <span>—</span>;
            }
            return (
                <div className={b('host')}>
                    <EntityStatus name={row.fqdn} showStatus={false} hasClipboardButton />
                </div>
            );
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
