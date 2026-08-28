import type {
    TPQPartitionConfig,
    TPQPartitionStrategy,
    TPQTabletConfig,
    TPersQueueGroupDescription,
} from '../../../types/api/schema';
import {EMeteringMode, EPQPartitionStrategyType} from '../../../types/api/schema';
import {HOUR_IN_SECONDS} from '../../../utils/constants';
import {formatBps, formatBytes, formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {createInfoFormatter} from '../utils';

const EMeteringModeToNames: Record<EMeteringMode, string> = {
    [EMeteringMode.METERING_MODE_REQUEST_UNITS]: 'request-units',
    [EMeteringMode.METERING_MODE_RESERVED_CAPACITY]: 'reserved-capacity',
};

const EPQPartitionStrategyTypeToNames: Record<EPQPartitionStrategyType, string> = {
    [EPQPartitionStrategyType.DISABLED]: 'Disabled',
    [EPQPartitionStrategyType.CAN_SPLIT]: 'Up',
    [EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE]: 'Up and down',
    [EPQPartitionStrategyType.PAUSED]: 'Paused',
};

export const formatPQGroupItem = createInfoFormatter<TPersQueueGroupDescription>({
    values: {
        Partitions: (value) => formatNumber(value?.length || 0),
        PQTabletConfig: (value) => {
            const hours =
                Math.round((value.PartitionConfig.LifetimeSeconds / HOUR_IN_SECONDS) * 100) / 100;
            return `${formatNumber(hours)} hours`;
        },
    },
    labels: {
        Partitions: 'Partitions count',
        PQTabletConfig: 'Retention',
    },
});

export const formatPQTabletConfig = createInfoFormatter<TPQTabletConfig>({
    values: {
        Codecs: (value) => value && Object.values(value.Codecs || {}).join(', '),
        MeteringMode: (value) => value && EMeteringModeToNames[value],
    },
    labels: {
        MeteringMode: 'Metering mode',
    },
});

export const formatPQPartitionConfig = createInfoFormatter<TPQPartitionConfig>({
    values: {
        StorageLimitBytes: formatBytes,
        WriteSpeedInBytesPerSecond: formatBps,
    },
    labels: {
        StorageLimitBytes: 'Retention storage',
        WriteSpeedInBytesPerSecond: 'Partitions write speed',
    },
});

export const formatPQPartitionStrategy = createInfoFormatter<TPQPartitionStrategy>({
    values: {
        PartitionStrategyType: (value) => value && EPQPartitionStrategyTypeToNames[value],
        MinPartitionCount: (value) => formatNumber(value ?? 1),
        MaxPartitionCount: (value) => formatNumber(value ?? 1),
    },
    labels: {
        PartitionStrategyType: 'Autopartitioning',
        MinPartitionCount: 'Min partitions count',
        MaxPartitionCount: 'Max partitions count',
    },
});
