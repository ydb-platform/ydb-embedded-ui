import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {MultilineTableHeader} from '../../../../../components/MultilineTableHeader/MultilineTableHeader';
import type {Column} from '../../../../../components/PaginatedTable';
import type {TopicMessage, TopicMessageMetadataItem} from '../../../../../types/api/topic';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatBytes, formatTimestamp} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../../../../utils/timeParsers';
import {convertToNumber} from '../../../../../utils/utils';
import i18n from '../i18n';
import {TOPIC_DATA_COLUMNS_TITLES, codecNumberToName} from '../utils/constants';
import type {TopicDataColumnId} from '../utils/types';
import {TOPIC_DATA_COLUMNS_IDS} from '../utils/types';

import './Columns.scss';

const b = cn('ydb-diagnostics-topic-data-columns');

export function getAllColumns(setFullValue: (value: string | TopicMessageMetadataItem[]) => void) {
    const columns: Column<TopicMessage>[] = [
        {
            name: TOPIC_DATA_COLUMNS_IDS.OFFSET,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.OFFSET],
            align: DataTable.LEFT,
            render: ({row}) => valueOrPlaceholder(row.Offset),
            width: 100,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE,
            header: (
                <MultilineTableHeader
                    title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE]}
                />
            ),
            align: DataTable.LEFT,
            render: ({row}) => <TopicDataTimestamp timestamp={row.CreateTimestamp} />,
            width: 220,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE,
            header: (
                <MultilineTableHeader
                    title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE]}
                />
            ),
            align: DataTable.LEFT,
            render: ({row}) => <TopicDataTimestamp timestamp={row.WriteTimestamp} />,
            width: 220,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.TS_DIFF,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TS_DIFF],
            align: DataTable.RIGHT,
            render: ({row}) => {
                const numericValue = convertToNumber(row.TimestampDiff);
                return (
                    <span className={b('ts-diff', {danger: numericValue >= 100_000})}>
                        {formatToMs(numericValue)}
                    </span>
                );
            },
            width: 90,
            note: i18n('context_ts-diff'),
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.METADATA,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.METADATA],
            align: DataTable.LEFT,
            render: ({row: {MessageMetadata}}) => {
                if (!MessageMetadata) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const prepared = MessageMetadata.map(
                    ({Key = '', Value = ''}) => `${Key}: ${Value}`,
                );
                const isTruncated = prepared.length > 0;
                return (
                    <span
                        className={b('message', {clickable: isTruncated})}
                        onClick={isTruncated ? () => setFullValue(MessageMetadata) : undefined}
                    >
                        {prepared.join(', ')}
                    </span>
                );
            },
            width: 200,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.MESSAGE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.MESSAGE],
            align: DataTable.LEFT,
            render: ({row: {Message}}) => {
                if (isNil(Message)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                let message = Message;
                try {
                    message = atob(Message);
                } catch {}
                const longMessage = message.length > 50;
                return (
                    <span
                        className={b('message', {clickable: longMessage})}
                        onClick={longMessage ? () => setFullValue(message) : undefined}
                    >
                        {message}
                    </span>
                );
            },
            width: 500,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.SIZE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SIZE],
            align: DataTable.RIGHT,
            render: ({row}) => formatBytes(row.StorageSize),
            width: 100,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE,
            header: (
                <MultilineTableHeader
                    title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE]}
                />
            ),
            align: DataTable.RIGHT,
            render: ({row}) => formatBytes(row.OriginalSize),
            width: 100,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.CODEC,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.CODEC],
            align: DataTable.RIGHT,
            render: ({row: {Codec}}) => {
                if (isNil(Codec)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return codecNumberToName[Codec] ?? Codec;
            },
            width: 70,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.PRODUCERID],
            align: DataTable.LEFT,
            render: ({row}) => valueOrPlaceholder(row.ProducerId),
            width: 100,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.SEQNO,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SEQNO],
            align: DataTable.RIGHT,
            render: ({row}) => valueOrPlaceholder(row.SeqNo),
            width: 70,
        },
    ];
    return columns;
}

export const DEFAULT_TOPIC_DATA_COLUMNS: TopicDataColumnId[] = [
    'offset',
    'timestampCreate',
    'tsDiff',
    'message',
];

export const REQUIRED_TOPIC_DATA_COLUMNS: TopicDataColumnId[] = ['offset'];

interface TopicDataTimestampProps {
    timestamp?: string;
}
function TopicDataTimestamp({timestamp}: TopicDataTimestampProps) {
    if (!timestamp) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    const formatted = formatTimestamp(timestamp);
    const splitted = formatted.split('.');
    const ms = splitted.pop();
    return (
        <React.Fragment>
            {splitted.join('.')}
            <span className={b('timestamp-ms')}>.{ms}</span>
        </React.Fragment>
    );
}

function valueOrPlaceholder(value: string | undefined, placeholder = EMPTY_DATA_PLACEHOLDER) {
    return isNil(value) ? placeholder : value;
}
