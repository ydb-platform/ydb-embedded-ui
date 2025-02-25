import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import type {Location} from 'history';

import {InternalLink} from '../../../../../components/InternalLink';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {TabletNameWrapper} from '../../../../../components/TabletNameWrapper/TabletNameWrapper';
import {UsageLabel} from '../../../../../components/UsageLabel/UsageLabel';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatNumber, roundToPrecision} from '../../../../../utils/dataFormatters/dataFormatters';
import {getUsageSeverity} from '../../../../../utils/generateEvaluator';
import {getDefaultNodePath} from '../../../../Node/NodePages';

import {TOP_SHARDS_COLUMNS_IDS, TOP_SHARDS_COLUMNS_TITLES} from './constants';

function prepareCPUWorkloadValue(value: string | number) {
    return `${roundToPrecision(Number(value) * 100, 2)}%`;
}

const getPathColumn = (schemaPath: string, location: Location): Column<KeyValueRow> => ({
    name: TOP_SHARDS_COLUMNS_IDS.Path,
    header: TOP_SHARDS_COLUMNS_TITLES.Path,
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
    header: TOP_SHARDS_COLUMNS_TITLES.CPUCores,
    render: ({row}) => {
        return prepareCPUWorkloadValue(row.CPUCores || 0);
    },
    align: DataTable.RIGHT,
};

const dataSizeColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.DataSize,
    header: TOP_SHARDS_COLUMNS_TITLES.DataSize,
    render: ({row}) => {
        return formatNumber(row.DataSize);
    },
    align: DataTable.RIGHT,
};

const tabletIdColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.TabletId,
    header: TOP_SHARDS_COLUMNS_TITLES.TabletId,
    render: ({row}) => {
        if (!row.TabletId) {
            return '–';
        }
        return <TabletNameWrapper tabletId={row.TabletId} />;
    },
    sortable: false,
    width: 220,
};

const getNodeIdColumn = (database?: string): Column<KeyValueRow> => ({
    name: TOP_SHARDS_COLUMNS_IDS.NodeId,
    header: TOP_SHARDS_COLUMNS_TITLES.NodeId,
    render: ({row}) => {
        if (!row.NodeId) {
            return '–';
        }
        return (
            <InternalLink to={getDefaultNodePath(row.NodeId, {database})}>
                {row.NodeId}
            </InternalLink>
        );
    },
    align: DataTable.RIGHT,
});

const topShardsCpuCoresColumn: Column<KeyValueRow> = {
    name: TOP_SHARDS_COLUMNS_IDS.CPUCores,
    header: TOP_SHARDS_COLUMNS_TITLES.CPUCores,
    render: ({row}) => {
        return (
            <UsageLabel
                value={roundToPrecision(Number(row.CPUCores) * 100, 2)}
                theme={getUsageSeverity(Number(row.CPUCores) * 100)}
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
    header: TOP_SHARDS_COLUMNS_TITLES.InFlightTxCount,
    render: ({row}) => formatNumber(row.InFlightTxCount),
    align: DataTable.RIGHT,
};

export const getShardsWorkloadColumns = (
    schemaPath: string,
    location: Location,
    database?: string,
) => {
    return [
        getPathColumn(schemaPath, location),
        cpuCoresColumn,
        dataSizeColumn,
        tabletIdColumn,
        getNodeIdColumn(database),
        inFlightTxCountColumn,
    ];
};

export const getTopShardsColumns = (schemaPath: string, location: Location) => {
    return [tabletIdColumn, getPathColumn(schemaPath, location), topShardsCpuCoresColumn];
};
