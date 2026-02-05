import React from 'react';

import {Code, Database, FolderTree, Pulse, Terminal} from '@gravity-ui/icons';
import {useLocation, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes, {getTenantPath, parseQuery} from '../../../routes';
import {DEFAULT_USER_SETTINGS, SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../../store/reducers/tenant/types';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import {TENANT_NAVIGATION_V2_FLAG} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
import {isLocalStorageFlagEnabled} from '../../../utils/index';
import i18n from '../i18n';

type TenantPages = keyof typeof TENANT_PAGES_IDS;

const pagesList: Array<TenantPages> = ['query', 'diagnostics'];
const pagesListV2: Array<TenantPages> = ['diagnostics', 'schema', 'query'];

const mapPageToIcon = {
    query: Terminal,
    diagnostics: Pulse,
};

const mapPageToIcon2 = {
    diagnostics: Database,
    schema: FolderTree,
    query: Code,
};

export function useTenantNavigation() {
    const location = useLocation();
    const queryParams = parseQuery(location);
    const match = useRouteMatch(routes.tenant);
    const isV2Enabled = isLocalStorageFlagEnabled(TENANT_NAVIGATION_V2_FLAG);

    const {tenantPage, handleTenantPageChange} = useTenantPage();

    const menuItems = React.useMemo(() => {
        if (!match) {
            return [];
        }

        const pages = isV2Enabled ? pagesListV2 : pagesList;

        const items = pages.map((key) => {
            const pageId = TENANT_PAGES_IDS[key];
            const pagePath = getTenantPath({...queryParams, [TENANT_PAGE]: pageId});
            const icon = isV2Enabled
                ? mapPageToIcon2[key as keyof typeof mapPageToIcon2]
                : mapPageToIcon[key as keyof typeof mapPageToIcon];

            const nextItem = {
                id: pageId,
                title: i18n(`pages.${key}`),
                icon,
                path: pagePath,
                current: tenantPage === pageId,
                onForward: () => {
                    handleTenantPageChange(pageId);
                },
            };

            return nextItem;
        });

        return items;
    }, [tenantPage, handleTenantPageChange, match, queryParams, isV2Enabled]);

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
            setInitialTenantPage(value);
        },
        [setQueryParams, setInitialTenantPage],
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
            tenantPageSchema.parse(tenantPageFromQuery);
        } catch {
            // Invalid value in URL - replace with valid fallback
            setQueryParams({tenantPage: parsedInitialPage}, 'replaceIn');
        }
    }, [parsedInitialPage, setQueryParams, tenantPageFromQuery]);

    return {tenantPage, handleTenantPageChange} as const;
}
