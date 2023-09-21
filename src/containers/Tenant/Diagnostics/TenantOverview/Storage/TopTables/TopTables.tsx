import {useRef} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Popover} from '@gravity-ui/uikit';

import {DEFAULT_TABLE_SETTINGS} from '../../../../../../utils/constants';
import type {KeyValueRow} from '../../../../../../types/api/query';
import {useAutofetcher, useTypedSelector} from '../../../../../../utils/hooks';
import {fetchTopTables, setTopTablesState} from '../../../../../../store/reducers/executeTopTables';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../../utils/bytesParsers';
import {TableSkeleton} from '../../../../../../components/TableSkeleton/TableSkeleton';
import {AccessDenied} from '../../../../../../components/Errors/403';
import {ResponseError} from '../../../../../../components/Errors/ResponseError';

import './TopTables.scss';

const b = cn('kv-top-tables');

interface TopTablesProps {
    path: string;
}

export function TopTables({path}: TopTablesProps) {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const preventFetch = useRef(false);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
    } = useTypedSelector((state) => state.executeTopTables);

    useAutofetcher(
        (isBackground) => {
            if (preventFetch.current) {
                preventFetch.current = false;
                return;
            }

            if (!isBackground) {
                dispatch(
                    setTopTablesState({
                        loading: true,
                        wasLoaded: false,
                        data: undefined,
                    }),
                );
            }

            dispatch(fetchTopTables({database: path}));
        },
        [dispatch, path],
        autorefresh,
    );

    const formatSize = (value?: number) => {
        const size = getSizeWithSignificantDigits(data?.length ? Number(data[0].Size) : 0, 0);

        return formatBytes({value, size, precision: 1});
    };

    const COLUMNS: Column<KeyValueRow>[] = [
        {
            name: 'Size',
            width: 80,
            sortable: false,
            render: ({row}) => formatSize(Number(row.Size)),
        },
        {
            name: 'Path',
            width: 792,
            sortable: false,
            render: ({row}) => (
                <div className={b('path-cell-wrapper')}>
                    <Popover className={b('path-cell')} content={row.Path}>
                        {row.Path}
                    </Popover>
                </div>
            ),
        },
    ];

    const renderContent = () => {
        if (error) {
            if (error.status === 403) {
                return <AccessDenied />;
            }
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={5} />;
        }

        return (
            <DataTable
                columns={COLUMNS}
                data={data || []}
                theme="yandex-cloud"
                settings={DEFAULT_TABLE_SETTINGS}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top tables by size</div>
            <div className={b()}>{renderContent()}</div>
        </>
    );
}
