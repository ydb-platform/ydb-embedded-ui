import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';

export interface PreparedPartitionDataWithHosts extends PreparedPartitionData {
    partitionHost: string | undefined;
    connectionHost: string | undefined;
}
