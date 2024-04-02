import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';
import type {NodesMap} from '../../../../../types/store/nodesList';

import type {PreparedPartitionDataWithHosts} from './types';

export const addHostToPartitions = (
    partitions: PreparedPartitionData[] = [],
    nodesMap?: NodesMap,
): PreparedPartitionDataWithHosts[] => {
    return partitions?.map((partition) => {
        const partitionHost =
            partition.partitionNodeId && nodesMap
                ? nodesMap.get(partition.partitionNodeId)
                : undefined;

        const connectionHost =
            partition.connectionNodeId && nodesMap
                ? nodesMap.get(partition.connectionNodeId)
                : undefined;

        return {
            ...partition,
            partitionHost,
            connectionHost,
        };
    });
};
