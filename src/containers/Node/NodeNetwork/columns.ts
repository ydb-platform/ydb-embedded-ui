import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {
    getHostColumn,
    getNodeIdColumn,
    getNodeNameColumn,
    getPileNameColumn,
} from '../../../components/nodesColumns/columns';
import {formatTimestamp} from '../../../utils/dataFormatters/dataFormatters';
import {formatToMs, parseUsToMs} from '../../../utils/timeParsers';
import {bytesToMB, bytesToSpeed} from '../../../utils/utils';

import i18n from './i18n';
import type {NodePeerRow} from './nodeNetworkMapper';

export function getNodeNetworkColumns(params: {database?: string} = {}): Column<NodePeerRow>[] {
    const cols: Column<NodePeerRow>[] = [
        getNodeIdColumn(),
        getNodeNameColumn(),
        getPileNameColumn(),
        getHostColumn(params),
        {
            name: 'ConnectTime',
            align: DataTable.LEFT,
            resizeable: true,
            sortable: false,
            header: i18n('field_connect-time'),
            render: ({row}) => formatTimestamp(row.ConnectTime),
        },
        {
            name: 'Skew',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_skew'),
            render: ({row}) => formatToMs(parseUsToMs(row.ClockSkewUs)),
        },
        {
            name: 'Ping',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_ping'),
            render: ({row}) => formatToMs(parseUsToMs(row.PingTimeUs)),
        },
        {
            name: 'Send',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_send'),
            render: ({row}) => bytesToSpeed(row.SendThroughput),
        },
        {
            name: 'SentBytes',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_sent-bytes'),
            render: ({row}) => bytesToMB(row.SentBytes),
        },
        {
            name: 'Receive',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_receive'),
            render: ({row}) => bytesToSpeed(row.ReceiveThroughput),
        },
        {
            name: 'ReceivedBytes',
            align: DataTable.RIGHT,
            resizeable: true,
            sortable: false,
            header: i18n('field_received-bytes'),
            render: ({row}) => bytesToMB(row.ReceivedBytes),
        },
    ];

    return cols;
}
