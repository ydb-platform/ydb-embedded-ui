import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {getLocationObjectFromHref, getTenantPath, parseQuery} from '../../../../routes';
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
}

function getDatabaseFromQueryParams(queryParams: ReturnType<typeof parseQuery>) {
    const databaseParam = queryParams.database || queryParams.name;
    return typeof databaseParam === 'string' && databaseParam.trim() ? databaseParam : undefined;
}

export function useOpenExternalQueryInEditor() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const location = useLocation();
    const [sendCancelQuery] = cancelQueryApi.useCancelQueryMutation();
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const currentInput = useTypedSelector(selectUserInput);
    const isCurrentTabDirty = useTypedSelector(selectIsDirty);
    const result = useTypedSelector(selectResult);
    const isQueryRunning = Boolean(result?.isLoading);
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

            const queryPath = getTenantPath({
                ...queryParams,
                database,
                name: undefined,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });
            const queryPathname = getLocationObjectFromHref(queryPath).pathname;
            const isQueryEditorLocation =
                history.location.pathname === queryPathname &&
                queryParams[TENANT_PAGE] === TENANT_PAGES_IDS.query;

            if (!isQueryEditorLocation) {
                history.push(queryPath);
            }

            onAfterOpen?.();
        },
        [database, dispatch, history, isMultiTabEnabled, queryParams],
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

    const stopRunningQueryAndOpen = React.useCallback(
        async ({query, destination}: ExternalQueryOpenRequest) => {
            if (!isDestinationCurrent(destination)) {
                return;
            }

            if (!isMultiTabEnabled && isQueryRunning && activeTabId) {
                if (result?.streamingStatus) {
                    queryExecutionManagerInstance.abortQuery(activeTabId);
                } else {
                    const executionDatabase =
                        queryExecutionManagerInstance.getQueryDatabase(activeTabId);
                    if (!executionDatabase || !result?.queryId) {
                        return;
                    }

                    try {
                        await sendCancelQuery({
                            queryId: result.queryId,
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
                        currentEditorState.activeTabId !== activeTabId ||
                        currentEditorState.result?.queryId !== result.queryId
                    ) {
                        return;
                    }

                    queryExecutionManagerInstance.abortQuery(activeTabId);

                    if (
                        currentEditorState.input !== currentInput ||
                        currentEditorState.isDirty !== isCurrentTabDirty
                    ) {
                        return;
                    }
                }
            }

            if (!isDestinationCurrent(destination)) {
                return;
            }

            openExternalQueryInEditor(query);
        },
        [
            activeTabId,
            currentInput,
            isCurrentTabDirty,
            isDestinationCurrent,
            isMultiTabEnabled,
            isQueryRunning,
            openExternalQueryInEditor,
            result?.queryId,
            result?.streamingStatus,
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
    const latestOpenExternalQueryInEditorWithConfirmation = React.useRef(
        openExternalQueryInEditorWithConfirmation,
    );
    latestOpenExternalQueryInEditorWithConfirmation.current =
        openExternalQueryInEditorWithConfirmation;

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!database) {
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
            };

            if (!isMultiTabEnabled && isQueryRunning) {
                getRunningQueryConfirmation().then((confirmed) => {
                    if (confirmed) {
                        latestOpenExternalQueryInEditorWithConfirmation.current(request);
                    }
                });
                return;
            }

            latestOpenExternalQueryInEditorWithConfirmation.current(request);
        },
        [database, history, isMultiTabEnabled, isQueryRunning],
    );
}
