import type {IPreparedPartitionData} from '../../../../../types/store/consumer';

export interface IPreparedPartitionDataWithHosts extends IPreparedPartitionData {
    partitionHost: string | undefined;
    connectionHost: string | undefined;
}
