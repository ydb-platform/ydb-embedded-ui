import type {MetaClusterLogsUrls} from '../types/api/meta';

export interface GetLogsLinkProps {
    dbName: string;
    logging: MetaClusterLogsUrls;
}

export type GetLogsLink = (props: GetLogsLinkProps) => string;
