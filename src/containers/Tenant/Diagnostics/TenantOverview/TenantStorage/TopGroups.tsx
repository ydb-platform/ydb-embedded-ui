import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {
    setDataWasNotLoaded,
    getTopStorageGroups,
    selectTopStorageGroups,
} from '../../../../../store/reducers/tenantOverview/topStorageGroups/topStorageGroups';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';
import i18n from '../i18n';

const b = cn('tenant-overview-storage');

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {loading, wasLoaded, error} = useTypedSelector((state) => state.topStorageGroups);
    const topGroups = useTypedSelector(selectTopStorageGroups);

    const columns = getStorageTopGroupsColumns();

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getTopStorageGroups({tenant}));
        },
        [dispatch, tenant],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

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
                data={topGroups || []}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                emptyDataMessage={i18n('top-groups.empty-data')}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top groups by usage</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
}
