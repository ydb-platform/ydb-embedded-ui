export interface GetLogsLinkProps {
    dbName: string;
    logging: string;
}

export type GetLogsLink = (props: GetLogsLinkProps) => string;
