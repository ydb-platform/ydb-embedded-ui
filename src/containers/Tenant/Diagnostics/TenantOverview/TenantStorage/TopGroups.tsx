import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {
    setDataWasNotLoaded,
    getTopStorageGroups,
    selectTopStorageGroups,
} from '../../../../../store/reducers/tenantOverview/topStorageGroups/topStorageGroups';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

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

    return (
        <TenantOverviewTableLayout
            data={topGroups || []}
            columns={columns}
            title="Top groups by usage"
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
        />
    );
}
