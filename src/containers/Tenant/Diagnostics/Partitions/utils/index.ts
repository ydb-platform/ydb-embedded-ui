import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';
import type {NodeHostsMap} from '../../../../../types/store/nodesList';

import type {PreparedPartitionDataWithHosts} from './types';

export const addHostToPartitions = (
    partitions: PreparedPartitionData[] = [],
    nodeHosts?: NodeHostsMap,
): PreparedPartitionDataWithHosts[] => {
    return partitions?.map((partition) => {
        const partitionHost =
            partition.partitionNodeId && nodeHosts
                ? nodeHosts.get(partition.partitionNodeId)
                : undefined;

        const connectionHost =
            partition.connectionNodeId && nodeHosts
                ? nodeHosts.get(partition.connectionNodeId)
                : undefined;

        return {
            ...partition,
            partitionHost,
            connectionHost,
        };
    });
};
