import type React from 'react';

import type {
    CommonIssueType,
    GetHealthcheckViewTitles,
    GetHealthcheckViewsOrder,
} from '../containers/Tenant/Healthcheck/shared';
import type {ClusterInfo} from '../store/reducers/cluster/cluster';
import type {IssuesTree} from '../store/reducers/healthcheckInfo/types';
import type {PreparedTenant} from '../store/reducers/tenants/types';
import type {ClusterLink, DatabaseLink} from '../types/additionalProps';
import type {MetaBaseClusterInfo} from '../types/api/meta';
import type {ETenantType} from '../types/api/tenant';
import type {GetLogsLink} from '../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../utils/monitoring';

export interface UIFactory<H extends string = CommonIssueType> {
    onCreateDB?: HandleCreateDB;
    onEditDB?: HandleEditDB;
    onDeleteDB?: HandleDeleteDB;

    onAddCluster?: HandleAddCluster;
    onEditCluster?: HandleEditCluster;
    onDeleteCluster?: HandleDeleteCluster;

    clustersPageTitle?: string;

    getLogsLink?: GetLogsLink;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;

    getDatabaseLinks?: GetDatabaseLinks;
    getClusterLinks?: GetClusterLinks;

    renderBackups?: RenderBackups;
    renderEvents?: RenderEvents;

    healthcheck: {
        getHealthckechViewTitles: GetHealthcheckViewTitles<H>;
        getHealthcheckViewsOrder: GetHealthcheckViewsOrder<H>;
        countHealthcheckIssuesByType: (issueTrees: IssuesTree[]) => Record<H, number>;
    };
    hasAccess?: boolean;
    yaMetricaMap?: Record<string, number>;

    useDatabaseId?: boolean;
}

export type HandleCreateDB = (params: {clusterName: string}) => Promise<boolean>;

export type HandleEditDB = (params: {
    clusterName: string;
    databaseData: PreparedTenant;
}) => Promise<boolean>;

export type HandleDeleteDB = (params: {
    clusterName: string;
    databaseData: PreparedTenant;
}) => Promise<boolean>;

export type HandleAddCluster = () => Promise<boolean>;

export type HandleEditCluster = (params: {clusterData: MetaBaseClusterInfo}) => Promise<boolean>;

export type HandleDeleteCluster = (params: {clusterData: MetaBaseClusterInfo}) => Promise<boolean>;

export type GetDatabaseLinks = (params: {
    clusterInfo: ClusterInfo;
    dbName?: string;
    dbType?: ETenantType;
}) => DatabaseLink[];

export type GetClusterLinks = (params: {clusterInfo: ClusterInfo}) => ClusterLink[];

export type RenderBackups = (props: {
    database: string;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}) => React.ReactNode;

export type RenderEvents = () => React.ReactNode;
