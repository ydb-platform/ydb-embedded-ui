import React from 'react';

import {Pulse, Terminal} from '@gravity-ui/icons';
import {useHistory, useLocation} from 'react-router';

import routes, {parseQuery} from '../../routes';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import {TENANT_INITIAL_PAGE_KEY} from '../../utils/constants';
import {useSetting, useTypedSelector} from '../../utils/hooks';
import {getTenantPath} from '../Tenant/TenantPages';

import i18n from './i18n';

type IconComponent = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

interface MenuItem {
    id: string;
    title: string;
    icon: IconComponent;
    iconSize: string | number;
    path: string;
    current?: boolean;
    locationKeys?: string[];
}

export function useNavigationMenuItems() {
    const location = useLocation();
    const history = useHistory();

    const [, setInitialTenantPage] = useSetting<string>(TENANT_INITIAL_PAGE_KEY);
    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const {pathname} = location;
    const queryParams = parseQuery(location);

    const isTenantPage = pathname === routes.tenant;

    const menuItems = React.useMemo(() => {
        if (!isTenantPage) {
            return [];
        }

        const items: MenuItem[] = [
            {
                id: TENANT_PAGES_IDS.query,
                title: i18n('pages.query'),
                icon: Terminal,
                iconSize: 20,
                path: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                }),
            },
            {
                id: TENANT_PAGES_IDS.diagnostics,
                title: i18n('pages.diagnostics'),
                icon: Pulse,
                iconSize: 20,
                path: getTenantPath({
                    ...queryParams,
                    [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
                }),
            },
        ];

        return items.map(({path, ...item}) => ({
            ...item,
            iconSize: 20,
            current: item.id === tenantPage,
            onItemClick: () => {
                setInitialTenantPage(item.id);
                history.push(path);
            },
        }));
    }, [tenantPage, isTenantPage, setInitialTenantPage, history, queryParams]);

    return menuItems;
}
