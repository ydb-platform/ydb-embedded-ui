import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {getLocationObjectFromHref, getTenantPath, parseQuery} from '../../../../routes';
import {useMultiTabQueryEditorEnabled} from '../../../../store/reducers/capabilities/hooks';
import {
    applyExternalQueryToActiveTab,
    setIsDirty,
    setQueryTabContent,
} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {useTypedDispatch} from '../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {TenantTabsGroups} from '../../TenantPages';

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
    const queryParams = React.useMemo(() => parseQuery(location), [location]);
    const hasDatabase =
        typeof queryParams.database === 'string' && Boolean(queryParams.database.trim());

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
        [dispatch, history, isMultiTabEnabled, queryParams],
    );

    const openExternalQueryInEditorWithConfirmation = useChangeInputWithConfirmation(
        openExternalQueryInEditor,
        isMultiTabEnabled,
    );

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!hasDatabase) {
                return undefined;
            }
            return openExternalQueryInEditorWithConfirmation(query);
        },
        [hasDatabase, openExternalQueryInEditorWithConfirmation],
    );
}
