import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    fetchTopTables,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/executeTopTables/executeTopTables';
import type {KeyValueRow} from '../../../../../types/api/query';
import {formatBytes, getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';

import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

import '../TenantOverview.scss';

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
            wasLoaded={wasLoaded}
            error={error}
        />
    );
}
