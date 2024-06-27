import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {useLocation} from 'react-router';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {topTablesApi} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
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

    const {result: data} = currentData || {};

    const formatSize = (value?: number) => {
        const size = getSizeWithSignificantDigits(data?.length ? Number(data[0].Size) : 0, 0);

        return formatBytes({value, size, precision: 1});
    };

    const columns: Column<KeyValueRow>[] = [
        {
            name: 'Size',
            width: 100,
            sortable: false,
            render: ({row}) => formatSize(Number(row.Size)),
            align: DataTable.RIGHT,
        },
        {
            name: 'Path',
            width: 700,
            sortable: false,
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
            columnsWidthLSKey={TOP_TABLES_COLUMNS_WIDTH_LS_KEY}
            data={data || []}
            columns={columns}
            title={title}
            loading={loading}
            error={parseQueryErrorToString(error)}
        />
    );
}
