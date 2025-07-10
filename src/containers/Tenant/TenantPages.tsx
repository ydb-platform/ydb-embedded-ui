import type {CreateHrefOptions} from '../../routes';
import routes, {createHref} from '../../routes';
import {TENANT_SUMMARY_TABS_IDS} from '../../store/reducers/tenant/constants';
import type {paramSetup} from '../../store/state-url-mapping';
import type {ExtractType} from '../../types/common';

type TenantQueryParams = {
    [K in keyof (typeof paramSetup)['/tenant']]?: ExtractType<(typeof paramSetup)['/tenant'][K]>;
};

type AdditionalQueryParams = {
    database?: string;
    name?: string;
    backend?: string;
    selectedPartition?: string;
    activeOffset?: string;
    metricsTab?: string;
    showPreview?: boolean;
    queryMode?: string;
};

export type TenantQuery = TenantQueryParams | AdditionalQueryParams;

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

export const getTenantPath = (query: TenantQuery, options?: CreateHrefOptions) => {
    return createHref(routes.tenant, undefined, query, options);
};
