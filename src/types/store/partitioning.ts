export interface UpdateTablePartitioningValues {
    partitionSizeMb: number;
    minPartitions: number;
    maxPartitions: number;
    splitByLoad: boolean;
}

export interface UpdateTablePartitioningParams {
    value: UpdateTablePartitioningValues;
    database: string;
    path: string;
}
