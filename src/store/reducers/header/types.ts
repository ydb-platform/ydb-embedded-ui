import type {ClusterTab} from '../../../containers/Cluster/utils';
import type {NodeTab} from '../../../containers/Node/NodePages';
import type {EType} from '../../../types/api/tablet';

import type {setHeaderBreadcrumbs} from './header';

export type Page =
    | 'clusters'
    | 'cluster'
    | 'tenant'
    | 'node'
    | 'pDisk'
    | 'vDisk'
    | 'tablet'
    | 'storageGroup'
    | undefined;

export interface ClustersBreadcrumbsOptions {
    isViewerUser?: boolean;
}

export interface ClusterBreadcrumbsOptions extends ClustersBreadcrumbsOptions {
    clusterName?: string;
    clusterTab?: ClusterTab;
}

export interface TenantBreadcrumbsOptions extends ClusterBreadcrumbsOptions {
    tenantName?: string;
}

export interface StorageGroupBreadcrumbsOptions extends ClusterBreadcrumbsOptions {
    groupId?: string;
}

export interface NodeBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    nodeId?: string | number;
    nodeActiveTab?: NodeTab;
    nodeRole?: 'Storage' | 'Compute';
}

export interface PDiskBreadcrumbsOptions extends Omit<NodeBreadcrumbsOptions, 'tenantName'> {
    pDiskId?: string | number;
}

export interface VDiskBreadcrumbsOptions extends PDiskBreadcrumbsOptions {
    vDiskSlotId?: string | number;
}

export interface TabletBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    tabletId?: string;
    tabletType?: EType;
}

export type BreadcrumbsOptions =
    | ClusterBreadcrumbsOptions
    | TenantBreadcrumbsOptions
    | NodeBreadcrumbsOptions
    | TabletBreadcrumbsOptions
    | StorageGroupBreadcrumbsOptions;

export type PageBreadcrumbsOptions<T extends Page = undefined> = T extends 'cluster'
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
