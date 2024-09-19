import React from 'react';

import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../../../store/reducers/storage/storage';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/columns/columns';
import {STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY} from '../../../../Storage/StorageGroups/columns/constants';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

import {prepareTopStorageGroups} from './utils';

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const query = useSearchQuery();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const columns = getStorageTopGroupsColumns();

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            tenant,
            sort: '-Usage',
            with: 'all',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            shouldUseGroupsHandler: groupsHandlerAvailable,
        },
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );

    const loading = isFetching && currentData === undefined;

    const preparedGroups = React.useMemo(() => {
        return prepareTopStorageGroups(currentData);
    }, [currentData]);

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
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            data={preparedGroups}
            columns={columns}
            title={title}
            loading={loading || !capabilitiesLoaded}
            error={error}
        />
    );
}
