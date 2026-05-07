export interface BuildTemplateOptions {
    tableName: string;
    columns?: Column[];
    values?: {[key: string]: string | null};
    secondaryIndexes?: SecondaryIndex[];
    deletedColumns?: Column[];
    updatedSecondaryIndexes?: UpdatedSecondaryIndex[];
    columnsHash?: string[];
    settings?: TableSettings;
}

interface EntitySchemeEntry {
    type: string;
    name: string;
    owner: string;
    createdAt: {
        planStep: number;
        txId: number;
    };
}

type Int64 = string;

interface Timestamp {
    seconds: Int64;
    nanos?: number;
}

export enum TableFeatureFlag {
    Enabled = 'ENABLED',
    Disabled = 'DISABLED',
}

interface TableChangefeed {
    name: string;
    mode: string;
    format: string;
    state: string;
    virtualTimestamps?: boolean;
}

interface TableEntityDescription {
    self: EntitySchemeEntry;
    columns: Array<{
        name: string;
        type: unknown;
        family?: string;
    }>;
    columnFamilies?: Array<{
        name: string;
        data?: {
            media?: string;
        };
        compression?: string;
    }>;
    attributes?: Record<string, string>;
    tableStats: {
        creationTime: Timestamp;
        modificationTime?: Timestamp;
        partitions: number;
        partitionStats?: Array<{
            rowsEstimate: number;
            storeSize: number;
        }>;
        rowsEstimate?: number;
        storeSize?: number;
    };
    partitioningSettings: {
        maxPartitionsCount: number;
        minPartitionsCount: number;
        partitionSizeMb: number;
        partitioningBySize: TableFeatureFlag;
        partitioningByLoad: TableFeatureFlag;
    };
    keyBloomFilter?: TableFeatureFlag;
    ttlSettings?: {
        dateTypeColumn?: {
            columnName: string;
            expireAfterSeconds: number;
        };
        valueSinceUnixEpoch?: {
            columnName: string;
            columnUnit: string;
            expireAfterSeconds: number;
        };
    };
    readReplicasSettings?: {
        perAzReadReplicasCount?: number;
        anyAzReadReplicasCount?: number;
    };
    changefeeds?: TableChangefeed[];
}

interface ColumnTableEntityDescription {
    self: EntitySchemeEntry;
    columns: Array<{
        name: string;
        type: unknown;
        family?: string;
    }>;
    columnFamilies?: Array<{
        name: string;
        data?: {
            media?: string;
        };
        compression?: string;
    }>;
    attributes?: Record<string, string>;
    tableStats: {
        creationTime: Timestamp;
        modificationTime?: Timestamp;
        partitions: number;
        partitionStats?: Array<{
            rowsEstimate: number;
            storeSize: number;
        }>;
        rowsEstimate?: number;
        storeSize?: number;
    };
    partitioningSettings: {
        partitionBy: string[];
    };
    ttlSettings?: {
        dateTypeColumn?: {
            columnName: string;
            expireAfterSeconds: number;
        };
        valueSinceUnixEpoch?: {
            columnName: string;
            columnUnit: string;
            expireAfterSeconds: number;
        };
    };
}

type ColumnFamiliesDescription = NonNullable<
    TableEntityDescription['columnFamilies'] | ColumnTableEntityDescription['columnFamilies']
>;

export type ColumnFamilyDescription = ColumnFamiliesDescription[number];

export enum PartitionsType {
    None = 'none',
    Uniform = 'uniform',
    Explicit = 'explicit',
}

export interface Column {
    name: string;
    type: string;
    notNull: boolean;
    defaultValue?: string | number | boolean;
    family?: string;
    autoincrement?: boolean; // column table
    key?: boolean; // column table
    keyOrder?: number; // column table
    shardKey?: boolean; // document table
    sortKey?: boolean; // document table

    isDeletable?: boolean;
    isDisabled?: boolean; // to block a change, for example, if the type is unknown
}

export interface ColumnValueField extends Column {
    id: string;
    isDefined: boolean;
    value: string | null;
}

export interface ColumnField extends Column {
    _id: string;
    withDefaultValue: boolean;
}

export interface TTLSettings {
    status: 'enabled' | 'disabled';
    column?: string;
    columnWithEpochMode?: boolean;
    expire?: number;
    lifetime?: number;
    unit?: 'seconds' | 'minutes' | 'hours' | 'days';
    epochMode?: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';
}

export interface TableSettings {
    partitionsType?: PartitionsType;
    uniformPartitions?: string;
    partitionsAtKeys?: ColumnValueField[][];
    autoPartitionBySize?: boolean;
    autoPartitionByLoad?: boolean;
    autoPartitionBySizeMb?: number;
    autoPartitionMinPartitions?: string;
    autoPartitionMaxPartitions?: string;
    keyBloomFilter?: boolean;
    ttl: TTLSettings;
    columnFamilies?: ColumnFamiliesDescription;
}

export interface SecondaryIndex {
    name: string;
    key: string[];
    cover?: string[];
}

export interface UpdatedSecondaryIndex {
    name: string;
    newName: string;
    isDeleted: boolean;
}
