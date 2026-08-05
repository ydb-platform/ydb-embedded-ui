import React from 'react';

import {useHistory, useLocation, useRouteMatch} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import routes, {createHref, getLocationObjectFromHref, parseQuery} from '../../../../routes';
import {environment as configuredEnvironment} from '../../../../store';
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
import {TenantTabsGroups} from '../../TenantPages';

import {
    getDatabaseFromQueryParams,
    useExternalQuerySingleTabProtection,
} from './useExternalQuerySingleTabProtection';

const ROUTE_PATHS = Object.values(routes);

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
    const currentRouteMatch = useRouteMatch<{environment?: string}>({
        path: ROUTE_PATHS,
        exact: true,
    });
    const routeEnvironment = currentRouteMatch?.params.environment ?? configuredEnvironment;
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const queryParams = React.useMemo(() => parseQuery(location), [location]);
    const database = getDatabaseFromQueryParams(queryParams);

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
    const openExternalQueryWithSingleTabProtection = useExternalQuerySingleTabProtection({
        database: database ?? '',
        history,
        isMultiTabEnabled,
        openExternalQueryInEditor,
    });

    return React.useCallback(
        (query: ExternalQueryToOpen) => {
            if (!database) {
                return;
            }

            if (isMultiTabEnabled) {
                openExternalQueryInEditor(query);
            } else {
                openExternalQueryWithSingleTabProtection(query);
            }
        },
        [
            database,
            isMultiTabEnabled,
            openExternalQueryInEditor,
            openExternalQueryWithSingleTabProtection,
        ],
    );
}
