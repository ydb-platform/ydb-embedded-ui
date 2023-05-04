import type {IResponseError} from '../../../types/api/error';
import type {IProcessSpeedStats} from '../../../utils/bytesParsers';
import type {ApiRequestAction} from '../../utils';

import {FETCH_PARTITIONS, setDataWasNotLoaded} from './partitions';

// Fields that could be undefined corresponds to partitions without consumers
export interface PreparedPartitionData {
    partitionId: string;
    storeSize: string;

    writeSpeed: IProcessSpeedStats;
    readSpeed?: IProcessSpeedStats;

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
    partitions?: PreparedPartitionData[];
    error?: IResponseError;
}

export type PartitionsAction =
    | ApiRequestAction<typeof FETCH_PARTITIONS, PreparedPartitionData[], IResponseError>
    | ReturnType<typeof setDataWasNotLoaded>;
