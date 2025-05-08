import type {ProcessSpeedStats} from '../../../utils/bytesParsers';

// Fields that could be undefined corresponds to partitions without consumers
export interface PreparedPartitionData {
    partitionId: string | number;
    storeSize: string;

    writeSpeed: ProcessSpeedStats;
    readSpeed?: ProcessSpeedStats;

    partitionWriteLag: number;
    partitionWriteIdleTime: number;

    consumerWriteLag?: number;
    consumerReadLag?: number;
    consumerReadIdleTime?: number;

    uncommitedMessages?: number;
    unreadMessages?: number;

    startOffset: string;
    endOffset: string;
    commitedOffset?: string;

    readSessionId?: string;
    readerName?: string;

    partitionNodeId: number;
    connectionNodeId?: number;
}
