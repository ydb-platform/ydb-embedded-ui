import React from 'react';

import {useHistory, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {changeUserInput, setIsDirty} from '../../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import type {KeyValueRow} from '../../../../../types/api/query';
import {useTypedDispatch} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {createQueryInfoItems} from '../utils';

import {NotFoundContainer} from './NotFoundContainer';
import {QueryDetails} from './QueryDetails';

interface QueryDetailsDrawerContentProps {
    row: KeyValueRow | null;
    onClose: () => void;
}

export const QueryDetailsDrawerContent = ({row, onClose}: QueryDetailsDrawerContentProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const handleOpenInEditor = React.useCallback(() => {
        if (row) {
            const input = row.QueryText as string;
            dispatch(changeUserInput({input}));
            dispatch(setIsDirty(false));

            const queryParams = parseQuery(location);

            const queryPath = getTenantPath({
                ...queryParams,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });

            history.push(queryPath);
        }
    }, [dispatch, history, location, row]);

    if (row) {
        return (
            <QueryDetails
                queryText={row.QueryText as string}
                infoItems={createQueryInfoItems(row)}
                onOpenInEditor={handleOpenInEditor}
            />
        );
    }

    return <NotFoundContainer onClose={onClose} />;
};
