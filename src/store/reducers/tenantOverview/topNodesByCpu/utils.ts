import type {TComputeInfo} from '../../../../types/api/compute';
import {prepareComputeNodes} from '../../nodes/utils';
import type {TopNodesByCpuHandledResponse} from './types';

export const prepareTopComputeNodesData = (data: TComputeInfo): TopNodesByCpuHandledResponse => {
    const preparedNodes = prepareComputeNodes(data.Nodes, data.Tenants);

    if (!data.Nodes) {
        preparedNodes.sort((a, b) => {
            let aMaxPoolUsage = 0;
            let bMaxPoolUsage = 0;
            if (a.PoolStats) {
                aMaxPoolUsage = Math.max(...a.PoolStats.map(({Usage}) => Number(Usage)));
            }
            if (b.PoolStats) {
                bMaxPoolUsage = Math.max(...b.PoolStats.map(({Usage}) => Number(Usage)));
            }
            return bMaxPoolUsage - aMaxPoolUsage;
        });
    }

    return {
        Nodes: preparedNodes,
    };
};
