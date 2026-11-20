import {getTenantName} from '../../../store/reducers/tenant/availability';
import type {TTenant} from '../../../types/api/tenant';

function displayValue(value?: string | null) {
    return value === undefined || value === null || value === '' ? undefined : value;
}

/** Control plane fields of a database; a missing value is `undefined`. */
export function prepareControlPlaneInfo(tenant: TTenant) {
    const cp = tenant.ControlPlane ?? {};
    return {
        name: displayValue(cp.name),
        path: displayValue(getTenantName(tenant)),
        type: displayValue(tenant.Type || cp.type),
        status: displayValue(cp.status),
    };
}
