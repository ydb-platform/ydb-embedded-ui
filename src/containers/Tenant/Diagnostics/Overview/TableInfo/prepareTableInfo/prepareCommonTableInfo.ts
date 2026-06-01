import omit from 'lodash/omit';
import pick from 'lodash/pick';

import {toFormattedSize} from '../../../../../../components/FormattedBytes/utils';
import type {YDBDefinitionListItem} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {
    formatFollowerGroupItem,
    formatPartitionConfigItem,
    formatTableStatsItem,
    formatTabletMetricsItem,
} from '../../../../../../components/YDBDefinitionList/formatters/table';
import {formatObjectToDefinitionItems} from '../../../../../../components/YDBDefinitionList/utils';
import type {TPartitionConfig, TTableStats} from '../../../../../../types/api/schema';
import {isNumeric} from '../../../../../../utils/utils';
import {ROW_COUNT_NOTE} from '../../../../constants';

const GENERAL_METRICS_KEYS = ['CPU', 'Memory', 'ReadThroughput', 'Network'] as const;

/**
 * Prepares general statistics section (PartCount, RowCount, DataSize, IndexSize)
 */
export function prepareGeneralStats(TableStats: TTableStats = {}) {
    const {PartCount, RowCount, DataSize, IndexSize} = TableStats;

    return formatObjectToDefinitionItems(formatTableStatsItem, {
        PartCount,
        RowCount,
        DataSize,
        IndexSize,
    }).map((item) =>
        item.name === 'RowCount'
            ? {
                  ...item,
                  note: ROW_COUNT_NOTE,
              }
            : item,
    );
}

/**
 * Prepares detailed table statistics sections (bloom filter, timestamps, transactions, operations)
 */
export function prepareTableStatsInfo(
    TableStats: TTableStats = {},
    PartitionConfig: TPartitionConfig = {},
) {
    const {
        ByKeyFilterSize,
        LastAccessTime,
        LastUpdateTime,
        ImmediateTxCompleted,
        PlannedTxCompleted,
        TxRejectedByOverload,
        TxRejectedBySpace,
        TxCompleteLagMsec,
        InFlightTxCount,
        RowUpdates,
        RowDeletes,
        RowReads,
        RangeReads,
        RangeReadRows,
    } = TableStats;

    const bloomFilterItems: YDBDefinitionListItem[] = [];

    if (
        isNumeric(ByKeyFilterSize) &&
        (PartitionConfig.EnableFilterByKey || Number(ByKeyFilterSize) > 0)
    ) {
        bloomFilterItems.push({name: 'BloomFilterSize', content: toFormattedSize(ByKeyFilterSize)});
    }

    return [
        ...(bloomFilterItems.length > 0 ? [bloomFilterItems] : []),
        formatObjectToDefinitionItems(formatTableStatsItem, {
            LastAccessTime,
            LastUpdateTime,
        }),
        formatObjectToDefinitionItems(formatTableStatsItem, {
            ImmediateTxCompleted,
            PlannedTxCompleted,
            TxRejectedByOverload,
            TxRejectedBySpace,
            TxCompleteLagMsec,
            InFlightTxCount,
        }),
        formatObjectToDefinitionItems(formatTableStatsItem, {
            RowUpdates,
            RowDeletes,
            RowReads,
            RangeReads,
            RangeReadRows,
        }),
    ];
}

/**
 * Prepares general tablet metrics (CPU, Memory, ReadThroughput, Network)
 */
export function prepareGeneralMetrics(TabletMetrics: Record<string, unknown> = {}) {
    return formatObjectToDefinitionItems(
        formatTabletMetricsItem as any,
        pick(TabletMetrics, GENERAL_METRICS_KEYS) as any,
    );
}

/**
 * Prepares detailed tablet metrics (excluding general metrics and group metrics)
 */
export function prepareTabletMetricsInfo(TabletMetrics: Record<string, unknown> = {}) {
    return formatObjectToDefinitionItems(
        formatTabletMetricsItem as any,
        omit(TabletMetrics, [
            ...GENERAL_METRICS_KEYS,
            'GroupReadIops',
            'GroupReadThroughput',
            'GroupWriteIops',
            'GroupWriteThroughput',
        ]) as any,
    );
}

/**
 * Prepares partition configuration info (follower groups, read replicas)
 */
export function preparePartitionConfigInfo(PartitionConfig: TPartitionConfig = {}) {
    const {FollowerGroups, FollowerCount, CrossDataCenterFollowerCount} = PartitionConfig;

    const partitionConfigInfo: YDBDefinitionListItem[] = [];

    if (Array.isArray(FollowerGroups) && FollowerGroups.length > 0) {
        partitionConfigInfo.push(
            ...formatObjectToDefinitionItems(formatFollowerGroupItem, FollowerGroups[0]),
        );
    } else if (FollowerCount !== undefined) {
        partitionConfigInfo.push(formatPartitionConfigItem('FollowerCount', FollowerCount));
    } else if (CrossDataCenterFollowerCount !== undefined) {
        partitionConfigInfo.push(
            formatPartitionConfigItem('CrossDataCenterFollowerCount', CrossDataCenterFollowerCount),
        );
    }

    return partitionConfigInfo;
}
