import routes, {createHref} from '../../routes';
import {TENANT_SUMMARY_TABS_IDS} from '../../store/reducers/tenant/constants';

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

export const getTenantPath = (query = {}) => {
    return createHref(routes.tenant, undefined, query);
};
