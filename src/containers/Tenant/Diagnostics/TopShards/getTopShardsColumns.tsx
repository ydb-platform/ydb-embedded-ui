import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import type {Location} from 'history';

import {InternalLink} from '../../../../components/InternalLink';
import {LinkToSchemaObject} from '../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {TabletNameWrapper} from '../../../../components/TabletNameWrapper/TabletNameWrapper';
import {UsageLabel} from '../../../../components/UsageLabel/UsageLabel';
import {getLoadSeverityForShard} from '../../../../store/reducers/tenantOverview/topShards/utils';
import type {KeyValueRow} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import {formatNumber, roundToPrecision} from '../../../../utils/dataFormatters/dataFormatters';
import {getDefaultNodePath} from '../../../Node/NodePages';

export const TOP_SHARDS_COLUMNS_WIDTH_LS_KEY = 'topShardsColumnsWidth';

const TOP_SHARDS_COLUMNS_IDS = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
} as const;

type TopShardsColumns = ValueOf<typeof TOP_SHARDS_COLUMNS_IDS>;

const tableColumnsNames: Record<TopShardsColumns, string> = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize (B)',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
};

function prepareCPUWorkloadValue(value: string | number) {
    return `${roundToPrecision(Number(value) * 100, 2)}%`;
}

const getPathColumn = (schemaPath: string, location: Location): Column<KeyValueRow> => ({
    name: TOP_SHARDS_COLUMNS_IDS.Path,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.Path],
    render: ({row}) => {
        // row.Path - relative schema path
        return (
            <LinkToSchemaObject path={schemaPath + row.Path} location={location}>
                {row.Path}
            </LinkToSchemaObject>
        );
    },
    sortable: false,
    width: 300,
});

const cpuCoresColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.CPUCores,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.CPUCores],
    render: ({row}) => {
        return prepareCPUWorkloadValue(row.CPUCores || 0);
    },
    align: DataTable.RIGHT,
};

const dataSizeColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.DataSize,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.DataSize],
    render: ({row}) => {
        return formatNumber(row.DataSize);
    },
    align: DataTable.RIGHT,
};

const tabletIdColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.TabletId,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.TabletId],
    render: ({row}) => {
        if (!row.TabletId) {
            return '–';
        }
        return <TabletNameWrapper tabletId={row.TabletId} />;
    },
    sortable: false,
    width: 220,
};

const nodeIdColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.NodeId,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.NodeId],
    render: ({row}) => {
        if (!row.NodeId) {
            return '–';
        }
        return <InternalLink to={getDefaultNodePath(row.NodeId)}>{row.NodeId}</InternalLink>;
    },
    align: DataTable.RIGHT,
};

const topShardsCpuCoresColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.CPUCores,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.CPUCores],
    render: ({row}) => {
        return (
            <UsageLabel
                value={roundToPrecision(Number(row.CPUCores) * 100, 2)}
                theme={getLoadSeverityForShard(Number(row.CPUCores) * 100)}
            />
        );
    },
    align: DataTable.RIGHT,
    sortable: false,
    width: 140,
    resizeMinWidth: 140,
};

const inFlightTxCountColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.InFlightTxCount,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.InFlightTxCount],
    render: ({row}) => formatNumber(row.InFlightTxCount),
    align: DataTable.RIGHT,
};

export const getShardsWorkloadColumns = (schemaPath: string, location: Location) => {
    return [
        getPathColumn(schemaPath, location),
        cpuCoresColumn,
        dataSizeColumn,
        tabletIdColumn,
        nodeIdColumn,
        inFlightTxCountColumn,
    ];
};

export const getTopShardsColumns = (schemaPath: string, location: Location) => {
    return [tabletIdColumn, getPathColumn(schemaPath, location), topShardsCpuCoresColumn];
};
