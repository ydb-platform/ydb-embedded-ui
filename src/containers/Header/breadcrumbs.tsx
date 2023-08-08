import {
    NodesRight as ClusterIcon,
    Database as DatabaseIcon,
    Cpu as ComputeNodeIcon,
    HardDrive as StorageNodeIcon,
} from '@gravity-ui/icons';

import type {
    BreadcrumbsOptions,
    ClusterBreadcrumbsOptions,
    NodeBreadcrumbsOptions,
    Page,
    TabletBreadcrumbsOptions,
    TabletsBreadcrumbsOptions,
    TenantBreadcrumbsOptions,
} from '../../store/reducers/header/types';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGE,
    TENANT_PAGES_IDS,
} from '../../store/reducers/tenant/constants';
import {TabletIcon} from '../../components/TabletIcon/TabletIcon';
import routes, {createHref} from '../../routes';
import {CLUSTER_DEFAULT_TITLE, getTabletLabel} from '../../utils/constants';

import {getClusterPath} from '../Cluster/utils';
import {TenantTabsGroups, getTenantPath} from '../Tenant/TenantPages';
import {getDefaultNodePath} from '../Node/NodePages';

const prepareTenantName = (tenantName: string) => {
    return tenantName.startsWith('/') ? tenantName.slice(1) : tenantName;
};

export interface RawBreadcrumbItem {
    text: string;
    link?: string;
    icon?: JSX.Element;
}

const getClusterBreadcrumbs = (
    options: ClusterBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {clusterName, clusterTab} = options;

    return [
        {
            text: clusterName || CLUSTER_DEFAULT_TITLE,
            link: getClusterPath(clusterTab, query),
            icon: <ClusterIcon />,
        },
    ];
};

const getTenantBreadcrumbs = (
    options: TenantBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {tenantName} = options;

    const text = tenantName ? prepareTenantName(tenantName) : 'Tenant';
    const link = tenantName ? getTenantPath({...query, name: tenantName}) : undefined;

    return [...getClusterBreadcrumbs(options, query), {text, link, icon: <DatabaseIcon />}];
};

const getNodeBreadcrumbs = (options: NodeBreadcrumbsOptions, query = {}): RawBreadcrumbItem[] => {
    const {tenantName, nodeId} = options;

    let breadcrumbs: RawBreadcrumbItem[];

    // Compute nodes have tenantName, storage nodes doesn't
    const isStorageNode = !tenantName;

    const newQuery = {
        ...query,
        [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
        [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
    };

    if (isStorageNode) {
        breadcrumbs = getClusterBreadcrumbs(options, query);
    } else {
        breadcrumbs = getTenantBreadcrumbs(options, newQuery);
    }

    const text = nodeId ? `Node ${nodeId}` : 'Node';
    const link = nodeId ? getDefaultNodePath(nodeId, query) : undefined;
    const icon = isStorageNode ? <StorageNodeIcon /> : <ComputeNodeIcon />;

    breadcrumbs.push({
        text,
        link,
        icon,
    });

    return breadcrumbs;
};

const getTabletsBreadcrubms = (
    options: TabletsBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {tenantName, nodeIds} = options;

    const newQuery = {
        ...query,
        [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
        [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.tablets,
    };

    let breadcrumbs: RawBreadcrumbItem[];

    // Cluster system tablets don't have tenantName
    if (tenantName) {
        breadcrumbs = getTenantBreadcrumbs(options, newQuery);
    } else {
        breadcrumbs = getClusterBreadcrumbs(options, query);
    }

    const link = createHref(routes.tabletsFilters, undefined, {
        ...query,
        nodeIds,
        path: tenantName,
    });

    breadcrumbs.push({text: 'Tablets', link});

    return breadcrumbs;
};

const getTabletBreadcrubms = (
    options: TabletBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {tabletId, tabletType} = options;

    const breadcrumbs = getTabletsBreadcrubms(options, query);

    breadcrumbs.push({
        text: tabletId || 'Tablet',
        icon: <TabletIcon text={getTabletLabel(tabletType)} />,
    });

    return breadcrumbs;
};

export const getBreadcrumbs = (
    page: Page,
    options: BreadcrumbsOptions,
    rawBreadcrumbs: RawBreadcrumbItem[] = [],
    query = {},
) => {
    switch (page) {
        case 'cluster': {
            return [...rawBreadcrumbs, ...getClusterBreadcrumbs(options, query)];
        }
        case 'tenant': {
            return [...rawBreadcrumbs, ...getTenantBreadcrumbs(options, query)];
        }
        case 'node': {
            return [...rawBreadcrumbs, ...getNodeBreadcrumbs(options, query)];
        }
        case 'tablets': {
            return [...rawBreadcrumbs, ...getTabletsBreadcrubms(options, query)];
        }
        case 'tablet': {
            return [...rawBreadcrumbs, ...getTabletBreadcrubms(options, query)];
        }
        default: {
            return rawBreadcrumbs;
        }
    }
};
