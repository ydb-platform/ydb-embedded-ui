import {Icon} from '../../components/Icon';
import {TENANT_GENERAL_TABS_IDS} from '../../store/reducers/tenant/constants';

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
        id: TENANT_GENERAL_TABS_IDS.query,
        title: 'Query',
        icon: <Icon name="query" viewBox="0 0 16 16" />,
    },
    {
        id: TENANT_GENERAL_TABS_IDS.diagnostics,
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
