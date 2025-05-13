import type {GetLogsLink} from '../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../utils/monitoring';

export interface UIFactory {
    onCreateDB?: HandleCreateDB;
    onDeleteDB?: HandleDeleteDB;

    getLogsLink?: GetLogsLink;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
}

export type HandleCreateDB = (params: {clusterName: string}) => Promise<boolean>;

export type HandleDeleteDB = (params: {
    clusterName: string;
    databaseName: string;
    databaseId: string;
}) => Promise<boolean>;
