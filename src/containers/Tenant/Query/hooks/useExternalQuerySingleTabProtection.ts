import React from 'react';

import type {History} from 'history';

import {parseQuery} from '../../../../routes';
import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {
    selectActiveTabId,
    selectIsDirty,
    selectResult,
    selectUserInput,
} from '../../../../store/reducers/query/query';
import createToast from '../../../../utils/createToast';
import {useTypedSelector} from '../../../../utils/hooks';
import {getRunningQueryConfirmation} from '../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {changeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {queryExecutionManagerInstance} from '../QueryEditor/utils/queryExecutionManager';
import i18n from '../i18n';

import type {ExternalQueryToOpen} from './useOpenExternalQueryInEditor';

const STOP_QUERY_ERROR_AUTO_HIDE_TIMEOUT = 5000;

interface ExternalQueryDestination {
    database: string;
    requestEpoch: number;
}

interface QueryLocation {
    hash: string;
    pathname: string;
    search: string;
}

interface QueryExecutionIdentity {
    activeTabId: string;
    startTime: number;
}

interface ExternalQueryOpenRequest {
    query: ExternalQueryToOpen;
    destination: ExternalQueryDestination;
    confirmedExecution?: QueryExecutionIdentity;
}

interface ExternalQueryRequestCoordinator {
    requestEpoch: number;
}

interface ExternalQuerySingleTabProtectionOptions {
    database: string;
    history: History;
    isMultiTabEnabled: boolean;
    openExternalQueryInEditor: (query: ExternalQueryToOpen) => void;
}

const externalQueryRequestCoordinators = new WeakMap<History, ExternalQueryRequestCoordinator>();

function getExternalQueryRequestCoordinator(history: History) {
    let coordinator = externalQueryRequestCoordinators.get(history);
    if (!coordinator) {
        coordinator = {requestEpoch: 0};
        externalQueryRequestCoordinators.set(history, coordinator);
    }

    return coordinator;
}

export function getDatabaseFromQueryParams(queryParams: ReturnType<typeof parseQuery>) {
    const databaseParam = queryParams.database || queryParams.name;
    return typeof databaseParam === 'string' && databaseParam.trim() ? databaseParam : undefined;
}

function isSameExecution(
    currentExecution: QueryExecutionIdentity | undefined,
    expectedExecution: QueryExecutionIdentity,
) {
    return (
        currentExecution?.activeTabId === expectedExecution.activeTabId &&
        currentExecution.startTime === expectedExecution.startTime
    );
}

function isLegacyQueryNormalization(previousLocation: QueryLocation, nextLocation: QueryLocation) {
    if (
        previousLocation.pathname !== nextLocation.pathname ||
        previousLocation.hash !== nextLocation.hash
    ) {
        return false;
    }

    const previousParams = new URLSearchParams(previousLocation.search);
    const nextParams = new URLSearchParams(nextLocation.search);
    const legacyDatabase = previousParams.get('name');
    let normalizesDatabase = false;
    if (legacyDatabase && !previousParams.has('database')) {
        normalizesDatabase = true;
        previousParams.delete('name');
        previousParams.set('database', legacyDatabase);
    }

    const legacyTenantPage = previousParams.get('tenantPage');
    const normalizesTenantPage = legacyTenantPage !== null;
    if (normalizesTenantPage) {
        previousParams.delete('tenantPage');
        if (!previousParams.has('databasePage')) {
            previousParams.set('databasePage', legacyTenantPage);
        }
    }

    if (!normalizesDatabase && !normalizesTenantPage) {
        return false;
    }

    previousParams.sort();
    nextParams.sort();

    return previousParams.toString() === nextParams.toString();
}

export function useExternalQueryRequestRegistration(history: History) {
    const requestCoordinator = React.useMemo(
        () => getExternalQueryRequestCoordinator(history),
        [history],
    );
    const latestLocation = React.useRef(history.location);
    React.useEffect(() => {
        return history.listen((nextLocation, action) => {
            const previousLocation = latestLocation.current;
            latestLocation.current = nextLocation;
            if (
                action !== 'REPLACE' ||
                !isLegacyQueryNormalization(previousLocation, nextLocation)
            ) {
                requestCoordinator.requestEpoch += 1;
            }
        });
    }, [history, requestCoordinator]);

    return React.useCallback(() => {
        requestCoordinator.requestEpoch += 1;
    }, [requestCoordinator]);
}

export function useExternalQuerySingleTabProtection({
    database,
    history,
    isMultiTabEnabled,
    openExternalQueryInEditor,
}: ExternalQuerySingleTabProtectionOptions) {
    const [sendCancelQuery] = cancelQueryApi.useCancelQueryMutation();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const currentInput = useTypedSelector(selectUserInput);
    const isCurrentTabDirty = useTypedSelector(selectIsDirty);
    const result = useTypedSelector(selectResult);
    const requestCoordinator = React.useMemo(
        () => getExternalQueryRequestCoordinator(history),
        [history],
    );

    const latestOptions = React.useRef({isMultiTabEnabled, openExternalQueryInEditor});
    latestOptions.current = {isMultiTabEnabled, openExternalQueryInEditor};
    const latestEditorState = React.useRef({
        activeTabId,
        input: currentInput,
        isDirty: isCurrentTabDirty,
        result,
    });
    latestEditorState.current = {
        activeTabId,
        input: currentInput,
        isDirty: isCurrentTabDirty,
        result,
    };

    const getCurrentExecutionIdentity = React.useCallback(() => {
        const currentEditorState = latestEditorState.current;
        if (!currentEditorState.activeTabId || currentEditorState.result?.startTime === undefined) {
            return undefined;
        }

        return {
            activeTabId: currentEditorState.activeTabId,
            startTime: currentEditorState.result.startTime,
        };
    }, []);
    const getCurrentRunningExecutionIdentity = React.useCallback(() => {
        return latestEditorState.current.result?.isLoading
            ? getCurrentExecutionIdentity()
            : undefined;
    }, [getCurrentExecutionIdentity]);

    const isDestinationCurrent = React.useCallback(
        (destination: ExternalQueryDestination) => {
            const currentQueryParams = parseQuery(history.location);
            return (
                getDatabaseFromQueryParams(currentQueryParams) === destination.database &&
                requestCoordinator.requestEpoch === destination.requestEpoch
            );
        },
        [history, requestCoordinator],
    );
    const isRequestContextCurrent = React.useCallback(
        ({destination, confirmedExecution}: ExternalQueryOpenRequest) => {
            if (!isDestinationCurrent(destination)) {
                return false;
            }
            if (!confirmedExecution) {
                return true;
            }

            return isSameExecution(getCurrentExecutionIdentity(), confirmedExecution);
        },
        [getCurrentExecutionIdentity, isDestinationCurrent],
    );

    const latestOpenExternalQueryInEditorWithConfirmation = React.useRef<
        (request: ExternalQueryOpenRequest) => void
    >(() => undefined);
    const stopRunningQueryAndOpen = React.useCallback(
        async (request: ExternalQueryOpenRequest) => {
            const {query} = request;
            if (!isRequestContextCurrent(request)) {
                return;
            }

            const runningExecution = latestOptions.current.isMultiTabEnabled
                ? undefined
                : getCurrentRunningExecutionIdentity();
            if (runningExecution && !request.confirmedExecution) {
                const confirmed = await getRunningQueryConfirmation();
                const confirmedRequest = {
                    ...request,
                    confirmedExecution: runningExecution,
                };
                if (!confirmed || !isRequestContextCurrent(confirmedRequest)) {
                    return;
                }

                latestOpenExternalQueryInEditorWithConfirmation.current(confirmedRequest);
                return;
            }

            if (runningExecution) {
                const editorStateBeforeStop = latestEditorState.current;
                const runningResult = editorStateBeforeStop.result;
                if (runningResult?.streamingStatus) {
                    queryExecutionManagerInstance.abortQuery(runningExecution.activeTabId);
                } else {
                    const executionDatabase = queryExecutionManagerInstance.getQueryDatabase(
                        runningExecution.activeTabId,
                    );
                    if (!executionDatabase || !runningResult?.queryId) {
                        return;
                    }

                    try {
                        await sendCancelQuery({
                            queryId: runningResult.queryId,
                            database: executionDatabase,
                        }).unwrap();
                    } catch {
                        const currentRunningExecution = getCurrentRunningExecutionIdentity();
                        if (isSameExecution(currentRunningExecution, runningExecution)) {
                            createToast({
                                name: 'stop-error',
                                title: '',
                                content: i18n('toaster.stop-error'),
                                theme: 'danger',
                                autoHiding: STOP_QUERY_ERROR_AUTO_HIDE_TIMEOUT,
                            });
                            return;
                        }
                    }

                    const currentEditorState = latestEditorState.current;
                    if (!isSameExecution(getCurrentExecutionIdentity(), runningExecution)) {
                        return;
                    }

                    queryExecutionManagerInstance.abortQuery(runningExecution.activeTabId);
                    if (
                        currentEditorState.input !== editorStateBeforeStop.input ||
                        currentEditorState.isDirty !== editorStateBeforeStop.isDirty
                    ) {
                        return;
                    }
                }
            }

            if (!isRequestContextCurrent(request)) {
                return;
            }

            latestOptions.current.openExternalQueryInEditor(query);
        },
        [
            getCurrentExecutionIdentity,
            getCurrentRunningExecutionIdentity,
            isRequestContextCurrent,
            sendCancelQuery,
        ],
    );

    const latestStopRunningQueryAndOpen = React.useRef(stopRunningQueryAndOpen);
    latestStopRunningQueryAndOpen.current = stopRunningQueryAndOpen;
    const stopLatestRunningQueryAndOpen = React.useCallback((request: ExternalQueryOpenRequest) => {
        latestStopRunningQueryAndOpen.current(request);
    }, []);
    const stopLatestRunningQueryAndOpenWithConfirmation = React.useMemo(
        () => changeInputWithConfirmation(stopLatestRunningQueryAndOpen),
        [stopLatestRunningQueryAndOpen],
    );
    latestOpenExternalQueryInEditorWithConfirmation.current =
        isMultiTabEnabled || !isCurrentTabDirty
            ? stopLatestRunningQueryAndOpen
            : stopLatestRunningQueryAndOpenWithConfirmation;

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            const currentIsQueryRunning = Boolean(latestEditorState.current.result?.isLoading);
            const currentIsMultiTabEnabled = latestOptions.current.isMultiTabEnabled;
            const confirmedExecution =
                !currentIsMultiTabEnabled && currentIsQueryRunning
                    ? getCurrentRunningExecutionIdentity()
                    : undefined;
            if (!currentIsMultiTabEnabled && currentIsQueryRunning && !confirmedExecution) {
                return;
            }

            const request = {
                query,
                destination: {
                    database,
                    requestEpoch: requestCoordinator.requestEpoch,
                },
                confirmedExecution,
            };
            if (!currentIsMultiTabEnabled && currentIsQueryRunning) {
                getRunningQueryConfirmation().then((confirmed) => {
                    if (confirmed) {
                        latestOpenExternalQueryInEditorWithConfirmation.current(request);
                    }
                });
                return;
            }

            latestOpenExternalQueryInEditorWithConfirmation.current(request);
        },
        [database, getCurrentRunningExecutionIdentity, requestCoordinator],
    );
}
