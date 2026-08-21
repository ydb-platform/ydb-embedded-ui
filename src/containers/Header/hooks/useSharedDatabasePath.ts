import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {getTenantBackend} from '../../../components/TenantNameWrapper/utils';
import {getTenantPath} from '../../../routes';
import {backend as activeBackend, environment} from '../../../store';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';

interface UseSharedDatabasePathParams {
    clusterName?: string;
    databaseData?: PreparedTenant;
    isViewerUser?: boolean;
    prepareTenantBackend?: AdditionalTenantsProps['prepareTenantBackend'];
}

function getSharedDatabaseBackend(
    databaseData: PreparedTenant | undefined,
    prepareTenantBackend: AdditionalTenantsProps['prepareTenantBackend'],
) {
    if (!databaseData) {
        return activeBackend;
    }

    return getTenantBackend(databaseData, {prepareTenantBackend}) ?? activeBackend;
}

export function useSharedDatabasePath({
    clusterName,
    databaseData,
    isViewerUser,
    prepareTenantBackend,
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
        shouldResolveSharedDatabaseName
            ? {clusterName, environmentName: environment, isMetaDatabasesAvailable}
            : skipToken,
    );

    const sharedDatabaseName = React.useMemo(() => {
        if (databaseData?.sharedTenantName) {
            return databaseData.sharedTenantName;
        }

        return databases?.find(({Id}) => Id === databaseData?.ResourceId)?.Name;
    }, [databaseData?.ResourceId, databaseData?.sharedTenantName, databases]);

    const sharedDatabase = useDatabaseId ? databaseData?.ResourceId : sharedDatabaseName;
    const backend = getSharedDatabaseBackend(databaseData, prepareTenantBackend);

    return isViewerUser &&
        isClusterBaseInfoResolved &&
        databaseData?.Type === 'Serverless' &&
        sharedDatabase
        ? getTenantPath({clusterName, database: sharedDatabase, backend}, {withBasename: true})
        : undefined;
}
