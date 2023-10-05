import cn from 'bem-cn-lite';
import qs from 'qs';
import {useDispatch} from 'react-redux';
import {useHistory, useLocation} from 'react-router';
import {useCallback} from 'react';

import DataTable from '@gravity-ui/react-data-table';

import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../../store/reducers/tenant/constants';
import {
    fetchTopQueries,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/executeTopQueries/executeTopQueries';
import {changeUserInput} from '../../../../../store/reducers/executeQuery';
import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {getTenantOverviewTopQueriesColumns} from '../../TopQueries/getTopQueriesColumns';

import './TenantCpu.scss';

const b = cn('tenant-overview-cpu');

interface TopQueriesProps {
    path?: string;
}

export function TopQueries({path}: TopQueriesProps) {
    const dispatch = useDispatch();
    const location = useLocation();
    const history = useHistory();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
    } = useTypedSelector((state) => state.tenantOverviewExecuteTopQueries);
    const columns = getTenantOverviewTopQueriesColumns();

    useAutofetcher(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            // @ts-expect-error
            // typed dispatch required, remove error expectation after adding it
            dispatch(fetchTopQueries(path));
        },
        [dispatch, path],
        autorefresh,
    );

    const handleRowClick = useCallback(
        (row) => {
            const {QueryText: input} = row;

            dispatch(changeUserInput({input}));

            const queryParams = qs.parse(location.search, {
                ignoreQueryPrefix: true,
            });

            const queryPath = getTenantPath({
                ...queryParams,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });

            history.push(queryPath);
        },
        [dispatch, history, location],
    );

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable
                columns={columns}
                data={data || []}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                onRowClick={handleRowClick}
                theme="yandex-cloud"
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top queries by cpu time</div>
            <div className={b('table', {'top-queries': true})}>{renderContent()}</div>
        </>
    );
}
