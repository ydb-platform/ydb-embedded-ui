import nodesRightIcon from '@gravity-ui/icons/svgs/nodes-right.svg';
import databaseIcon from '@gravity-ui/icons/svgs/database.svg';

import type {
    BreadcrumbsOptions,
    ClusterBreadcrumbsOptions,
    NodeBreadcrumbsOptions,
    Page,
    TabletBreadcrumbsOptions,
    TabletsBreadcrumbsOptions,
    TenantBreadcrumbsOptions,
} from '../../store/reducers/header/types';
import routes, {createHref} from '../../routes';

import {getClusterPath} from '../Cluster/utils';
import {getTenantPath} from '../Tenant/TenantPages';
import {getDefaultNodePath} from '../Node/NodePages';

const prepareTenantName = (tenantName: string) => {
    return tenantName.startsWith('/') ? tenantName.slice(1) : tenantName;
};

export interface RawBreadcrumbItem {
    text: string;
    link?: string;
    icon?: SVGIconData;
}

const getClusterBreadcrumbs = (
    options: ClusterBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {clusterName, clusterTab} = options;

    return [
        {
            text: clusterName || 'Cluster',
            link: getClusterPath(clusterTab, query),
            icon: nodesRightIcon,
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

    return [...getClusterBreadcrumbs(options, query), {text, link, icon: databaseIcon}];
};

const getNodeBreadcrumbs = (options: NodeBreadcrumbsOptions, query = {}): RawBreadcrumbItem[] => {
    const {tenantName, nodeId} = options;

    let breadcrumbs: RawBreadcrumbItem[];

    // Compute nodes have tenantName, storage nodes doesn't
    const isStorageNode = !tenantName;

    if (isStorageNode) {
        breadcrumbs = getClusterBreadcrumbs(options, query);
    } else {
        breadcrumbs = getTenantBreadcrumbs(options, query);
    }

    const text = nodeId ? `Node ${nodeId}` : 'Node';
    const link = nodeId ? getDefaultNodePath(nodeId, query) : undefined;

    breadcrumbs.push({text, link});

    return breadcrumbs;
};

const getTabletsBreadcrubms = (
    options: TabletsBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {tenantName, nodeIds, state, type} = options;

    let breadcrumbs: RawBreadcrumbItem[];

    // Cluster system tablets don't have tenantName
    if (tenantName) {
        breadcrumbs = getTenantBreadcrumbs(options, query);
    } else {
        breadcrumbs = getClusterBreadcrumbs(options, query);
    }

    const link = createHref(routes.tabletsFilters, undefined, {
        nodeIds,
        state,
        type,
        path: tenantName,
    });

    breadcrumbs.push({text: 'Tablets', link});

    return breadcrumbs;
};

const getTabletBreadcrubms = (
    options: TabletBreadcrumbsOptions,
    query = {},
): RawBreadcrumbItem[] => {
    const {tabletId} = options;

    const breadcrumbs = getTabletsBreadcrubms(options, query);

    breadcrumbs.push({
        text: tabletId || 'Tablet',
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
