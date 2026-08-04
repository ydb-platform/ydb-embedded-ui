import React from 'react';

import {useHistory, useLocation, useRouteMatch} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import routes, {createHref, getLocationObjectFromHref, parseQuery} from '../../../../routes';
import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {useMultiTabQueryEditorEnabled} from '../../../../store/reducers/capabilities/hooks';
import {
    applyExternalQueryToActiveTab,
    selectActiveTabId,
    selectIsDirty,
    selectResult,
    selectUserInput,
    setIsDirty,
    setQueryTabContent,
} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import createToast from '../../../../utils/createToast';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getRunningQueryConfirmation} from '../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {changeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups} from '../../TenantPages';
import {queryExecutionManagerInstance} from '../QueryEditor/utils/queryExecutionManager';
import i18n from '../i18n';

const STOP_QUERY_ERROR_AUTO_HIDE_TIMEOUT = 5000;
const ROUTE_PATHS = Object.values(routes);

export interface ExternalQueryToOpen {
    title: string;
    input: string;
    savedQueryName?: string;
    onAfterOpen?: () => void;
}

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

function getDatabaseFromQueryParams(queryParams: ReturnType<typeof parseQuery>) {
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

function isLegacyDatabaseNormalization(
    previousLocation: QueryLocation,
    nextLocation: QueryLocation,
) {
    if (
        previousLocation.pathname !== nextLocation.pathname ||
        previousLocation.hash !== nextLocation.hash
    ) {
        return false;
    }

    const previousParams = new URLSearchParams(previousLocation.search);
    const nextParams = new URLSearchParams(nextLocation.search);
    const legacyDatabase = previousParams.get('name');
    if (
        !legacyDatabase ||
        previousParams.has('database') ||
        nextParams.has('name') ||
        nextParams.get('database') !== legacyDatabase
    ) {
        return false;
    }

    previousParams.delete('name');
    previousParams.set('database', legacyDatabase);
    previousParams.sort();
    nextParams.sort();

    return previousParams.toString() === nextParams.toString();
}

export function useOpenExternalQueryInEditor() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const location = useLocation();
    const currentRouteMatch = useRouteMatch<{environment?: string}>({
        path: ROUTE_PATHS,
        exact: true,
    });
    const routeEnvironment = currentRouteMatch?.params.environment;
    const [sendCancelQuery] = cancelQueryApi.useCancelQueryMutation();
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const currentInput = useTypedSelector(selectUserInput);
    const isCurrentTabDirty = useTypedSelector(selectIsDirty);
    const result = useTypedSelector(selectResult);
    const queryParams = React.useMemo(() => parseQuery(location), [location]);
    const database = getDatabaseFromQueryParams(queryParams);
    const requestEpoch = React.useRef(0);
    const latestLocation = React.useRef(history.location);
    React.useEffect(() => {
        return history.listen((nextLocation, action) => {
            const previousLocation = latestLocation.current;
            latestLocation.current = nextLocation;
            if (
                action !== 'REPLACE' ||
                !isLegacyDatabaseNormalization(previousLocation, nextLocation)
            ) {
                requestEpoch.current += 1;
            }
        });
    }, [history]);
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

    const openExternalQueryInEditor = React.useCallback(
        ({title, input, savedQueryName, onAfterOpen}: ExternalQueryToOpen) => {
            if (isMultiTabEnabled) {
                dispatch(
                    setQueryTabContent({
                        tabId: uuidv4(),
                        title,
                        input,
                        savedQueryName,
                    }),
                );
            } else {
                dispatch(
                    applyExternalQueryToActiveTab({
                        title,
                        input,
                        savedQueryName,
                    }),
                );
            }

            dispatch(setIsDirty(false));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));

            const queryPath = createHref(
                routes.tenant,
                {environment: routeEnvironment},
                {
                    ...queryParams,
                    database,
                    name: undefined,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                    [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
                },
            );
            const queryPathname = getLocationObjectFromHref(queryPath).pathname;
            const isQueryEditorLocation =
                history.location.pathname === queryPathname &&
                queryParams[TENANT_PAGE] === TENANT_PAGES_IDS.query;

            if (!isQueryEditorLocation) {
                history.push(queryPath);
            }

            onAfterOpen?.();
        },
        [database, dispatch, history, isMultiTabEnabled, queryParams, routeEnvironment],
    );

    const isDestinationCurrent = React.useCallback(
        (destination: ExternalQueryDestination) => {
            const currentQueryParams = parseQuery(history.location);
            return (
                getDatabaseFromQueryParams(currentQueryParams) === destination.database &&
                requestEpoch.current === destination.requestEpoch
            );
        },
        [history],
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

            const runningExecution = !isMultiTabEnabled
                ? getCurrentRunningExecutionIdentity()
                : undefined;
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

            openExternalQueryInEditor(query);
        },
        [
            getCurrentExecutionIdentity,
            getCurrentRunningExecutionIdentity,
            isMultiTabEnabled,
            isRequestContextCurrent,
            openExternalQueryInEditor,
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
    const openExternalQueryInEditorWithConfirmation =
        isMultiTabEnabled || !isCurrentTabDirty
            ? stopLatestRunningQueryAndOpen
            : stopLatestRunningQueryAndOpenWithConfirmation;
    latestOpenExternalQueryInEditorWithConfirmation.current =
        openExternalQueryInEditorWithConfirmation;

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!database) {
                return;
            }

            requestEpoch.current += 1;
            const currentIsQueryRunning = Boolean(latestEditorState.current.result?.isLoading);
            const confirmedExecution =
                !isMultiTabEnabled && currentIsQueryRunning
                    ? getCurrentRunningExecutionIdentity()
                    : undefined;
            if (!isMultiTabEnabled && currentIsQueryRunning && !confirmedExecution) {
                return;
            }

            const request = {
                query,
                destination: {
                    database,
                    requestEpoch: requestEpoch.current,
                },
                confirmedExecution,
            };

            if (!isMultiTabEnabled && currentIsQueryRunning) {
                getRunningQueryConfirmation().then((confirmed) => {
                    if (confirmed) {
                        latestOpenExternalQueryInEditorWithConfirmation.current(request);
                    }
                });
                return;
            }

            latestOpenExternalQueryInEditorWithConfirmation.current(request);
        },
        [database, getCurrentRunningExecutionIdentity, isMultiTabEnabled],
    );
}
