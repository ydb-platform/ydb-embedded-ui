import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {getLocationObjectFromHref, getTenantPath, parseQuery} from '../../../../routes';
import {useMultiTabQueryEditorEnabled} from '../../../../store/reducers/capabilities/hooks';
import {
    applyExternalQueryToActiveTab,
    selectActiveTabId,
    selectResult,
    setIsDirty,
    setQueryTabContent,
} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getRunningQueryConfirmation} from '../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups} from '../../TenantPages';
import {queryExecutionManagerInstance} from '../QueryEditor/utils/queryExecutionManager';

export interface ExternalQueryToOpen {
    title: string;
    input: string;
    savedQueryName?: string;
    onAfterOpen?: () => void;
}

export function useOpenExternalQueryInEditor() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const location = useLocation();
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const activeTabId = useTypedSelector(selectActiveTabId);
    const result = useTypedSelector(selectResult);
    const isQueryRunning = Boolean(result?.isLoading);
    const queryParams = React.useMemo(() => parseQuery(location), [location]);
    const databaseParam = queryParams.database || queryParams.name;
    const database =
        typeof databaseParam === 'string' && databaseParam.trim() ? databaseParam : undefined;
    const hasDatabase = Boolean(database);

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
                if (isQueryRunning && activeTabId) {
                    queryExecutionManagerInstance.abortQuery(activeTabId);
                }
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
        [activeTabId, database, dispatch, history, isMultiTabEnabled, isQueryRunning, queryParams],
    );

    const openExternalQueryInEditorWithConfirmation = useChangeInputWithConfirmation(
        openExternalQueryInEditor,
        isMultiTabEnabled,
    );
    const latestOpenExternalQueryInEditorWithConfirmation = React.useRef(
        openExternalQueryInEditorWithConfirmation,
    );
    latestOpenExternalQueryInEditorWithConfirmation.current =
        openExternalQueryInEditorWithConfirmation;

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!hasDatabase) {
                return;
            }

            if (!isMultiTabEnabled && isQueryRunning) {
                getRunningQueryConfirmation().then((confirmed) => {
                    if (confirmed) {
                        latestOpenExternalQueryInEditorWithConfirmation.current(query);
                    }
                });
                return;
            }

            latestOpenExternalQueryInEditorWithConfirmation.current(query);
        },
        [hasDatabase, isMultiTabEnabled, isQueryRunning],
    );
}
