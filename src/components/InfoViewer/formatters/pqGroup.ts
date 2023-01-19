import {
    EMeteringMode,
    TPersQueueGroupDescription,
    TPQPartitionConfig,
    TPQTabletConfig,
} from '../../../types/api/schema';
import {formatBps, formatBytes, formatNumber} from '../../../utils';
import {HOUR_IN_SECONDS} from '../../../utils/constants';

import {createInfoFormatter} from '../utils';

const EMeteringModeToNames: Record<EMeteringMode, string> = {
    [EMeteringMode.METERING_MODE_REQUEST_UNITS]: 'request-units',
    [EMeteringMode.METERING_MODE_RESERVED_CAPACITY]: 'reserved-capacity',
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
