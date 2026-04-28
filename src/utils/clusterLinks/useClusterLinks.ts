import React from 'react';

import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {ClusterLink, ClusterLinkWithTitle} from '../../types/additionalProps';

import {resolveClusterLinks} from './resolveClusterLinks';

export function useClusterLinks(additionalLinks?: ClusterLink[]): ClusterLinkWithTitle[] {
    const clusterInfo = useClusterBaseInfo();

    return React.useMemo(() => {
        return resolveClusterLinks(clusterInfo, additionalLinks);
    }, [clusterInfo, additionalLinks]);
}
