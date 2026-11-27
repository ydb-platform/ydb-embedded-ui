import type React from 'react';

import type {getTenantLink} from '../../components/TenantNameWrapper/utils';
import type {PreparedTenant} from '../../store/reducers/tenants/types';

export interface AllocatedResources {
    cores?: number;
    memoryBytes?: number;
}

/** A databases table row: the database with everything its cells need. */
export interface DatabaseRow extends PreparedTenant {
    link?: ReturnType<typeof getTenantLink>;
    /** Resources allocated by Control Plane; set on My databases only. */
    allocated?: AllocatedResources;
    /** Footer cells by column name; set on the totals row only. */
    totals?: Partial<Record<string, React.ReactNode>>;
}
