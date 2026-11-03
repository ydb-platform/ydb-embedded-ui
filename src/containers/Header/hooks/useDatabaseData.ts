import {isRuntimeTenant} from '../../../store/reducers/tenant/availability';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {MetaBaseClusterInfo} from '../../../types/api/meta';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {canShowTenantMonitoring} from '../../../utils/monitoringVisibility';
import {isAccessError, isRedirectToAuth} from '../../../utils/response';
import {
    useDatabaseAvailability,
    useIsMetaDatabaseCandidate,
} from '../../Tenant/useDatabaseAvailability';

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
    const candidate = useIsMetaDatabaseCandidate();
    const availability = useDatabaseAvailability({
        skip: !candidate || !database || !isDatabasePage,
    });
    const legacy = !candidate || (availability.isReady && !availability.composed);
    const legacyTenant = useTenantBaseInfo(database ?? '', clusterName, {
        skip: !legacy || !database || !isDatabasePage || !metaCapabilitiesLoaded,
    });
    const legacyAuthorized =
        (!candidate || availability.runtimeAuthorized) &&
        !isAccessError(legacyTenant.error) &&
        !isRedirectToAuth(legacyTenant.error);
    const legacyData =
        legacyAuthorized && isRuntimeTenant(legacyTenant.databaseData)
            ? legacyTenant.databaseData
            : undefined;
    const databaseData = legacy ? legacyData : availability.runtimeTenant;
    const isDatabaseDataLoading = legacy ? legacyTenant.isLoading : availability.isLoading;

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
