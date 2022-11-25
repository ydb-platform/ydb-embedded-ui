//@ts-ignore
import Icon from '../../components/Icon/Icon';

export enum TenantGeneralTabsIds {
    query = 'query',
    diagnostics = 'diagnostics',
}
export enum TenantInfoTabsIds {
    overview = 'overview',
    acl = 'acl',
    schema = 'schema',
}

export enum TenantTabsGroups {
    info = 'info',
    general = 'general',
    generalTab = 'generalTab',
}

export const TENANT_GENERAL_TABS = [
    {
        id: TenantGeneralTabsIds.query,
        title: 'Query',
        icon: <Icon name="query" viewBox="0 0 16 16" />,
    },
    {
        id: TenantGeneralTabsIds.diagnostics,
        title: 'Diagnostics',
        icon: <Icon name="diagnostics" viewBox="0 0 17 16" />,
    },
];
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
