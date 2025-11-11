import React from 'react';

import {Pulse, Terminal} from '@gravity-ui/icons';
import {useLocation, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes, {getTenantPath, parseQuery} from '../../../routes';
import {DEFAULT_USER_SETTINGS, SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../store/reducers/settings/useSetting';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../../store/reducers/tenant/types';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import i18n from '../i18n';

type TenantPages = keyof typeof TENANT_PAGES_IDS;

const pagesList: Array<TenantPages> = ['query', 'diagnostics'];

const mapPageToIcon = {
    query: Terminal,
    diagnostics: Pulse,
};

export function useTenantNavigation() {
    const location = useLocation();
    const queryParams = parseQuery(location);
    const match = useRouteMatch(routes.tenant);

    const {tenantPage, handleTenantPageChange} = useTenantPage();

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
                    handleTenantPageChange(pageId);
                },
            };

            return nextItem;
        });

        return items;
    }, [tenantPage, handleTenantPageChange, match, queryParams]);

    return menuItems;
}

export function useTenantPage() {
    const [{tenantPage}, setQueryParams] = useQueryParams({tenantPage: StringParam});

    const {value: initialTenantPage, saveValue: setInitialTenantPage} = useSetting<TenantPage>(
        SETTING_KEYS.TENANT_INITIAL_PAGE,
    );

    const handleTenantPageChange = React.useCallback(
        (value?: TenantPage) => {
            setInitialTenantPage(value);
            setQueryParams({tenantPage: value});
        },
        [setInitialTenantPage, setQueryParams],
    );

    React.useEffect(() => {
        try {
            tenantPageSchema.parse(tenantPage);
        } catch {
            const parsedInitialPage = tenantPageSchema
                .catch(DEFAULT_USER_SETTINGS[SETTING_KEYS.TENANT_INITIAL_PAGE] as TenantPage)
                .parse(initialTenantPage);
            handleTenantPageChange(parsedInitialPage);
        }
    }, [tenantPage, initialTenantPage, handleTenantPageChange]);

    return {tenantPage, handleTenantPageChange} as const;
}
