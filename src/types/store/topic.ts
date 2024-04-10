import type {FETCH_TOPIC, cleanTopicData, setDataWasNotLoaded} from '../../store/reducers/topic';
import type {ApiRequestAction} from '../../store/utils';
import type {ProcessSpeedStats} from '../../utils/bytesParsers';
import type {IResponseError} from '../api/error';
import type {DescribeTopicResult} from '../api/topic';

export interface IPreparedConsumerData {
    name: string | undefined;
    readSpeed: ProcessSpeedStats;

    writeLag: number;
    readLag: number;
    readIdleTime: number;
}

export interface IPreparedTopicStats {
    storeSize: string;

    partitionsWriteLag: number;
    partitionsIdleTime: number;

    writeSpeed: ProcessSpeedStats;
}

export interface ITopicState {
    loading: boolean;
    wasLoaded: boolean;
    data?: DescribeTopicResult;
    error?: IResponseError;
}

export type ITopicAction =
    | ApiRequestAction<typeof FETCH_TOPIC, DescribeTopicResult, IResponseError>
    | ReturnType<typeof setDataWasNotLoaded>
    | ReturnType<typeof cleanTopicData>;

export interface ITopicRootStateSlice {
    topic: ITopicState;
}
