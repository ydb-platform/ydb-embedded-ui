import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import {formatObject} from '../../../../../components/InfoViewer';
import {
    formatFollowerGroupItem,
    formatPartitionConfigItem,
    formatTableStatsItem,
    formatTabletMetricsItem,
} from '../../../../../components/InfoViewer/formatters';

export const prepareTableInfo = (data?: TEvDescribeSchemeResult) => {
    if (!data) {
        return {};
    }

    const {PathDescription = {}} = data;

    const {
        TableStats = {},
        TabletMetrics = {},
        Table: {PartitionConfig = {}} = {},
    } = PathDescription;

    const {
        PartCount,
        RowCount,
        DataSize,
        IndexSize,

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

        ...restTableStats
    } = TableStats;

    const {FollowerGroups, FollowerCount, CrossDataCenterFollowerCount} = PartitionConfig;

    const generalTableInfo = formatObject(formatTableStatsItem, {
        PartCount,
        RowCount,
        DataSize,
        IndexSize,
        ...restTableStats,
    });

    const tableStatsInfo = [
        formatObject(formatTableStatsItem, {
            LastAccessTime,
            LastUpdateTime,
        }),
        formatObject(formatTableStatsItem, {
            ImmediateTxCompleted,
            PlannedTxCompleted,
            TxRejectedByOverload,
            TxRejectedBySpace,
            TxCompleteLagMsec,
            InFlightTxCount,
        }),
        formatObject(formatTableStatsItem, {
            RowUpdates,
            RowDeletes,
            RowReads,
            RangeReads,
            RangeReadRows,
        }),
    ];

    const tabletMetricsInfo = formatObject(formatTabletMetricsItem, TabletMetrics);

    let partitionConfigInfo = [];

    if (Array.isArray(FollowerGroups) && FollowerGroups.length > 0) {
        partitionConfigInfo = formatObject(formatFollowerGroupItem, FollowerGroups[0]);
    } else if (FollowerCount !== undefined) {
        partitionConfigInfo.push(formatPartitionConfigItem('FollowerCount', FollowerCount));
    } else if (CrossDataCenterFollowerCount !== undefined) {
        partitionConfigInfo.push(
            formatPartitionConfigItem('CrossDataCenterFollowerCount', CrossDataCenterFollowerCount),
        );
    }

    return {generalTableInfo, tableStatsInfo, tabletMetricsInfo, partitionConfigInfo};
};
