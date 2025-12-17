import React from 'react';

import {Pulse, Terminal} from '@gravity-ui/icons';
import {useLocation, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes, {getTenantPath, parseQuery} from '../../../routes';
import {DEFAULT_USER_SETTINGS, SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../../store/reducers/tenant/types';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import {useSetting} from '../../../utils/hooks';
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
    const [{tenantPage: tenantPageFromQuery}, setQueryParams] = useQueryParams({
        tenantPage: StringParam,
    });

    const [initialTenantPage, setInitialTenantPage] = useSetting<TenantPage | undefined>(
        SETTING_KEYS.TENANT_INITIAL_PAGE,
    );

    const handleTenantPageChange = React.useCallback(
        (value?: TenantPage) => {
            setQueryParams({tenantPage: value});
        },
        [setQueryParams],
    );

    const parsedInitialPage = React.useMemo(
        () =>
            tenantPageSchema
                .catch(DEFAULT_USER_SETTINGS[SETTING_KEYS.TENANT_INITIAL_PAGE])
                .parse(initialTenantPage),
        [initialTenantPage],
    );

    const tenantPage = React.useMemo(
        () => tenantPageSchema.catch(parsedInitialPage).parse(tenantPageFromQuery),
        [tenantPageFromQuery, parsedInitialPage],
    );

    React.useEffect(() => {
        try {
            const parsedQueryPage = tenantPageSchema.parse(tenantPageFromQuery);

            setInitialTenantPage(parsedQueryPage);
        } catch {
            // If query page is not valid, remove it from query
            setQueryParams({tenantPage: undefined}, 'replaceIn');
        }
    }, [tenantPageFromQuery, setQueryParams, setInitialTenantPage]);

    React.useEffect(() => {
        if (!tenantPageFromQuery) {
            setQueryParams({tenantPage: parsedInitialPage});
        }
    }, [parsedInitialPage, tenantPageFromQuery, setQueryParams]);

    return {tenantPage, handleTenantPageChange} as const;
}
