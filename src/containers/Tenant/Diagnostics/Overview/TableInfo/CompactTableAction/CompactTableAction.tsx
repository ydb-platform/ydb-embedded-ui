import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {CircleStop, GearPlay} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Dialog,
    Flex,
    HelpMark,
    Icon,
    Popover,
    Switch,
    Text,
    TextInput,
} from '@gravity-ui/uikit';

import type {TOperation} from '../../../../../../types/api/operations';
import {CompactState} from '../../../../../../types/api/operations';
import {cn} from '../../../../../../utils/cn';
import createToast from '../../../../../../utils/createToast';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';
import {
    getCompactionProgress,
    getCompactionShardProgress,
    isCompactMetadata,
} from '../../../../../../utils/tableCompaction';
import {reachMetricaGoal} from '../../../../../../utils/yaMetrica';
import i18n from '../i18n';

import './CompactTableAction.scss';

const b = cn('ydb-diagnostics-table-info');
const DEFAULT_PARALLEL_SHARDS = '1';
const COMPACT_TABLE_DIALOG = 'compact-table-dialog';
const START_COMPACTION_RESPONSE_TIMEOUT = 1000;

interface CompactTableActionProps {
    runningCompaction?: TOperation;
    isFetching: boolean;
    onApply: (value: {cascade: boolean; parallel?: number}) => Promise<void>;
    onRefreshCompactions?: () => void;
    executeQueryAndForgetAvailable?: boolean;
}

type CompactionStartResult =
    | {status: 'success'}
    | {status: 'error'; error: unknown}
    | {status: 'timeout'};

// Races the compaction request against a timeout so the dialog does not block on a
// long-running query. The request only resolves successfully if the operation actually
// started; if it fails to start, the request rejects and we surface the error. Reaching
// the timeout without an error is therefore treated as a successful start. Note: an error
// arriving after the timeout cannot be shown, since by then the dialog is already closed.
function waitForCompactionStartOrTimeout(
    promise: Promise<void>,
    timeoutMs: number,
): Promise<CompactionStartResult> {
    return new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
            resolve({status: 'timeout'});
        }, timeoutMs);

        promise
            .then(() => {
                window.clearTimeout(timeoutId);
                resolve({status: 'success'});
            })
            .catch((error: unknown) => {
                window.clearTimeout(timeoutId);
                resolve({status: 'error', error});
            });
    });
}

function showCompactionToast(content: string) {
    createToast({
        name: 'startTableCompaction',
        content,
        autoHiding: 3000,
        isClosable: true,
    });
}

function parseParallel(value: string) {
    if (!value.trim()) {
        return undefined;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getProgress(operation?: TOperation) {
    return getCompactionProgress(operation) ?? 0;
}

function getCompactionProgressDescription(operation: TOperation) {
    const {metadata} = operation;

    if (!isCompactMetadata(metadata)) {
        return i18n('value_compaction-starting');
    }

    if (metadata.state === CompactState.STATE_IN_PROGRESS) {
        return i18n('value_compaction-running');
    }

    if (metadata.state === CompactState.STATE_DONE) {
        return i18n('value_compaction-done');
    }

    if (metadata.state === CompactState.STATE_CANCELLED) {
        return i18n('value_compaction-cancelled');
    }

    return i18n('value_compaction-starting');
}

function CompactTableStatusDetails({operation}: {operation: TOperation}) {
    const {metadata} = operation;
    const progress = getCompactionProgress(operation);
    const shardProgress = getCompactionShardProgress(operation);

    if (!isCompactMetadata(metadata)) {
        return null;
    }

    return (
        <Flex className={b('compaction-popover')} direction="column" gap="1">
            <Text variant="subheader-1">{i18n('title_compaction')}</Text>
            {metadata.state && (
                <Text>{i18n('field_compaction-state', {state: metadata.state})}</Text>
            )}
            {typeof progress === 'number' && (
                <Text>{i18n('field_compaction-progress', {progress})}</Text>
            )}
            {shardProgress && (
                <Text>
                    {i18n('field_compaction-shards', {
                        done: shardProgress.shardsDone,
                        total: shardProgress.shardsTotal,
                    })}
                </Text>
            )}
        </Flex>
    );
}

export function CompactTableStatusBanner({
    operation,
    onCancel,
    isCancelling,
}: {
    operation: TOperation;
    onCancel: () => void;
    isCancelling: boolean;
}) {
    const progress = getProgress(operation);
    const progressWidth = `${progress}%`;

    return (
        <Flex className={b('compaction-banner')} gap="3" alignItems="flex-start">
            <Icon className={b('compaction-banner-icon')} data={GearPlay} size={20} />
            <Flex gap="5" alignItems="center" grow>
                <Flex direction="column" gap="2" className={b('compaction-banner-content')}>
                    <Text variant="subheader-2">{i18n('title_compaction-in-progress')}</Text>
                    <Text variant="body-1">{i18n('context_compaction-in-progress')}</Text>

                    <div
                        className={b('compaction-progress')}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                    >
                        <div
                            className={b('compaction-progress-fill')}
                            style={{width: progressWidth}}
                        />
                    </div>

                    <Text variant="body-1" color="secondary">
                        {i18n('context_compaction-progress', {
                            progress,
                            status: getCompactionProgressDescription(operation),
                        })}
                    </Text>
                </Flex>
                <Button
                    view="normal-contrast"
                    onClick={onCancel}
                    loading={isCancelling}
                    disabled={isCancelling}
                    aria-label={i18n('action_stop-compaction')}
                >
                    <Icon data={CircleStop} size={16} />
                    {i18n('action_stop')}
                </Button>
            </Flex>
        </Flex>
    );
}

export function CompactTableAction({
    runningCompaction,
    isFetching,
    onApply,
    onRefreshCompactions,
    executeQueryAndForgetAvailable,
}: CompactTableActionProps) {
    const handleOpenDialog = React.useCallback(() => {
        reachMetricaGoal('openCompactionDialog');
        openCompactTableDialog({
            onApply,
            onRefreshCompactions,
            hasRunningCompaction: Boolean(runningCompaction),
            executeQueryAndForgetAvailable,
        });
    }, [executeQueryAndForgetAvailable, onApply, onRefreshCompactions, runningCompaction]);

    const button = (
        <Button
            view="normal"
            size="s"
            onClick={handleOpenDialog}
            disabled={Boolean(runningCompaction)}
            loading={isFetching && !runningCompaction}
            aria-label={i18n('action_compaction')}
        >
            <Icon data={GearPlay} size={16} />
            {i18n('action_compaction')}
        </Button>
    );

    return runningCompaction ? (
        <Popover
            content={<CompactTableStatusDetails operation={runningCompaction} />}
            placement="bottom-end"
        >
            <span className={b('compaction-disabled-button-wrapper')}>{button}</span>
        </Popover>
    ) : (
        <ActionTooltip title={i18n('action_run-compaction')}>{button}</ActionTooltip>
    );
}

interface CompactTableDialogProps {
    onApply: (value: {cascade: boolean; parallel?: number}) => Promise<void>;
    onRefreshCompactions?: () => void;
    hasRunningCompaction: boolean;
    executeQueryAndForgetAvailable?: boolean;
}

interface CompactTableDialogNiceModalProps extends CompactTableDialogProps {
    open: boolean;
    onClose: () => void;
}

function CompactTableDialog({
    open,
    onClose,
    onApply,
    onRefreshCompactions,
    hasRunningCompaction,
    executeQueryAndForgetAvailable,
}: CompactTableDialogNiceModalProps) {
    const [cascade, setCascade] = React.useState(true);
    const [parallel, setParallel] = React.useState(DEFAULT_PARALLEL_SHARDS);
    const [parallelError, setParallelError] = React.useState('');
    const [requestErrorMessage, setRequestErrorMessage] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const submitDisabled = isSubmitting || hasRunningCompaction;

    const resetFormState = React.useCallback(() => {
        setCascade(true);
        setParallel(DEFAULT_PARALLEL_SHARDS);
        setParallelError('');
        setRequestErrorMessage('');
    }, []);

    const handleClose = React.useCallback(() => {
        resetFormState();
        onClose();
    }, [onClose, resetFormState]);

    const handleCascadeUpdate = React.useCallback((value: boolean) => {
        setCascade(value);
        setRequestErrorMessage('');
    }, []);

    const handleParallelUpdate = React.useCallback((value: string) => {
        setParallel(value);
        setParallelError('');
        setRequestErrorMessage('');
    }, []);

    const handleSubmit = React.useCallback(
        async (event?: React.FormEvent) => {
            event?.preventDefault();

            if (submitDisabled) {
                return;
            }

            const parsedParallel = parseParallel(parallel);

            if (parsedParallel === null) {
                setParallelError(i18n('alert_positive-integer'));
                return;
            }

            setRequestErrorMessage('');
            setIsSubmitting(true);

            try {
                reachMetricaGoal('startCompaction');
                const applyPromise = onApply({
                    cascade,
                    parallel: parsedParallel,
                });

                if (executeQueryAndForgetAvailable) {
                    // Backend returns immediately once compaction is scheduled in the background
                    await applyPromise;
                } else {
                    // Compaction query is long-running, so do not block the dialog on it.
                    // Treat reaching the response timeout without an error as a success.
                    const result = await waitForCompactionStartOrTimeout(
                        applyPromise,
                        START_COMPACTION_RESPONSE_TIMEOUT,
                    );

                    if (result.status === 'error') {
                        setRequestErrorMessage(prepareErrorMessage(result.error));
                        return;
                    }
                }

                showCompactionToast(i18n('toast_compaction-started'));
                onRefreshCompactions?.();
                handleClose();
            } catch (error) {
                setRequestErrorMessage(prepareErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            cascade,
            executeQueryAndForgetAvailable,
            handleClose,
            onApply,
            onRefreshCompactions,
            parallel,
            submitDisabled,
        ],
    );

    return (
        <Dialog open={open} size="s" onClose={handleClose}>
            <Dialog.Header
                caption={<Text variant="subheader-3">{i18n('title_run-table-compaction')}</Text>}
            />
            <form onSubmit={handleSubmit}>
                <Dialog.Body className={b('compaction-dialog-body')}>
                    <Flex direction="column" gap="4" alignItems="flex-start">
                        <Flex className={b('compaction-dialog-row')} gap="3" alignItems="center">
                            <Flex
                                className={b('compaction-label-wrapper')}
                                gap="1"
                                alignItems="center"
                            >
                                <label
                                    htmlFor="tableCompactionCascade"
                                    className={b('compaction-label')}
                                >
                                    {i18n('field_cascade')}
                                </label>
                                <HelpMark iconSize="s">{i18n('help_cascade')}</HelpMark>
                            </Flex>
                            <Switch
                                id="tableCompactionCascade"
                                checked={cascade}
                                onUpdate={handleCascadeUpdate}
                            />
                        </Flex>
                        <Flex className={b('compaction-dialog-row')} gap="3" alignItems="center">
                            <Flex
                                className={b('compaction-label-wrapper')}
                                gap="1"
                                alignItems="center"
                            >
                                <label
                                    htmlFor="tableCompactionParallel"
                                    className={b('compaction-label')}
                                >
                                    {i18n('field_parallel-shards')}
                                </label>
                                <HelpMark iconSize="s">{i18n('help_parallel-shards')}</HelpMark>
                            </Flex>
                            <TextInput
                                id="tableCompactionParallel"
                                type="number"
                                value={parallel}
                                onUpdate={handleParallelUpdate}
                                className={b('compaction-input')}
                                errorMessage={parallelError}
                                validationState={parallelError ? 'invalid' : undefined}
                                hasClear
                            />
                        </Flex>
                        {requestErrorMessage && (
                            <Text
                                color="danger"
                                className={b('compaction-error')}
                                title={requestErrorMessage}
                            >
                                {requestErrorMessage}
                            </Text>
                        )}
                    </Flex>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonCancel={i18n('action_cancel')}
                    textButtonApply={i18n('action_start-compaction')}
                    onClickButtonCancel={handleClose}
                    loading={isSubmitting}
                    propsButtonApply={{
                        type: 'submit',
                        disabled: submitDisabled,
                    }}
                />
            </form>
        </Dialog>
    );
}

export const CompactTableDialogNiceModal = NiceModal.create((props: CompactTableDialogProps) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <CompactTableDialog
            {...props}
            onApply={props.onApply}
            onClose={handleClose}
            open={modal.visible}
        />
    );
});

NiceModal.register(COMPACT_TABLE_DIALOG, CompactTableDialogNiceModal);

export function openCompactTableDialog(props: CompactTableDialogProps): void {
    NiceModal.show(COMPACT_TABLE_DIALOG, {
        id: COMPACT_TABLE_DIALOG,
        ...props,
    });
}
