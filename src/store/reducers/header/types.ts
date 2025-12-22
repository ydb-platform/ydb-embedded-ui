import type {ClusterTab} from '../../../containers/Cluster/utils';
import type {NodeTab} from '../../../containers/Node/NodePages';
import type {HomePageTab} from '../../../routes';
import type {EType} from '../../../types/api/tablet';

import type {setHeaderBreadcrumbs} from './header';

export type Page =
    | 'homePage'
    | 'cluster'
    | 'tenant'
    | 'node'
    | 'pDisk'
    | 'vDisk'
    | 'tablet'
    | 'storageGroup'
    | undefined;

export interface HomePageBreadcrumbsOptions {
    homePageTab?: HomePageTab;
    databasesPageAvailable?: boolean;
    databasesPageEnvironment?: string;
}

export interface ClusterBreadcrumbsOptions extends HomePageBreadcrumbsOptions {
    clusterName?: string;
    clusterTab?: ClusterTab;
    environment?: string;
}

export interface TenantBreadcrumbsOptions extends ClusterBreadcrumbsOptions {
    database?: string;
    databaseName?: string;
}

export interface StorageGroupBreadcrumbsOptions extends ClusterBreadcrumbsOptions {
    groupId?: string;
    database?: string;
}

export interface NodeBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    nodeId?: string | number;
    nodeActiveTab?: NodeTab;
    nodeRole?: 'Storage' | 'Compute';
}

export interface PDiskBreadcrumbsOptions extends Omit<NodeBreadcrumbsOptions, 'database'> {
    pDiskId?: string | number;
}

export interface VDiskBreadcrumbsOptions extends PDiskBreadcrumbsOptions {
    vDiskId?: string | number;
    groupId?: string;
}

export interface TabletBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    tabletId?: string;
    tabletType?: EType;
}

export type BreadcrumbsOptions =
    | ClusterBreadcrumbsOptions
    | HomePageBreadcrumbsOptions
    | TenantBreadcrumbsOptions
    | NodeBreadcrumbsOptions
    | TabletBreadcrumbsOptions
    | StorageGroupBreadcrumbsOptions;

export type PageBreadcrumbsOptions<T extends Page = undefined> = T extends 'homePage'
    ? HomePageBreadcrumbsOptions
    : T extends 'cluster'
      ? ClusterBreadcrumbsOptions
      : T extends 'tenant'
        ? TenantBreadcrumbsOptions
        : T extends 'node'
          ? NodeBreadcrumbsOptions
          : T extends 'tablet'
            ? TabletBreadcrumbsOptions
            : {};

export interface HeaderState {
    page?: Page;
    pageBreadcrumbsOptions: BreadcrumbsOptions;
}

export type HeaderAction = ReturnType<typeof setHeaderBreadcrumbs>;
