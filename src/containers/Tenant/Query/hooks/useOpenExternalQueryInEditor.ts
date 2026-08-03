import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {getTenantPath, parseQuery} from '../../../../routes';
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

            const queryParams = parseQuery(location);
            const queryPath = getTenantPath({
                ...queryParams,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });
            history.push(queryPath);

            onAfterOpen?.();
        },
        [dispatch, history, isMultiTabEnabled, location],
    );

    return useChangeInputWithConfirmation(openExternalQueryInEditor, isMultiTabEnabled);
}
