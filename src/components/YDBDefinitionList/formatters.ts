import type {TFollowerGroup, TPartitionConfig, TTableStats} from '../../types/api/schema';
import type {TMetrics} from '../../types/api/tenant';
import {
    formatBps,
    formatCPU,
    formatDateTime,
    formatNumber,
} from '../../utils/dataFormatters/dataFormatters';
import {toFormattedSize} from '../FormattedBytes/utils';

import {createDefinitionFormatter} from './utils';

export const formatTabletMetricsItem = createDefinitionFormatter<TMetrics>({
    contents: {
        CPU: formatCPU,
        Memory: toFormattedSize,
        Storage: toFormattedSize,
        Network: formatBps,
        ReadThroughput: formatBps,
        WriteThroughput: formatBps,
    },
    defaultContentFormatter: formatNumber,
});

export const formatFollowerGroupItem = createDefinitionFormatter<TFollowerGroup>({
    contents: {
        FollowerCount: formatNumber,
    },
    names: {
        // Make it shorter to fit label width
        FollowerCountPerDataCenter: 'FollowerCountPerDC',
    },
    // Most of the FollowerGroup fields are arrays or boolean
    defaultContentFormatter: (value) => value && String(value),
});

export const formatPartitionConfigItem = createDefinitionFormatter<TPartitionConfig>({
    contents: {
        FollowerCount: formatNumber,
        CrossDataCenterFollowerCount: formatNumber,
    },
});

export const formatTableStatsItem = createDefinitionFormatter<TTableStats>({
    contents: {
        DataSize: toFormattedSize,
        IndexSize: toFormattedSize,
        LastAccessTime: formatDateTime,
        LastUpdateTime: formatDateTime,
    },
    defaultContentFormatter: formatNumber,
});
