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
