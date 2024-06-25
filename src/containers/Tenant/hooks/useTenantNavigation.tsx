import React from 'react';

import {Pulse, Terminal} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router';

import routes, {parseQuery} from '../../../routes';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {TENANT_INITIAL_PAGE_KEY} from '../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import {getTenantPath} from '../TenantPages';
import i18n from '../i18n';

type TenantPages = keyof typeof TENANT_PAGES_IDS;

const pagesList: Array<TenantPages> = ['query', 'diagnostics'];

const mapPageToIcon: Record<TenantPages, IconData> = {
    query: Terminal,
    diagnostics: Pulse,
};

export function useTenantNavigation() {
    const history = useHistory();

    const location = useLocation();
    const queryParams = parseQuery(location);

    const [, setInitialTenantPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);
    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const menuItems = React.useMemo(() => {
        if (location.pathname !== routes.tenant) {
            return [];
        }

        const items = pagesList.map((key) => {
            const pageId = TENANT_PAGES_IDS[key];
            const pagePath = getTenantPath({...queryParams, [TENANT_PAGE]: pageId});

            const nextItem = {
                id: pageId,
                title: i18n(`pages.${key}`),
                icon: <Icon data={mapPageToIcon[key]} size={20} />,
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
    }, [tenantPage, setInitialTenantPage, location.pathname, history, queryParams]);

    return menuItems;
}
