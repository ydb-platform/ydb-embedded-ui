import type {
    CommonIssueType,
    GetHealthcheckViewTitles,
    GetHealthcheckViewsOrder,
} from '../containers/Tenant/Healthcheck/shared';
import type {IssuesTree} from '../store/reducers/healthcheckInfo/types';
import type {PreparedTenant} from '../store/reducers/tenants/types';
import type {GetLogsLink} from '../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../utils/monitoring';

export interface UIFactory {
    onCreateDB?: HandleCreateDB;
    onEditDB?: HandleEditDB;
    onDeleteDB?: HandleDeleteDB;

    getLogsLink?: GetLogsLink;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;

    healthcheck: {
        getHealthckechViewTitles: GetHealthcheckViewTitles<CommonIssueType>;
        getHealthcheckViewsOrder: GetHealthcheckViewsOrder<CommonIssueType>;
    };
    countHealthcheckIssuesByType: (
        issueTrees: IssuesTree[],
    ) => Record<CommonIssueType, number> & Record<string, number>;
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
