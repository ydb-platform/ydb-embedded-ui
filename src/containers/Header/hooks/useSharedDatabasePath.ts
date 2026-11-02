import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {getTenantBackend} from '../../../components/TenantNameWrapper/utils';
import {getTenantPath} from '../../../routes';
import {backend as activeBackend, environment} from '../../../store';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import type {PreparedTenant, SharedDatabaseTarget} from '../../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {getDatabaseNavigationId} from '../../../utils/databaseId';
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
}

function canResolveSharedDatabaseName({
    databaseData,
    isClusterBaseInfoResolved,
    isViewerUser,
}: SharedDatabaseNameResolutionParams) {
    return Boolean(
        isViewerUser &&
            isClusterBaseInfoResolved &&
            databaseData?.Type === 'Serverless' &&
            databaseData.ResourceId &&
            !databaseData.sharedTenantName,
    );
}

function getSharedDatabaseBackend(
    sharedDatabase: SharedDatabaseTarget | undefined,
    prepareTenantBackend: AdditionalTenantsProps['prepareTenantBackend'],
) {
    if (!sharedDatabase) {
        return activeBackend;
    }

    return (
        getTenantBackend({NodeIds: sharedDatabase.nodeIds}, {prepareTenantBackend}) ?? activeBackend
    );
}

function shouldResolveSharedDatabaseNodeIds(
    balancer: string | undefined,
    settings: {use_meta_proxy?: boolean} | undefined,
    prepareTenantBackend: AdditionalTenantsProps['prepareTenantBackend'],
) {
    const useMetaProxy = Boolean(
        window.api.meta && uiFactory.useMetaProxy && settings?.use_meta_proxy !== false,
    );

    return Boolean(
        balancer && !useMetaProxy && prepareTenantBackend && !prepareTenantBackend(undefined),
    );
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
        balancer,
        settings,
        isError: isClusterBaseInfoError,
        isResolved: isClusterBaseInfoResolved,
    } = useClusterBaseInfo();
    const isMonitoringAllowed = useIsUserAllowedToMakeChanges();
    const isClusterBaseInfoAvailable = isClusterBaseInfoResolved && !isClusterBaseInfoError;

    const needSharedDatabaseNodeIds = shouldResolveSharedDatabaseNodeIds(
        balancer,
        settings,
        prepareTenantBackend,
    );
    const shouldResolveSharedDatabaseName = canResolveSharedDatabaseName({
        databaseData,
        isClusterBaseInfoResolved: isClusterBaseInfoAvailable,
        isViewerUser,
    });

    const shouldResolveSharedDatabaseFromViewer =
        shouldResolveSharedDatabaseName && !window.api.meta;

    const {currentData: sharedDatabaseFromViewer, isFetching: isSharedDatabaseFromViewerFetching} =
        tenantsApi.useGetSharedDatabaseQuery(
            shouldResolveSharedDatabaseFromViewer && databaseData?.ResourceId
                ? {
                      clusterName,
                      database: databaseData.Name,
                      backend: activeBackend,
                      environmentName: environment,
                      isMonitoringAllowed: isMonitoringAllowed === true,
                      needNodeIds: needSharedDatabaseNodeIds,
                      resourceId: databaseData.ResourceId,
                  }
                : skipToken,
        );

    const shouldResolveSharedDatabaseFromMetaList =
        shouldResolveSharedDatabaseName && Boolean(window.api.meta);

    const {currentData: databases, isFetching: isDatabasesFetching} =
        tenantsApi.useGetTenantsInfoQuery(
            shouldResolveSharedDatabaseFromMetaList
                ? {clusterName, environmentName: environment, isMetaDatabasesAvailable}
                : skipToken,
        );

    const sharedDatabaseTarget = React.useMemo<SharedDatabaseTarget | undefined>(() => {
        if (databaseData?.sharedTenantName) {
            return {
                name: databaseData.sharedTenantName,
                nodeIds: databaseData.sharedNodeIds,
                controlPlane: databaseData.sharedControlPlane,
            };
        }

        if (sharedDatabaseFromViewer) {
            return sharedDatabaseFromViewer;
        }

        const sharedDatabase = databases?.find(({Id}) => Id === databaseData?.ResourceId);
        const sharedDatabaseName = sharedDatabase?.Name?.trim();

        return sharedDatabaseName
            ? {
                  name: sharedDatabaseName,
                  nodeIds: sharedDatabase?.NodeIds,
                  controlPlane: sharedDatabase?.ControlPlane,
              }
            : undefined;
    }, [
        databaseData?.ResourceId,
        databaseData?.sharedNodeIds,
        databaseData?.sharedControlPlane,
        databaseData?.sharedTenantName,
        databases,
        sharedDatabaseFromViewer,
    ]);

    const backend = getSharedDatabaseBackend(sharedDatabaseTarget, prepareTenantBackend);
    const sharedDatabase = getDatabaseNavigationId(
        {
            Name: sharedDatabaseTarget?.name,
            Id: databaseData?.ResourceId,
            ControlPlane: sharedDatabaseTarget?.controlPlane,
        },
        {settings, useDatabaseId: uiFactory.useDatabaseId, isMetaDatabasesAvailable, backend},
    );

    return {
        isSharedDatabaseLoading:
            (isSharedDatabaseFromViewerFetching && sharedDatabaseFromViewer === undefined) ||
            (isDatabasesFetching && databases === undefined),
        sharedDatabasePath: getResolvedSharedDatabasePath({
            backend,
            clusterName,
            databaseData,
            isClusterBaseInfoResolved: isClusterBaseInfoAvailable,
            isViewerUser,
            sharedDatabase,
        }),
    };
}
