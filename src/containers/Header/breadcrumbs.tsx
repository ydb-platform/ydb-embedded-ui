import {
    NodesRight as ClusterIcon,
    Cpu as ComputeNodeIcon,
    Database as DatabaseIcon,
    HardDrive as StorageNodeIcon,
} from '@gravity-ui/icons';

import {TabletIcon} from '../../components/TabletIcon/TabletIcon';
import {getPDiskPagePath} from '../../routes';
import type {
    BreadcrumbsOptions,
    ClusterBreadcrumbsOptions,
    NodeBreadcrumbsOptions,
    PDiskBreadcrumbsOptions,
    Page,
    TabletBreadcrumbsOptions,
    TenantBreadcrumbsOptions,
    VDiskBreadcrumbsOptions,
} from '../../store/reducers/header/types';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGE,
    TENANT_PAGES_IDS,
} from '../../store/reducers/tenant/constants';
import {CLUSTER_DEFAULT_TITLE, getTabletLabel} from '../../utils/constants';
import {getClusterPath} from '../Cluster/utils';
import {TABLETS, getDefaultNodePath} from '../Node/NodePages';
import {TenantTabsGroups, getTenantPath} from '../Tenant/TenantPages';

import {headerKeyset} from './i18n';

const prepareTenantName = (tenantName: string) => {
    return tenantName.startsWith('/') ? tenantName.slice(1) : tenantName;
};

export interface RawBreadcrumbItem {
    text: string;
    link?: string;
    icon?: JSX.Element;
}

interface GetBreadcrumbs<T, U = AnyRecord> {
    (options: T, query?: U): RawBreadcrumbItem[];
}

const getQueryForTenant = (type: 'nodes' | 'tablets') => ({
    [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS[type],
});

const getClusterBreadcrumbs: GetBreadcrumbs<ClusterBreadcrumbsOptions> = (options, query = {}) => {
    const {clusterName, clusterTab} = options;

    return [
        {
            text: clusterName || CLUSTER_DEFAULT_TITLE,
            link: getClusterPath(clusterTab, query),
            icon: <ClusterIcon />,
        },
    ];
};

const getTenantBreadcrumbs: GetBreadcrumbs<TenantBreadcrumbsOptions> = (options, query = {}) => {
    const {tenantName} = options;

    const breadcrumbs = getClusterBreadcrumbs(options, query);

    const text = tenantName ? prepareTenantName(tenantName) : headerKeyset('breadcrumbs.tenant');
    const link = tenantName ? getTenantPath({...query, name: tenantName}) : undefined;

    const lastItem = {text, link, icon: <DatabaseIcon />};
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getNodeBreadcrumbs: GetBreadcrumbs<NodeBreadcrumbsOptions> = (options, query = {}) => {
    const {nodeId, nodeRole, nodeActiveTab, tenantName} = options;

    const tenantQuery = getQueryForTenant(nodeActiveTab === TABLETS ? 'tablets' : 'nodes');

    const breadcrumbs = tenantName
        ? getTenantBreadcrumbs(options, {...query, ...tenantQuery})
        : getClusterBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.node');
    if (nodeId) {
        text += ` ${nodeId}`;
    }

    const lastItem = {
        text,
        link: nodeId
            ? getDefaultNodePath(nodeId, {tenantName, ...query}, nodeActiveTab)
            : undefined,
        icon: getNodeIcon(nodeRole),
    };

    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

function getNodeIcon(nodeRole: 'Storage' | 'Compute' | undefined) {
    switch (nodeRole) {
        case 'Storage':
            return <StorageNodeIcon />;
        case 'Compute':
            return <ComputeNodeIcon />;
        default:
            return undefined;
    }
}

const getPDiskBreadcrumbs: GetBreadcrumbs<PDiskBreadcrumbsOptions> = (options, query = {}) => {
    const {nodeId, pDiskId, nodeRole, nodeActiveTab} = options;

    const breadcrumbs = getNodeBreadcrumbs({
        nodeId,
        nodeRole: nodeRole ?? 'Storage',
        nodeActiveTab,
    });

    let text = headerKeyset('breadcrumbs.pDisk');
    if (pDiskId) {
        text += ` ${pDiskId}`;
    }

    const hasLink = pDiskId && nodeId;
    const link = hasLink ? getPDiskPagePath(pDiskId, nodeId, query) : undefined;

    const lastItem = {
        text,
        link,
    };
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getVDiskBreadcrumbs: GetBreadcrumbs<VDiskBreadcrumbsOptions> = (options, query = {}) => {
    const {vDiskSlotId} = options;

    const breadcrumbs = getPDiskBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.vDisk');
    if (vDiskSlotId) {
        text += ` ${vDiskSlotId}`;
    }

    const lastItem = {
        text,
    };
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getTabletBreadcrumbs: GetBreadcrumbs<TabletBreadcrumbsOptions> = (options, query = {}) => {
    const {tabletId, tabletType, nodeId, nodeRole, nodeActiveTab = TABLETS, tenantName} = options;

    const breadcrumbs = getNodeBreadcrumbs({nodeId, nodeRole, nodeActiveTab, tenantName}, query);

    const lastItem = {
        text: tabletId || headerKeyset('breadcrumbs.tablet'),
        icon: <TabletIcon text={getTabletLabel(tabletType)} />,
    };

    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const mapPageToGetter = {
    cluster: getClusterBreadcrumbs,
    node: getNodeBreadcrumbs,
    pDisk: getPDiskBreadcrumbs,
    tablet: getTabletBreadcrumbs,
    tenant: getTenantBreadcrumbs,
    vDisk: getVDiskBreadcrumbs,
} as const;

export const getBreadcrumbs = (
    page: Page,
    options: BreadcrumbsOptions,
    rawBreadcrumbs: RawBreadcrumbItem[] = [],
    query = {},
) => {
    if (!page) {
        return rawBreadcrumbs;
    }

    const getter = mapPageToGetter[page];

    const pageBreadcrumbs = getter(options, query);

    return [...rawBreadcrumbs, ...pageBreadcrumbs];
};
