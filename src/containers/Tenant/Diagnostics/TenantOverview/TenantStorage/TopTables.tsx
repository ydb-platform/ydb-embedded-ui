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
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';

import './TenantStorage.scss';

const b = cn('tenant-overview-storage');

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
            render: ({row}) => (
                <LinkToSchemaObject
                    className={b('cell-with-popover-wrapper')}
                    path={row.Path as string}
                    location={location}
                >
                    <Popover className={b('cell-with-popover')} content={row.Path}>
                        {row.Path}
                    </Popover>
                </LinkToSchemaObject>
            ),
        },
    ];

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                data={data || []}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top tables by size</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
}
