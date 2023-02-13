import {FETCH_TOPIC, setDataWasNotLoaded} from '../../store/reducers/topic';
import type {ApiRequestAction} from '../../store/utils';
import type {IProcessSpeedStats} from '../../utils/bytesParsers';
import type {IResponseError} from '../api/error';
import type {DescribeTopicResult} from '../api/topic';

export interface IPreparedConsumerData {
    name: string | undefined;
    readSpeed: IProcessSpeedStats;

    writeLag: number;
    readLag: number;
    readIdleTime: number;
}

export interface IPreparedTopicStats {
    storeSize: string;

    partitionsWriteLag: number;
    partitionsIdleTime: number;

    writeSpeed: IProcessSpeedStats;
}

export interface ITopicState {
    loading: boolean;
    wasLoaded: boolean;
    data?: DescribeTopicResult;
    error?: IResponseError;
}

export type ITopicAction =
    | ApiRequestAction<typeof FETCH_TOPIC, DescribeTopicResult, IResponseError>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface ITopicRootStateSlice {
    topic: ITopicState;
}
