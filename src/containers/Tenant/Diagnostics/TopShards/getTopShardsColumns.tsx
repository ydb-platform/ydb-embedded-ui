import cn from 'bem-cn-lite';

import DataTable, {type Column} from '@gravity-ui/react-data-table';
import {Label} from '@gravity-ui/uikit';

import type {KeyValueRow} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import {formatNumber, roundToPrecision} from '../../../../utils/dataFormatters/dataFormatters';
import {getLoadSeverityForShard} from '../../../../store/reducers/tenantOverview/executeTopShards/utils';
import {InternalLink} from '../../../../components/InternalLink';
import routes, {createHref} from '../../../../routes';
import {getDefaultNodePath} from '../../../Node/NodePages';

import './TopShards.scss';

const b = cn('top-shards');
const bLink = cn('yc-link');

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

const getPathColumn = (
    onSchemaClick: (schemaPath: string) => () => void,
    tenantPath: string,
): Column<KeyValueRow> => ({
    name: TOP_SHARDS_COLUMNS_IDS.Path,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.Path],
    render: ({row}) => {
        // row.Path - relative schema path
        return (
            <span
                onClick={onSchemaClick(tenantPath + row.Path)}
                className={bLink({view: 'normal'})}
            >
                {row.Path}
            </span>
        );
    },
    sortable: false,
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
        return (
            <InternalLink to={createHref(routes.tablet, {id: row.TabletId})}>
                {row.TabletId}
            </InternalLink>
        );
    },
    sortable: false,
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
            <>
                <Label
                    theme={getLoadSeverityForShard(Number(row.CPUCores) * 100)}
                    className={b('usage-label', {overload: Number(row.CPUCores) * 100 >= 90})}
                >
                    {roundToPrecision(Number(row.CPUCores) * 100, 2)}%
                </Label>
            </>
        );
    },
    align: DataTable.RIGHT,
    sortable: false,
};

const inFlightTxCountColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.InFlightTxCount,
    header: tableColumnsNames[TOP_SHARDS_COLUMNS_IDS.InFlightTxCount],
    render: ({row}) => formatNumber(row.InFlightTxCount),
    align: DataTable.RIGHT,
};

export const getShardsWorkloadColumns = (
    onSchemaClick: (schemaPath: string) => () => void,
    tenantPath: string,
) => {
    return [
        getPathColumn(onSchemaClick, tenantPath),
        cpuCoresColumn,
        dataSizeColumn,
        tabletIdColumn,
        nodeIdColumn,
        inFlightTxCountColumn,
    ];
};

export const getTopShardsColumns = (
    onSchemaClick: (schemaPath: string) => () => void,
    tenantPath: string,
) => {
    return [tabletIdColumn, getPathColumn(onSchemaClick, tenantPath), topShardsCpuCoresColumn];
};
