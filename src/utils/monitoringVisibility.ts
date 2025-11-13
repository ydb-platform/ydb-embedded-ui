import type {MetaBaseClusterInfo} from '../types/api/meta';
import type {ControlPlane} from '../types/api/tenant';

/**
 * Centralized check for whether Monitoring should be shown for a database.
 * Rule:
 * - If ControlPlane exists, require a non-empty id.
 * - If ControlPlane does not exist, fallback to cluster monitoring meta presence.
 */
export function canShowTenantMonitoring(
    controlPlane?: ControlPlane,
    clusterMonitoring?: MetaBaseClusterInfo['solomon'],
): boolean {
    if (controlPlane) {
        return Boolean(controlPlane.id);
    }
    return Boolean(clusterMonitoring);
}
