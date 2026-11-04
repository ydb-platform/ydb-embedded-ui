import type {TTenant, TenantSourceErrors} from '../../../types/api/tenant';
import type {TUserToken} from '../../../types/api/whoami';
import {isAccessError} from '../../../utils/response';
import type {PreparedTenant} from '../tenants/types';

/** Runtime (Viewer) data is available, the tenant is prepared with runtime metrics. */
export type RuntimeTenant = PreparedTenant & {
    availability: 'runtime';
    sourceErrors?: TenantSourceErrors;
};
/** Only control plane data is available: runtime fields are absent rather than zeroed. */
export type ControlPlaneTenant = TTenant & {
    availability: 'control-plane';
    sourceErrors?: TenantSourceErrors;
};
export type TenantInfoData = RuntimeTenant | ControlPlaneTenant;

export function isRuntimeTenant(tenant?: TenantInfoData): tenant is RuntimeTenant {
    return tenant?.availability === 'runtime';
}

export function matchesDatabase(tenant: TTenant, database: string) {
    return Boolean(
        database &&
            (tenant.Id === database ||
                tenant.Name === database ||
                tenant.ControlPlane?.id === database),
    );
}

export function hasUsableControlPlane(tenant?: TTenant) {
    return Boolean(tenant?.ControlPlane?.id?.trim());
}

export type DatabaseAvailability =
    /** The composite meta API is not used for this database, the regular data flow applies. */
    | {status: 'legacy'}
    | {status: 'loading'}
    | {status: 'access-error'; error: unknown}
    /** The regular database page. `tenant` is set only when runtime access is confirmed. */
    | {status: 'runtime'; tenant?: RuntimeTenant}
    | {status: 'control-plane'; tenant: TTenant}
    /** Runtime is unavailable and control plane data cannot be shown either. */
    | {status: 'unavailable'; error: unknown};

export function isTenantRequestReady({
    whoamiData,
    whoamiError,
    clusterInfoResolved,
}: {
    whoamiData?: TUserToken;
    whoamiError?: unknown;
    clusterInfoResolved: boolean;
}) {
    if (isAccessError(whoamiError)) {
        return false;
    }
    if (!whoamiData && !whoamiError) {
        return false;
    }
    // Only Viewer users can load the protected cluster settings that select the tenant API.
    // An operational whoami failure or a non-Viewer role keeps the default API policy.
    return whoamiData?.IsViewerAllowed !== true || clusterInfoResolved;
}

interface DatabaseAvailabilityParams {
    database: string;
    /** Whether the composite (runtime + control plane) tenant API is used */
    composite: boolean;
    whoamiData?: TUserToken;
    whoamiError?: unknown;
    capabilitiesError?: unknown;
    clusterInfoResolved: boolean;
    tenantData?: TenantInfoData;
    tenantError?: unknown;
}

export function getDatabaseAvailability({
    database,
    composite,
    whoamiData,
    whoamiError,
    capabilitiesError,
    clusterInfoResolved,
    tenantData,
    tenantError,
}: DatabaseAvailabilityParams): DatabaseAvailability {
    // An authorization failure from any source wins over data retained from earlier requests.
    const accessError = [tenantError, whoamiError, capabilitiesError].find(isAccessError);
    if (accessError) {
        return {status: 'access-error', error: accessError};
    }
    if (!isTenantRequestReady({whoamiData, whoamiError, clusterInfoResolved})) {
        return {status: 'loading'};
    }
    if (!composite) {
        return {status: 'legacy'};
    }

    const runtimeAuthorized = Boolean(whoamiData && !whoamiError);
    const getRuntime = (tenant?: RuntimeTenant): DatabaseAvailability => ({
        status: 'runtime',
        tenant: runtimeAuthorized ? tenant : undefined,
    });

    if (!tenantData) {
        // A cold composite failure keeps the regular page and its own error handling.
        return tenantError ? getRuntime() : {status: 'loading'};
    }
    if (tenantError) {
        // Retained data from a failed request never authorizes control plane mode.
        return isRuntimeTenant(tenantData)
            ? getRuntime(tenantData)
            : {status: 'unavailable', error: tenantError};
    }

    const controlPlaneUsable =
        matchesDatabase(tenantData, database) && hasUsableControlPlane(tenantData);

    if (!isRuntimeTenant(tenantData)) {
        return controlPlaneUsable
            ? {status: 'control-plane', tenant: tenantData}
            : {status: 'unavailable', error: {status: 503, data: tenantData.sourceErrors?.viewer}};
    }
    // The composite request reached the runtime, but the runtime cannot serve this user.
    if (whoamiError && controlPlaneUsable) {
        return {status: 'control-plane', tenant: tenantData};
    }
    return getRuntime(tenantData);
}
