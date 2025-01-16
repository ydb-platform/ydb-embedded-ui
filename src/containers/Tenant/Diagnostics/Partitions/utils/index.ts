import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';
import type {NodesMap} from '../../../../../types/store/nodesList';

import type {PreparedPartitionDataWithHosts} from './types';

export const addHostToPartitions = (
    partitions: PreparedPartitionData[] = [],
    nodeHosts?: NodesMap,
): PreparedPartitionDataWithHosts[] => {
    return partitions?.map((partition) => {
        const partitionHost =
            partition.partitionNodeId && nodeHosts
                ? nodeHosts.get(partition.partitionNodeId)?.Host
                : undefined;

        const connectionHost =
            partition.connectionNodeId && nodeHosts
                ? nodeHosts.get(partition.connectionNodeId)?.Host
                : undefined;

        return {
            ...partition,
            partitionHost,
            connectionHost,
        };
    });
};
