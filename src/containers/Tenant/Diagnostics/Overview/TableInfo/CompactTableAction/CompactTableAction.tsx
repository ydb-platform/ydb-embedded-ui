import React from 'react';

import {GearPlay} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Dialog,
    Flex,
    Icon,
    Popover,
    Switch,
    Text,
    TextInput,
} from '@gravity-ui/uikit';

import type {TOperation} from '../../../../../../types/api/operations';
import {CompactState} from '../../../../../../types/api/operations';
import {cn} from '../../../../../../utils/cn';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';
import {
    getCompactionProgress,
    getCompactionShardProgress,
    isCompactMetadata,
} from '../../../../../../utils/tableCompaction';
import i18n from '../i18n';

import './CompactTableAction.scss';

const b = cn('ydb-diagnostics-table-info');
const DEFAULT_PARALLEL_SHARDS = '1';

interface CompactTableActionProps {
    runningCompaction?: TOperation;
    isFetching: boolean;
    isStarting: boolean;
    onApply: (value: {cascade: boolean; parallel?: number}) => Promise<void>;
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

export function CompactTableStatusBanner({operation}: {operation: TOperation}) {
    const progress = getProgress(operation);
    const progressWidth = `${progress}%`;

    return (
        <Flex className={b('compaction-banner')} gap="3" alignItems="flex-start">
            <Icon className={b('compaction-banner-icon')} data={GearPlay} size={20} />
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
                    <div className={b('compaction-progress-fill')} style={{width: progressWidth}} />
                </div>
                <Text variant="body-1" color="secondary">
                    {i18n('context_compaction-progress', {
                        progress,
                        status: getCompactionProgressDescription(operation),
                    })}
                </Text>
            </Flex>
        </Flex>
    );
}

export function CompactTableAction({
    runningCompaction,
    isFetching,
    isStarting,
    onApply,
}: CompactTableActionProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleCloseDialog = React.useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleOpenDialog = React.useCallback(() => {
        setDialogOpen(true);
    }, []);

    const button = (
        <Button
            view="normal"
            size="s"
            onClick={handleOpenDialog}
            disabled={Boolean(runningCompaction) || isStarting}
            loading={isStarting || (isFetching && !runningCompaction)}
            aria-label={i18n('action_compaction')}
        >
            <Icon data={GearPlay} size={16} />
            {i18n('action_compaction')}
        </Button>
    );

    return (
        <React.Fragment>
            {runningCompaction ? (
                <Popover
                    content={<CompactTableStatusDetails operation={runningCompaction} />}
                    placement="bottom-end"
                >
                    <span className={b('compaction-disabled-button-wrapper')}>{button}</span>
                </Popover>
            ) : (
                <ActionTooltip title={i18n('action_run-compaction')}>{button}</ActionTooltip>
            )}
            <CompactTableDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                onApply={onApply}
                loading={isStarting}
                hasRunningCompaction={Boolean(runningCompaction)}
            />
        </React.Fragment>
    );
}

interface CompactTableDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (value: {cascade: boolean; parallel?: number}) => Promise<void>;
    loading: boolean;
    hasRunningCompaction: boolean;
}

function CompactTableDialog({
    open,
    onClose,
    onApply,
    loading,
    hasRunningCompaction,
}: CompactTableDialogProps) {
    const [cascade, setCascade] = React.useState(true);
    const [parallel, setParallel] = React.useState(DEFAULT_PARALLEL_SHARDS);
    const [parallelError, setParallelError] = React.useState('');
    const [requestErrorMessage, setRequestErrorMessage] = React.useState('');
    const submitInProgressRef = React.useRef(false);
    const submitDisabled = loading || hasRunningCompaction;

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

            if (submitDisabled || submitInProgressRef.current) {
                return;
            }

            const parsedParallel = parseParallel(parallel);

            if (parsedParallel === null) {
                setParallelError(i18n('alert_positive-integer'));
                return;
            }

            setRequestErrorMessage('');
            submitInProgressRef.current = true;

            try {
                await onApply({
                    cascade,
                    parallel: parsedParallel,
                });
                handleClose();
            } catch (error) {
                setRequestErrorMessage(prepareErrorMessage(error));
            } finally {
                submitInProgressRef.current = false;
            }
        },
        [cascade, handleClose, onApply, parallel, submitDisabled],
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
                            <label
                                htmlFor="tableCompactionCascade"
                                className={b('compaction-label')}
                            >
                                {i18n('field_cascade')}
                            </label>
                            <Switch
                                id="tableCompactionCascade"
                                checked={cascade}
                                onUpdate={handleCascadeUpdate}
                            />
                        </Flex>
                        <Flex className={b('compaction-dialog-row')} gap="3" alignItems="center">
                            <label
                                htmlFor="tableCompactionParallel"
                                className={b('compaction-label')}
                            >
                                {i18n('field_parallel-shards')}
                            </label>
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
                    loading={loading}
                    propsButtonApply={{
                        type: 'submit',
                        disabled: submitDisabled,
                    }}
                />
            </form>
        </Dialog>
    );
}
