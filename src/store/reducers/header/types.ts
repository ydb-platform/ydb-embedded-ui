import type {ClusterTab} from '../../../containers/Cluster/utils';
import type {EType} from '../../../types/api/tablet';

import {setHeaderBreadcrumbs} from './header';

export type Page =
    | 'cluster'
    | 'tenant'
    | 'node'
    | 'pDisk'
    | 'vDisk'
    | 'tablets'
    | 'tablet'
    | undefined;

export interface ClusterBreadcrumbsOptions {
    clusterName?: string;
    clusterTab?: ClusterTab;
}

export interface TenantBreadcrumbsOptions extends ClusterBreadcrumbsOptions {
    tenantName?: string;
}

export interface NodeBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    nodeId?: string | number;
}

export interface PDiskBreadcrumbsOptions extends Omit<NodeBreadcrumbsOptions, 'tenantName'> {
    pDiskId?: string | number;
}

export interface VDiskBreadcrumbsOptions extends PDiskBreadcrumbsOptions {
    vDiskSlotId?: string | number;
}

export interface TabletsBreadcrumbsOptions extends TenantBreadcrumbsOptions {
    nodeIds?: string[] | number[];
}

export interface TabletBreadcrumbsOptions extends TabletsBreadcrumbsOptions {
    tabletId?: string;
    tabletType?: EType;
}

export type BreadcrumbsOptions =
    | ClusterBreadcrumbsOptions
    | TenantBreadcrumbsOptions
    | NodeBreadcrumbsOptions
    | TabletsBreadcrumbsOptions
    | TabletBreadcrumbsOptions;

export type PageBreadcrumbsOptions<T extends Page = undefined> = T extends 'cluster'
    ? ClusterBreadcrumbsOptions
    : T extends 'tenant'
    ? TenantBreadcrumbsOptions
    : T extends 'node'
    ? NodeBreadcrumbsOptions
    : T extends 'tablets'
    ? TabletsBreadcrumbsOptions
    : T extends 'tablet'
    ? TabletBreadcrumbsOptions
    : {};

export interface HeaderState {
    page?: Page;
    pageBreadcrumbsOptions: BreadcrumbsOptions;
}

export type HeaderAction = ReturnType<typeof setHeaderBreadcrumbs>;
