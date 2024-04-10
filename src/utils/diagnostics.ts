import type {ValueOf} from '../types/common';

const TOP_SHARDS_SORT_VALUES = {
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    InFlightTxCount: 'InFlightTxCount',
} as const;

const TOP_QUERIES_SORT_VALUES = {
    CPUTimeUs: 'CPUTimeUs',
    EndTime: 'EndTime',
    ReadRows: 'ReadRows',
    ReadBytes: 'ReadBytes',
    UserSID: 'UserSID',
    Duration: 'Duration',
} as const;

type TopShardsSortValue = ValueOf<typeof TOP_SHARDS_SORT_VALUES>;
type TopQueriesSortValue = ValueOf<typeof TOP_QUERIES_SORT_VALUES>;

export const isSortableTopShardsProperty = (value: string): value is TopShardsSortValue =>
    Object.values(TOP_SHARDS_SORT_VALUES).includes(value as TopShardsSortValue);

export const isSortableTopQueriesProperty = (value: string): value is TopQueriesSortValue =>
    Object.values(TOP_QUERIES_SORT_VALUES).includes(value as TopQueriesSortValue);
