import type {Column} from '@gravity-ui/react-data-table';
import {ClipboardButton, Flex, Text} from '@gravity-ui/uikit';

import type {ControlPlaneOperationRow} from '../../services/parsers/parseControlPlaneOperation';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatDateTime} from '../../utils/dataFormatters/dataFormatters';

import {OperationError} from './OperationError';
import {OperationUser} from './OperationUser';
import i18n from './i18n';
import {b} from './shared';
import {getOperationErrorText} from './utils';

export const CONTROL_PLANE_STATUS_TITLES = {
    DONE: i18n('value_completed'),
    PENDING: i18n('value_pending'),
    ERROR: i18n('value_error'),
};

const STATUS_COLORS = {ERROR: 'danger', DONE: 'positive', PENDING: 'secondary'} as const;

export function getControlPlaneColumns(clusterName?: string): Column<ControlPlaneOperationRow>[] {
    return [
        {
            name: 'id',
            className: b('id-cell'),
            width: 220,
            header: i18n('column_id'),
            sortable: true,
            render: ({row}) =>
                row.id ? (
                    <Flex alignItems="center" gap={1}>
                        {row.id}
                        <ClipboardButton
                            text={row.id}
                            size="xs"
                            view="flat-secondary"
                            className={b('id-copy')}
                            aria-label={i18n('action_copy-operation-id', {id: row.id})}
                        />
                    </Flex>
                ) : (
                    EMPTY_DATA_PLACEHOLDER
                ),
        },
        {
            name: 'status',
            width: 180,
            header: i18n('column_status'),
            sortable: false,
            render: ({row}) => {
                const status = row.controlPlaneStatus ?? 'PENDING';
                const title = CONTROL_PLANE_STATUS_TITLES[status];
                const error = getOperationErrorText(row.issues);
                if (status === 'ERROR' && error) {
                    return <OperationError status={title} message={error} id={row.id} />;
                }
                return <Text color={STATUS_COLORS[status]}>{title}</Text>;
            },
        },
        {
            name: 'created_by',
            width: 200,
            header: i18n('column_user'),
            sortable: false,
            render: ({row}) => <OperationUser userId={row.created_by} clusterName={clusterName} />,
        },
        {
            name: 'description',
            width: 240,
            header: i18n('column_operation'),
            sortable: false,
            render: ({row}) => row.description || EMPTY_DATA_PLACEHOLDER,
        },
        ...(['created_at', 'modified_at'] as const).map(
            (name): Column<ControlPlaneOperationRow> => ({
                name,
                width: 180,
                header: i18n(name === 'created_at' ? 'column_started-at' : 'column_updated-at'),
                sortable: true,
                render: ({row}) =>
                    formatDateTime(row[name], {defaultValue: EMPTY_DATA_PLACEHOLDER}),
            }),
        ),
    ];
}
