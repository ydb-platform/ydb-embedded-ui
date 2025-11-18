import {duration} from '@gravity-ui/date-utils';
import {Ban, CircleStop} from '@gravity-ui/icons';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {ActionTooltip, Flex, Icon, Text} from '@gravity-ui/uikit';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {operationsApi} from '../../store/reducers/operations';
import type {IndexBuildMetadata, OperationKind, TOperation} from '../../types/api/operations';
import {EStatusCode} from '../../types/api/operations';
import {EMPTY_DATA_PLACEHOLDER, HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';
import createToast from '../../utils/createToast';
import {formatDateTime} from '../../utils/dataFormatters/dataFormatters';
import {parseProtobufTimestampToMs} from '../../utils/timeParsers';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';
import {getOperationProgress, isIndexBuildMetadata} from './utils';

import './Operations.scss';

const IMPORT_EXPORT_KINDS: OperationKind[] = ['import/s3', 'export/s3', 'export/yt'];

export function getColumns({
    database,
    refreshTable,
    kind,
}: {
    database: string;
    refreshTable: VoidFunction;
    kind: OperationKind;
}): DataTableColumn<TOperation>[] {
    const isBuildIndex = kind === 'buildindex';
    const isImportOrExport = IMPORT_EXPORT_KINDS.includes(kind);

    // Helper function to get description tooltip content (buildindex-only)
    const getDescriptionTooltip = (operation: TOperation): string => {
        const {metadata} = operation;

        if (!isIndexBuildMetadata(metadata) || !metadata.description) {
            return '';
        }

        return JSON.stringify(metadata.description, null, 2);
    };

    const columns: DataTableColumn<TOperation>[] = [
        {
            name: COLUMNS_NAMES.ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.ID],
            width: 340,
            render: ({row}) => {
                if (!row.id) {
                    return EMPTY_DATA_PLACEHOLDER;
                }

                const tooltipContent = isBuildIndex ? getDescriptionTooltip(row) || row.id : row.id;

                return (
                    <CellWithPopover placement={['top', 'bottom']} content={tooltipContent}>
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
    ];

    // Add buildindex-specific state column
    if (isBuildIndex) {
        columns.push({
            name: COLUMNS_NAMES.STATE,
            header: COLUMNS_TITLES[COLUMNS_NAMES.STATE],
            render: ({row}) => {
                const metadata = row.metadata as IndexBuildMetadata | undefined;
                if (!metadata?.state) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return metadata.state;
            },
        });
    }

    // Add progress column for operations that have progress data
    if (isBuildIndex || isImportOrExport) {
        columns.push({
            name: COLUMNS_NAMES.PROGRESS,
            header: COLUMNS_TITLES[COLUMNS_NAMES.PROGRESS],
            render: ({row}) => {
                const progress = getOperationProgress(row, i18n);
                if (progress === null) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return progress;
            },
        });
    }

    // Add standard columns for non-buildindex operations
    if (!isBuildIndex) {
        columns.push(
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
            },
        );
    }

    // Add Actions column
    columns.push({
        name: 'Actions',
        sortable: false,
        resizeable: false,
        header: '',
        render: ({row}) => {
            return (
                <OperationsActions
                    operation={row}
                    database={database}
                    refreshTable={refreshTable}
                />
            );
        },
    });

    return columns;
}

interface OperationsActionsProps {
    operation: TOperation;
    database: string;
    refreshTable: VoidFunction;
}

function OperationsActions({operation, database, refreshTable}: OperationsActionsProps) {
    const [cancelOperation, {isLoading: isCancelLoading}] =
        operationsApi.useCancelOperationMutation();
    const [forgetOperation, {isLoading: isForgetLoading}] =
        operationsApi.useForgetOperationMutation();

    const id = operation.id;
    if (!id) {
        return null;
    }

    const isForgetButtonDisabled = isForgetLoading;
    const isCancelButtonDisabled = isCancelLoading || operation.ready === true;

    return (
        <Flex gap="2">
            <ActionTooltip
                title={i18n('header_forget')}
                placement={['left', 'bottom']}
                disabled={isForgetButtonDisabled}
            >
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
                        buttonDisabled={isForgetButtonDisabled}
                    >
                        <Icon data={Ban} />
                    </ButtonWithConfirmDialog>
                </div>
            </ActionTooltip>
            <ActionTooltip
                title={i18n('header_cancel')}
                placement={['right', 'bottom']}
                disabled={isCancelButtonDisabled}
            >
                <div>
                    <ButtonWithConfirmDialog
                        popoverDisabled={isCancelButtonDisabled}
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
                        buttonDisabled={isCancelButtonDisabled}
                    >
                        <Icon data={CircleStop} />
                    </ButtonWithConfirmDialog>
                </div>
            </ActionTooltip>
        </Flex>
    );
}
