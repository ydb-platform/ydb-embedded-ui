import type React from 'react';

import type {EmptyStateProps} from '../components/EmptyState';
import type {
    CommonIssueType,
    GetHealthcheckViewTitles,
    GetHealthcheckViewsOrder,
} from '../containers/Tenant/Healthcheck/shared';
import type {ClusterInfo} from '../store/reducers/cluster/cluster';
import type {IssuesTree} from '../store/reducers/healthcheckInfo/types';
import type {PreparedTenant} from '../store/reducers/tenants/types';
import type {AdditionalTenantsProps, ClusterLink, DatabaseLink} from '../types/additionalProps';
import type {MetaBaseClusterInfo} from '../types/api/meta';
import type {EPathSubType, EPathType} from '../types/api/schema/schema';
import type {ETenantType} from '../types/api/tenant';
import type {GetLogsLink} from '../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../utils/monitoring';

export interface UIFactory<H extends string = CommonIssueType, T extends string = string> {
    onCreateDB?: HandleCreateDB;
    onEditDB?: HandleEditDB;
    onDeleteDB?: HandleDeleteDB;

    onAddCluster?: HandleAddCluster;
    onEditCluster?: HandleEditCluster;
    onDeleteCluster?: HandleDeleteCluster;

    homePageTitle?: string;

    getLogsLink?: GetLogsLink;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;

    getDatabaseLinks?: GetDatabaseLinks;
    getClusterLinks?: GetClusterLinks;

    renderBackups?: RenderBackups;
    renderEvents?: RenderEvents;
    renderMonitoring?: RenderMonitoring;
    clusterOrDatabaseAccessError?: Partial<EmptyStateProps>;

    enableMultiTabQueryEditor?: boolean;

    healthcheck: {
        getHealthckechViewTitles: GetHealthcheckViewTitles<H>;
        getHealthcheckViewsOrder: GetHealthcheckViewsOrder<H>;
        countHealthcheckIssuesByType: (issueTrees: IssuesTree[]) => Record<H, number>;
    };
    hasAccess?: boolean;
    hideGrantAccess?: boolean;

    useDatabaseId?: boolean;

    useMetaProxy?: boolean;
    useClusterDomain?: boolean;

    settingsBackend?: {
        /**
         * Settings service endpoint (base URL) for `/meta/*` settings contract.
         */
        getEndpoint: () => string | undefined;
        /**
         * User identifier to scope settings in the remote store (Yandex users).
         */
        getUserId: () => string | undefined;
    };

    yaMetricaConfig?: {
        yaMetricaMap: Record<T, number | undefined>;
        goals: UiMetricaGoals;
        getMetricaName: (goalKey: UiMetricaGoal) => T;
    };

    databasesEnvironmentsConfig?: DatabasesEnvironmentsConfig;
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

export type RenderEvents = (props: {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}) => React.ReactNode;

export type RenderMonitoring = (props: {
    type?: EPathType;
    subType?: EPathSubType;
    database: string;
    path: string;
    databaseFullPath?: string;
    useMetaProxy?: boolean;
    additionalTenantProps?: AdditionalTenantsProps;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}) => React.ReactNode;
export interface UiMetricaGoals {
    runQuery?: string;
    stopQuery?: string;
    openManagePartitioning?: string;
    applyManagePartitioning?: string;
}

export type UiMetricaGoal = keyof UiMetricaGoals;

/**
 * Configuration for managing database environments in multi-cluster mode.
 * Affects environments that are shown on Databases tab on HomePage
 */
export interface DatabasesEnvironmentsConfig {
    /** The environment to select by default when no environment is specified */
    getDefaultEnvironment?: () => string | undefined;

    /**
     * Environments can work in two modes:
     *
     * 1. **Filtered backend list**: If `getEnvironments` is not provided, the list of environments
     *    is fetched from the backend and filtered by `getSupportedEnvironments`. Only environments
     *    that exist in both the backend response and `getSupportedEnvironments` will be shown.
     *
     * 2. **Determined list**: If `getEnvironments` is provided, it returns the list of
     *    available environments, ignoring the backend response.
     *    Backend response with `getSupportedEnvironments` is used as fallback if function returns nothing
     */
    getSupportedEnvironments: () => string[] | undefined;
    getEnvironments?: () => string[] | undefined;

    /** Custom display title for each environment (falls back to environment name) */
    getEnvironmentTitle?: (env: string) => string | undefined;

    /** If provided, clicking an environment tab will redirect to that domain instead of changing the environment in the current context */
    getEnvironmentDomain?: (env: string) => string | undefined;
}
