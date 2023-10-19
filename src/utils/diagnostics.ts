import {ValueOf} from '../types/common';

export const TOP_SHARDS_SORT_VALUES = {
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
} as const;

export type TopShardsSortValue = ValueOf<typeof TOP_SHARDS_SORT_VALUES>;

export const isSortableTopShardsProperty = (value: string): value is TopShardsSortValue =>
    Object.values(TOP_SHARDS_SORT_VALUES).includes(value as TopShardsSortValue);
