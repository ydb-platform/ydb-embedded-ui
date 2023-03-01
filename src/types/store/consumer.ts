import type {IProcessSpeedStats} from '../../utils/bytesParsers';
import type {ApiRequestAction} from '../../store/utils';

import {
    FETCH_CONSUMER,
    setDataWasNotLoaded,
    setSelectedConsumer,
} from '../../store/reducers/consumer';

import type {DescribeConsumerResult} from '../api/consumer';
import type {IResponseError} from '../api/error';

// All fields should be present though they could be undefined
export interface IPreparedPartitionData {
    partitionId: string;
    storeSize: string;

    writeSpeed: IProcessSpeedStats;
    readSpeed: IProcessSpeedStats;

    partitionWriteLag: number;
    partitionWriteIdleTime: number;

    consumerWriteLag: number;
    consumerReadLag: number;
    consumerReadIdleTime: number;

    uncommitedMessages: number;
    unreadMessages: number;

    startOffset: string;
    endOffset: string;
    commitedOffset: string;

    readSessionId: string | undefined;
    readerName: string | undefined;

    partitionNodeId: number;
    connectionNodeId: number;
}

export interface IConsumerState {
    loading: boolean;
    wasLoaded: boolean;
    selectedConsumer?: string;
    data?: DescribeConsumerResult;
    error?: IResponseError;
}

type IConsumerApiRequestAction = ApiRequestAction<
    typeof FETCH_CONSUMER,
    DescribeConsumerResult,
    IResponseError
>;

export type IConsumerAction =
    | IConsumerApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>
    | ReturnType<typeof setSelectedConsumer>;

export interface IConsumerRootStateSlice {
    consumer: IConsumerState;
}
