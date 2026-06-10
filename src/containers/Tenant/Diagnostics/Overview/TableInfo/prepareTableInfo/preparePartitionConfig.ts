import type {TPartitionConfig, TTableStats} from '../../../../../../types/api/schema';
import {formatBytes, getBytesSizeUnit} from '../../../../../../utils/bytesParsers';
import {DEFAULT_MANAGE_PARTITIONING_VALUE} from '../ManagePartitioningDialog/constants';
import type {ManagePartitioningFormState} from '../ManagePartitioningDialog/types';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import type {PartitionProgressConfig} from './renderHelpers';

/**
 * Prepares partition progress configuration from partition config and table stats
 */
export function preparePartitionProgressConfig(
    PartitionConfig: TPartitionConfig,
    TableStats?: TTableStats,
): PartitionProgressConfig {
    const {PartitioningPolicy} = PartitionConfig;

    // We are convinced, there is always at least one partition;
    // fallback and clamp to 1 if value is missing.
    const minPartitions = Math.max(1, PartitioningPolicy?.MinPartitionsCount ?? 1);
    const maxPartitions = PartitioningPolicy?.MaxPartitionsCount;
    const partitionsCount = Number(TableStats?.PartCount ?? 1);

    return {
        minPartitions,
        maxPartitions,
        partitionsCount,
    };
}

/**
 * Prepares initial configuration for the manage partitioning dialog
 */
export function prepareManagePartitioningDialogConfig(
    partitionConfig?: TPartitionConfig,
    progress?: PartitionProgressConfig,
): ManagePartitioningFormState | undefined {
    if (!partitionConfig || !progress) {
        return undefined;
    }

    const policy = partitionConfig?.PartitioningPolicy;

    const splitByLoadEnabled = Boolean(policy?.SplitByLoadSettings?.Enabled);

    const bytes = Number(policy?.SizeToSplit ?? DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES);
    const size = formatBytes({
        value: bytes,
        withSizeLabel: false,
    });

    const unit = getBytesSizeUnit(bytes);

    return {
        splitSize: size,
        splitUnit: unit,
        loadEnabled: splitByLoadEnabled,
        minimum: String(progress?.minPartitions),
        maximum: String(progress?.maxPartitions ?? DEFAULT_MANAGE_PARTITIONING_VALUE.maximum),
    };
}
