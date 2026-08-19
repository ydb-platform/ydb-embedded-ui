interface UpdateTablePartitioningCommonValues {
    minPartitions: number;
    maxPartitions: number;
    splitByLoad: boolean;
}

export type UpdateTablePartitioningValues = UpdateTablePartitioningCommonValues &
    ({splitBySize: true; partitionSizeMb: number} | {splitBySize: false; partitionSizeMb?: never});

export interface UpdateTablePartitioningParams {
    value: UpdateTablePartitioningValues;
    database: string;
    path: string;
}
