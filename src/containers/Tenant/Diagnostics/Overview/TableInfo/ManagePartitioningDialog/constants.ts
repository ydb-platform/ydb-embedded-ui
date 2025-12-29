import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {formatBytes, sizes} from '../../../../../../utils/bytesParsers';
import {
    DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
    DEFAULT_PARTITION_SPLIT_BY_LOAD_THRESHOLD_PERCENT,
} from '../constants';

import type {ManagePartitioningValue} from './ManagePartitioningDialog';

export const UNIT_OPTIONS: Array<{value: BytesSizes; label: string}> = (
    Object.keys(sizes) as BytesSizes[]
).map((value) => ({
    value,
    label: sizes[value].label,
}));

export const DEFAULT_MAX_SPLIT_SIZE_GB = formatBytes({
    value: DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
    size: 'gb',
    withSizeLabel: false,
});

export const DEFAULT_MANAGE_PARTITIONING_VALUE: ManagePartitioningValue = {
    splitSize: DEFAULT_MAX_SPLIT_SIZE_GB,
    splitUnit: 'gb',
    loadEnabled: true,
    loadPercent: String(DEFAULT_PARTITION_SPLIT_BY_LOAD_THRESHOLD_PERCENT),
    minimum: '40',
    maximum: '1000',
};

export const splitToBytes = (splitSize: string, splitUnit: BytesSizes): number | null => {
    const n = Number(splitSize.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
        return null;
    }

    return n * sizes[splitUnit].value;
};
