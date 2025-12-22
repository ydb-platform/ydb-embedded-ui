import React from 'react';

import {TriangleExclamation} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {TextProps} from '@gravity-ui/uikit';
import {ActionTooltip, Icon, Popover, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';
import {Link} from 'react-router-dom';

import {EntityStatus} from '../../../../../components/EntityStatus/EntityStatus';
import {MultilineTableHeader} from '../../../../../components/MultilineTableHeader/MultilineTableHeader';
import type {Column} from '../../../../../components/PaginatedTable';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {TOPIC_MESSAGE_SIZE_LIMIT} from '../../../../../store/reducers/topic';
import type {TopicMessageEnhanced} from '../../../../../types/api/topic';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatBytes, formatTimestamp} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../../../../utils/timeParsers';
import {safeParseNumber} from '../../../../../utils/utils';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import i18n from '../i18n';
import {useTopicDataQueryParams} from '../useTopicDataQueryParams';
import {TOPIC_DATA_COLUMNS_TITLES, codecNumberToName} from '../utils/constants';
import type {TopicDataColumnId} from '../utils/types';
import {TOPIC_DATA_COLUMNS_IDS} from '../utils/types';

import './Columns.scss';

const b = cn('ydb-diagnostics-topic-data-columns');

export const offsetColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.OFFSET,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.OFFSET],
    align: DataTable.LEFT,
    render: ({row}) => {
        const {Offset: offset, removed, notLoaded} = row;

        return <Offset offset={offset} removed={removed} notLoaded={notLoaded} />;
    },
    width: 100,
};

export const timestampCreateColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE,
    header: (
        <MultilineTableHeader
            title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE]}
        />
    ),
    align: DataTable.LEFT,
    render: ({row: {CreateTimestamp}}) =>
        CreateTimestamp ? (
            <EntityStatus
                showStatus={false}
                renderName={() => <TopicDataTimestamp timestamp={CreateTimestamp} />}
                name={formatTimestamp(CreateTimestamp)}
                hasClipboardButton
            />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        ),
    width: 220,
};

export const timestampWriteColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE,
    header: (
        <MultilineTableHeader
            title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE]}
        />
    ),
    align: DataTable.LEFT,
    render: ({row: {WriteTimestamp}}) =>
        WriteTimestamp ? (
            <EntityStatus
                showStatus={false}
                renderName={() => <TopicDataTimestamp timestamp={WriteTimestamp} />}
                name={formatTimestamp(WriteTimestamp)}
                hasClipboardButton
            />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        ),
    width: 220,
};

export const tsDiffColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.TS_DIFF,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TS_DIFF],
    align: DataTable.RIGHT,
    render: ({row: {TimestampDiff}}) => <TopicDataTsDiff value={TimestampDiff} />,
    width: 110,
    note: i18n('context_ts-diff'),
};

export const metadataColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.METADATA,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.METADATA],
    align: DataTable.LEFT,
    render: ({row: {MessageMetadata}}) => {
        if (!MessageMetadata) {
            return EMPTY_DATA_PLACEHOLDER;
        }
        const prepared = MessageMetadata.map(({Key = '', Value = ''}) => `${Key}: ${Value}`);
        return prepared.join(', ');
    },
    width: 200,
};

export const messageColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.MESSAGE,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.MESSAGE],
    align: DataTable.LEFT,
    render: ({row: {Message, OriginalSize}}) => (
        <TopicDataMessage message={Message} size={OriginalSize} />
    ),
    width: 500,
};

export const sizeColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.SIZE,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SIZE],
    align: DataTable.RIGHT,
    render: ({row: {StorageSize}}) => <TopicDataSize size={StorageSize} />,
    width: 100,
};

export const originalSizeColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE,
    header: (
        <MultilineTableHeader
            title={TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE]}
        />
    ),
    align: DataTable.RIGHT,
    render: ({row}) => formatBytes(row.OriginalSize),
    width: 100,
};

export const codecColumn: Column<TopicMessageEnhanced> = {
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
};

export const producerIdColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.PRODUCERID],
    align: DataTable.LEFT,
    render: ({row}) =>
        row.ProducerId ? (
            <EntityStatus showStatus={false} name={row.ProducerId} hasClipboardButton />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        ),
    width: 100,
};

export const seqNoColumn: Column<TopicMessageEnhanced> = {
    name: TOPIC_DATA_COLUMNS_IDS.SEQNO,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SEQNO],
    align: DataTable.RIGHT,
    render: ({row}) =>
        row.SeqNo ? (
            <EntityStatus showStatus={false} name={row.SeqNo} hasClipboardButton />
        ) : (
            EMPTY_DATA_PLACEHOLDER
        ),
    width: 100,
};

export function getAllColumns() {
    const columns: Column<TopicMessageEnhanced>[] = [
        offsetColumn,
        timestampCreateColumn,
        timestampWriteColumn,
        tsDiffColumn,
        metadataColumn,
        messageColumn,
        sizeColumn,
        originalSizeColumn,
        codecColumn,
        producerIdColumn,
        seqNoColumn,
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
export function TopicDataTimestamp({timestamp}: TopicDataTimestampProps) {
    if (!timestamp) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    const formatted = formatTimestamp(timestamp);
    const splitted = formatted.split('.');
    const ms = splitted.pop();
    return (
        <Text variant="body-2">
            {splitted.join('.')}
            <Text color="secondary" variant="body-2">
                .{ms}
            </Text>
        </Text>
    );
}

interface PartitionIdProps {
    offset?: string | number;
    removed?: boolean;
    notLoaded?: boolean;
}

function Offset({offset, removed, notLoaded}: PartitionIdProps) {
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const {handleActiveOffsetChange} = useTopicDataQueryParams();

    if (isNil(offset)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    if (removed) {
        return (
            <ActionTooltip title={i18n('description_removed-message')} placement={'right'}>
                <Text className={b('offset', {removed: true})} variant="body-2">
                    {offset}
                </Text>
            </ActionTooltip>
        );
    }

    const offsetLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.topicData, {
        activeOffset: String(offset),
    });

    const handleClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        //if allow to navigate link, the table will be rerendered
        e.stopPropagation();
        e.preventDefault();
        const stringOffset = String(offset);

        handleActiveOffsetChange(stringOffset);
    };

    return (
        <Link to={offsetLink} onClick={handleClick} className={b('offset', {link: true})}>
            <Text variant="body-2" color="info">
                {offset}
            </Text>
            {notLoaded && (
                <Popover
                    content={
                        <Text className={b('help')}>{i18n('description_not-loaded-message')}</Text>
                    }
                    className={b('help-popover')}
                >
                    <Text color="secondary" className={b('help-popover')}>
                        <Icon data={TriangleExclamation} />
                    </Text>
                </Popover>
            )}
        </Link>
    );
}
interface TopicDataTsDiffProps {
    value?: string;
    baseColor?: TextProps['color'];
    variant?: TextProps['variant'];
}

export function TopicDataTsDiff({
    value,
    baseColor = 'primary',
    variant = 'body-2',
}: TopicDataTsDiffProps) {
    if (isNil(value)) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    const numericValue = safeParseNumber(value);
    return (
        <Text variant={variant} color={numericValue >= 100_000 ? 'danger' : baseColor}>
            {formatToMs(numericValue)}
        </Text>
    );
}

interface TopicDataMessageProps {
    message?: string;
    size?: number;
}

export function TopicDataMessage({message, size}: TopicDataMessageProps) {
    if (isNil(message)) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    let encryptedMessage;
    let invalid = false;
    try {
        encryptedMessage = atob(message);
    } catch {
        encryptedMessage = i18n('description_failed-decode');
        invalid = true;
    }

    const truncated = safeParseNumber(size) > TOPIC_MESSAGE_SIZE_LIMIT;
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
}

interface TopicDataSizeProps {
    size?: number;
}

export function TopicDataSize({size}: TopicDataSizeProps) {
    return formatBytes(size);
}
