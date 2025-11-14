import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../../../components/InternalLink/InternalLink';
import {NodeId} from '../../../../components/NodeId/NodeId';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TabletState} from '../../../../components/TabletState/TabletState';
import {TabletUptime} from '../../../../components/UptimeViewer/UptimeViewer';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../lib';
import {useTabletPagePath} from '../../../../routes';
import type {ITabletPreparedHistoryItem} from '../../../../types/store/tablet';

const TABLET_COLUMNS_WIDTH_LS_KEY = 'tabletTableColumnsWidth';

const getColumns: (props: {tabletId: string}) => Column<ITabletPreparedHistoryItem>[] = ({
    tabletId,
}) => [
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
        render: ({row}) => <TabletLink row={row} tabletId={tabletId} />,
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

interface TabletLinkProps {
    row: ITabletPreparedHistoryItem;
    tabletId: string;
}

function TabletLink({tabletId, row}: TabletLinkProps) {
    const getTabletPagePath = useTabletPagePath();
    const tabletPath = getTabletPagePath(tabletId, {
        followerId: row.leader ? undefined : row.followerId?.toString(),
    });
    const tabletName = `${tabletId}${row.followerId ? `.${row.followerId}` : ''}`;
    return <InternalLink to={tabletPath}>{tabletName}</InternalLink>;
}

const TABLE_SETTINGS = {
    displayIndices: false,
    highlightRows: true,
};

interface TabletTableProps {
    history: ITabletPreparedHistoryItem[];
    tabletId: string;
}

export const TabletTable = ({history, tabletId}: TabletTableProps) => {
    const columns = React.useMemo(() => {
        return getColumns({tabletId});
    }, [tabletId]);

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
