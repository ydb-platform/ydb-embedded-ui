import {Text} from '@gravity-ui/uikit';
import omit from 'lodash/omit';

import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {formatObject} from '../../../../../components/InfoViewer';
import {
    formatFollowerGroupItem,
    formatPartitionConfigItem,
    formatTableStatsItem,
    formatTabletMetricsItem,
} from '../../../../../components/InfoViewer/formatters';
import type {
    TColumnDataLifeCycle,
    TColumnTableDescription,
    TEvDescribeSchemeResult,
    TPartitionConfig,
    TTTLSettings,
} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import {formatBytes, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatDurationToShortTimeFormat} from '../../../../../utils/timeParsers';

import i18n from './i18n';

const isInStoreColumnTable = (table: TColumnTableDescription) => {
    // SchemaPresetId could be 0
    return table.SchemaPresetName && table.SchemaPresetId !== undefined;
};

const prepareTTL = (ttl: TTTLSettings | TColumnDataLifeCycle) => {
    // ExpireAfterSeconds could be 0
    if (ttl.Enabled && ttl.Enabled.ColumnName && ttl.Enabled.ExpireAfterSeconds !== undefined) {
        const value = i18n('value.ttl', {
            columnName: ttl.Enabled.ColumnName,
            expireTime: formatDurationToShortTimeFormat(ttl.Enabled.ExpireAfterSeconds * 1000, 1),
        });

        return {label: i18n('label.ttl'), value};
    }
    return undefined;
};

function prepareColumnTableGeneralInfo(columnTable: TColumnTableDescription) {
    const columnTableGeneralInfo: InfoViewerItem[] = [];

    columnTableGeneralInfo.push({
        label: i18n('label.standalone'),
        value: String(!isInStoreColumnTable(columnTable)),
    });

    if (columnTable.Sharding?.HashSharding?.Columns) {
        const columns = columnTable.Sharding.HashSharding.Columns.join(', ');
        const content = `PARTITION BY HASH(${columns})`;

        columnTableGeneralInfo.push({
            label: i18n('label.partitioning'),
            value: (
                <Text variant="code-2" wordBreak="break-word">
                    {content}
                </Text>
            ),
        });
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
            ? i18n('value.partitioning-by-size.enabled', {
                  size: formatBytes(PartitioningPolicy.SizeToSplit),
              })
            : i18n('disabled');

    const partitioningByLoad = PartitioningPolicy.SplitByLoadSettings?.Enabled
        ? i18n('enabled')
        : i18n('disabled');

    generalTableInfo.push(
        {label: i18n('label.partitioning-by-size'), value: partitioningBySize},
        {label: i18n('label.partitioning-by-load'), value: partitioningByLoad},
        {
            label: i18n('label.partitions-min'),
            value: formatNumber(PartitioningPolicy.MinPartitionsCount || 0),
        },
    );

    if (PartitioningPolicy.MaxPartitionsCount) {
        generalTableInfo.push({
            label: i18n('label.partitions-max'),
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

        generalTableInfo.push({label: i18n('label.read-replicas'), value: readReplicasConfig});
    }

    if (TTLSettings) {
        const ttlInfo = prepareTTL(TTLSettings);
        if (ttlInfo) {
            generalTableInfo.push(ttlInfo);
        }
    }

    generalTableInfo.push({
        label: i18n('label.bloom-filter'),
        value: EnableFilterByKey ? i18n('enabled') : i18n('disabled'),
    });

    return generalTableInfo;
};

/** Prepares data for Table, ColumnTable and ColumnStore */
export const prepareTableInfo = (data?: TEvDescribeSchemeResult, type?: EPathType) => {
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

    const tableStatsInfo = [
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

    const tabletMetricsInfo = formatObject(
        formatTabletMetricsItem,
        omit(TabletMetrics, [
            'GroupReadIops',
            'GroupReadThroughput',
            'GroupWriteIops',
            'GroupWriteThroughput',
        ]),
    );

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
