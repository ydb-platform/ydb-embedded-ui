import React from 'react';

import {GearPlay} from '@gravity-ui/icons';
import {Button, Dialog, Flex, Icon, Popover, Switch, Text, TextInput} from '@gravity-ui/uikit';

import {useFeatureFlagsAvailable} from '../../../../store/reducers/capabilities/hooks';
import {configsApi} from '../../../../store/reducers/configs';
import {operationsApi} from '../../../../store/reducers/operations';
import type {TOperation} from '../../../../types/api/operations';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {prepareErrorMessage} from '../../../../utils/prepareErrorMessage';
import {
    getCompactionProgress,
    getCompactionShardProgress,
    isCompactMetadata,
    isForcedCompactionEnabled,
} from '../../../../utils/tableCompaction';
import i18n from '../i18n';
import {transformPath} from '../transformPath';

import {b} from './shared';

import './CompactTableAction.scss';

interface CompactTableActionProps {
    path: string;
    database: string;
    databaseFullPath: string;
}

function parseMaxShardsInFlight(value: string) {
    if (!value.trim()) {
        return undefined;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function formatProgress(operation?: TOperation) {
    const progress = getCompactionProgress(operation);

    return typeof progress === 'number' ? `${progress}%` : undefined;
}

function CompactTableStatus({operation}: {operation: TOperation}) {
    const {metadata} = operation;
    const progress = formatProgress(operation);
    const shardProgress = getCompactionShardProgress(operation);

    if (!isCompactMetadata(metadata)) {
        return null;
    }

    return (
        <Flex className={b('popover')} direction="column" gap="1">
            <Text variant="subheader-1">{i18n('compaction.status-title')}</Text>
            {metadata.state && (
                <Text>{i18n('compaction.status-state', {state: metadata.state})}</Text>
            )}
            {progress && <Text>{i18n('compaction.status-progress', {progress})}</Text>}
            {shardProgress && (
                <Text>
                    {i18n('compaction.status-shards', {
                        done: shardProgress.shardsDone,
                        total: shardProgress.shardsTotal,
                    })}
                </Text>
            )}
        </Flex>
    );
}

export function CompactTableAction({path, database, databaseFullPath}: CompactTableActionProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const featureFlagsAvailable = useFeatureFlagsAvailable();

    const {currentData: featureFlags} = configsApi.useGetFeatureFlagsQuery(
        {database},
        {skip: !featureFlagsAvailable},
    );
    const compactionEnabled = isForcedCompactionEnabled(featureFlags);

    const {
        currentData: runningCompaction,
        isFetching: isCompactionFetching,
        refetch: refetchCompaction,
    } = operationsApi.useGetTableCompactionQuery(
        {database, path},
        {
            pollingInterval: autoRefreshInterval,
            skip: !compactionEnabled,
        },
    );
    const [startTableCompaction, startTableCompactionResponse] =
        operationsApi.useStartTableCompactionMutation();

    const handleCloseDialog = React.useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleOpenDialog = React.useCallback(() => {
        setDialogOpen(true);
    }, []);

    const handleApply = React.useCallback(
        async ({cascade, maxShardsInFlight}: {cascade: boolean; maxShardsInFlight?: number}) => {
            await startTableCompaction({
                database,
                path: transformPath(path, databaseFullPath),
                cascade,
                maxShardsInFlight,
            }).unwrap();

            await refetchCompaction();
        },
        [database, databaseFullPath, path, refetchCompaction, startTableCompaction],
    );

    if (!compactionEnabled) {
        return null;
    }

    const progress = formatProgress(runningCompaction);
    const buttonText = runningCompaction
        ? progress || i18n('compaction.action-running')
        : i18n('compaction.action-run');

    const button = (
        <Button
            view="flat-secondary"
            title={
                runningCompaction
                    ? i18n('compaction.action-running-title')
                    : i18n('compaction.action-run')
            }
            onClick={handleOpenDialog}
            disabled={Boolean(runningCompaction)}
            loading={isCompactionFetching && !runningCompaction}
        >
            <Icon data={GearPlay} size={16} />
            {buttonText}
        </Button>
    );

    return (
        <React.Fragment>
            {runningCompaction ? (
                <Popover
                    content={<CompactTableStatus operation={runningCompaction} />}
                    placement="bottom-end"
                >
                    <span className={b('disabled-button-wrapper')}>{button}</span>
                </Popover>
            ) : (
                button
            )}
            <CompactTableDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                onApply={handleApply}
                loading={startTableCompactionResponse.isLoading}
            />
        </React.Fragment>
    );
}

interface CompactTableDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (value: {cascade: boolean; maxShardsInFlight?: number}) => Promise<void>;
    loading: boolean;
}

function CompactTableDialog({open, onClose, onApply, loading}: CompactTableDialogProps) {
    const [cascade, setCascade] = React.useState(true);
    const [maxShardsInFlight, setMaxShardsInFlight] = React.useState('');
    const [maxShardsError, setMaxShardsError] = React.useState('');
    const [requestErrorMessage, setRequestErrorMessage] = React.useState('');

    const resetFormState = React.useCallback(() => {
        setCascade(true);
        setMaxShardsInFlight('');
        setMaxShardsError('');
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

    const handleMaxShardsUpdate = React.useCallback((value: string) => {
        setMaxShardsInFlight(value);
        setMaxShardsError('');
        setRequestErrorMessage('');
    }, []);

    const handleSubmit = React.useCallback(
        async (event?: React.FormEvent) => {
            event?.preventDefault();

            const parsedMaxShardsInFlight = parseMaxShardsInFlight(maxShardsInFlight);

            if (parsedMaxShardsInFlight === null) {
                setMaxShardsError(i18n('compaction.error-positive-integer'));
                return;
            }

            setRequestErrorMessage('');

            try {
                await onApply({
                    cascade,
                    maxShardsInFlight: parsedMaxShardsInFlight,
                });
                handleClose();
            } catch (error) {
                setRequestErrorMessage(prepareErrorMessage(error));
            }
        },
        [cascade, handleClose, maxShardsInFlight, onApply],
    );

    return (
        <Dialog open={open} size="s" onClose={handleClose} onEnterKeyDown={() => handleSubmit()}>
            <Dialog.Header caption={i18n('compaction.dialog-title')} />
            <form onSubmit={handleSubmit}>
                <Dialog.Body className={b('dialog-body')}>
                    <Flex direction="column" gap="3" alignItems="flex-start">
                        <Flex className={b('dialog-row')} gap="3" alignItems="center">
                            <label htmlFor="tableCompactionCascade" className={b('label')}>
                                {i18n('compaction.field-cascade')}
                            </label>
                            <Switch
                                id="tableCompactionCascade"
                                checked={cascade}
                                onUpdate={handleCascadeUpdate}
                            />
                        </Flex>
                        <Flex className={b('dialog-row')} gap="3" alignItems="center">
                            <label htmlFor="tableCompactionMaxShards" className={b('label')}>
                                {i18n('compaction.field-max-shards')}
                            </label>
                            <TextInput
                                id="tableCompactionMaxShards"
                                type="number"
                                value={maxShardsInFlight}
                                onUpdate={handleMaxShardsUpdate}
                                className={b('input')}
                                errorMessage={maxShardsError}
                                validationState={maxShardsError ? 'invalid' : undefined}
                                hasClear
                            />
                        </Flex>
                        {requestErrorMessage && (
                            <Text color="danger" className={b('error')} title={requestErrorMessage}>
                                {requestErrorMessage}
                            </Text>
                        )}
                    </Flex>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonCancel={i18n('compaction.action-cancel')}
                    textButtonApply={i18n('compaction.action-start')}
                    onClickButtonCancel={handleClose}
                    loading={loading}
                    propsButtonApply={{
                        type: 'submit',
                        disabled: loading,
                    }}
                />
            </form>
        </Dialog>
    );
}
