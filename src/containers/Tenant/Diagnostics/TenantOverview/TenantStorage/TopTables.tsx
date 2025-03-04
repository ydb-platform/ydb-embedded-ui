import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {useLocation} from 'react-router-dom';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {topTablesApi} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getBytesSizeUnit} from '../../../../../utils/bytesParsers';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

import '../TenantOverview.scss';

interface TopTablesProps {
    path: string;
}

const TOP_TABLES_COLUMNS_WIDTH_LS_KEY = 'topTablesTableColumnsWidth';

export function TopTables({path}: TopTablesProps) {
    const location = useLocation();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, error, isFetching} = topTablesApi.useGetTopTablesQuery(
        {path},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    const data = currentData?.resultSets?.[0]?.result || [];

    const formatSize = (value?: number) => {
        const size = getBytesSizeUnit(data?.length ? Number(data[0].Size) : 0);

        return formatBytes({value, size, precision: 1});
    };

    const columns: Column<KeyValueRow>[] = [
        {
            name: 'Size',
            width: 100,
            render: ({row}) => formatSize(Number(row.Size)),
            align: DataTable.RIGHT,
        },
        {
            name: 'Path',
            width: 700,
            render: ({row}) =>
                row.Path ? (
                    <CellWithPopover content={row.Path}>
                        <LinkToSchemaObject path={String(row.Path)} location={location}>
                            {row.Path}
                        </LinkToSchemaObject>
                    </CellWithPopover>
                ) : null,
        },
    ];
    const title = getSectionTitle({
        entity: i18n('tables'),
        postfix: i18n('by-size'),
    });

    return (
        <TenantOverviewTableLayout
            title={title}
            loading={loading}
            error={parseQueryErrorToString(error)}
            withData={Boolean(currentData)}
        >
            <ResizeableDataTable
                columnsWidthLSKey={TOP_TABLES_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
