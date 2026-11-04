import {isRuntimeTenant} from '../../../store/reducers/tenant/availability';
import type {RuntimeTenant} from '../../../store/reducers/tenant/availability';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {MetaBaseClusterInfo} from '../../../types/api/meta';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {canShowTenantMonitoring} from '../../../utils/monitoringVisibility';
import {isAccessError} from '../../../utils/response';
import {useDatabaseAvailability} from '../../Tenant/DatabaseAvailability/useDatabaseAvailability';

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
    const {availability} = useDatabaseAvailability({skip: !database || !isDatabasePage});
    const legacy = availability.status === 'legacy';
    const legacyTenant = useTenantBaseInfo(database ?? '', clusterName, {
        skip: !legacy || !database || !isDatabasePage || !metaCapabilitiesLoaded,
    });

    // Runtime actions (copy path, edit, delete, monitoring links) need confirmed runtime data
    let databaseData: RuntimeTenant | undefined;
    if (legacy) {
        databaseData =
            isRuntimeTenant(legacyTenant.databaseData) && !isAccessError(legacyTenant.error)
                ? legacyTenant.databaseData
                : undefined;
    } else if (availability.status === 'runtime') {
        databaseData = availability.tenant;
    }
    const isDatabaseDataLoading = legacy
        ? legacyTenant.isLoading
        : availability.status === 'loading';
    // Runtime requests (e.g. healthcheck) are pointless when only the control plane responds
    const isRuntimeUnavailable =
        availability.status === 'control-plane' || availability.status === 'unavailable';

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
        isRuntimeUnavailable,
        monitoringLinkUrl,
    };
}
