import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {topTablesApi} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

import {formatTenantStorageTableMetric} from './displayFormatters';

interface TopTablesProps {
    database: string;
}

const TOP_TABLES_COLUMNS_WIDTH_LS_KEY = 'topTablesTableColumnsWidth';

function getColumns() {
    const columns: Column<KeyValueRow>[] = [
        {
            name: 'Size',
            width: 100,
            render: ({row}) => formatTenantStorageTableMetric(row.Size),
            align: DataTable.RIGHT,
        },
        {
            name: 'Path',
            width: 700,
            render: ({row}) =>
                row.Path ? (
                    <CellWithPopover content={row.Path}>
                        <LinkToSchemaObject path={String(row.Path)}>{row.Path}</LinkToSchemaObject>
                    </CellWithPopover>
                ) : null,
        },
    ];
    return columns;
}

export function TopTables({database}: TopTablesProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, error, isFetching} = topTablesApi.useGetTopTablesQuery(
        {database},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    const data = currentData?.resultSets?.[0]?.result || [];
    const columns = React.useMemo(() => getColumns(), []);

    return (
        <TenantOverviewTableLayout loading={loading} error={error} withData={Boolean(currentData)}>
            <ResizeableDataTable
                columnsWidthLSKey={TOP_TABLES_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
