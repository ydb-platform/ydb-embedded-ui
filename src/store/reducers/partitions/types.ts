import type {IResponseError} from '../../../types/api/error';
import type {ProcessSpeedStats} from '../../../utils/bytesParsers';
import type {ApiRequestAction} from '../../utils';

import {FETCH_PARTITIONS, setDataWasNotLoaded, setSelectedConsumer} from './partitions';

// Fields that could be undefined corresponds to partitions without consumers
export interface PreparedPartitionData {
    partitionId: string;
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

export interface PartitionsState {
    loading: boolean;
    wasLoaded: boolean;
    selectedConsumer: string;
    partitions?: PreparedPartitionData[];
    error?: IResponseError;
}

export type PartitionsAction =
    | ApiRequestAction<typeof FETCH_PARTITIONS, PreparedPartitionData[], IResponseError>
    | ReturnType<typeof setDataWasNotLoaded>
    | ReturnType<typeof setSelectedConsumer>;
