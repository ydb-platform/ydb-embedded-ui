import {duration} from '@gravity-ui/date-utils';
import {Ban, CircleStop} from '@gravity-ui/icons';
import {ActionTooltip, Flex, Icon, Text} from '@gravity-ui/uikit';
import type {ColumnDef} from '@tanstack/react-table';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {ColumnHeader} from '../../components/Table/Table';
import {operationsApi} from '../../store/reducers/operations';
import type {TOperation} from '../../types/api/operations';
import {EStatusCode} from '../../types/api/operations';
import {EMPTY_DATA_PLACEHOLDER, HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';
import createToast from '../../utils/createToast';
import {formatDateTime} from '../../utils/dataFormatters/dataFormatters';
import {parseProtobufTimestampToMs} from '../../utils/timeParsers';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';

import './Operations.scss';

export function getColumns({
    database,
    refreshTable,
}: {
    database: string;
    refreshTable: VoidFunction;
}): ColumnDef<TOperation>[] {
    return [
        {
            accessorKey: 'id',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.ID]}</ColumnHeader>,
            size: 340,
            cell: ({getValue}) => {
                const id = getValue<string>();
                if (!id) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <CellWithPopover placement={['top', 'bottom']} content={id}>
                        {id}
                    </CellWithPopover>
                );
            },
        },
        {
            accessorKey: 'status',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.STATUS]}</ColumnHeader>,
            cell: ({getValue}) => {
                const status = getValue<EStatusCode>();
                if (!status) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <Text color={status === EStatusCode.SUCCESS ? 'positive' : 'danger'}>
                        {status}
                    </Text>
                );
            },
        },
        {
            accessorKey: 'created_by',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.CREATED_BY]}</ColumnHeader>,
            cell: ({getValue}) => {
                const createdBy = getValue<string>();
                if (!createdBy) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return createdBy;
            },
        },
        {
            accessorKey: 'create_time',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.CREATE_TIME]}</ColumnHeader>,
            cell: ({getValue}) => {
                const createTime = getValue<TOperation['create_time']>();
                if (!createTime) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return formatDateTime(parseProtobufTimestampToMs(createTime));
            },
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.create_time
                    ? parseProtobufTimestampToMs(rowA.original.create_time)
                    : 0;
                const b = rowB.original.create_time
                    ? parseProtobufTimestampToMs(rowB.original.create_time)
                    : 0;
                return a - b;
            },
        },
        {
            accessorKey: 'end_time',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.END_TIME]}</ColumnHeader>,
            cell: ({getValue}) => {
                const endTime = getValue<TOperation['end_time']>();
                if (!endTime) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return formatDateTime(parseProtobufTimestampToMs(endTime));
            },
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.end_time
                    ? parseProtobufTimestampToMs(rowA.original.end_time)
                    : Number.MAX_SAFE_INTEGER;
                const b = rowB.original.end_time
                    ? parseProtobufTimestampToMs(rowB.original.end_time)
                    : Number.MAX_SAFE_INTEGER;
                return a - b;
            },
        },
        {
            id: 'duration',
            header: () => <ColumnHeader>{COLUMNS_TITLES[COLUMNS_NAMES.DURATION]}</ColumnHeader>,
            cell: ({row}) => {
                const operation = row.original;
                let durationValue = 0;
                if (!operation.create_time) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const createTime = parseProtobufTimestampToMs(operation.create_time);
                if (operation.end_time) {
                    const endTime = parseProtobufTimestampToMs(operation.end_time);
                    durationValue = endTime - createTime;
                } else {
                    durationValue = Date.now() - createTime;
                }

                const durationFormatted =
                    durationValue > HOUR_IN_SECONDS * SECOND_IN_MS
                        ? duration(durationValue).format('hh:mm:ss')
                        : duration(durationValue).format('mm:ss');

                return operation.end_time
                    ? durationFormatted
                    : i18n('label_duration-ongoing', {value: durationFormatted});
            },
            sortingFn: (rowA, rowB) => {
                const getDuration = (operation: TOperation) => {
                    if (!operation.create_time) {
                        return 0;
                    }
                    const createTime = parseProtobufTimestampToMs(operation.create_time);
                    if (operation.end_time) {
                        const endTime = parseProtobufTimestampToMs(operation.end_time);
                        return endTime - createTime;
                    }
                    return Date.now() - createTime;
                };
                return getDuration(rowA.original) - getDuration(rowB.original);
            },
        },
        {
            id: 'actions',
            header: () => <ColumnHeader> </ColumnHeader>,
            cell: ({row}) => {
                return (
                    <OperationsActions
                        operation={row.original}
                        database={database}
                        refreshTable={refreshTable}
                    />
                );
            },
            enableSorting: false,
            size: 100,
        },
    ];
}

interface OperationsActionsProps {
    operation: TOperation;
    database: string;
    refreshTable: VoidFunction;
}

function OperationsActions({operation, database, refreshTable}: OperationsActionsProps) {
    const [cancelOperation, {isLoading: isLoadingCancel}] =
        operationsApi.useCancelOperationMutation();
    const [forgetOperation, {isLoading: isForgetLoading}] =
        operationsApi.useForgetOperationMutation();

    const id = operation.id;
    if (!id) {
        return null;
    }

    return (
        <Flex gap="2">
            <ActionTooltip title={i18n('header_forget')} placement={['left', 'auto']}>
                <div>
                    <ButtonWithConfirmDialog
                        buttonView="outlined"
                        dialogHeader={i18n('header_forget')}
                        dialogText={i18n('text_forget')}
                        onConfirmAction={() =>
                            forgetOperation({id, database})
                                .unwrap()
                                .then(() => {
                                    createToast({
                                        name: 'Forgotten',
                                        title: i18n('text_forgotten', {id}),
                                        theme: 'success',
                                    });
                                    refreshTable();
                                })
                        }
                        buttonDisabled={isLoadingCancel}
                    >
                        <Icon data={Ban} />
                    </ButtonWithConfirmDialog>
                </div>
            </ActionTooltip>
            <ActionTooltip title={i18n('header_cancel')} placement={['right', 'auto']}>
                <div>
                    <ButtonWithConfirmDialog
                        buttonView="outlined"
                        dialogHeader={i18n('header_cancel')}
                        dialogText={i18n('text_cancel')}
                        onConfirmAction={() =>
                            cancelOperation({id, database})
                                .unwrap()
                                .then(() => {
                                    createToast({
                                        name: 'Cancelled',
                                        title: i18n('text_cancelled', {id}),
                                        theme: 'success',
                                    });
                                    refreshTable();
                                })
                        }
                        buttonDisabled={isForgetLoading}
                    >
                        <Icon data={CircleStop} />
                    </ButtonWithConfirmDialog>
                </div>
            </ActionTooltip>
        </Flex>
    );
}
