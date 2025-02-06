import type {EColumnCodec, EUnit, TPathID, TStorageSettings, TTypeInfo} from './shared';
import type {TFamilyDescription} from './table';

export interface TColumnTableDescription {
    Name?: string;

    Schema?: TColumnTableSchema;
    TtlSettings?: TColumnDataLifeCycle;

    SchemaPresetId?: number; // For in-store column tables, could be 0
    SchemaPresetName?: string; // For in-store column tables

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

    /** uint64 */
    Version?: string;

    DefaultCompression?: TCompressionOptions;
    Indexes?: unknown;
    Options?: TColumnTableSchemeOptions;
    ColumnFamilies?: TFamilyDescription[];
}

interface TColumnTableSchemaPreset {
    Id?: number;
    Name?: string;
    Schema?: TColumnTableSchema;
}

interface TColumnTableSchemeOptions {
    SchemeNeedActualization?: boolean; // default = false
    ScanReaderPolicyName?: string;
}

interface TOlapColumnDescription {
    Id?: number;
    Name?: string;

    Type?: string;
    TypeId?: number;
    TypeInfo?: TTypeInfo;

    NotNull?: boolean;

    DictionaryEncoding?: TDictionaryEncodingSettings;
    Serializer?: unknown;
    StorageId?: string;
    DefaultValue?: unknown;
    DataAccessorConstructor?: unknown;
    ColumnFamilyId?: number;
    ColumnFamilyName?: string;
}

interface TColumnTableSharding {
    /** uint64 */
    ColumnShards?: string[];

    RandomSharding?: {};
    HashSharding?: THashSharding;
}

interface THashSharding {
    Function?: EHashFunction;
    Columns?: string[];
    ActiveShardsCount?: number;
    ModuloPartsCount?: number;
}

interface TCompressionOptions {
    CompressionCodec?: EColumnCodec;
    CompressionLevel?: number;
}

interface TDictionaryEncodingSettings {
    Enabled?: boolean;
}

type EHashFunction =
    | 'HASH_FUNCTION_MODULO_N'
    | 'HASH_FUNCTION_CLOUD_LOGS'
    | 'HASH_FUNCTION_CONSISTENCY_64';
