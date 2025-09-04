import {
    NodesRight as ClusterIcon,
    Cpu as ComputeNodeIcon,
    Database as DatabaseIcon,
    HardDrive as StorageNodeIcon,
} from '@gravity-ui/icons';

import {TabletIcon} from '../../components/TabletIcon/TabletIcon';
import routes, {getPDiskPagePath, getStorageGroupPath} from '../../routes';
import type {
    BreadcrumbsOptions,
    ClusterBreadcrumbsOptions,
    ClustersBreadcrumbsOptions,
    NodeBreadcrumbsOptions,
    PDiskBreadcrumbsOptions,
    Page,
    StorageGroupBreadcrumbsOptions,
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
import {getDefaultNodePath} from '../Node/NodePages';
import {TenantTabsGroups, getTenantPath} from '../Tenant/TenantPages';

import {headerKeyset} from './i18n';

export interface RawBreadcrumbItem {
    text: string;
    link?: string;
    icon?: JSX.Element;
}

interface GetBreadcrumbs<T, U = AnyRecord> {
    (
        options: T & {singleClusterMode: boolean; isViewerUser?: boolean},
        query?: U,
    ): RawBreadcrumbItem[];
}

const getQueryForTenant = (type: 'nodes' | 'tablets') => ({
    [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS[type],
});

const getClustersBreadcrumbs: GetBreadcrumbs<ClustersBreadcrumbsOptions> = (options) => {
    if (!options.isViewerUser) {
        return [];
    }
    return [
        {
            text: headerKeyset('breadcrumbs.clusters'),
            link: routes.clusters,
        },
    ];
};

const getClusterBreadcrumbs: GetBreadcrumbs<ClusterBreadcrumbsOptions> = (options, query = {}) => {
    const {clusterName, clusterTab, singleClusterMode, isViewerUser} = options;

    if (!isViewerUser) {
        return [];
    }

    let breadcrumbs: RawBreadcrumbItem[] = [];

    if (!singleClusterMode) {
        breadcrumbs = getClustersBreadcrumbs(options, query);
    }

    breadcrumbs.push({
        text: clusterName || CLUSTER_DEFAULT_TITLE,
        link: getClusterPath(clusterTab, query),
        icon: <ClusterIcon />,
    });

    return breadcrumbs;
};

const getTenantBreadcrumbs: GetBreadcrumbs<TenantBreadcrumbsOptions> = (options, query = {}) => {
    const {tenantName, database} = options;

    const breadcrumbs = getClusterBreadcrumbs(options, query);

    const text = tenantName || headerKeyset('breadcrumbs.tenant');
    const link = tenantName ? getTenantPath({...query, database}) : undefined;

    const lastItem = {text, link, icon: <DatabaseIcon />};
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getNodeBreadcrumbs: GetBreadcrumbs<NodeBreadcrumbsOptions> = (options, query = {}) => {
    const {nodeId, nodeRole, nodeActiveTab, tenantName} = options;

    const tenantQuery = getQueryForTenant(nodeActiveTab === 'tablets' ? 'tablets' : 'nodes');

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
            ? getDefaultNodePath(nodeId, {database: tenantName, ...query}, nodeActiveTab)
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
    if (!options.isViewerUser) {
        return [];
    }
    const {nodeId, pDiskId, nodeRole} = options;

    const breadcrumbs = getNodeBreadcrumbs({
        ...options,
        nodeRole: nodeRole ?? 'Storage',
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

const getStorageGroupBreadcrumbs: GetBreadcrumbs<StorageGroupBreadcrumbsOptions> = (
    options,
    query = {},
) => {
    const {groupId, tenantName} = options;

    const breadcrumbs = tenantName
        ? getTenantBreadcrumbs(options, query)
        : getClusterBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.storageGroup');
    if (groupId) {
        text += ` ${groupId}`;
    }

    const lastItem = {
        text,
        link: groupId ? getStorageGroupPath(groupId, {database: tenantName}) : undefined,
    };
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getVDiskBreadcrumbs: GetBreadcrumbs<VDiskBreadcrumbsOptions> = (options, query = {}) => {
    const {vDiskId} = options;

    const breadcrumbs = getStorageGroupBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.vDisk');
    if (vDiskId) {
        text += ` ${vDiskId}`;
    }

    const lastItem = {
        text,
    };
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getTabletBreadcrumbs: GetBreadcrumbs<TabletBreadcrumbsOptions> = (options, query = {}) => {
    const {tabletId, tabletType, tenantName} = options;

    const breadcrumbs = tenantName
        ? getTenantBreadcrumbs(options, query)
        : getClusterBreadcrumbs(options, query);

    const lastItem = {
        text: tabletId || headerKeyset('breadcrumbs.tablet'),
        icon: <TabletIcon text={getTabletLabel(tabletType)} />,
    };

    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const mapPageToGetter = {
    clusters: getClustersBreadcrumbs,
    cluster: getClusterBreadcrumbs,
    node: getNodeBreadcrumbs,
    pDisk: getPDiskBreadcrumbs,
    tablet: getTabletBreadcrumbs,
    tenant: getTenantBreadcrumbs,
    vDisk: getVDiskBreadcrumbs,
    storageGroup: getStorageGroupBreadcrumbs,
} as const;

export const getBreadcrumbs = (
    page: Page,
    options: BreadcrumbsOptions & {singleClusterMode: boolean; isViewerUser?: boolean},
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
