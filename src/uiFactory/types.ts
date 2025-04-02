export interface UIFactory {
    onCreateDB?: HandleCreateDB;
    onDeleteDB?: HandleDeleteDB;
}

export type HandleCreateDB = (params: {clusterName: string}) => Promise<boolean>;

export type HandleDeleteDB = (params: {
    clusterName: string;
    databaseName: string;
    databaseId: string;
}) => Promise<boolean>;
