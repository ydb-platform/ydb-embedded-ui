import type {
    TPQPartitionConfig,
    TPQPartitionStrategy,
    TPQTabletConfig,
    TPersQueueGroupDescription,
} from '../../../types/api/schema';
import {EMeteringMode, EPQPartitionStrategyType} from '../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER, HOUR_IN_SECONDS} from '../../../utils/constants';
import {formatBps, formatBytes, formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';
import {createInfoFormatter} from '../utils';

const EMeteringModeToNames: Record<EMeteringMode, string> = {
    [EMeteringMode.METERING_MODE_REQUEST_UNITS]: 'request-units',
    [EMeteringMode.METERING_MODE_RESERVED_CAPACITY]: 'reserved-capacity',
};

const EPQPartitionStrategyTypeToNames: Record<EPQPartitionStrategyType, string> = {
    [EPQPartitionStrategyType.DISABLED]: i18n('value_autopartitioning-disabled'),
    [EPQPartitionStrategyType.CAN_SPLIT]: i18n('value_autopartitioning-up'),
    [EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE]: i18n('value_autopartitioning-up-and-down'),
    [EPQPartitionStrategyType.PAUSED]: i18n('value_autopartitioning-paused'),
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

const formatPartitionCount = (value?: number) =>
    value === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(value);

export const formatPQPartitionStrategy = createInfoFormatter<TPQPartitionStrategy>({
    values: {
        // Fall back to the raw enum value so a strategy introduced by a newer YDB
        // version still renders the Autopartitioning row instead of being dropped.
        PartitionStrategyType: (value) =>
            value && (EPQPartitionStrategyTypeToNames[value] ?? value),
        MinPartitionCount: formatPartitionCount,
        MaxPartitionCount: formatPartitionCount,
    },
    labels: {
        PartitionStrategyType: i18n('field_autopartitioning'),
        MinPartitionCount: i18n('field_min-partitions-count'),
        MaxPartitionCount: i18n('field_max-partitions-count'),
    },
});
