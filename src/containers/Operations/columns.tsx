import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Text} from '@gravity-ui/uikit';

import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import type {TOperation} from '../../types/api/operationList';
import {EStatusCode} from '../../types/api/operationList';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';

export function getColumns(): DataTableColumn<TOperation>[] {
    return [
        {
            name: COLUMNS_NAMES.ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.ID],
            width: 220,
            render: ({row}) => {
                if (!row.id) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return <EntityStatus name={row.id} showStatus={false} />;
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
                return new Date(row.create_time || '').toLocaleString();
            },
            sortAccessor: (row) => new Date(row.create_time || '').getTime(),
        },
        {
            name: COLUMNS_NAMES.END_TIME,
            header: COLUMNS_TITLES[COLUMNS_NAMES.END_TIME],
            render: ({row}) => {
                if (!row.end_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return row.end_time ? new Date(row.end_time).toLocaleString() : '-';
            },
            sortAccessor: (row) =>
                row.end_time ? new Date(row.end_time).getTime() : Number.MAX_SAFE_INTEGER,
        },
        {
            name: COLUMNS_NAMES.DURATION,
            header: COLUMNS_TITLES[COLUMNS_NAMES.DURATION],
            render: ({row}) => {
                if (!row.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                if (row.create_time && row.end_time) {
                    const duration =
                        new Date(row.end_time).getTime() - new Date(row.create_time).getTime();
                    return `${(duration / 1000).toFixed(2)}s`;
                }
                const duration = Date.now() - new Date(row.create_time || '').getTime();
                return `${(duration / 1000).toFixed(2)}s (ongoing)`;
            },
            sortAccessor: (row) => {
                if (row.create_time && row.end_time) {
                    return new Date(row.end_time).getTime() - new Date(row.create_time).getTime();
                }
                return Date.now() - new Date(row.create_time || '').getTime();
            },
        },
    ];
}
