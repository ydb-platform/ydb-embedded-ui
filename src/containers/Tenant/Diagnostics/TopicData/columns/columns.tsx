import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {EntityStatus} from '../../../../../components/EntityStatus/EntityStatus';
import {MultilineTableHeader} from '../../../../../components/MultilineTableHeader/MultilineTableHeader';
import type {Column} from '../../../../../components/PaginatedTable';
import {TOPIC_MESSAGE_SIZE_LIMIT} from '../../../../../store/reducers/topic';
import type {TopicMessageEnhanced} from '../../../../../types/api/topic';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatBytes, formatTimestamp} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../../../../utils/timeParsers';
import {safeParseNumber} from '../../../../../utils/utils';
import i18n from '../i18n';
import {TOPIC_DATA_COLUMNS_TITLES, codecNumberToName} from '../utils/constants';
import type {TopicDataColumnId} from '../utils/types';
import {TOPIC_DATA_COLUMNS_IDS} from '../utils/types';

import './Columns.scss';

const b = cn('ydb-diagnostics-topic-data-columns');

export function getAllColumns() {
    const columns: Column<TopicMessageEnhanced>[] = [
        {
            name: TOPIC_DATA_COLUMNS_IDS.OFFSET,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.OFFSET],
            align: DataTable.LEFT,
            render: ({row}) => {
                const {Offset, removed} = row;
                return (
                    <Text
                        className={b('offset', {removed})}
                        variant="body-2"
                        color={removed ? 'secondary' : 'primary'}
                    >
                        {valueOrPlaceholder(Offset)}
                    </Text>
                );
            },
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
                const numericValue = safeParseNumber(row.TimestampDiff);
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
                return prepared.join(', ');
            },
            width: 200,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.MESSAGE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.MESSAGE],
            align: DataTable.LEFT,
            render: ({row: {Message, OriginalSize}}) => {
                if (isNil(Message)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                let encryptedMessage;
                let invalid = false;
                try {
                    encryptedMessage = atob(Message);
                } catch {
                    encryptedMessage = i18n('description_failed-decode');
                    invalid = true;
                }

                const truncated = safeParseNumber(OriginalSize) > TOPIC_MESSAGE_SIZE_LIMIT;
                return (
                    <Text
                        variant="body-2"
                        color={invalid ? 'secondary' : 'primary'}
                        className={b('message', {invalid})}
                    >
                        {encryptedMessage}
                        {truncated && (
                            <Text color="secondary" className={b('truncated')}>
                                {' '}
                                {i18n('description_truncated')}
                            </Text>
                        )}
                    </Text>
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
            render: ({row}) => (
                <EntityStatus showStatus={false} name={row.ProducerId} hasClipboardButton />
            ),
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

function valueOrPlaceholder(
    value: string | number | undefined,
    placeholder = EMPTY_DATA_PLACEHOLDER,
) {
    return isNil(value) ? placeholder : value;
}
