import DataTable from '@gravity-ui/react-data-table';

import {
    getHostColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPeerPingColumn,
    getPeerSkewColumn,
    getPileNameColumn,
    getReceiveThroughputColumn,
    getSendThroughputColumn,
} from '../../../components/nodesColumns/columns';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../../lib';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../../utils/tableUtils/types';
import {bytesToMB, isNumeric} from '../../../utils/utils';

import {
    NODE_NETWORK_COLUMNS_IDS,
    NODE_NETWORK_COLUMNS_TITLES,
    isSortableNodeNetworkColumn,
} from './constants';
import type {NodePeerRow} from './helpers/nodeNetworkMapper';

function getPeerConnectTimeColumn<T extends {ConnectTime?: string}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.ConnectTime,
        header: NODE_NETWORK_COLUMNS_TITLES.ConnectTime,
        align: DataTable.LEFT,
        width: 150,
        resizeMinWidth: 120,
        render: ({row}) =>
            row.ConnectTime ? formatDateTime(row.ConnectTime) : EMPTY_DATA_PLACEHOLDER,
    };
}

function getPeerSentBytesColumn<T extends {BytesSend?: string | number}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.BytesSend,
        header: NODE_NETWORK_COLUMNS_TITLES.BytesSend,
        align: DataTable.RIGHT,
        width: 140,
        resizeMinWidth: 120,
        render: ({row}) =>
            isNumeric(row.BytesSend) ? bytesToMB(row.BytesSend) : EMPTY_DATA_PLACEHOLDER,
    };
}

function getPeerReceivedBytesColumn<T extends {BytesReceived?: string | number}>(): Column<T> {
    return {
        name: NODE_NETWORK_COLUMNS_IDS.BytesReceived,
        header: NODE_NETWORK_COLUMNS_TITLES.BytesReceived,
        align: DataTable.RIGHT,
        width: 160,
        resizeMinWidth: 130,
        render: ({row}) =>
            isNumeric(row.BytesReceived) ? bytesToMB(row.BytesReceived) : EMPTY_DATA_PLACEHOLDER,
    };
}

export function getNodeNetworkColumns(params: GetNodesColumnsParams = {}): Column<NodePeerRow>[] {
    const hostColumn = getHostColumn(params) as unknown as Column<NodePeerRow>;

    const cols: Column<NodePeerRow>[] = [
        getNodeIdColumn(),
        getNodeNameColumn(),
        getPileNameColumn(),
        hostColumn,
        getPeerConnectTimeColumn(),
        getPeerSkewColumn(),
        getPeerPingColumn(),
        getSendThroughputColumn(),
        getPeerSentBytesColumn(),
        getReceiveThroughputColumn(),
        getPeerReceivedBytesColumn(),
    ];

    return cols.map((column) => {
        return {
            ...column,
            sortable: isSortableNodeNetworkColumn(column.name),
        };
    });
}
