import escapeRegExp from 'lodash/escapeRegExp';

import {EFlag} from '../../../types/api/enums';

import type {PreparedTenant} from './types';

export function filterTenantsByProblems(tenants: PreparedTenant[], withProblems: boolean) {
    if (withProblems) {
        return tenants.filter((tenant) => {
            return tenant.Overall && tenant.Overall !== EFlag.Green;
        });
    }
    return tenants;
}
export function filterTenantsBySearch(tenants: PreparedTenant[], search: string) {
    return tenants.filter((item) => {
        const re = new RegExp(escapeRegExp(search), 'i');
        return re.test(item.Name || '') || re.test(item.controlPlaneName);
    });
}
export function filterTenantsByDomain(tenants: PreparedTenant[], showDomainDatabase?: boolean) {
    if (!showDomainDatabase && tenants.length > 1) {
        return tenants.filter((item) => item.Type !== 'Domain');
    }
    return tenants;
}
