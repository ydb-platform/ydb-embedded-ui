import {skipToken} from '@reduxjs/toolkit/query';

import {tenantApi} from '../../../store/reducers/tenant/tenant';
import type {MetaBaseClusterInfo} from '../../../types/api/meta';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';
import {canShowTenantMonitoring} from '../../../utils/monitoringVisibility';

interface UseDatabaseDataParams {
    metaCapabilitiesLoaded: boolean;
    database?: string;
    clusterName?: string;
    isDatabasePage: boolean;
    monitoring?: MetaBaseClusterInfo['solomon'];
}

export function useDatabaseData({
    metaCapabilitiesLoaded,
    database,
    clusterName,
    isDatabasePage,
    monitoring,
}: UseDatabaseDataParams) {
    const isMetaDatabasesAvailable = useDatabasesV2();

    const shouldRequestTenantData = database && isDatabasePage;

    const params = shouldRequestTenantData
        ? {database, clusterName, isMetaDatabasesAvailable}
        : skipToken;

    const {currentData: databaseData, isLoading: isDatabaseDataLoading} =
        tenantApi.useGetTenantInfoQuery(params, {
            skip: !metaCapabilitiesLoaded,
        });

    // Show Monitoring only when:
    // - ControlPlane exists AND has a non-empty id
    // - OR ControlPlane is absent, but cluster-level monitoring meta exists
    const controlPlane = databaseData?.ControlPlane;
    const canShowMonitoring = canShowTenantMonitoring(controlPlane, monitoring);
    const monitoringLinkUrl =
        canShowMonitoring && uiFactory.getMonitoringLink && databaseData?.Name && databaseData?.Type
            ? uiFactory.getMonitoringLink({
                  monitoring,
                  clusterName,
                  dbName: databaseData.Name,
                  dbType: databaseData.Type,
                  controlPlane: databaseData.ControlPlane,
                  userAttributes: databaseData.UserAttributes,
              })
            : null;

    return {
        databaseData,
        isDatabaseDataLoading,
        monitoringLinkUrl,
    };
}
