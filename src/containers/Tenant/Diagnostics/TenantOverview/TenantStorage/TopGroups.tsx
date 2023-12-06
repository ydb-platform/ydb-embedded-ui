import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {useAutofetcher, useSearchQuery, useTypedSelector} from '../../../../../utils/hooks';
import {
    setDataWasNotLoaded,
    getTopStorageGroups,
    selectTopStorageGroups,
} from '../../../../../store/reducers/tenantOverview/topStorageGroups/topStorageGroups';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';

import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';

import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const dispatch = useDispatch();

    const query = useSearchQuery();

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

    const title = getSectionTitle({
        entity: i18n('groups'),
        postfix: i18n('by-usage'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.storage,
        }),
    });

    return (
        <TenantOverviewTableLayout
            data={topGroups || []}
            columns={columns}
            title={title}
            loading={loading}
            wasLoaded={wasLoaded}
            error={error}
        />
    );
}
