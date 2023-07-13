import type {EColumnCodec, EUnit, TPathID, TStorageSettings, TTypeInfo} from './shared';

export interface TColumnTableDescription {
    Name?: string;

    Schema?: TColumnTableSchema;
    TtlSettings?: TColumnDataLifeCycle;

    SchemaPresetId?: number;
    SchemaPresetName?: string;

    ColumnStorePathId?: TPathID;

    ColumnShardCount?: number;
    Sharding?: TColumnTableSharding;

    /** uint64 */
    SchemaPresetVersionAdj?: string;
    /** uint64 */
    TtlSettingsPresetVersionAdj?: string;

    StorageConfig?: TColumnStorageConfig;
}

export interface TColumnStoreDescription {
    Name?: string;
    ColumnShardCount?: number;

    /** uint64 */
    ColumnShards?: string[];

    SchemaPresets?: TColumnTableSchemaPreset[];
    StorageConfig?: TColumnStorageConfig;

    NextSchemaPresetId?: number;
    NextTtlSettingsPresetId?: number;
}

export interface TColumnDataLifeCycle {
    Enabled?: TTtl;
    Disabled?: {};
    Tiering?: TStorageTiering;

    /** uint64 */
    Version?: string;
}

interface TColumnStorageConfig {
    SysLog?: TStorageSettings;
    Log?: TStorageSettings;
    Data?: TStorageSettings;
    DataChannelCount?: number;
}

interface TStorageTiering {
    Tiers?: TStorageTier[];
}

interface TStorageTier {
    Name?: string;
    Eviction?: TTtl;
}

interface TTtl {
    ColumnName?: string;

    ExpireAfterSeconds?: number;

    /** uint64 */
    ExpireAfterBytes?: string;

    ColumnUnit?: EUnit;
}

interface TColumnTableSchema {
    Columns?: TOlapColumnDescription[];
    KeyColumnNames?: string[];
    Engine?: EColumnTableEngine;
    NextColumnId?: number;

    /** uint64 */
    Version?: string;

    DefaultCompression?: TCompressionOptions;
    EnableTiering?: boolean;
}

interface TColumnTableSchemaPreset {
    Id?: number;
    Name?: string;
    Schema?: TColumnTableSchema;
}

interface TOlapColumnDescription {
    Id?: number;
    Name?: string;
    Type?: string;
    TypeId?: number;
    TypeInfo?: TTypeInfo;
}

interface TColumnTableSharding {
    /** uint64 */
    Version?: string;

    /** uint64 */
    ColumnShards?: string[];

    /** uint64 */
    AdditionalColumnShards?: string[];

    UniquePrimaryKey?: boolean;

    RandomSharding?: {};
    HashSharding?: THashSharding;
}

interface THashSharding {
    Function?: EHashFunction;
    Columns?: string[];
    UniqueShardKey?: boolean;
    ActiveShardsCount?: number;
}

interface TCompressionOptions {
    CompressionCodec?: EColumnCodec;
    CompressionLevel?: number;
}

enum EHashFunction {
    HASH_FUNCTION_MODULO_N = 'HASH_FUNCTION_MODULO_N',
    HASH_FUNCTION_CLOUD_LOGS = 'HASH_FUNCTION_CLOUD_LOGS',
}

enum EColumnTableEngine {
    COLUMN_ENGINE_NONE = 'COLUMN_ENGINE_NONE',
    COLUMN_ENGINE_REPLACING_TIMESERIES = 'COLUMN_ENGINE_REPLACING_TIMESERIES',
}
