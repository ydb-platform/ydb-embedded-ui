import type {StorageV2SortValue} from '../types/api/storage';

import {generateEvaluator} from './generateEvaluator';

interface EntityWithUsage {
    Used: number;
    Limit: number;
}

export const getUsage = <T extends EntityWithUsage>(data: T, step = 1) => {
    // if limit is 0, display 0
    const usage = data.Limit ? (data.Used * 100) / data.Limit : 0;

    return Math.floor(usage / step) * step;
};

export const getSpaceUsageSeverity = generateEvaluator(80, 85, ['success', 'warning', 'danger']);

const STORAGE_SORT_VALUES: StorageV2SortValue[] = [
    'PoolName',
    'Kind',
    'MediaType',
    'Erasure',
    'Degraded',
    'Usage',
    'GroupId',
    'Used',
    'Limit',
    'Read',
    'Write',

    'AllocationUnits',
    'Latency',
    'DiskSpaceUsage',
];

export const isSortableStorageProperty = (value: unknown): value is StorageV2SortValue =>
    STORAGE_SORT_VALUES.includes(value as StorageV2SortValue);
