import type {TTenant, TTenantInfo} from '../../../types/api/tenant';
import type {TUserToken} from '../../../types/api/whoami';
import {isAccessError, isRedirectToAuth} from '../../../utils/response';
import type {PreparedTenant} from '../tenants/types';

export type TenantSourceErrors = TTenantInfo['sourceErrors'];
export type RuntimeTenant = PreparedTenant & {
    availability: 'runtime';
    sourceErrors?: TenantSourceErrors;
};
export type ControlPlaneTenant = TTenant & {
    availability: 'control-plane';
    sourceErrors?: TenantSourceErrors;
};
export type TenantInfo = RuntimeTenant | ControlPlaneTenant;

export function isRuntimeTenant(tenant?: TenantInfo | PreparedTenant): tenant is PreparedTenant {
    return Boolean(tenant && (!('availability' in tenant) || tenant.availability === 'runtime'));
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

export function getDatabaseAvailability({
    database,
    tenant,
    tenantError,
    whoamiError,
    capabilitiesError,
}: {
    database: string;
    tenant?: TenantInfo;
    tenantError?: unknown;
    whoamiError?: unknown;
    capabilitiesError?: unknown;
}) {
    const authorizationError = [tenantError, whoamiError, capabilitiesError].find(
        (error) => isAccessError(error) || isRedirectToAuth(error),
    );
    // Never use retained data from a failed composite request as a CP authorization grant.
    const controlPlaneOnly = Boolean(
        !authorizationError &&
            !tenantError &&
            tenant &&
            matchesDatabase(tenant, database) &&
            hasUsableControlPlane(tenant) &&
            (tenant.availability === 'control-plane' || whoamiError),
    );
    return {authorizationError, controlPlaneOnly};
}

export function isTenantRequestReady({
    whoamiData,
    whoamiError,
    clusterInfoResolved,
}: {
    whoamiData?: TUserToken;
    whoamiError?: unknown;
    clusterInfoResolved: boolean;
}) {
    if (isAccessError(whoamiError) || isRedirectToAuth(whoamiError)) {
        return false;
    }
    if (!whoamiData && !whoamiError) {
        return false;
    }
    // Only Viewer users can load the protected cluster settings. An operational
    // whoami failure or a non-Viewer role keeps the existing default API policy.
    return whoamiData?.IsViewerAllowed !== true || clusterInfoResolved;
}

export function getRuntimeTenant({
    tenant,
    whoamiData,
    whoamiError,
    authorizationError,
    controlPlaneOnly,
}: {
    tenant?: TenantInfo;
    whoamiData?: TUserToken;
    whoamiError?: unknown;
    authorizationError?: unknown;
    controlPlaneOnly: boolean;
}) {
    return whoamiData &&
        !whoamiError &&
        !authorizationError &&
        !controlPlaneOnly &&
        isRuntimeTenant(tenant)
        ? tenant
        : undefined;
}
