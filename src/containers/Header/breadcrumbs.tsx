import {
    NodesRight as ClusterIcon,
    Cpu as ComputeNodeIcon,
    Database as DatabaseIcon,
    House,
    HardDrive as StorageNodeIcon,
} from '@gravity-ui/icons';
import {isNil} from 'lodash';

import {TabletIcon} from '../../components/TabletIcon/TabletIcon';
import {
    getClusterPath,
    getClustersPath,
    getDatabasesPath,
    getDefaultNodePath,
    getPDiskPagePath,
    getStorageGroupPath,
    getTenantPath,
} from '../../routes';
import type {
    BreadcrumbsOptions,
    ClusterBreadcrumbsOptions,
    HomePageBreadcrumbsOptions,
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
import {CLUSTER_DEFAULT_TITLE, UNBREAKABLE_GAP, getTabletLabel} from '../../utils/constants';
import {TenantTabsGroups} from '../Tenant/TenantPages';

import {headerKeyset} from './i18n';

export interface RawBreadcrumbItem {
    text?: string;
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

const getHomePageBreadcrumbs: GetBreadcrumbs<HomePageBreadcrumbsOptions> = (options) => {
    const {isViewerUser, homePageTab, databasesPageEnvironment, databasesPageAvailable} = options;

    // Reset backend and clusterName - we do not need them on home page
    const clustersPath = getClustersPath({backend: '', clusterName: ''});
    const databasesPath = getDatabasesPath({
        env: databasesPageEnvironment,
        backend: '',
        clusterName: '',
    });

    const clustersTitle = headerKeyset('breadcrumbs.clusters');
    const databasesTitle = headerKeyset('breadcrumbs.databases');

    const icon = <House />;

    // 1. Database user
    // 1.1. Databases available - return databases with title
    // 1.2. No databases page - no home page in breadcrumbs at all
    // 2. There is databases page - return saved page with icon
    // 3. No databases page - return clusters page with title
    if (!isViewerUser) {
        if (databasesPageAvailable) {
            return [{text: databasesTitle, link: databasesPath}];
        } else {
            return [];
        }
    }
    if (databasesPageAvailable) {
        if (homePageTab === 'clusters') {
            // icon is not rendered properly without text
            // Add UNBREAKABLE_GAP as workaround for proper icon placement
            return [{text: UNBREAKABLE_GAP, link: clustersPath, icon}];
        } else {
            return [{text: UNBREAKABLE_GAP, link: databasesPath, icon}];
        }
    } else {
        return [{text: clustersTitle, link: clustersPath}];
    }
};

const getClusterBreadcrumbs: GetBreadcrumbs<ClusterBreadcrumbsOptions> = (options, query = {}) => {
    const {clusterName, clusterTab, singleClusterMode, isViewerUser, environment} = options;

    if (!isViewerUser) {
        if (singleClusterMode) {
            return [];
        } else {
            return getHomePageBreadcrumbs(options, query);
        }
    }

    let breadcrumbs: RawBreadcrumbItem[] = [];

    if (!singleClusterMode) {
        breadcrumbs = getHomePageBreadcrumbs(options, query);
    }

    breadcrumbs.push({
        text: clusterName || CLUSTER_DEFAULT_TITLE,
        link: getClusterPath({activeTab: clusterTab, environment}, query),
        icon: <ClusterIcon />,
    });

    return breadcrumbs;
};

const getTenantBreadcrumbs: GetBreadcrumbs<TenantBreadcrumbsOptions> = (options, query = {}) => {
    const {databaseName, database} = options;

    const breadcrumbs = getClusterBreadcrumbs(options, query);

    const text = databaseName || headerKeyset('breadcrumbs.tenant');
    const link = database ? getTenantPath({...query, database}) : undefined;

    const lastItem = {text, link, icon: <DatabaseIcon />};
    breadcrumbs.push(lastItem);

    return breadcrumbs;
};

const getNodeBreadcrumbs: GetBreadcrumbs<NodeBreadcrumbsOptions> = (options, query = {}) => {
    const {nodeId, nodeRole, nodeActiveTab, database} = options;

    const tenantQuery = getQueryForTenant(nodeActiveTab === 'tablets' ? 'tablets' : 'nodes');

    const breadcrumbs = database
        ? getTenantBreadcrumbs(options, {...query, ...tenantQuery})
        : getClusterBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.node');
    if (nodeId) {
        text += ` ${nodeId}`;
    }

    const lastItem = {
        text,
        link: nodeId
            ? getDefaultNodePath({id: nodeId, activeTab: nodeActiveTab}, {database, ...query})
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
    const {groupId, database} = options;

    const breadcrumbs = database
        ? getTenantBreadcrumbs(options, query)
        : getClusterBreadcrumbs(options, query);

    let text = headerKeyset('breadcrumbs.storageGroup');
    if (!isNil(groupId)) {
        text += ` ${groupId}`;
    }

    const lastItem = {
        text,
        link: isNil(groupId) ? undefined : getStorageGroupPath(groupId, {database}),
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
    const {tabletId, tabletType, database} = options;

    const breadcrumbs = database
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
    homePage: getHomePageBreadcrumbs,
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
