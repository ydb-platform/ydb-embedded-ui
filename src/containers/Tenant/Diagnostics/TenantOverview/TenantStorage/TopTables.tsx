import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {useLocation} from 'react-router';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {topTablesApi} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {DEFAULT_POLLING_INTERVAL} from '../../../../../utils/constants';
import {useTypedSelector} from '../../../../../utils/hooks';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

import '../TenantOverview.scss';

interface TopTablesProps {
    path: string;
}

export function TopTables({path}: TopTablesProps) {
    const location = useLocation();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {currentData, error, isFetching} = topTablesApi.useGetTopTablesQuery(
        {path},
        {pollingInterval: autorefresh ? DEFAULT_POLLING_INTERVAL : 0},
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
            width: 80,
            sortable: false,
            render: ({row}) => formatSize(Number(row.Size)),
            align: DataTable.RIGHT,
        },
        {
            name: 'Path',
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
            data={data || []}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
        />
    );
}
