/**
 * endpoint: /viewer/json/autocomplete
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TQueryAutocomplete {
    Success: boolean;
    Error?: string[];
    Result: TAutocompleteResult;
}

interface TAutocompleteResult {
    Entities?: TAutocompleteEntity[];
    Total?: number;
}

export interface TAutocompleteEntity {
    Name: string;
    Type: AutocompleteEntityType;
    Parent: string;
}

export interface AutocompleteColumn extends TAutocompleteEntity {
    Type: 'column';
    PKIndex?: number;
    NotNull?: boolean;
    Default?: number;
}

export function isAutocompleteColumn(entity: TAutocompleteEntity): entity is AutocompleteColumn {
    return entity.Type === 'column';
}

export type AutocompleteEntityType =
    | 'unknown'
    | 'dir'
    | 'table'
    | 'pers_queue_group'
    | 'sub_domain'
    | 'rtmr_volume'
    | 'block_store_volume'
    | 'kesus'
    | 'solomon_volume'
    | 'table_index'
    | 'ext_sub_domain'
    | 'file_store'
    | 'column_store'
    | 'column_table'
    | 'cdc_stream'
    | 'sequence'
    | 'replication'
    | 'blob_depot'
    | 'external_table'
    | 'external_data_source'
    | 'view'
    | 'column'
    | 'index'
    | 'streaming_query';
