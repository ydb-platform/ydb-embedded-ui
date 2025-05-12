import React from 'react';

import {Button, Icon, Text} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {changeUserInput, setIsDirty} from '../../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import type {KeyValueRow} from '../../../../../types/api/query';
import {cn} from '../../../../../utils/cn';
import {useTypedDispatch} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import i18n from '../i18n';
import {createQueryInfoItems} from '../utils';

import {QueryDetails} from './QueryDetails';

import CryCatIcon from '../../../../../assets/icons/cry-cat.svg';

const b = cn('kv-top-queries');

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

    return (
        <div className={b('not-found-container')}>
            <Icon data={CryCatIcon} size={100} />
            <Text variant="subheader-2" className={b('not-found-title')}>
                {i18n('query-details.not-found.title')}
            </Text>
            <Text variant="body-1" color="complementary" className={b('not-found-description')}>
                {i18n('query-details.not-found.description')}
            </Text>
            <Button size="m" view="normal" className={b('not-found-close')} onClick={onClose}>
                {i18n('query-details.close')}
            </Button>
        </div>
    );
};
