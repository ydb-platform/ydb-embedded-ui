import type {ValueOf} from '../types/common';

interface EntityWithUsage {
    Used: number;
    Limit: number;
}

export const getUsage = <T extends EntityWithUsage>(data: T, step = 1) => {
    // if limit is 0, display 0
    const usage = data.Limit ? (data.Used * 100) / data.Limit : 0;

    return Math.floor(usage / step) * step;
};

/**
 * Values to sort /storage v2 response
 *
 * Source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_storage.h
 */
export const STORAGE_SORT_VALUES = {
    PoolName: 'PoolName',
    Kind: 'Kind',
    Erasure: 'Erasure',
    Degraded: 'Degraded',
    Usage: 'Usage',
    GroupId: 'GroupId',
    Used: 'Used',
    Limit: 'Limit',
    Read: 'Read',
    Write: 'Write',
} as const;

export type StorageSortValue = ValueOf<typeof STORAGE_SORT_VALUES>;

export const isSortableStorageProperty = (value: string): value is StorageSortValue =>
    Object.values(STORAGE_SORT_VALUES).includes(value as StorageSortValue);
