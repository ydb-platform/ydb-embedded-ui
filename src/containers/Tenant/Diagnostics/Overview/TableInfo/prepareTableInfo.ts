import type {
    TColumnDataLifeCycle,
    TColumnTableDescription,
    TEvDescribeSchemeResult,
    TPartitionConfig,
    TTTLSettings,
} from '../../../../../types/api/schema';
import type {KeyValueRow} from '../../../../../types/api/query';
import {EPathType} from '../../../../../types/api/schema';
import {isNumeric} from '../../../../../utils/utils';
import {formatBytes, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatDurationToShortTimeFormat} from '../../../../../utils/timeParsers';
import {formatObject, InfoViewerItem} from '../../../../../components/InfoViewer';
import {
    formatFollowerGroupItem,
    formatPartitionConfigItem,
    formatTableStatsItem,
    formatTabletMetricsItem,
} from '../../../../../components/InfoViewer/formatters';

const isInStoreColumnTable = (table: TColumnTableDescription) => {
    // SchemaPresetId could be 0
    return table.SchemaPresetName && table.SchemaPresetId !== undefined;
};

const prepareOlapStats = (olapStats?: KeyValueRow[]) => {
    const Bytes = olapStats?.reduce((acc, el) => {
        const value = isNumeric(el.Bytes) ? Number(el.Bytes) : 0;
        return acc + value;
    }, 0);
    const Rows = olapStats?.reduce((acc, el) => {
        const value = isNumeric(el.Rows) ? Number(el.Rows) : 0;
        return acc + value;
    }, 0);
    const tabletIds = olapStats?.reduce((acc, el) => {
        acc.add(el.TabletId);
        return acc;
    }, new Set());

    return [
        {label: 'PartCount', value: tabletIds?.size ?? 0},
        {label: 'RowCount', value: formatNumber(Rows) ?? 0},
        {label: 'DataSize', value: formatBytes(Bytes) ?? 0},
    ];
};

const prepareTTL = (ttl: TTTLSettings | TColumnDataLifeCycle) => {
    // ExpireAfterSeconds could be 0
    if (ttl.Enabled && ttl.Enabled.ColumnName && ttl.Enabled.ExpireAfterSeconds !== undefined) {
        const value = `column: '${
            ttl.Enabled.ColumnName
        }', expire after: ${formatDurationToShortTimeFormat(
            ttl.Enabled.ExpireAfterSeconds * 1000,
            1,
        )}`;

        return {label: 'TTL for rows', value};
    }
    return undefined;
};

function prepareColumnTableGeneralInfo(columnTable: TColumnTableDescription) {
    const columnTableGeneralInfo: InfoViewerItem[] = [];

    columnTableGeneralInfo.push({
        label: 'Standalone',
        value: String(!isInStoreColumnTable(columnTable)),
    });

    if (columnTable.Sharding && columnTable.Sharding.HashSharding) {
        columnTableGeneralInfo.push({label: 'Sharding', value: 'hash'});
    }

    if (columnTable.TtlSettings) {
        const ttlInfo = prepareTTL(columnTable?.TtlSettings);
        if (ttlInfo) {
            columnTableGeneralInfo.push(ttlInfo);
        }
    }

    return columnTableGeneralInfo;
}

const prepareTableGeneralInfo = (PartitionConfig: TPartitionConfig, TTLSettings?: TTTLSettings) => {
    const {PartitioningPolicy = {}, FollowerGroups, EnableFilterByKey} = PartitionConfig;

    const generalTableInfo: InfoViewerItem[] = [];

    const partitioningBySize =
        PartitioningPolicy.SizeToSplit && Number(PartitioningPolicy.SizeToSplit) > 0
            ? `Enabled, split size: ${formatBytes(PartitioningPolicy.SizeToSplit)}`
            : 'Disabled';

    const partitioningByLoad = PartitioningPolicy.SplitByLoadSettings?.Enabled
        ? 'Enabled'
        : 'Disabled';

    generalTableInfo.push(
        {label: 'Partitioning by size', value: partitioningBySize},
        {label: 'Partitioning by load', value: partitioningByLoad},
        {
            label: 'Min number of partitions',
            value: formatNumber(PartitioningPolicy.MinPartitionsCount || 0),
        },
    );

    if (PartitioningPolicy.MaxPartitionsCount) {
        generalTableInfo.push({
            label: 'Max number of partitions',
            value: formatNumber(PartitioningPolicy.MaxPartitionsCount),
        });
    }

    if (FollowerGroups && FollowerGroups.length) {
        const {RequireAllDataCenters, FollowerCountPerDataCenter, FollowerCount} =
            FollowerGroups[0];

        let readReplicasConfig: string;

        if (RequireAllDataCenters && FollowerCountPerDataCenter) {
            readReplicasConfig = `PER_AZ: ${FollowerCount}`;
        } else {
            readReplicasConfig = `ANY_AZ: ${FollowerCount}`;
        }

        generalTableInfo.push({label: 'Read replicas (followers)', value: readReplicasConfig});
    }

    if (TTLSettings) {
        const ttlInfo = prepareTTL(TTLSettings);
        if (ttlInfo) {
            generalTableInfo.push(ttlInfo);
        }
    }

    generalTableInfo.push({
        label: 'Bloom filter',
        value: EnableFilterByKey ? 'Enabled' : 'Disabled',
    });

    return generalTableInfo;
};

/** Prepares data for Table, ColumnTable and ColumnStore */
export const prepareTableInfo = (
    data?: TEvDescribeSchemeResult,
    type?: EPathType,
    olapStats?: KeyValueRow[],
) => {
    if (!data) {
        return {};
    }

    const {PathDescription = {}} = data;

    const {
        TableStats = {},
        TabletMetrics = {},
        Table: {PartitionConfig = {}, TTLSettings} = {},
        ColumnTableDescription = {},
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
    } = TableStats;

    const {FollowerGroups, FollowerCount, CrossDataCenterFollowerCount} = PartitionConfig;

    let generalInfo: InfoViewerItem[] = [];

    switch (type) {
        case EPathType.EPathTypeTable: {
            generalInfo = prepareTableGeneralInfo(PartitionConfig, TTLSettings);
            break;
        }
        case EPathType.EPathTypeColumnTable: {
            generalInfo = prepareColumnTableGeneralInfo(ColumnTableDescription);
            break;
        }
    }

    let tableStatsInfo: InfoViewerItem[][];

    // There is no TableStats and TabletMetrics for ColumnTables inside ColumnStore
    // Therefore we parse olapStats
    if (type === EPathType.EPathTypeColumnTable && isInStoreColumnTable(ColumnTableDescription)) {
        tableStatsInfo = [prepareOlapStats(olapStats)];
    } else {
        tableStatsInfo = [
            formatObject(formatTableStatsItem, {
                PartCount,
                RowCount,
                DataSize,
                IndexSize,
            }),
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
    }

    const tabletMetricsInfo = formatObject(formatTabletMetricsItem, TabletMetrics);

    let partitionConfigInfo: InfoViewerItem[] = [];

    if (Array.isArray(FollowerGroups) && FollowerGroups.length > 0) {
        partitionConfigInfo = formatObject(formatFollowerGroupItem, FollowerGroups[0]);
    } else if (FollowerCount !== undefined) {
        partitionConfigInfo.push(formatPartitionConfigItem('FollowerCount', FollowerCount));
    } else if (CrossDataCenterFollowerCount !== undefined) {
        partitionConfigInfo.push(
            formatPartitionConfigItem('CrossDataCenterFollowerCount', CrossDataCenterFollowerCount),
        );
    }

    return {generalInfo, tableStatsInfo, tabletMetricsInfo, partitionConfigInfo};
};
