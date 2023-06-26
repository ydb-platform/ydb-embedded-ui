import routes, {createHref} from '../../routes';

export enum TenantInfoTabsIds {
    overview = 'overview',
    acl = 'acl',
    schema = 'schema',
}

export enum TenantTabsGroups {
    info = 'info',
    queryTab = 'queryTab',
    diagnosticsTab = 'diagnosticsTab',
}

export const TENANT_INFO_TABS = [
    {
        id: TenantInfoTabsIds.overview,
        title: 'Overview',
    },
    {
        id: TenantInfoTabsIds.acl,
        title: 'ACL',
    },
];

export const TENANT_SCHEMA_TAB = [
    {
        id: TenantInfoTabsIds.schema,
        title: 'Schema',
    },
];

export const getTenantPath = (query = {}) => {
    return createHref(routes.tenant, undefined, query);
};
