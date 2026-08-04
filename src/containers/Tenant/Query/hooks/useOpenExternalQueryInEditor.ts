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
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups} from '../../TenantPages';
import {queryExecutionManagerInstance} from '../QueryEditor/utils/queryExecutionManager';
import i18n from '../i18n';

const STOP_QUERY_ERROR_AUTO_HIDE_TIMEOUT = 5000;

export interface ExternalQueryToOpen {
    title: string;
    input: string;
    savedQueryName?: string;
    onAfterOpen?: () => void;
}

interface ExternalQueryDestination {
    database: string;
    pathname: string;
    search: string;
    hash: string;
}

interface ExternalQueryOpenRequest {
    query: ExternalQueryToOpen;
    destination: ExternalQueryDestination;
    confirmedExecution?: {
        activeTabId: string;
        startTime: number;
    };
}

function getDatabaseFromQueryParams(queryParams: ReturnType<typeof parseQuery>) {
    const databaseParam = queryParams.database || queryParams.name;
    return typeof databaseParam === 'string' && databaseParam.trim() ? databaseParam : undefined;
}

export function useOpenExternalQueryInEditor() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const location = useLocation();
    const tenantRouteMatch = useRouteMatch<{environment?: string}>(routes.tenant);
    const routeEnvironment = tenantRouteMatch?.params.environment;
    const [sendCancelQuery] = cancelQueryApi.useCancelQueryMutation();
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const currentInput = useTypedSelector(selectUserInput);
    const isCurrentTabDirty = useTypedSelector(selectIsDirty);
    const result = useTypedSelector(selectResult);
    const queryParams = React.useMemo(() => parseQuery(location), [location]);
    const database = getDatabaseFromQueryParams(queryParams);
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
                history.location.pathname === destination.pathname &&
                history.location.search === destination.search &&
                history.location.hash === destination.hash
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

            const currentExecution = getCurrentExecutionIdentity();
            return (
                currentExecution?.activeTabId === confirmedExecution.activeTabId &&
                currentExecution.startTime === confirmedExecution.startTime
            );
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
                        createToast({
                            name: 'stop-error',
                            title: '',
                            content: i18n('toaster.stop-error'),
                            theme: 'danger',
                            autoHiding: STOP_QUERY_ERROR_AUTO_HIDE_TIMEOUT,
                        });
                        return;
                    }

                    const currentEditorState = latestEditorState.current;
                    if (
                        currentEditorState.activeTabId !== runningExecution.activeTabId ||
                        currentEditorState.result?.startTime !== runningExecution.startTime
                    ) {
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

    const openExternalQueryInEditorWithConfirmation = useChangeInputWithConfirmation(
        stopLatestRunningQueryAndOpen,
        isMultiTabEnabled,
    );
    latestOpenExternalQueryInEditorWithConfirmation.current =
        openExternalQueryInEditorWithConfirmation;

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!database) {
                return;
            }

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
                    pathname: history.location.pathname,
                    search: history.location.search,
                    hash: history.location.hash,
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
        [database, getCurrentRunningExecutionIdentity, history, isMultiTabEnabled],
    );
}
