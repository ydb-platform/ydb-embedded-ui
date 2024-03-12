import DataTable, {Column} from '@gravity-ui/react-data-table';
import block from 'bem-cn-lite';

import {SpeedMultiMeter} from '../../../../../components/SpeedMultiMeter';
import {EntityStatus} from '../../../../../components/EntityStatus/EntityStatus';
import {getDefaultNodePath} from '../../../../Node/NodePages';
import {formatBytes, formatMsToUptime} from '../../../../../utils/dataFormatters/dataFormatters';
import {isNumeric} from '../../../../../utils/utils';

import {
    PARTITIONS_COLUMNS_IDS,
    PARTITIONS_COLUMNS_TITILES,
    PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS,
    PARTITIONS_READ_LAGS_SUB_COLUMNS_TITLES,
    PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS,
    PARTITIONS_WRITE_LAGS_SUB_COLUMNS_TITLES,
    generalPartitionColumnsIds,
} from '../utils/constants';
import type {PreparedPartitionDataWithHosts} from '../utils/types';

import {
    MultilineHeader,
    ReadLagsHeader,
    ReadSessionHeader,
    UncommitedMessagesHeader,
    UnreadMessagesHeader,
    WriteLagsHeader,
} from '../Headers';

import './Columns.scss';

const b = block('ydb-diagnostics-partitions-columns');

export const allColumns: Column<PreparedPartitionDataWithHosts>[] = [
    {
        name: PARTITIONS_COLUMNS_IDS.PARTITION_ID,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.PARTITION_ID]}
            />
        ),
        sortAccessor: (row) => isNumeric(row.partitionId) && Number(row.partitionId),
        align: DataTable.LEFT,
        render: ({row}) => row.partitionId,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.STORE_SIZE,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.STORE_SIZE]}
            />
        ),
        align: DataTable.RIGHT,
        render: ({row}) => formatBytes(row.storeSize),
    },
    {
        name: PARTITIONS_COLUMNS_IDS.WRITE_SPEED,
        header: PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.WRITE_SPEED],
        align: DataTable.LEFT,
        sortAccessor: (row) => row.writeSpeed.perMinute,
        render: ({row}) => <SpeedMultiMeter data={row.writeSpeed} />,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.READ_SPEED,
        header: PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.READ_SPEED],
        align: DataTable.LEFT,
        sortAccessor: (row) => row.readSpeed?.perMinute,
        render: ({row}) => <SpeedMultiMeter data={row.readSpeed} />,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.WRITE_LAGS,
        header: <WriteLagsHeader />,
        className: b('lags-header'),
        sub: [
            {
                name: PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_LAG,
                header: PARTITIONS_WRITE_LAGS_SUB_COLUMNS_TITLES[
                    PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_LAG
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatMsToUptime(row.partitionWriteLag),
            },
            {
                name: PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_IDLE_TIME,
                header: PARTITIONS_WRITE_LAGS_SUB_COLUMNS_TITLES[
                    PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_IDLE_TIME
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatMsToUptime(row.partitionWriteIdleTime),
            },
        ],
    },
    {
        name: PARTITIONS_COLUMNS_IDS.READ_LAGS,
        header: <ReadLagsHeader />,
        className: b('lags-header'),
        sub: [
            {
                name: PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_WRITE_LAG,
                header: PARTITIONS_READ_LAGS_SUB_COLUMNS_TITLES[
                    PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_WRITE_LAG
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatMsToUptime(row.consumerWriteLag),
            },
            {
                name: PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_LAG,
                header: PARTITIONS_READ_LAGS_SUB_COLUMNS_TITLES[
                    PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_LAG
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatMsToUptime(row.consumerReadLag),
            },
            {
                name: PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_IDLE_TIME,
                header: PARTITIONS_READ_LAGS_SUB_COLUMNS_TITLES[
                    PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_IDLE_TIME
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatMsToUptime(row.consumerReadIdleTime),
            },
        ],
    },
    {
        name: PARTITIONS_COLUMNS_IDS.UNCOMMITED_MESSAGES,
        header: <UncommitedMessagesHeader />,
        align: DataTable.RIGHT,
        render: ({row}) => row.uncommitedMessages,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.UNREAD_MESSAGES,
        header: <UnreadMessagesHeader />,
        align: DataTable.RIGHT,
        render: ({row}) => row.unreadMessages,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.START_OFFSET,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.START_OFFSET]}
            />
        ),
        sortAccessor: (row) => isNumeric(row.startOffset) && Number(row.startOffset),
        align: DataTable.RIGHT,
        render: ({row}) => row.startOffset,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.END_OFFSET,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.END_OFFSET]}
            />
        ),
        sortAccessor: (row) => isNumeric(row.endOffset) && Number(row.endOffset),
        align: DataTable.RIGHT,
        render: ({row}) => row.endOffset,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.COMMITED_OFFSET,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.COMMITED_OFFSET]}
            />
        ),
        sortAccessor: (row) => isNumeric(row.commitedOffset) && Number(row.commitedOffset),
        align: DataTable.RIGHT,
        render: ({row}) => row.commitedOffset,
    },
    {
        name: PARTITIONS_COLUMNS_IDS.READ_SESSION_ID,
        header: <ReadSessionHeader />,
        align: DataTable.LEFT,
        render: ({row}) =>
            row.readSessionId ? (
                <EntityStatus
                    name={row.readSessionId}
                    showStatus={false}
                    hasClipboardButton
                    className={b('string-with-copy')}
                />
            ) : (
                '–'
            ),
    },
    {
        name: PARTITIONS_COLUMNS_IDS.READER_NAME,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.READER_NAME]}
            />
        ),
        align: DataTable.LEFT,
        render: ({row}) =>
            row.readerName ? (
                <EntityStatus
                    name={row.readerName}
                    showStatus={false}
                    hasClipboardButton
                    className={b('string-with-copy')}
                />
            ) : (
                '–'
            ),
    },
    {
        name: PARTITIONS_COLUMNS_IDS.PARTITION_HOST,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.PARTITION_HOST]}
            />
        ),
        align: DataTable.LEFT,
        render: ({row}) =>
            row.partitionNodeId && row.partitionHost ? (
                <EntityStatus
                    name={row.partitionHost}
                    path={getDefaultNodePath(row.partitionNodeId)}
                    showStatus={false}
                    hasClipboardButton
                    className={b('string-with-copy')}
                />
            ) : (
                '–'
            ),
    },
    {
        name: PARTITIONS_COLUMNS_IDS.CONNECTION_HOST,
        header: (
            <MultilineHeader
                title={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.CONNECTION_HOST]}
            />
        ),
        align: DataTable.LEFT,
        render: ({row}) =>
            row.connectionNodeId && row.connectionHost ? (
                <EntityStatus
                    name={row.connectionHost}
                    path={getDefaultNodePath(row.connectionNodeId)}
                    showStatus={false}
                    hasClipboardButton
                    className={b('string-with-copy')}
                />
            ) : (
                '–'
            ),
    },
];

// Topics without consumers have partitions data with no data corresponding to consumers
// These columns will be empty and should not be displayed
export const generalColumns = allColumns.filter((column) => {
    return generalPartitionColumnsIds.includes(
        column.name as typeof generalPartitionColumnsIds[number],
    );
});
