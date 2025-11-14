import React from 'react';

import {Pulse, Terminal} from '@gravity-ui/icons';
import {useHistory, useLocation, useRouteMatch} from 'react-router-dom';

import routes, {getTenantPath, parseQuery} from '../../../routes';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import i18n from '../i18n';

type TenantPages = keyof typeof TENANT_PAGES_IDS;

const pagesList: Array<TenantPages> = ['query', 'diagnostics'];

const mapPageToIcon = {
    query: Terminal,
    diagnostics: Pulse,
};

export function useTenantNavigation() {
    const history = useHistory();

    const location = useLocation();
    const queryParams = parseQuery(location);
    const match = useRouteMatch(routes.tenant);

    const [, setInitialTenantPage] = useSetting<string>(SETTING_KEYS.TENANT_INITIAL_PAGE);
    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const menuItems = React.useMemo(() => {
        if (!match) {
            return [];
        }

        const items = pagesList.map((key) => {
            const pageId = TENANT_PAGES_IDS[key];
            const pagePath = getTenantPath({...queryParams, [TENANT_PAGE]: pageId});

            const nextItem = {
                id: pageId,
                title: i18n(`pages.${key}`),
                icon: mapPageToIcon[key],
                path: pagePath,
                current: tenantPage === pageId,
                onForward: () => {
                    setInitialTenantPage(pageId);
                    history.push(pagePath);
                },
            };

            return nextItem;
        });

        return items;
    }, [tenantPage, setInitialTenantPage, match, history, queryParams]);

    return menuItems;
}
