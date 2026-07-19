import type {YDBDefinitionListItem} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {EPathType} from '../../../../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../../../../types/api/schema';
import type {ManagePartitioningFormState} from '../ManagePartitioningDialog/types';

import {
    prepareGeneralMetrics,
    prepareGeneralStats,
    preparePartitionConfigInfo,
    prepareTableStatsInfo,
    prepareTabletMetricsInfo,
} from './prepareCommonTableInfo';
import {
    prepareManagePartitioningDialogConfig,
    preparePartitionProgressConfig,
} from './preparePartitionConfig';
import {prepareRowTableGeneralInfo} from './prepareRowTableInfo';
import type {PartitionProgressConfig} from './renderHelpers';

export type {PartitionProgressConfig} from './renderHelpers';

export interface PreparedTableInfo {
    generalInfoLeft: YDBDefinitionListItem[];
    generalInfoRight: YDBDefinitionListItem[];
    generalStats: YDBDefinitionListItem[];
    tableStatsInfo: YDBDefinitionListItem[][];
    generalMetrics: YDBDefinitionListItem[];
    tabletMetricsInfo: YDBDefinitionListItem[];
    partitionConfigInfo: YDBDefinitionListItem[];
    partitionProgressConfig?: PartitionProgressConfig;
    managePartitioningDialogConfig?: ManagePartitioningFormState;
    hasMoreLeft: boolean;
    hasMoreRight: boolean;
}

/**
 * Prepares all table information for display.
 * Prepares row-table-specific information and statistics shared by all table types.
 * @param data - Schema description result from YDB API
 * @param type - Path type (Table, ColumnTable, ColumnStore)
 * @returns Prepared table information organized by sections
 */
export function prepareTableInfo(
    data?: TEvDescribeSchemeResult,
    type?: EPathType,
): Partial<PreparedTableInfo> & Pick<PreparedTableInfo, 'hasMoreLeft' | 'hasMoreRight'> {
    if (!data) {
        return {
            hasMoreLeft: false,
            hasMoreRight: false,
        };
    }

    const {PathDescription = {}} = data;

    const {
        TablePartitions,
        TableStats = {},
        TabletMetrics = {},
        Table: {PartitionConfig = {}, TTLSettings} = {},
    } = PathDescription;

    let generalInfoLeft: YDBDefinitionListItem[] = [];
    let generalInfoRight: YDBDefinitionListItem[] = [];
    let partitionProgressConfig: PartitionProgressConfig | undefined;
    let managePartitioningDialogConfig: ManagePartitioningFormState | undefined;

    if (type === EPathType.EPathTypeTable) {
        partitionProgressConfig = preparePartitionProgressConfig(PartitionConfig, TablePartitions);

        managePartitioningDialogConfig = prepareManagePartitioningDialogConfig(
            PartitionConfig,
            partitionProgressConfig,
        );

        const {left, right} = prepareRowTableGeneralInfo(
            PartitionConfig,
            partitionProgressConfig,
            TTLSettings,
        );
        generalInfoLeft = left;
        generalInfoRight = right;
    }

    // Prepare common information (shared across all table types)
    const generalStats = prepareGeneralStats(TableStats);
    const tableStatsInfo = prepareTableStatsInfo(TableStats, PartitionConfig);
    const generalMetrics = prepareGeneralMetrics(TabletMetrics as Record<string, unknown>);
    const tabletMetricsInfo = prepareTabletMetricsInfo(TabletMetrics as Record<string, unknown>);
    const partitionConfigInfo = preparePartitionConfigInfo(PartitionConfig);

    // Calculate if there's expandable content
    const hasMoreLeft = tableStatsInfo.some((items) => items.length > 0);
    const hasMoreRight = tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0;

    return {
        generalInfoLeft,
        generalInfoRight,
        generalStats,
        tableStatsInfo,
        generalMetrics,
        tabletMetricsInfo,
        partitionConfigInfo,
        partitionProgressConfig,
        managePartitioningDialogConfig,
        hasMoreLeft,
        hasMoreRight,
    };
}
