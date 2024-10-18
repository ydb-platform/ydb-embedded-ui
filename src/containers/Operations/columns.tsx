import {duration} from '@gravity-ui/date-utils';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import type {TOperation} from '../../types/api/operationList';
import {EStatusCode} from '../../types/api/operationList';
import {EMPTY_DATA_PLACEHOLDER, HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';
import {formatDateTime} from '../../utils/dataFormatters/dataFormatters';
import {parseProtobufTimestampToMs} from '../../utils/timeParsers';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';

export function getColumns(): DataTableColumn<TOperation>[] {
    return [
        {
            name: COLUMNS_NAMES.ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.ID],
            width: 340,
            render: ({row}) => {
                if (!row.id) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <CellWithPopover placement={['top', 'bottom']} content={row.id}>
                        {row.id}
                    </CellWithPopover>
                );
            },
        },
        {
            name: COLUMNS_NAMES.STATUS,
            header: COLUMNS_TITLES[COLUMNS_NAMES.STATUS],
            render: ({row}) => {
                if (!row.status) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <Text color={row.status === EStatusCode.SUCCESS ? 'positive' : 'danger'}>
                        {row.status}
                    </Text>
                );
            },
        },
        {
            name: COLUMNS_NAMES.CREATED_BY,
            header: COLUMNS_TITLES[COLUMNS_NAMES.CREATED_BY],
            render: ({row}) => {
                if (!row.created_by) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return row.created_by;
            },
        },
        {
            name: COLUMNS_NAMES.CREATE_TIME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.CREATE_TIME],
            render: ({row}) => {
                if (!row.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return formatDateTime(parseProtobufTimestampToMs(row.create_time));
            },
            sortAccessor: (row) =>
                row.create_time ? parseProtobufTimestampToMs(row.create_time) : 0,
        },
        {
            name: COLUMNS_NAMES.END_TIME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.END_TIME],
            render: ({row}) => {
                if (!row.end_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return formatDateTime(parseProtobufTimestampToMs(row.end_time));
            },
            sortAccessor: (row) =>
                row.end_time ? parseProtobufTimestampToMs(row.end_time) : Number.MAX_SAFE_INTEGER,
        },
        {
            name: COLUMNS_NAMES.DURATION,
            header: COLUMNS_TITLES[COLUMNS_NAMES.DURATION],
            render: ({row}) => {
                let durationValue = 0;
                if (!row.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const createTime = parseProtobufTimestampToMs(row.create_time);
                if (row.end_time) {
                    const endTime = parseProtobufTimestampToMs(row.end_time);
                    durationValue = endTime - createTime;
                } else {
                    durationValue = Date.now() - createTime;
                }

                const durationFormatted =
                    durationValue > HOUR_IN_SECONDS * SECOND_IN_MS
                        ? duration(durationValue).format('hh:mm:ss')
                        : duration(durationValue).format('mm:ss');

                return row.end_time
                    ? durationFormatted
                    : i18n('label_duration-ongoing', {value: durationFormatted});
            },
            sortAccessor: (row) => {
                if (!row.create_time) {
                    return 0;
                }
                const createTime = parseProtobufTimestampToMs(row.create_time);
                if (row.end_time) {
                    const endTime = parseProtobufTimestampToMs(row.end_time);
                    return endTime - createTime;
                }
                return Date.now() - createTime;
            },
        },
    ];
}
