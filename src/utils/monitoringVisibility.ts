import type {MetaBaseClusterInfo} from '../types/api/meta';
import type {ControlPlane} from '../types/api/tenant';
import {uiFactory} from '../uiFactory/uiFactory';

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

/**
 * Unified visibility check for the Monitoring tab/button.
 * Combines UI factory capability and tenant/cluster monitoring availability.
 */
export function canShowTenantMonitoringTab(
    controlPlane?: ControlPlane,
    clusterMonitoring?: MetaBaseClusterInfo['solomon'],
): boolean {
    return (
        Boolean(uiFactory.renderMonitoring) &&
        canShowTenantMonitoring(controlPlane, clusterMonitoring)
    );
}
