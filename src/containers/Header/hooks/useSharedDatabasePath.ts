import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {getTenantPath} from '../../../routes';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';

interface UseSharedDatabasePathParams {
    clusterName?: string;
    databaseData?: PreparedTenant;
    isViewerUser?: boolean;
}

export function useSharedDatabasePath({
    clusterName,
    databaseData,
    isViewerUser,
}: UseSharedDatabasePathParams) {
    const isMetaDatabasesAvailable = useDatabasesV2();
    const {settings, isResolved: isClusterBaseInfoResolved} = useClusterBaseInfo();

    const useDatabaseId = uiFactory.useDatabaseId && settings?.use_meta_proxy !== false;
    const shouldResolveSharedDatabaseName =
        isViewerUser &&
        isClusterBaseInfoResolved &&
        databaseData?.Type === 'Serverless' &&
        Boolean(databaseData.ResourceId) &&
        !useDatabaseId &&
        !databaseData.sharedTenantName;

    const {currentData: databases} = tenantsApi.useGetTenantsInfoQuery(
        shouldResolveSharedDatabaseName ? {clusterName, isMetaDatabasesAvailable} : skipToken,
    );

    const sharedDatabaseName = React.useMemo(() => {
        if (databaseData?.sharedTenantName) {
            return databaseData.sharedTenantName;
        }

        return databases?.find(({Id}) => Id === databaseData?.ResourceId)?.Name;
    }, [databaseData?.ResourceId, databaseData?.sharedTenantName, databases]);

    const sharedDatabase = useDatabaseId ? databaseData?.ResourceId : sharedDatabaseName;

    return isViewerUser &&
        isClusterBaseInfoResolved &&
        databaseData?.Type === 'Serverless' &&
        sharedDatabase
        ? getTenantPath({clusterName, database: sharedDatabase}, {withBasename: true})
        : undefined;
}
