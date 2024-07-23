import routes, {createHref} from '../../routes';
import {TENANT_SUMMARY_TABS_IDS} from '../../store/reducers/tenant/constants';
import type {paramSetup} from '../../store/state-url-mapping';
import type {ExtractType} from '../../types/common';

type TenantQueryParams = {
    [K in keyof (typeof paramSetup)['/tenant']]?: ExtractType<(typeof paramSetup)['/tenant'][K]>;
};

type AdditionalQueryParams = {
    name?: string;
    backend?: string;
};

type TenantQuery = TenantQueryParams | AdditionalQueryParams;

export const TenantTabsGroups = {
    summaryTab: 'summaryTab',
    queryTab: 'queryTab',
    diagnosticsTab: 'diagnosticsTab',
    metricsTab: 'metricsTab',
} as const;

export const TENANT_INFO_TABS = [
    {
        id: TENANT_SUMMARY_TABS_IDS.overview,
        title: 'Overview',
    },
    {
        id: TENANT_SUMMARY_TABS_IDS.acl,
        title: 'ACL',
    },
];

export const TENANT_SCHEMA_TAB = [
    {
        id: TENANT_SUMMARY_TABS_IDS.schema,
        title: 'Schema',
    },
];

export const getTenantPath = (query: TenantQuery) => {
    return createHref(routes.tenant, undefined, query);
};
