import {CircleQuestion} from '@gravity-ui/icons';
import {Flex, Icon, Label, Popover, Text} from '@gravity-ui/uikit';
import omit from 'lodash/omit';

import {toFormattedSize} from '../../../../../components/FormattedBytes/utils';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {
    formatFollowerGroupItem,
    formatPartitionConfigItem,
    formatTableStatsItem,
    formatTabletMetricsItem,
} from '../../../../../components/YDBDefinitionList/formatters';
import {formatObjectToDefinitionItems} from '../../../../../components/YDBDefinitionList/utils';
import type {
    TColumnDataLifeCycle,
    TColumnTableDescription,
    TEvDescribeSchemeResult,
    TPartitionConfig,
    TTTLSettings,
    TTablePartition,
} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import {formatBytes, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {formatDurationToShortTimeFormat} from '../../../../../utils/timeParsers';
import {isNumeric} from '../../../../../utils/utils';

import {StatusIcon} from './StatusIcon/StatusIcon';
import {b} from './TableInfo';
import i18n from './i18n';

const isInStoreColumnTable = (table: TColumnTableDescription) => {
    // SchemaPresetId could be 0
    return table.SchemaPresetName && table.SchemaPresetId !== undefined;
};

const prepareTTL = (ttl: TTTLSettings | TColumnDataLifeCycle) => {
    // ExpireAfterSeconds could be 0
    if (ttl.Enabled && ttl.Enabled.ColumnName && ttl.Enabled.ExpireAfterSeconds !== undefined) {
        const value = i18n('value_ttl-config', {
            columnName: ttl.Enabled.ColumnName,
            expireTime: formatDurationToShortTimeFormat(ttl.Enabled.ExpireAfterSeconds * 1000, 1),
        });

        return {name: i18n('field_ttl-for-rows'), content: value};
    }
    return undefined;
};

function prepareColumnTableGeneralInfo(columnTable: TColumnTableDescription) {
    const left: YDBDefinitionListItem[] = [];

    left.push({
        name: i18n('field_standalone'),
        content: String(!isInStoreColumnTable(columnTable)),
    });

    if (columnTable.Sharding?.HashSharding?.Columns) {
        const columns = columnTable.Sharding.HashSharding.Columns.join(', ');
        const content = `PARTITION BY HASH(${columns})`;

        left.push({
            name: i18n('field_partitioning'),
            content: (
                <Text variant="code-2" wordBreak="break-word">
                    {content}
                </Text>
            ),
        });
    }

    if (columnTable.TtlSettings) {
        const ttlInfo = prepareTTL(columnTable?.TtlSettings);
        if (ttlInfo) {
            left.push(ttlInfo);
        }
    }

    return left;
}

const renderCurrentPartitionsContent = (progress: PartitionProgressConfig) => {
    const {minPartitions, maxPartitions, partitionsCount} = progress;

    const isOutOfRange =
        partitionsCount < minPartitions ||
        (maxPartitions !== undefined && partitionsCount > maxPartitions);

    return (
        <Label theme={isOutOfRange ? 'danger' : undefined}>
            <Flex gap="2" alignItems="center">
                {formatNumber(partitionsCount)}
                {isOutOfRange && (
                    <Popover
                        placement="auto-start"
                        content={i18n('hint_current-partitions-out-of-range')}
                        className={b('partitions-popover')}
                    >
                        <Icon data={CircleQuestion} />
                    </Popover>
                )}
            </Flex>
        </Label>
    );
};

const prepareTableGeneralInfo = (
    PartitionConfig: TPartitionConfig,
    progress: PartitionProgressConfig,
    TTLSettings?: TTTLSettings,
) => {
    const {PartitioningPolicy = {}, FollowerGroups, EnableFilterByKey} = PartitionConfig;

    const left: YDBDefinitionListItem[] = [];
    const right: YDBDefinitionListItem[] = [];

    const partitioningByLoad = PartitioningPolicy.SplitByLoadSettings?.Enabled ? (
        <Label>{PartitioningPolicy.SplitByLoadSettings.CpuPercentageThreshold ?? '50%'}</Label>
    ) : (
        <Label theme="unknown">{i18n('value_disabled')}</Label>
    );

    left.push(
        {
            name: i18n('field_current-partitions'),
            content: renderCurrentPartitionsContent(progress),
        },
        {
            name: i18n('field_partitioning-by-size'),
            content: <Label>{formatBytes(PartitioningPolicy.SizeToSplit) || '2 GB'}</Label>,
        },
        {name: i18n('field_partitioning-by-load'), content: partitioningByLoad},
    );

    if (TTLSettings) {
        const ttlInfo = prepareTTL(TTLSettings);
        if (ttlInfo) {
            left.push(ttlInfo);
        }
    }

    let readReplicasConfig;
    if (FollowerGroups && FollowerGroups.length) {
        const {RequireAllDataCenters, FollowerCountPerDataCenter, FollowerCount} =
            FollowerGroups[0];

        readReplicasConfig =
            RequireAllDataCenters && FollowerCountPerDataCenter
                ? `PER_AZ: ${FollowerCount}`
                : `ANY_AZ: ${FollowerCount}`;
    } else {
        readReplicasConfig = i18n('value_no');
    }

    right.push(
        {name: i18n('field_read-replicas'), content: readReplicasConfig},
        {
            name: i18n('field_bloom-filter'),
            content: <StatusIcon value={Boolean(EnableFilterByKey)} />,
        },
    );

    return {left, right};
};

type PartitionProgressConfig = {
    minPartitions: number;
    maxPartitions?: number;
    partitionsCount: number;
};

const preparePartitionProgressConfig = (
    PartitionConfig: TPartitionConfig,
    TablePartitions?: TTablePartition[],
): PartitionProgressConfig => {
    const {PartitioningPolicy} = PartitionConfig;

    // We are convinced, there is always at least one partition;
    // fallback and clamp to 1 if value is missing.
    const minPartitions = Math.max(1, PartitioningPolicy?.MinPartitionsCount ?? 1);
    const maxPartitions = PartitioningPolicy?.MaxPartitionsCount;
    const partitionsCount = TablePartitions?.length ?? 1;

    return {
        minPartitions,
        maxPartitions,
        partitionsCount,
    };
};

/** Prepares data for Table, ColumnTable and ColumnStore */
export const prepareTableInfo = (data?: TEvDescribeSchemeResult, type?: EPathType) => {
    if (!data) {
        return {};
    }

    const {PathDescription = {}} = data;

    const {
        TablePartitions,
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

    const {FollowerGroups, FollowerCount, CrossDataCenterFollowerCount} = PartitionConfig;

    let generalInfoLeft: YDBDefinitionListItem[] = [];
    let generalInfoRight: YDBDefinitionListItem[] = [];
    let partitionProgressConfig: PartitionProgressConfig | undefined;

    switch (type) {
        case EPathType.EPathTypeTable: {
            partitionProgressConfig = preparePartitionProgressConfig(
                PartitionConfig,
                TablePartitions,
            );

            const {left, right} = prepareTableGeneralInfo(
                PartitionConfig,
                partitionProgressConfig,
                TTLSettings,
            );
            generalInfoLeft = left;
            generalInfoRight = right;
            break;
        }
        case EPathType.EPathTypeColumnTable: {
            generalInfoLeft = prepareColumnTableGeneralInfo(ColumnTableDescription);
            break;
        }
    }

    const generalStats = formatObjectToDefinitionItems(formatTableStatsItem, {
        PartCount,
        RowCount,
        DataSize,
        IndexSize,
    });

    if (
        isNumeric(ByKeyFilterSize) &&
        (PartitionConfig.EnableFilterByKey || Number(ByKeyFilterSize) > 0)
    ) {
        generalStats.push({name: 'BloomFilterSize', content: toFormattedSize(ByKeyFilterSize)});
    }

    const tableStatsInfo = [
        generalStats,
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

    const tabletMetricsInfo = formatObjectToDefinitionItems(
        formatTabletMetricsItem,
        omit(TabletMetrics, [
            'GroupReadIops',
            'GroupReadThroughput',
            'GroupWriteIops',
            'GroupWriteThroughput',
        ]),
    );

    let partitionConfigInfo: YDBDefinitionListItem[] = [];

    if (Array.isArray(FollowerGroups) && FollowerGroups.length > 0) {
        partitionConfigInfo = formatObjectToDefinitionItems(
            formatFollowerGroupItem,
            FollowerGroups[0],
        );
    } else if (FollowerCount !== undefined) {
        partitionConfigInfo.push(formatPartitionConfigItem('FollowerCount', FollowerCount));
    } else if (CrossDataCenterFollowerCount !== undefined) {
        partitionConfigInfo.push(
            formatPartitionConfigItem('CrossDataCenterFollowerCount', CrossDataCenterFollowerCount),
        );
    }

    return {
        generalInfoRight,
        generalInfoLeft,
        tableStatsInfo,
        tabletMetricsInfo,
        partitionConfigInfo,
        partitionProgressConfig,
    };
};
