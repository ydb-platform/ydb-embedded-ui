import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {TopicMessage} from '../../../../../types/api/topic';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {
    TopicDataMessage,
    TopicDataSize,
    TopicDataTimestamp,
    TopicDataTsDiff,
} from '../../../Diagnostics/TopicData/columns/columns';
import {TOPIC_DATA_COLUMNS_TITLES} from '../../../Diagnostics/TopicData/utils/constants';
import {TOPIC_DATA_COLUMNS_IDS} from '../../../Diagnostics/TopicData/utils/types';
import {b} from '../shared';

function getColumns(isSchematized?: boolean): Column<TopicMessage>[] {
    return [
        {
            name: TOPIC_DATA_COLUMNS_IDS.OFFSET,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.OFFSET],
            render: ({row: {Offset}}) => (isNil(Offset) ? EMPTY_DATA_PLACEHOLDER : Offset),
            sortable: false,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE],
            render: ({row: {CreateTimestamp, TimestampDiff}}) => (
                <React.Fragment>
                    <TopicDataTimestamp timestamp={CreateTimestamp} />
                    <br />
                    <TopicDataTsDiff value={TimestampDiff} baseColor="secondary" variant="body-1" />
                </React.Fragment>
            ),
            width: 200,
            sortable: false,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.MESSAGE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.MESSAGE],
            render: ({row: {Message, OriginalSize, SchematizeError}}) => (
                <TopicDataMessage
                    message={Message}
                    size={OriginalSize}
                    messageSchematizeError={SchematizeError}
                    // A per-message schematization error means this message
                    // stayed in its legacy base64 form even when a schema is
                    // present, so it must still be decoded.
                    isSchematized={isSchematized && !SchematizeError}
                />
            ),
            width: 500,
            sortable: false,
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.SIZE,
            header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SIZE],
            render: ({row: {StorageSize}}) => <TopicDataSize size={StorageSize} />,
            align: 'right',
            width: 100,
            sortable: false,
        },
    ];
}

interface TopicPreviewTableProps {
    messages: TopicMessage[];
    /**
     * Whether the response was schematized (carries schema context and no
     * schematization error). Schematized message values, including string
     * primitives, must be rendered as-is without base64 decoding.
     */
    isSchematized?: boolean;
}

export function TopicPreviewTable({messages, isSchematized}: TopicPreviewTableProps) {
    const getRowIndex = (row: TopicMessage, index: number) => row.Offset ?? index;
    const columns = React.useMemo(() => getColumns(isSchematized), [isSchematized]);
    return (
        <ResizeableDataTable
            data={messages}
            columns={columns}
            settings={DEFAULT_TABLE_SETTINGS}
            rowKey={getRowIndex}
            wrapperClassName={b('table-wrapper')}
            emptyDataMessage="No data"
        />
    );
}
