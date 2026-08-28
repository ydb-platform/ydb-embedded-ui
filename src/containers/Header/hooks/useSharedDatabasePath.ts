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
import {useIsUserAllowedToMakeChanges} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';

interface UseSharedDatabasePathParams {
    clusterName?: string;
    databaseData?: PreparedTenant;
    isViewerUser?: boolean;
    prepareTenantBackend?: AdditionalTenantsProps['prepareTenantBackend'];
}

interface SharedDatabaseNameResolutionParams {
    databaseData?: PreparedTenant;
    isClusterBaseInfoResolved: boolean;
    isViewerUser?: boolean;
    useDatabaseId?: boolean;
}

function canResolveSharedDatabaseName({
    databaseData,
    isClusterBaseInfoResolved,
    isViewerUser,
    useDatabaseId,
}: SharedDatabaseNameResolutionParams) {
    return Boolean(
        isViewerUser &&
            isClusterBaseInfoResolved &&
            databaseData?.Type === 'Serverless' &&
            databaseData.ResourceId &&
            !useDatabaseId &&
            !databaseData.sharedTenantName,
    );
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

function getResolvedSharedDatabasePath({
    backend,
    clusterName,
    databaseData,
    isClusterBaseInfoResolved,
    isViewerUser,
    sharedDatabase,
}: {
    backend?: string;
    clusterName?: string;
    databaseData?: PreparedTenant;
    isClusterBaseInfoResolved: boolean;
    isViewerUser?: boolean;
    sharedDatabase?: string;
}) {
    if (
        !isViewerUser ||
        !isClusterBaseInfoResolved ||
        databaseData?.Type !== 'Serverless' ||
        !sharedDatabase
    ) {
        return undefined;
    }

    return getTenantPath(
        {clusterName, database: sharedDatabase, backend},
        {withBasename: true, environment},
    );
}

export function useSharedDatabasePath({
    clusterName,
    databaseData,
    isViewerUser,
    prepareTenantBackend,
}: UseSharedDatabasePathParams) {
    const isMetaDatabasesAvailable = useDatabasesV2();
    const {
        settings,
        isError: isClusterBaseInfoError,
        isResolved: isClusterBaseInfoResolved,
    } = useClusterBaseInfo();
    const isMonitoringAllowed = useIsUserAllowedToMakeChanges();
    const isClusterBaseInfoAvailable = isClusterBaseInfoResolved && !isClusterBaseInfoError;

    const useDatabaseId = uiFactory.useDatabaseId && settings?.use_meta_proxy !== false;
    const shouldResolveSharedDatabaseName = canResolveSharedDatabaseName({
        databaseData,
        isClusterBaseInfoResolved: isClusterBaseInfoAvailable,
        isViewerUser,
        useDatabaseId,
    });

    const shouldResolveSharedDatabaseFromViewer =
        shouldResolveSharedDatabaseName && !window.api.meta;

    const {currentData: sharedDatabaseNameFromViewer} = tenantsApi.useGetSharedDatabaseNameQuery(
        shouldResolveSharedDatabaseFromViewer && databaseData?.ResourceId
            ? {
                  clusterName,
                  database: databaseData.Name,
                  backend: activeBackend,
                  environmentName: environment,
                  isMonitoringAllowed: isMonitoringAllowed === true,
                  resourceId: databaseData.ResourceId,
              }
            : skipToken,
    );

    const shouldResolveSharedDatabaseFromMetaList =
        shouldResolveSharedDatabaseName && Boolean(window.api.meta);

    const {currentData: databases} = tenantsApi.useGetTenantsInfoQuery(
        shouldResolveSharedDatabaseFromMetaList
            ? {clusterName, environmentName: environment, isMetaDatabasesAvailable}
            : skipToken,
    );

    const sharedDatabaseName = React.useMemo(() => {
        if (databaseData?.sharedTenantName) {
            return databaseData.sharedTenantName;
        }

        return (
            sharedDatabaseNameFromViewer ??
            databases?.find(({Id}) => Id === databaseData?.ResourceId)?.Name
        );
    }, [
        databaseData?.ResourceId,
        databaseData?.sharedTenantName,
        databases,
        sharedDatabaseNameFromViewer,
    ]);

    const sharedDatabase = useDatabaseId ? databaseData?.ResourceId : sharedDatabaseName;
    const backend = getSharedDatabaseBackend(databaseData, prepareTenantBackend);

    return getResolvedSharedDatabasePath({
        backend,
        clusterName,
        databaseData,
        isClusterBaseInfoResolved: isClusterBaseInfoAvailable,
        isViewerUser,
        sharedDatabase,
    });
}
