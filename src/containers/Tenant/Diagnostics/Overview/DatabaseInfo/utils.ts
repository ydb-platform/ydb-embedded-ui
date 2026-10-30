import type {PreparedTenant} from '../../../../../store/reducers/tenants/types';
import {uiFactory} from '../../../../../uiFactory/uiFactory';
import {normalizeDatacenter} from '../../../../../utils/datacenters';

export interface DatacenterNodes {
    name?: string;
    count: number;
}

export function countDatacenterNodes(nodes: Iterable<{DCKey?: string}>): DatacenterNodes[] {
    const counts = new Map<string | undefined, number>();
    for (const {DCKey} of nodes) {
        const name = normalizeDatacenter(DCKey);
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
        .sort(([a], [b]) => {
            if (a === b) {
                return 0;
            }
            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return a < b ? -1 : 1;
        })
        .map(([name, count]) => ({name, count}));
}

export function prepareAdditionalDatabaseInfoItems(databaseData?: PreparedTenant) {
    if (!databaseData) {
        return undefined;
    }

    return uiFactory.getAdditionalDatabaseInfoItems?.({databaseData});
}
