import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Popover} from '@gravity-ui/uikit';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    fetchTopTables,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

import '../TenantOverview.scss';

const b = cn('tenant-overview');

interface TopTablesProps {
    path: string;
}

export function TopTables({path}: TopTablesProps) {
    const dispatch = useDispatch();
    const location = useLocation();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
    } = useTypedSelector((state) => state.executeTopTables);

    useAutofetcher(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(fetchTopTables(path));
        },
        [dispatch, path],
        autorefresh,
    );

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
                    <LinkToSchemaObject
                        className={b('cell-with-popover-wrapper')}
                        path={String(row.Path)}
                        location={location}
                    >
                        <Popover className={b('cell-with-popover')} content={row.Path}>
                            {row.Path}
                        </Popover>
                    </LinkToSchemaObject>
                ) : null,
        },
    ];

    return (
        <TenantOverviewTableLayout
            data={data || []}
            columns={columns}
            title="Top tables by size"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
        />
    );
}
