import type {ApiRequestAction} from '../../store/utils';

import {
    FETCH_CONSUMER,
    setDataWasNotLoaded,
    setSelectedConsumer,
} from '../../store/reducers/consumer';

import type {DescribeConsumerResult} from '../api/consumer';
import type {IResponseError} from '../api/error';

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
