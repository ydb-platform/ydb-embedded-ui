import DataTable from '@gravity-ui/react-data-table';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNumber, roundToPrecision} from '../../utils/dataFormatters/dataFormatters';
import {getUsageSeverity} from '../../utils/generateEvaluator';
import {InternalLink} from '../InternalLink';
import {LinkToSchemaObject} from '../LinkToSchemaObject/LinkToSchemaObject';
import {TabletNameWrapper} from '../TabletNameWrapper/TabletNameWrapper';
import {UsageLabel} from '../UsageLabel/UsageLabel';

import type {TopShardsColumnId} from './constants';
import {TOP_SHARDS_COLUMNS_IDS, TOP_SHARDS_COLUMNS_TITLES} from './constants';
import type {GetShardsColumn} from './types';
import {prepareDateTimeValue} from './utils';

export const getPathColumn: GetShardsColumn = ({schemaPath = ''}) => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.Path,
        header: TOP_SHARDS_COLUMNS_TITLES.Path,
        render: ({row}) => {
            // row.RelativePath - relative schema path
            return (
                <LinkToSchemaObject path={schemaPath + row.RelativePath}>
                    {row.RelativePath}
                </LinkToSchemaObject>
            );
        },
        width: 300,
    };
};
export const getDataSizeColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.DataSize,
        header: TOP_SHARDS_COLUMNS_TITLES.DataSize,
        render: ({row}) => {
            return formatNumber(row.DataSize);
        },
        align: DataTable.RIGHT,
    };
};
export const getTabletIdColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.TabletId,
        header: TOP_SHARDS_COLUMNS_TITLES.TabletId,
        render: ({row}) => {
            if (!row.TabletId) {
                return EMPTY_DATA_PLACEHOLDER;
            }
            return (
                <TabletNameWrapper
                    tabletId={row.TabletId}
                    followerId={row.FollowerId || undefined}
                />
            );
        },
        width: 220,
    };
};
export const getNodeIdColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.NodeId,
        header: TOP_SHARDS_COLUMNS_TITLES.NodeId,
        render: ({row}) => {
            if (!row.NodeId) {
                return EMPTY_DATA_PLACEHOLDER;
            }
            return <InternalLink to={getDefaultNodePath(row.NodeId)}>{row.NodeId}</InternalLink>;
        },
        align: DataTable.RIGHT,
    };
};
export const getCpuCoresColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.CPUCores,
        header: TOP_SHARDS_COLUMNS_TITLES.CPUCores,
        render: ({row}) => {
            const usage = Number(row.CPUCores) * 100 || 0;
            return (
                <UsageLabel value={roundToPrecision(usage, 2)} theme={getUsageSeverity(usage)} />
            );
        },
        align: DataTable.LEFT,
        width: 110,
        resizeMinWidth: 110,
    };
};
export const getInFlightTxCountColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.InFlightTxCount,
        header: TOP_SHARDS_COLUMNS_TITLES.InFlightTxCount,
        render: ({row}) => formatNumber(row.InFlightTxCount),
        align: DataTable.RIGHT,
    };
};
export const getPeakTimeColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.PeakTime,
        render: ({row}) => {
            return prepareDateTimeValue(row.PeakTime);
        },
    };
};
export const getIntervalEndColumn: GetShardsColumn = () => {
    return {
        name: TOP_SHARDS_COLUMNS_IDS.IntervalEnd,
        render: ({row}) => {
            return prepareDateTimeValue(row.IntervalEnd);
        },
    };
};

export const shardsColumnIdToGetColumn: Record<TopShardsColumnId, GetShardsColumn> = {
    [TOP_SHARDS_COLUMNS_IDS.Path]: getPathColumn,
    [TOP_SHARDS_COLUMNS_IDS.DataSize]: getDataSizeColumn,
    [TOP_SHARDS_COLUMNS_IDS.TabletId]: getTabletIdColumn,
    [TOP_SHARDS_COLUMNS_IDS.NodeId]: getNodeIdColumn,
    [TOP_SHARDS_COLUMNS_IDS.CPUCores]: getCpuCoresColumn,
    [TOP_SHARDS_COLUMNS_IDS.InFlightTxCount]: getInFlightTxCountColumn,
    [TOP_SHARDS_COLUMNS_IDS.PeakTime]: getPeakTimeColumn,
    [TOP_SHARDS_COLUMNS_IDS.IntervalEnd]: getIntervalEndColumn,
};
