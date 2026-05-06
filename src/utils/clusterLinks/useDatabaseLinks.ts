import React from 'react';

import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ClusterLinkWithTitle, DatabaseLink} from '../../types/additionalProps';

import {resolveDatabaseLinks} from './resolveClusterLinks';

export function useDatabaseLinks(
    tenant: PreparedTenant | undefined,
    additionalLinks: DatabaseLink[] = [],
): ClusterLinkWithTitle[] {
    const clusterInfo = useClusterBaseInfo();

    return React.useMemo(() => {
        if (!tenant) {
            return [];
        }

        return resolveDatabaseLinks(clusterInfo.links, tenant, clusterInfo, additionalLinks);
    }, [clusterInfo, tenant, additionalLinks]);
}
