import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../../../components/InternalLink/InternalLink';
import {NodeId} from '../../../../components/NodeId/NodeId';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TabletState} from '../../../../components/TabletState/TabletState';
import {TabletUptime} from '../../../../components/UptimeViewer/UptimeViewer';
import {getTabletPagePath} from '../../../../routes';
import type {ITabletPreparedHistoryItem} from '../../../../types/store/tablet';

const TABLET_COLUMNS_WIDTH_LS_KEY = 'tabletTableColumnsWidth';

const getColumns: (props: {
    database?: string;
    tabletId: string;
}) => Column<ITabletPreparedHistoryItem>[] = ({database, tabletId}) => [
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
        name: 'Tablet',
        sortable: false,
        render: ({row}) => {
            const tabletPath = getTabletPagePath(tabletId, {
                database,
                followerId: row.leader ? undefined : row.followerId?.toString(),
            });
            const tabletName = `${tabletId}${row.followerId ? `.${row.followerId}` : ''}`;
            return <InternalLink to={tabletPath}>{tabletName}</InternalLink>;
        },
    },
    {
        name: 'Node ID',
        align: DataTable.RIGHT,
        sortable: false,
        render: ({row}) => {
            return <NodeId id={row.nodeId} />;
        },
    },
    {
        name: 'Node FQDN',
        sortable: false,
        width: 300,
        render: ({row}) => {
            if (!row.fqdn) {
                return EMPTY_DATA_PLACEHOLDER;
            }
            return <EntityStatus name={row.fqdn} showStatus={false} hasClipboardButton />;
        },
    },
];

const TABLE_SETTINGS = {
    displayIndices: false,
    highlightRows: true,
};

interface TabletTableProps {
    history: ITabletPreparedHistoryItem[];
    database?: string;
    tabletId: string;
}

export const TabletTable = ({history, database, tabletId}: TabletTableProps) => {
    const columns = React.useMemo(() => {
        return getColumns({database, tabletId});
    }, [database, tabletId]);

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
