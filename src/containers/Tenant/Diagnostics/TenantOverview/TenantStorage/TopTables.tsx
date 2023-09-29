import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Popover} from '@gravity-ui/uikit';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    fetchTopTables,
    setTopTablesState,
} from '../../../../../store/reducers/executeTopTables/executeTopTables';
import {DEFAULT_TABLE_SETTINGS} from '../../../../../utils/constants';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../../components/Errors/ResponseError';

import './TenantStorage.scss';

const b = cn('tenant-overview-storage');

interface TopTablesProps {
    path: string;
}

export function TopTables({path}: TopTablesProps) {
    const dispatch = useDispatch();

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
                dispatch(
                    setTopTablesState({
                        wasLoaded: false,
                    }),
                );
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
                <div className={b('cell-with-popover-wrapper')}>
                    <Popover className={b('cell-with-popover')} content={row.Path}>
                        {row.Path}
                    </Popover>
                </div>
            ),
        },
    ];

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={5} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                columns={columns}
                settings={{...DEFAULT_TABLE_SETTINGS, stickyHead: undefined, dynamicRender: false}}
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
