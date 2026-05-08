import React from 'react';

import {useClusterWithProxy} from '../../../../../store/reducers/cluster/cluster';
import {tenantOverviewStorageApi} from '../../../../../store/reducers/tenantOverview/storage/tenantOverviewStorage';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';

import type {TenantStorageMetrics} from './types';
import {buildTenantStorageData} from './utils';
import type {TenantStorageData} from './utils';

interface UseTenantStorageNewDataParams {
    database: string;
    databaseFullPath: string;
    metrics: TenantStorageMetrics;
}

export function useTenantStorageNewData({
    database,
    databaseFullPath,
    metrics,
}: UseTenantStorageNewDataParams) {
    const useMetaProxy = useClusterWithProxy();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const query = tenantOverviewStorageApi.useGetTenantStorageRawDataQuery(
        {database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const data = React.useMemo<TenantStorageData>(() => {
        return buildTenantStorageData(query.currentData, metrics);
    }, [metrics, query.currentData]);

    return {
        ...query,
        data,
    };
}
