import React from 'react';

import {CircleTree, Code, Database, Pulse, Terminal} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {useLocation, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes, {getTenantPath, parseQuery} from '../../../routes';
import {DEFAULT_USER_SETTINGS, SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {TENANT_PAGE, TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../../store/reducers/tenant/types';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import {useSetting} from '../../../utils/hooks';
import i18n from '../i18n';
import {useNavigationV2Enabled} from '../utils/useNavigationV2Enabled';

const pagesList: Array<TenantPage> = ['query', 'diagnostics'];
const pagesListV2: Array<TenantPage> = ['database', 'diagnostics', 'query'];

const mapPageToIcon: Partial<Record<TenantPage, IconData>> = {
    query: Terminal,
    diagnostics: Pulse,
};

const mapPageToTitle: Partial<Record<TenantPage, string>> = {
    get query() {
        return i18n('pages.query');
    },
    get diagnostics() {
        return i18n('pages.diagnostics');
    },
};

const mapPageToIcon2: Record<TenantPage, IconData> = {
    database: Database,
    diagnostics: CircleTree,
    query: Code,
};

const mapPageToTitle2: Record<TenantPage, string> = {
    get database() {
        return i18n('pages.database');
    },
    get diagnostics() {
        return i18n('pages.diagnostics');
    },
    get query() {
        return i18n('pages.editor');
    },
};

interface TenantNavigationItem {
    id: string;
    title?: string;
    icon?: IconData;
    path: string;
    current: boolean;
    onForward: () => void;
}

export function useTenantNavigation(): TenantNavigationItem[] {
    const location = useLocation();
    const queryParams = parseQuery(location);
    const match = useRouteMatch(routes.tenant);
    const isV2Enabled = useNavigationV2Enabled();

    const {tenantPage, handleTenantPageChange} = useTenantPage();

    const menuItems = React.useMemo<TenantNavigationItem[]>(() => {
        if (!match) {
            return [];
        }

        const pages = isV2Enabled ? pagesListV2 : pagesList;

        const items = pages.map((key) => {
            const pageId = TENANT_PAGES_IDS[key];
            const pagePath = getTenantPath({...queryParams, [TENANT_PAGE]: pageId});
            const icon = isV2Enabled ? mapPageToIcon2[key] : mapPageToIcon[key];
            const title = isV2Enabled ? mapPageToTitle2[key] : mapPageToTitle[key];

            const nextItem = {
                id: pageId,
                title,
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
