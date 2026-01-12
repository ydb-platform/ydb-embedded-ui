import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {formatBytes, sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import type {ManagePartitioningFormState} from './types';

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

export const DEFAULT_MANAGE_PARTITIONING_VALUE: ManagePartitioningFormState = {
    splitSize: DEFAULT_MAX_SPLIT_SIZE_GB,
    splitUnit: 'gb',
    loadEnabled: true,
    minimum: '40',
    maximum: '1000',
};
