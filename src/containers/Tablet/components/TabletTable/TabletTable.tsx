import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../../../components/InternalLink/InternalLink';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TabletState} from '../../../../components/TabletState/TabletState';
import {TabletUptime} from '../../../../components/UptimeViewer/UptimeViewer';
import type {ITabletPreparedHistoryItem} from '../../../../types/store/tablet';
import {getDefaultNodePath} from '../../../Node/NodePages';

const TABLET_COLUMNS_WIDTH_LS_KEY = 'tabletTableColumnsWidth';

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
        render: ({row}) => {
            return <TabletUptime ChangeTime={row.changeTime} />;
        },
        width: 120,
    },
    {
        name: 'State',
        sortable: false,
        render: ({row}) => <TabletState state={row.state} />,
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
        width: 300,
        render: ({row}) => {
            if (!row.fqdn) {
                return <span>—</span>;
            }
            return <EntityStatus name={row.fqdn} showStatus={false} hasClipboardButton />;
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
        <ResizeableDataTable
            columnsWidthLSKey={TABLET_COLUMNS_WIDTH_LS_KEY}
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
