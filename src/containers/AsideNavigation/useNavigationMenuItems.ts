import React from 'react';

import type {MenuItem as AsideHeaderMenuItem} from '@gravity-ui/navigation';
import type {IconData} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router';

import routes, {parseQuery} from '../../routes';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import {TENANT_INITIAL_PAGE_KEY} from '../../utils/constants';
import {useSetting, useTypedSelector} from '../../utils/hooks';
import {getTenantPath} from '../Tenant/TenantPages';

import i18n from './i18n';

import pulseIcon from '@gravity-ui/icons/svgs/pulse.svg';
import terminalIcon from '@gravity-ui/icons/svgs/terminal.svg';

interface MenuItem {
    id: string;
    title: string;
    icon: IconData;
    iconSize: string | number;
    location: string;
    locationKeys?: string[];
}

export function useNavigationMenuItems() {
    const location = useLocation();
    const history = useHistory();

    const [initialTenantPage, setInitialTenantPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);
    const {tenantPage = initialTenantPage} = useTypedSelector((state) => state.tenant);

    const {pathname} = location;
    const queryParams = parseQuery(location);

    const isTenantPage = pathname === routes.tenant;

    const menuItems: AsideHeaderMenuItem[] = React.useMemo(() => {
        if (!isTenantPage) {
            return [];
        }

        const items: MenuItem[] = [
            {
                id: TENANT_PAGES_IDS.query,
                title: i18n('pages.query'),
                icon: terminalIcon,
                iconSize: 20,
                location: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                }),
            },
            {
                id: TENANT_PAGES_IDS.diagnostics,
                title: i18n('pages.diagnostics'),
                icon: pulseIcon,
                iconSize: 20,
                location: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
                }),
            },
        ];

        return items.map((item) => {
            const current = item.id === tenantPage;

            return {
                id: item.id,
                title: item.title,
                icon: item.icon,
                iconSize: item.iconSize,
                current,
                onItemClick: () => {
                    setInitialTenantPage(item.id);
                    history.push(item.location);
                },
            };
        });
    }, [tenantPage, isTenantPage, setInitialTenantPage, history, queryParams]);

    return menuItems;
}
