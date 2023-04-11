import type {TFollowerGroup, TPartitionConfig, TTableStats} from '../../../types/api/schema';
import type {TMetrics} from '../../../types/api/tenant';
import {formatCPU, formatBytes, formatNumber, formatBps, formatDateTime} from '../../../utils';

import {createInfoFormatter} from '../utils';

export const formatTabletMetricsItem = createInfoFormatter<TMetrics>({
    values: {
        CPU: formatCPU,
        Memory: formatBytes,
        Storage: formatBytes,
        Network: formatBps,
        ReadThroughput: formatBps,
        WriteThroughput: formatBps,
    },
    defaultValueFormatter: formatNumber,
});

export const formatFollowerGroupItem = createInfoFormatter<TFollowerGroup>({
    values: {
        FollowerCount: formatNumber,
    },
    labels: {
        // Make it shorter to fit label width
        FollowerCountPerDataCenter: 'FollowerCountPerDC',
    },
    // Most of the FollowerGroup fields are arrays or boolean
    defaultValueFormatter: (value) => value && String(value),
});

export const formatPartitionConfigItem = createInfoFormatter<TPartitionConfig>({
    values: {
        FollowerCount: formatNumber,
        CrossDataCenterFollowerCount: formatNumber,
    },
});

export const formatTableStatsItem = createInfoFormatter<TTableStats>({
    values: {
        DataSize: formatBytes,
        IndexSize: formatBytes,
        LastAccessTime: formatDateTime,
        LastUpdateTime: formatDateTime,
    },
    defaultValueFormatter: formatNumber,
});
